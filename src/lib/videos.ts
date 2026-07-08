import { supabase, isSupabaseConfigured } from "./supabase";

/* Imkoniyatlar (Capabilities) videos.
 *
 * Public reads return only PUBLISHED rows (RLS) and map storage paths to public
 * URLs. Admin operations (upload/list-all/update/delete) are gated server-side
 * by storage + table RLS policies (public.is_admin()); the calls here simply use
 * the authenticated session. When Supabase isn't configured, fetch returns []
 * and Capabilities.jsx falls back to its hardcoded seed. */

export const CAPABILITIES_BUCKET = "capabilities";

// Client-side pre-checks (UX only). The bucket also enforces MIME + size limits
// server-side (see supabase/schema/storage_capabilities.sql).
export const VIDEO_MIME = ["video/mp4", "video/webm"];
export const POSTER_MIME = ["image/jpeg", "image/png", "image/webp"];
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB
export const MAX_POSTER_BYTES = 2 * 1024 * 1024; //   2 MB

export interface CapabilityVideo {
  id: string;
  src: string; // public URL, ready for <video src>
  poster: string | null; // public URL or null
}

export interface CapabilityVideoRow {
  id: string;
  video_path: string;
  poster_path: string | null;
  title: string | null;
  sort_order: number;
  published: boolean;
  created_at: string;
}

function publicUrl(path: string | null): string | null {
  if (!path) return null;
  // Root-relative (/public assets) or absolute URLs are served as-is. This lets
  // the original bundled clips live in capability_videos alongside uploads.
  if (path.startsWith("/") || path.startsWith("http")) return path;
  if (!supabase) return null;
  return supabase.storage.from(CAPABILITIES_BUCKET).getPublicUrl(path).data.publicUrl;
}

// A storage object key is anything that isn't a root-relative/absolute path.
export function isStoragePath(path: string | null): boolean {
  return !!path && !path.startsWith("/") && !path.startsWith("http");
}

// Public: published videos for the Imkoniyatlar page, in display order.
export async function fetchCapabilityVideos(): Promise<CapabilityVideo[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("capability_videos")
    .select("id, video_path, poster_path, sort_order, created_at")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    src: publicUrl(r.video_path as string) as string,
    poster: publicUrl(r.poster_path as string | null),
  }));
}

/* ---- Admin operations ---- */

// Admin: all rows incl. unpublished, for the management list.
export async function listAllVideos(): Promise<CapabilityVideoRow[]> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase
    .from("capability_videos")
    .select("id, video_path, poster_path, title, sort_order, published, created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CapabilityVideoRow[];
}

export function videoRowPublicUrls(row: CapabilityVideoRow): { src: string | null; poster: string | null } {
  return { src: publicUrl(row.video_path), poster: publicUrl(row.poster_path) };
}

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "video/mp4": "mp4",
    "video/webm": "webm",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return map[mime] ?? "bin";
}

// Admin: upload a video (+ optional poster) and create its row. Uploads first,
// then inserts the row; on row-insert failure the just-uploaded objects are
// cleaned up so no orphans are left in the bucket.
export async function uploadCapabilityVideo(params: {
  video: File;
  poster?: File | null;
  title?: string;
}): Promise<CapabilityVideoRow> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { video, poster, title } = params;

  if (!VIDEO_MIME.includes(video.type)) throw new Error("Unsupported video type");
  if (video.size > MAX_VIDEO_BYTES) throw new Error("Video is too large (max 100 MB)");
  if (poster) {
    if (!POSTER_MIME.includes(poster.type)) throw new Error("Unsupported poster type");
    if (poster.size > MAX_POSTER_BYTES) throw new Error("Poster is too large (max 2 MB)");
  }

  const uid = crypto.randomUUID();
  const store = supabase.storage.from(CAPABILITIES_BUCKET);
  const uploaded: string[] = [];

  const videoPath = `videos/${uid}.${extFromMime(video.type)}`;
  const { error: vErr } = await store.upload(videoPath, video, {
    contentType: video.type,
    upsert: false,
  });
  if (vErr) throw vErr;
  uploaded.push(videoPath);

  let posterPath: string | null = null;
  if (poster) {
    posterPath = `posters/${uid}.${extFromMime(poster.type)}`;
    const { error: pErr } = await store.upload(posterPath, poster, {
      contentType: poster.type,
      upsert: false,
    });
    if (pErr) {
      await store.remove(uploaded);
      throw pErr;
    }
    uploaded.push(posterPath);
  }

  // Append to the end of the current order.
  const { data: last } = await supabase
    .from("capability_videos")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = ((last?.sort_order as number | undefined) ?? -1) + 1;

  const { data, error } = await supabase
    .from("capability_videos")
    .insert({
      video_path: videoPath,
      poster_path: posterPath,
      title: title?.trim() || null,
      sort_order: sortOrder,
      published: true,
    })
    .select("id, video_path, poster_path, title, sort_order, published, created_at")
    .single();

  if (error) {
    await store.remove(uploaded); // best-effort orphan cleanup
    throw error;
  }
  return data as CapabilityVideoRow;
}

export async function setPublished(id: string, published: boolean): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.from("capability_videos").update({ published }).eq("id", id);
  if (error) throw error;
}

export async function setSortOrder(id: string, sortOrder: number): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.from("capability_videos").update({ sort_order: sortOrder }).eq("id", id);
  if (error) throw error;
}

// Batch-persist a full drag-and-drop reorder in one round trip (one row update
// per id, in parallel) rather than the pairwise swap setSortOrder was designed
// for. Throws the first error encountered, if any.
export async function reorderVideos(orderedIds: string[]): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured");
  const results = await Promise.all(
    orderedIds.map((id, i) => supabase.from("capability_videos").update({ sort_order: i }).eq("id", id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

// Delete the row, then the underlying objects (best-effort).
export async function deleteVideo(row: Pick<CapabilityVideoRow, "id" | "video_path" | "poster_path">): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.from("capability_videos").delete().eq("id", row.id);
  if (error) throw error;
  // Only remove real uploaded objects; the bundled /public seed rows have no
  // storage object to delete.
  const paths = [row.video_path, row.poster_path].filter(isStoragePath) as string[];
  if (paths.length) {
    await supabase.storage.from(CAPABILITIES_BUCKET).remove(paths);
  }
}
