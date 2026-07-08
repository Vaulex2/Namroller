// Shared CORS handling for the public submit-* edge functions.
//
// The browser calls these functions cross-origin, so they must answer the
// preflight OPTIONS request and echo CORS headers on every response. Set the
// ALLOWED_ORIGIN secret to the production site origin (e.g. https://namroller.uz)
// to lock this down; it falls back to "*" when unset (fine for local dev).

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "*";

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

// Returns a 204 preflight response for OPTIONS, or null for other methods.
export function handlePreflight(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  return null;
}

// JSON response helper that always carries the CORS headers.
export function jsonResponse(
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
