-- Product catalog (Katalog / Home / compare tray), managed from the admin
-- panel.
--
-- Rows store STRUCTURAL product data only: identity, category, headline
-- numbers, icon name, image, a jsonb specs array, the shared marketing-clip
-- pairs used on the product detail page, ordering, a publish flag, and a
-- DEFAULT-LANGUAGE name + blurb shown via the same t(key, fallback) mechanic
-- already used everywhere in the app (t(`pd.${id}.name`, row.name)).
--
-- Full translated (RU/UZ) copy AND the richer editorial prose
-- (pd.<id>.overview/process/features/applications) continue to live in
-- src/i18n/locales/{ru,uz}.json — adding a brand-new product's rich marketing
-- copy still needs a follow-up i18n edit. This table only makes a product
-- EXIST / be orderable / be structurally editable without a redeploy;
-- ProductDetail already renders gracefully (sections simply don't appear)
-- when a product has no matching pd.<id> i18n entries.
--
-- `image` and each `videos[].src`/`.poster` entry are either a root-relative
-- /public path (bundled seed assets) or a storage object path in the
-- `product-images` bucket (see storage_product_images.sql) — same dual-mode
-- resolution src/lib/videos.ts already uses for capability_videos.
--
-- Public visitors read only PUBLISHED rows (RLS). Admins (public.is_admin())
-- do everything, including reading unpublished drafts. When this table is
-- empty or Supabase isn't configured, the frontend falls back to the
-- hardcoded NR_PRODUCTS seed in src/pages/data.js (see src/hooks/useProducts.js).
--
-- quote_requests.product_id has NO foreign key to this table (by design —
-- historic quotes keep their frozen product_id/product_name snapshot text
-- regardless of later catalog edits or deletions).
--
-- Idempotent. Run in: Supabase Dashboard → SQL Editor.
-- Depends on public.is_admin() from supabase/schema/admins.sql (run that first).

create table if not exists public.products (
  id             text        primary key,   -- slug, matches i18n pd.<id> keys, e.g. 'trough-idler'
  name           text        not null,       -- default-language fallback
  blurb          text        not null,       -- default-language fallback
  icon           text        not null default 'package',
  image          text,
  cat            text        not null,       -- 'Idlers' | 'Pulleys' | 'Systems'
  diameter       text,
  load           text,
  specs          jsonb       not null default '[]'::jsonb,   -- [{label,value,unit?}]
  process_icons  jsonb       not null default '[]'::jsonb,   -- icon names, zipped with pd.<id>.process
  feature_icons  jsonb       not null default '[]'::jsonb,   -- icon names, zipped with pd.<id>.features
  videos         jsonb       not null default '[]'::jsonb,   -- [{src,poster}] from the shared clip pool
  sort_order     int         not null default 0,
  published      boolean     not null default true,
  created_at     timestamptz not null default now(),
  constraint products_id_format check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint products_name_len check (char_length(name) between 1 and 160),
  constraint products_blurb_len check (char_length(blurb) between 1 and 500),
  constraint products_cat_values check (cat in ('Idlers','Pulleys','Systems')),
  constraint products_image_len check (image is null or char_length(image) <= 400)
);

-- Public grid order: published first, then by sort_order, newest last.
create index if not exists products_order_idx
  on public.products (published, sort_order, created_at desc);

alter table public.products enable row level security;

-- Public (and authenticated) may read only published rows.
drop policy if exists "Public read published products" on public.products;
create policy "Public read published products"
  on public.products
  for select
  to anon, authenticated
  using (published = true);

-- Admins may read/insert/update/delete everything (incl. unpublished drafts).
drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products"
  on public.products
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
