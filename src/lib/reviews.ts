import { supabase, isSupabaseConfigured } from "./supabase";
import type { Testimonial } from "../components/ui/testimonials-columns-1";

/* Reviews API.
 *
 * Expected Supabase table:
 *   create table reviews (
 *     id          uuid primary key default gen_random_uuid(),
 *     name        text not null,
 *     role        text,
 *     text        text not null,
 *     rating      int  not null default 5,
 *     image       text,
 *     created_at  timestamptz not null default now()
 *   );
 *
 * The placeholder branches (when Supabase isn't configured yet) keep the UI
 * working with seed data; once env vars + table exist, the real queries run
 * with no further code changes. */

export type ReviewInput = {
  name: string;
  role: string;
  text: string;
  rating: number;
  image?: string;
};

const TABLE = "reviews";

export async function fetchReviews(): Promise<Testimonial[]> {
  if (!isSupabaseConfigured || !supabase) {
    // No backend yet → empty; the section falls back to localized seed reviews.
    return [];
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select("name, role, text, rating, image, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Empty array is fine — Testimonials.jsx shows localized seed when there are
  // no stored reviews yet.
  return (data ?? []) as Testimonial[];
}

export async function addReview(input: ReviewInput): Promise<Testimonial> {
  if (!isSupabaseConfigured || !supabase) {
    // Placeholder: echo the input back so the submit flow is demoable offline.
    return { ...input };
  }

  // TODO(real insert): runs once Supabase is configured.
  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select("name, role, text, rating, image")
    .single();

  if (error) throw error;
  return data as Testimonial;
}
