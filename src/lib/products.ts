import { supabase, isSupabaseConfigured } from "./supabase";

/* Product catalog (Katalog / Home / compare tray).
 *
 * Public reads return only PUBLISHED rows (RLS) and map storage paths to
 * public URLs, ordered for display. Admin operations (list-all/create/update/
 * reorder/delete) are gated server-side by table + storage RLS policies
 * (public.is_admin()); the calls here simply use the authenticated session.
 * When Supabase isn't configured (or the table is empty), fetchPublishedProducts
 * returns [] and src/hooks/useProducts.js falls back to the hardcoded seed in
 * src/pages/data.js — same fallback contract as capability_videos. */

export const PRODUCT_IMAGES_BUCKET = "product-images";
export const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface ProductSpec {
  label: string;
  value: string;
  unit?: string;
}

export interface ProductClip {
  src: string;
  poster: string | null;
}

export interface ProductRow {
  id: string;
  name: string;
  blurb: string;
  icon: string;
  image: string | null;
  cat: string;
  diameter: string | null;
  load: string | null;
  specs: ProductSpec[];
  process_icons: string[];
  feature_icons: string[];
  videos: ProductClip[];
  sort_order: number;
  published: boolean;
  created_at: string;
}

// Shape consumed by Catalog.jsx / Home.jsx / CompareTray.jsx — matches the
// NR_PRODUCTS entry shape exactly (content.process/content.features instead
// of the row's process_icons/feature_icons column names).
export interface Product {
  id: string;
  name: string;
  icon: string;
  image: string;
  videos: ProductClip[];
  cat: string;
  blurb: string;
  diameter: string;
  load: string;
  content: { process: string[]; features: string[] };
  specs: ProductSpec[];
}

const PRODUCTS_SELECT =
  "id, name, blurb, icon, image, cat, diameter, load, specs, process_icons, feature_icons, videos, sort_order, published, created_at";

// A storage object key is anything that isn't a root-relative/absolute path
// (mirrors the same helper in src/lib/videos.ts).
export function isStoragePath(path: string | null): boolean {
  return !!path && !path.startsWith("/") && !path.startsWith("http");
}

function publicImageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("/") || path.startsWith("http")) return path;
  if (!supabase) return null;
  return supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
}

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    image: publicImageUrl(row.image) ?? "",
    videos: row.videos ?? [],
    cat: row.cat,
    blurb: row.blurb,
    diameter: row.diameter ?? "—",
    load: row.load ?? "—",
    content: { process: row.process_icons ?? [], features: row.feature_icons ?? [] },
    specs: row.specs ?? [],
  };
}

// Public: published products for Catalog / Home / CompareTray, in display order.
export async function fetchPublishedProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCTS_SELECT)
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => rowToProduct(r as ProductRow));
}

/* ---- Admin operations ---- */

// Admin: all rows incl. unpublished, for the management list.
export async function listAllProducts(): Promise<ProductRow[]> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCTS_SELECT)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProductRow[];
}

export function productRowImageUrl(row: Pick<ProductRow, "image">): string | null {
  return publicImageUrl(row.image);
}

export type NewProductInput = Omit<ProductRow, "sort_order" | "published" | "created_at"> &
  Partial<Pick<ProductRow, "published">>;

// Thrown when the chosen id/slug collides with an existing product (Postgres
// unique_violation, code 23505) — a distinct, catchable error so the UI can
// show a friendly "id already taken" message instead of leaking the raw
// "duplicate key value violates unique constraint..." text to the user.
export class ProductIdTakenError extends Error {
  constructor() {
    super("Product id already in use");
    this.name = "ProductIdTakenError";
  }
}

// Appends to the end of the current display order (same pattern as
// uploadCapabilityVideo's sortOrder-append logic).
export async function createProduct(input: NewProductInput): Promise<ProductRow> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data: last } = await supabase
    .from("products")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = ((last?.sort_order as number | undefined) ?? -1) + 1;

  const { data, error } = await supabase
    .from("products")
    .insert({ ...input, sort_order: sortOrder, published: input.published ?? true })
    .select(PRODUCTS_SELECT)
    .single();
  if (error) {
    if (error.code === "23505") throw new ProductIdTakenError();
    throw error;
  }
  return data as ProductRow;
}

export async function updateProduct(
  id: string,
  patch: Partial<Omit<ProductRow, "id" | "created_at">>,
): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.from("products").update(patch).eq("id", id);
  if (error) throw error;
}

export async function setProductPublished(id: string, published: boolean): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.from("products").update({ published }).eq("id", id);
  if (error) throw error;
}

// Batch-persist a full drag-and-drop reorder in one round trip (one row
// update per id, in parallel).
export async function reorderProducts(orderedIds: string[]): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured");
  const results = await Promise.all(
    orderedIds.map((id, i) => supabase.from("products").update({ sort_order: i }).eq("id", id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

// Delete the row, then the underlying image object (best-effort). Only real
// uploaded objects are removed — bundled /public seed images have no storage
// object to delete.
export async function deleteProduct(row: Pick<ProductRow, "id" | "image">): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.from("products").delete().eq("id", row.id);
  if (error) throw error;
  if (isStoragePath(row.image)) {
    await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([row.image as string]);
  }
}

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return map[mime] ?? "bin";
}

// Uploads a product image and returns its storage path (to be saved as the
// row's `image` column by the caller).
export async function uploadProductImage(file: File): Promise<string> {
  if (!supabase) throw new Error("Supabase is not configured");
  if (!IMAGE_MIME.includes(file.type)) throw new Error("Unsupported image type");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Image is too large (max 5 MB)");

  const path = `products/${crypto.randomUUID()}.${extFromMime(file.type)}`;
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}
