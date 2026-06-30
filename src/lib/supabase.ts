import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* Supabase client (placeholder wiring).
 *
 * Set these in a local `.env` file (see `.env.example`):
 *   VITE_SUPABASE_URL=https://<project>.supabase.co
 *   VITE_SUPABASE_ANON_KEY=<anon-key>
 *
 * Until both are present, `isSupabaseConfigured` is false and the reviews
 * API (src/lib/reviews.ts) falls back to seed data so the site still works. */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null;
