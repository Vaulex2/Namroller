import { supabase, isSupabaseConfigured } from "./supabase";
import type { Testimonial } from "../components/ui/testimonials-columns-1";

/* Reviews API.
 *
 * Reads use the anon client and only return APPROVED rows (enforced by the
 * SELECT policy in supabase/schema/reviews.sql). Writes go through the
 * `submit-review` edge function, which verifies a Cloudflare Turnstile token and
 * inserts unapproved (approved=false) with the service role — so a new review
 * does not appear until a human approves it in the dashboard.
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
  // Cloudflare Turnstile token from the form's <Turnstile> widget. Omitted in
  // demo mode (no site key).
  token?: string;
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

  const { data, error } = await supabase.functions.invoke("submit-review", {
    body: {
      name: input.name,
      role: input.role,
      text: input.text,
      rating: input.rating,
      token: input.token,
    },
  });

  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || "submit-review failed");

  // The review is held for moderation, so it is NOT shown immediately. Echo the
  // submitted values back only so the success UI can reference them if needed.
  return {
    name: input.name,
    role: input.role,
    text: input.text,
    rating: input.rating,
  };
}
