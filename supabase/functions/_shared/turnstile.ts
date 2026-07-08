// Cloudflare Turnstile server-side verification, shared by the submit-* functions.
//
// Requires the TURNSTILE_SECRET_KEY edge-function secret (the secret key paired
// with the VITE_TURNSTILE_SITE_KEY used in the browser). For local testing
// Cloudflare's always-pass keys work:
//   site:   1x00000000000000000000AA
//   secret: 1x0000000000000000000000000000000AA

const VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Verifies a Turnstile token. Returns true only on a confirmed-human response.
// `remoteIp` is optional but recommended (Cloudflare cross-checks it).
export async function verifyTurnstile(
  token: string | undefined | null,
  remoteIp?: string | null,
): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) {
    // Misconfiguration: fail closed so a missing secret never silently disables
    // the captcha. The caller logs the detail; the client sees a generic error.
    console.error("TURNSTILE_SECRET_KEY is not set");
    return false;
  }
  if (!token) return false;

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);
  if (remoteIp) form.set("remoteip", remoteIp);

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    if (!res.ok) {
      console.error("Turnstile verify HTTP error", res.status);
      return false;
    }
    const data = await res.json() as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error("Turnstile verify request failed", err);
    return false;
  }
}

// Best-effort client IP from the incoming request headers.
export function clientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip");
}
