import { supabase, isSupabaseConfigured } from "./supabase";

/* Quote-request ("Ask the price") API.
 *
 * Writes go through the `submit-quote` edge function (see
 * supabase/functions/submit-quote), which verifies a Cloudflare Turnstile token,
 * validates input, inserts with the service role, and notifies Telegram. The anon
 * key has no insert path, so we never write to the table directly.
 *
 * When Supabase isn't configured yet, submitQuote is a no-op success so the quote
 * modal stays demoable offline. */

export type QuoteInput = {
  productId?: string;
  productName?: string;
  name: string;
  phone: string;
  email?: string;
  quantity?: string;
  address?: string;
  note?: string;
  lang?: string;
  source?: string;
  // Cloudflare Turnstile token from the form's <Turnstile> widget. Omitted in
  // demo mode (no site key) — the edge function rejects real submissions without it.
  token?: string;
};

export async function submitQuote(input: QuoteInput): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    // No backend yet → pretend success so the submit flow is demoable offline.
    return;
  }

  const { data, error } = await supabase.functions.invoke("submit-quote", {
    body: input,
  });

  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || "submit-quote failed");
}
