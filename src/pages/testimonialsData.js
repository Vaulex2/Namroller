/* Seed / fallback testimonials — language-neutral metadata only.
   The localized `text` + `role` live in the i18n files under
   `testimonials.seed` (ru.json / uz.json) and are merged by index
   in Testimonials.jsx. Names are a mix of Uzbek and Russian men
   (the company operates in Uzbekistan). Avatars are first-letter
   monograms (no photos) rendered by the testimonials column. */

export const SEED_META = [
  { name: 'Akmal Karimov',     rating: 5 },
  { name: 'Sergey Volkov',     rating: 5 },
  { name: 'Sardor Yusupov',    rating: 5 },
  { name: 'Dmitriy Sokolov',   rating: 5 },
  { name: 'Jasur Rahimov',     rating: 4 },
  { name: 'Andrey Morozov',    rating: 5 },
  { name: 'Bobur Tursunov',    rating: 5 },
  { name: 'Aleksey Novikov',   rating: 5 },
  { name: 'Otabek Saidov',     rating: 4 },
  { name: 'Rustam Abdullaev',  rating: 5 },
  { name: 'Igor Kuznetsov',    rating: 5 },
  { name: 'Sherzod Komilov',   rating: 4 },
];
