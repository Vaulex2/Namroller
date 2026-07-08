// Admin authorization helper for the admin-* edge functions.
//
// The public submit-* functions are anonymous; the admin functions are NOT. Each
// admin request must carry the signed-in user's access token in the
// `Authorization: Bearer <jwt>` header (supabase-js attaches it automatically for
// a logged-in session). We:
//   1. Resolve the caller from that JWT with an ANON-key client (never trusts the
//      client's claim of who they are — the token is verified by GoTrue).
//   2. Check admin membership by calling public.is_admin() AS THAT USER, so
//      auth.uid() inside the SECURITY DEFINER function resolves to the real caller.
// The service-role key is only used by the caller AFTER this check passes.
//
// Returns either { user } on success, or { response } holding a 401/403 to return
// immediately. Platform default verify_jwt=true already rejects missing/invalid
// JWTs at the gateway; requireAdmin is the defense-in-depth admin re-check on top.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse } from "./cors.ts";

export interface AdminUser {
  id: string;
  email?: string;
}

interface RequireAdminResult {
  user?: AdminUser;
  response?: Response;
}

export async function requireAdmin(req: Request): Promise<RequireAdminResult> {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return { response: jsonResponse({ ok: false, error: "Unauthorized" }, 401) };
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // User-scoped client: forwards the caller's JWT so auth.uid() / getUser resolve
  // to the real caller and RLS + is_admin() run as that user.
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return { response: jsonResponse({ ok: false, error: "Unauthorized" }, 401) };
  }

  const { data: isAdmin, error: adminErr } = await userClient.rpc("is_admin");
  if (adminErr) {
    console.error("is_admin rpc failed", adminErr);
    return { response: jsonResponse({ ok: false, error: "Forbidden" }, 403) };
  }
  if (isAdmin !== true) {
    return { response: jsonResponse({ ok: false, error: "Forbidden" }, 403) };
  }

  return { user: { id: userData.user.id, email: userData.user.email ?? undefined } };
}

// Service-role client for privileged reads/writes AFTER requireAdmin passes.
export function serviceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
