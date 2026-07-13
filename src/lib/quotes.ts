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
  // Groups any photos/videos already uploaded via uploadQuoteAttachment (see
  // below) with this request. Omit when nothing was attached.
  attachmentsDraftId?: string;
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

/* Quote attachments (photos / short videos) — see handoff-quote-attachments.md.
 *
 * Files upload straight to the private `quote-attachments` bucket with the
 * anon key BEFORE the quote_requests row exists (submit-quote creates it), so
 * every attachment picker session generates a random "draft id" up front and
 * tags every upload with it; submitQuote later links that id to the new row.
 * The bucket only grants anon INSERT (no read/list/update/delete), so nothing
 * uploaded here can be listed or fetched back by the browser — only admins,
 * via the admin-quotes edge function's signed URLs, can see it again. */

const ATTACHMENTS_BUCKET = "quote-attachments";
export const MAX_ATTACHMENTS = 5;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024; // 25 MB — a "short clip", not a movie; keeps worst-case upload time bounded
export const ATTACHMENT_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"];
export const ATTACHMENT_VIDEO_MIME = ["video/mp4", "video/webm", "video/quicktime"];
export const ATTACHMENT_ACCEPT = [...ATTACHMENT_IMAGE_MIME, ...ATTACHMENT_VIDEO_MIME].join(",");

// Per-file upload deadline. supabase-js's storage upload doesn't expose an
// abort/timeout option, so this races it against a timer instead — if the
// underlying request is truly stuck (seen in the field: a browser/network
// that silently black-holes the request instead of rejecting it), the form
// still recovers with a clear error instead of "Sending..." forever.
const UPLOAD_TIMEOUT_MS = 60_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Upload timed out")), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

export function newAttachmentsDraftId(): string {
  return crypto.randomUUID();
}

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  };
  return map[mime] ?? "bin";
}

// Uploads one photo/video into the given draft's folder. Throws on an
// unsupported type, an oversize file, or a storage error.
export async function uploadQuoteAttachment(file: File, draftId: string): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured");
  const isImage = ATTACHMENT_IMAGE_MIME.includes(file.type);
  const isVideo = ATTACHMENT_VIDEO_MIME.includes(file.type);
  if (!isImage && !isVideo) throw new Error("Unsupported file type");
  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) throw new Error("File is too large");

  const path = `${draftId}/${crypto.randomUUID()}.${extFromMime(file.type)}`;
  const { error } = await withTimeout(
    supabase.storage.from(ATTACHMENTS_BUCKET).upload(path, file, { contentType: file.type, upsert: false }),
    UPLOAD_TIMEOUT_MS,
  );
  if (error) throw error;
}

// Uploads a whole picker queue at submit time (not as each file is picked) so
// "remove before send" never needs a delete call — the anon key can only
// INSERT into this bucket, not remove, so nothing should hit storage until
// the buyer has actually committed to sending it. Returns the shared draft id
// to pass as submitQuote's attachmentsDraftId, or undefined if files is empty.
// Uploads run in parallel; any single failure rejects the whole batch (the
// caller shows one generic "couldn't attach files" error, same as the rest
// of these forms).
export async function uploadQuoteAttachments(files: File[]): Promise<string | undefined> {
  if (files.length === 0) return undefined;
  const draftId = newAttachmentsDraftId();
  await Promise.all(files.map((f) => uploadQuoteAttachment(f, draftId)));
  return draftId;
}
