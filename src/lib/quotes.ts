import { supabase, isSupabaseConfigured } from "./supabase";

/* Quote-request ("Ask the price") API.
 *
 * Expected Supabase table (see supabase/schema/quote_requests.sql):
 *   create table quote_requests (
 *     id           uuid primary key default gen_random_uuid(),
 *     product_id   text,
 *     product_name text,
 *     name         text not null,
 *     phone        text not null,
 *     email        text,
 *     quantity     text,
 *     note         text,
 *     lang         text,
 *     status       text not null default 'new',
 *     created_at   timestamptz not null default now()
 *   );
 *
 * Insert-only: the table has no anon select policy, so we never read rows back.
 * When Supabase isn't configured yet, submitQuote is a no-op success so the
 * quote modal stays demoable offline. */

export type QuoteInput = {
  productId?: string;
  productName?: string;
  name: string;
  phone: string;
  email?: string;
  quantity?: string;
  note?: string;
  lang?: string;
  source?: string;
};

const TABLE = "quote_requests";

export async function submitQuote(input: QuoteInput): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    // No backend yet → pretend success so the submit flow is demoable offline.
    return;
  }

  // DB column names are snake_case; map from the camelCase input.
  const { error } = await supabase.from(TABLE).insert({
    product_id: input.productId ?? null,
    product_name: input.productName ?? null,
    name: input.name,
    phone: input.phone,
    email: input.email || null,
    quantity: input.quantity || null,
    note: input.note || null,
    lang: input.lang ?? null,
    source: input.source ?? null,
  });

  if (error) throw error;
}
