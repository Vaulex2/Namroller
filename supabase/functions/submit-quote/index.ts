// Public endpoint for new price requests ("Ask the price" + Contact page).
//
// Replaces the old anon-key PostgREST insert + unauthenticated notify-quote
// webhook. Flow: verify Cloudflare Turnstile → validate input → insert into
// public.quote_requests with the SERVICE ROLE (bypasses RLS) → send the Telegram
// notification directly. There is no separate public notifier endpoint anymore.
//
// Required Edge Function secrets (Dashboard → Edge Functions → Secrets, or
// `supabase secrets set`):
//   TURNSTILE_SECRET_KEY  — Cloudflare Turnstile secret (pairs with site key)
//   TELEGRAM_BOT_TOKEN    — from @BotFather
//   TELEGRAM_CHAT_ID      — target chat / group / channel id
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.
// Optional: ALLOWED_ORIGIN (lock CORS to the production origin).
//
// Deploy: `supabase functions deploy submit-quote`.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handlePreflight, jsonResponse } from "../_shared/cors.ts";
import { clientIp, verifyTurnstile } from "../_shared/turnstile.ts";

interface QuoteInput {
  token?: string;
  productId?: string | null;
  productName?: string | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  quantity?: string | null;
  address?: string | null;
  note?: string | null;
  lang?: string | null;
  source?: string | null;
}

const str = (v: unknown): string => String(v ?? "").trim();
const nullable = (v: unknown): string | null => {
  const s = str(v);
  return s.length ? s : null;
};

// Telegram HTML mode requires &, <, > to be escaped in text nodes.
function esc(s: unknown): string {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function buildMessage(r: {
  product_name: string | null;
  product_id: string | null;
  name: string;
  phone: string;
  email: string | null;
  quantity: string | null;
  address: string | null;
  lang: string | null;
  note: string | null;
  source: string | null;
}): string {
  const lines = [
    `🛒 <b>New price request</b> — ${esc(r.product_name || r.product_id || "—")}`,
    `👤 ${esc(r.name)}   📞 ${esc(r.phone)}`,
  ];
  if (r.email) lines.push(`✉️ ${esc(r.email)}`);
  const meta: string[] = [];
  if (r.quantity) meta.push(`🔢 ${esc(r.quantity)}`);
  if (r.lang) meta.push(`🌐 ${esc(r.lang)}`);
  if (meta.length) lines.push(meta.join("   "));
  if (r.address) lines.push(`📮 ${esc(r.address)}`);
  if (r.note) lines.push(`📝 ${esc(r.note)}`);
  if (r.source) lines.push(`📍 ${esc(r.source)}`);
  return lines.join("\n");
}

async function notifyTelegram(text: string): Promise<void> {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
  if (!token || !chatId) {
    // Notification is best-effort: a missing bot config must not fail the insert.
    console.error("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set; skipping notify");
    return;
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) {
    // Log the upstream detail server-side only (never returned to the client).
    console.error("Telegram API error", res.status, await res.text());
  }
}

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  let input: QuoteInput;
  try {
    input = await req.json() as QuoteInput;
  } catch {
    return jsonResponse({ ok: false, error: "Invalid request" }, 400);
  }

  // 1. Captcha — fail closed.
  const human = await verifyTurnstile(input.token, clientIp(req));
  if (!human) {
    return jsonResponse({ ok: false, error: "Verification failed" }, 403);
  }

  // 2. Validate + normalize. Mirrors the table CHECK constraints so the client
  //    gets a clean rejection before the DB round-trip.
  const name = str(input.name);
  const phone = str(input.phone);
  if (name.length < 1 || name.length > 120) {
    return jsonResponse({ ok: false, error: "Invalid input" }, 400);
  }
  if (phone.length < 3 || phone.length > 40) {
    return jsonResponse({ ok: false, error: "Invalid input" }, 400);
  }
  const email = nullable(input.email);
  const quantity = nullable(input.quantity);
  const address = nullable(input.address);
  const note = nullable(input.note);
  if (
    (email && email.length > 160) ||
    (quantity && quantity.length > 120) ||
    (address && address.length > 300) ||
    (note && note.length > 2000)
  ) {
    return jsonResponse({ ok: false, error: "Invalid input" }, 400);
  }

  const row = {
    product_id: nullable(input.productId),
    product_name: nullable(input.productName),
    name,
    phone,
    email,
    quantity,
    address,
    note,
    lang: nullable(input.lang),
    source: nullable(input.source),
  };

  // 3. Insert with the service role (bypasses RLS; anon has no insert path).
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { error } = await supabase.from("quote_requests").insert(row);
    if (error) {
      console.error("quote insert failed", error);
      return jsonResponse({ ok: false, error: "Could not submit request" }, 500);
    }
  } catch (err) {
    console.error("quote insert threw", err);
    return jsonResponse({ ok: false, error: "Could not submit request" }, 500);
  }

  // 4. Notify Telegram (best-effort; never blocks success).
  await notifyTelegram(buildMessage(row));

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
