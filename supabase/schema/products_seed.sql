-- One-time seed: the 6 products that were hardcoded in src/pages/data.js
-- (NR_PRODUCTS), transcribed verbatim (specs / process_icons / feature_icons /
-- videos preserved exactly, including each product's hand-picked clip trio
-- from the shared CLIPS pool) so the DB-backed catalog starts out
-- pixel-identical to the site as it exists today.
--
-- Idempotent via "on conflict (id) do nothing" — safe to re-run even after
-- admins have started editing rows (a re-run never clobbers live edits).
-- Depends on supabase/schema/products.sql (run that first).
-- Run in: Supabase Dashboard → SQL Editor.

insert into public.products
  (id, name, blurb, icon, image, cat, diameter, load, specs, process_icons, feature_icons, videos, sort_order, published)
values
(
  'trough-idler',
  'Trough idler set',
  'Three-roll station for bulk material on inclined and horizontal belts.',
  'package',
  '/Gemini_Generated_Image_ceyruwceyruwceyr.png',
  'Idlers', '89–159', '1,200',
  '[
    {"label":"Roller diameter","value":"89 / 108 / 133 / 159","unit":"mm"},
    {"label":"Trough angle","value":"20° / 30° / 35°"},
    {"label":"Tube material","value":"St37 seamless steel"},
    {"label":"Bearing","value":"6204 / 6205 2Z"},
    {"label":"Max. load per set","value":"1,200","unit":"N"},
    {"label":"Belt width range","value":"500–1400","unit":"mm"}
  ]'::jsonb,
  '["package","cog","flame","check"]'::jsonb,
  '["shield","gauge","ruler","cog"]'::jsonb,
  '[
    {"src":"/video_2026-06-28_00-30-36.mp4","poster":"/posters/video_2026-06-28_00-30-36.jpg"},
    {"src":"/video_2026-06-28_00-30-40.mp4","poster":"/posters/video_2026-06-28_00-30-40.jpg"},
    {"src":"/video_2026-06-28_00-31-03.mp4","poster":"/posters/video_2026-06-28_00-31-03.jpg"}
  ]'::jsonb,
  0, true
),
(
  'return-roller',
  'Return roller',
  'Single-roll support for the belt''s return run. Rubber-disc option for sticky materials.',
  'cog',
  '/Gemini_Generated_Image_nwrnx8nwrnx8nwrn.png',
  'Idlers', '108–159', '900',
  '[
    {"label":"Roller diameter","value":"108 / 133 / 159","unit":"mm"},
    {"label":"Tube wall","value":"4.0–5.0","unit":"mm"},
    {"label":"Surface","value":"Plain / rubber disc"},
    {"label":"Bearing","value":"6204 2Z"},
    {"label":"Max. load","value":"900","unit":"N"},
    {"label":"Shaft","value":"Ø20 / Ø25","unit":"mm"}
  ]'::jsonb,
  '["package","cog","wrench","check"]'::jsonb,
  '["shield","cog","gauge","truck"]'::jsonb,
  '[
    {"src":"/IMG_1823.mp4","poster":"/posters/IMG_1823.jpg"},
    {"src":"/video_2026-06-28_22-46-37.mp4","poster":"/posters/video_2026-06-28_22-46-37.jpg"},
    {"src":"/video_2026-06-28_22-47-34.mp4","poster":"/posters/video_2026-06-28_22-47-34.jpg"}
  ]'::jsonb,
  1, true
),
(
  'impact-roller',
  'Impact roller',
  'Rubber-ringed rollers that absorb load shock at transfer and loading points.',
  'shield',
  '/Gemini_Generated_Image_ut769gut769gut76.png',
  'Idlers', '133–194', '2,000',
  '[
    {"label":"Roller diameter (over rings)","value":"133 / 159 / 194","unit":"mm"},
    {"label":"Ring material","value":"Vulcanised rubber, 65 Sh"},
    {"label":"Tube","value":"St37 steel core"},
    {"label":"Bearing","value":"6205 / 6306 2Z"},
    {"label":"Max. impact load","value":"2,000","unit":"N"},
    {"label":"Service","value":"Loading / transfer zones"}
  ]'::jsonb,
  '["package","flame","wrench","check"]'::jsonb,
  '["shield","gauge","cog","package"]'::jsonb,
  '[
    {"src":"/video_2026-06-28_22-48-05.mp4","poster":"/posters/video_2026-06-28_22-48-05.jpg"},
    {"src":"/IMG_0948.mp4","poster":"/posters/IMG_0948.jpg"},
    {"src":"/IMG_8870.mp4","poster":"/posters/IMG_8870.jpg"}
  ]'::jsonb,
  2, true
),
(
  'guide-roller',
  'Guide / training roller',
  'Self-aligning rollers that correct belt tracking and prevent edge wear.',
  'ruler',
  '/Gemini_Generated_Image_9486qg9486qg9486.png',
  'Idlers', '108–133', '1,000',
  '[
    {"label":"Roller diameter","value":"108 / 133","unit":"mm"},
    {"label":"Pivot","value":"Central swivel bearing"},
    {"label":"Vertical guide rolls","value":"2 × Ø89","unit":"mm"},
    {"label":"Bearing","value":"6204 2Z"},
    {"label":"Max. load","value":"1,000","unit":"N"},
    {"label":"Belt width range","value":"650–1200","unit":"mm"}
  ]'::jsonb,
  '["package","cog","wrench","check"]'::jsonb,
  '["ruler","cog","shield","gauge"]'::jsonb,
  '[
    {"src":"/video_2026-06-28_00-30-36.mp4","poster":"/posters/video_2026-06-28_00-30-36.jpg"},
    {"src":"/IMG_1823.mp4","poster":"/posters/IMG_1823.jpg"},
    {"src":"/video_2026-06-28_22-48-05.mp4","poster":"/posters/video_2026-06-28_22-48-05.jpg"}
  ]'::jsonb,
  3, true
),
(
  'drive-pulley',
  'Drive & tail pulley',
  'Lagged and bare pulleys for head, tail and take-up positions.',
  'gauge',
  '/Gemini_Generated_Image_yk8ax7yk8ax7yk8a.png',
  'Pulleys', '250–630', '—',
  '[
    {"label":"Pulley diameter","value":"250 / 320 / 400 / 500 / 630","unit":"mm"},
    {"label":"Lagging","value":"Plain / diamond rubber 10–14 mm"},
    {"label":"Shaft","value":"C45 turned, keyed"},
    {"label":"Bearing housing","value":"SN / SNL plummer block"},
    {"label":"Balancing","value":"Static / dynamic on request"},
    {"label":"Face width","value":"to suit belt + 100","unit":"mm"}
  ]'::jsonb,
  '["package","cog","flame","check"]'::jsonb,
  '["gauge","shield","cog","wrench"]'::jsonb,
  '[
    {"src":"/video_2026-06-28_00-30-40.mp4","poster":"/posters/video_2026-06-28_00-30-40.jpg"},
    {"src":"/video_2026-06-28_22-46-37.mp4","poster":"/posters/video_2026-06-28_22-46-37.jpg"},
    {"src":"/IMG_0948.mp4","poster":"/posters/IMG_0948.jpg"}
  ]'::jsonb,
  4, true
),
(
  'complete-system',
  'Complete conveyor system',
  'Engineered belt conveyors — frame, idlers, pulleys, drive and structure, supplied and installed.',
  'factory',
  '/Gemini_Generated_Image_moick5moick5moic.png',
  'Systems', '—', '—',
  '[
    {"label":"Belt width","value":"500–1400","unit":"mm"},
    {"label":"Capacity","value":"up to 12,000","unit":"t/day"},
    {"label":"Length per flight","value":"up to 120","unit":"m"},
    {"label":"Drive","value":"Geared motor, 5.5–110","unit":"kW"},
    {"label":"Structure","value":"Galvanised / painted steel"},
    {"label":"Scope","value":"Design · fabrication · installation"}
  ]'::jsonb,
  '["ruler","factory","truck","check"]'::jsonb,
  '["factory","gauge","shield","truck"]'::jsonb,
  '[
    {"src":"/video_2026-06-28_00-31-03.mp4","poster":"/posters/video_2026-06-28_00-31-03.jpg"},
    {"src":"/video_2026-06-28_22-47-34.mp4","poster":"/posters/video_2026-06-28_22-47-34.jpg"},
    {"src":"/IMG_8870.mp4","poster":"/posters/IMG_8870.jpg"}
  ]'::jsonb,
  5, true
)
on conflict (id) do nothing;
