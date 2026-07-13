-- Product catalog (Katalog / Home / compare tray), managed from the admin
-- panel.
--
-- Rows store identity, category, headline numbers, icon name, image, a jsonb
-- specs array, the shared marketing-clip pairs used on the product detail
-- page, ordering, a publish flag, a DEFAULT-LANGUAGE name + blurb shown via
-- the same t(key, fallback) mechanic already used everywhere in the app
-- (t(`pd.${id}.name`, row.name)) — AND the richer editorial prose (overview,
-- process steps, feature callouts, applications), authored in RU + UZ from
-- the admin panel (ProductForm.jsx), matching the admin panel's own
-- language scope (AdminLangSwitcher). `overview`/`applications` are
-- `{"ru": "...", "uz": "..."}`; `process`/`features` are arrays of
-- `{icon, title: {ru,uz}, text: {ru,uz}}` — the icon lives with its step, so
-- there is no separate array that has to stay the same length by convention
-- (the old process_icons/feature_icons columns this replaced were exactly
-- that footgun).
--
-- English/Chinese/Farsi copy for these same sections is NOT authored here —
-- it continues to live in src/i18n/locales/{en,zh,fa}.json under
-- pd.<id>.overview/process/features/applications, a deliberate scope limit
-- (the admin panel itself has never spoken those languages). ProductDetail
-- prefers this table's ru/uz content when present, and falls back to the
-- i18n JSON (any locale, including ru/uz for rows that predate this column
-- or simply have nothing entered yet) otherwise — sections simply don't
-- appear when neither source has content for the active language.
--
-- `image` and each `videos[].src`/`.poster` entry are either a root-relative
-- /public path (bundled seed assets) or a storage object path in the
-- `product-images` bucket (see storage_product_images.sql) — same dual-mode
-- resolution src/lib/videos.ts already uses for capability_videos.
--
-- Public visitors read only PUBLISHED rows (RLS). Admins (public.is_admin())
-- do everything, including reading unpublished drafts. When this table is
-- empty or Supabase isn't configured, the frontend falls back to the
-- hardcoded NR_PRODUCTS seed in src/pages/data.js (see src/hooks/useProducts.js)
-- — that seed has no overview/process/features/applications columns either,
-- so it always renders via the i18n-JSON fallback path, unaffected by this table.
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
  overview       jsonb       not null default '{}'::jsonb,   -- {ru,uz}
  process        jsonb       not null default '[]'::jsonb,   -- [{icon, title:{ru,uz}, text:{ru,uz}}]
  features       jsonb       not null default '[]'::jsonb,   -- same item shape as process
  applications   jsonb       not null default '{}'::jsonb,   -- {ru:[...], uz:[...]}
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
