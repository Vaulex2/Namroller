// Per-IP fixed-window rate limiting for the public submit-* edge functions,
// backed by public.rate_limit_hit() (see supabase/schema/rate_limits.sql).
//
// Defense-in-depth on top of Cloudflare Turnstile, not a replacement for it —
// checked first (before the Turnstile round trip) so a burst of requests
// doesn't also burn the Cloudflare siteverify quota.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Returns true if the request is within budget (and records it), false if it
// should be rejected with 429. Fails OPEN on a DB error: a broken rate
// limiter must never take the public forms down by itself (the insert right
// after this will fail on its own if the DB is genuinely unreachable).
export async function checkRateLimit(
  db: SupabaseClient,
  scope: string,
  ip: string | null,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const key = `${scope}:${ip ?? "unknown"}`;
  const { data, error } = await db.rpc("rate_limit_hit", {
    p_key: key,
    p_window_seconds: windowSeconds,
    p_limit: limit,
  });
  if (error) {
    console.error("rate_limit_hit failed", error);
    return true;
  }
  return data === true;
}
