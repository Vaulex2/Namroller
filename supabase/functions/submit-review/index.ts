// Public endpoint for new homepage reviews.
//
// Replaces the old anon-key PostgREST insert. Flow: verify Cloudflare Turnstile
// → validate input → insert into public.reviews with approved=false using the
// SERVICE ROLE (bypasses RLS). New reviews stay hidden until a human approves
// them in the dashboard. `image` is never accepted from the client.
//
// Required Edge Function secrets:
//   TURNSTILE_SECRET_KEY  — Cloudflare Turnstile secret (pairs with site key)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.
// Optional: ALLOWED_ORIGIN (lock CORS to the production origin).
//
// Deploy: `supabase functions deploy submit-review`.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handlePreflight, jsonResponse } from "../_shared/cors.ts";
import { clientIp, verifyTurnstile } from "../_shared/turnstile.ts";
import { checkRateLimit } from "../_shared/rateLimit.ts";

interface ReviewInput {
  token?: string;
  name?: string | null;
  role?: string | null;
  text?: string | null;
  rating?: number | null;
}

const str = (v: unknown): string => String(v ?? "").trim();
const nullable = (v: unknown): string | null => {
  const s = str(v);
  return s.length ? s : null;
};

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  let input: ReviewInput;
  try {
    input = await req.json() as ReviewInput;
  } catch {
    return jsonResponse({ ok: false, error: "Invalid request" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const ip = clientIp(req);

  // 1. Rate limit — 5 submissions per 10 minutes per IP. Checked before
  //    Turnstile so a burst doesn't also burn the siteverify quota.
  const withinBudget = await checkRateLimit(supabase, "submit-review", ip, 5, 600);
  if (!withinBudget) {
    return jsonResponse({ ok: false, error: "Too many requests. Please try again later." }, 429);
  }

  // 2. Captcha — fail closed.
  const human = await verifyTurnstile(input.token, ip);
  if (!human) {
    return jsonResponse({ ok: false, error: "Verification failed" }, 403);
  }

  // 3. Validate + normalize (mirrors the table CHECK constraints).
  const name = str(input.name);
  const text = str(input.text);
  const role = nullable(input.role);
  const rating = Math.round(Number(input.rating));
  if (name.length < 1 || name.length > 120) {
    return jsonResponse({ ok: false, error: "Invalid input" }, 400);
  }
  if (text.length < 1 || text.length > 2000) {
    return jsonResponse({ ok: false, error: "Invalid input" }, 400);
  }
  if (role && role.length > 120) {
    return jsonResponse({ ok: false, error: "Invalid input" }, 400);
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return jsonResponse({ ok: false, error: "Invalid input" }, 400);
  }

  // 4. Insert with the service role, unapproved. `image` is intentionally omitted.
  try {
    const { error } = await supabase.from("reviews").insert({
      name,
      role,
      text,
      rating,
      approved: false,
    });
    if (error) {
      console.error("review insert failed", error);
      return jsonResponse({ ok: false, error: "Could not submit review" }, 500);
    }
  } catch (err) {
    console.error("review insert threw", err);
    return jsonResponse({ ok: false, error: "Could not submit review" }, 500);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
