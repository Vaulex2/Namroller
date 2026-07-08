import { supabase, isSupabaseConfigured } from "./supabase";
import type { Session } from "@supabase/supabase-js";

/* Admin authentication (Supabase Auth, email + password).
 *
 * The admin user is created MANUALLY in the Supabase dashboard and granted admin
 * by inserting their id into public.admins (see supabase/schema/admins.sql).
 * Public signup is disabled, so signIn is the only entry point.
 *
 * IMPORTANT: knowing the session / isAdmin on the client is UX only. Every
 * privileged server path re-checks admin (RLS is_admin() on reviews/videos/
 * storage; requireAdmin in the admin-quotes edge function). Bypassing the client
 * guard grants no data access. */

export function authConfigured(): boolean {
  return isSupabaseConfigured && !!supabase;
}

export async function signIn(email: string, password: string): Promise<void> {
  if (!supabase) throw new Error("Auth is not configured");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

// Subscribe to auth changes. Returns an unsubscribe function.
export function onAuthChange(cb: (session: Session | null) => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

// Ask the server whether the current user is an admin (public.is_admin() RPC,
// evaluated as the signed-in user). Returns false when signed out / unconfigured.
export async function checkIsAdmin(): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("is_admin");
  if (error) return false;
  return data === true;
}
