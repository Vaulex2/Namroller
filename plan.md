# Nam Roller — Visual & UX Feature Upgrade

## Context

Nam Roller is a polished B2B conveyor-roller site (React 19 + Vite + Tailwind v4 + Framer Motion, RU/UZ i18n, Supabase-backed quotes). It already has a strong token-driven design system and motion primitives, but lacks a few high-impact niceties that improve both visual appeal and day-to-day usability for B2B buyers comparing equipment.

This plan delivers **6 focused, high-impact features** across three areas — **Dark mode**, **Catalog UX**, and **Conversion & content** — each built to reuse the existing design tokens, components, and i18n pattern.

---

## Feature 1 — Dark mode toggle (Dark mode)

**Why it works cleanly:** the entire site styles through semantic variables (`--surface-page/card/sunken`, `--text-*`, `--border-*`) defined in `src/tokens/colors.css`. Flipping those tokens under a `[data-theme="dark"]` selector recolors the whole app with no per-component edits. Dark "inverse" zones (header, hero gradients, footer) already use `--slate-900/950` and stay dark by design.

- In `src/tokens/colors.css`, add a `:root[data-theme="dark"] { … }` block remapping the **semantic** tokens only (not the raw slate scale): e.g. `--surface-page: var(--slate-950)`, `--surface-card: var(--slate-900)`, `--surface-sunken: var(--slate-800)`, `--surface-raised: var(--slate-800)`, `--text-strong: var(--slate-50)`, `--text-body: var(--slate-300)`, `--text-muted: var(--slate-400)`, `--border-subtle/default` → translucent light borders. Keep `--nr-accent` unchanged.
- New hook `src/hooks/useTheme.js`: reads `localStorage('nr-theme')`, falls back to `prefers-color-scheme`, exposes `{ theme, toggle }`, and sets `document.documentElement.dataset.theme`. Initialize in `src/App.jsx` via `useEffect` (mirrors the existing i18n/`document.title` effect).
- New `ThemeToggle` button in `src/pages/Header.jsx` right-controls, beside `LanguageSwitcher` (sun/moon). Add `sun`/`moon` icons to `src/pages/Icon.jsx` if absent.
- Spot-fix only the handful of hardcoded light values that would break in dark (e.g. the `var(--white)` logo box, `Photo` fallback stripe gradient) — verify visually, don't bulk-edit.

## Feature 2 — Catalog instant search (Catalog UX)

- In `Products` (`src/pages/Catalog.jsx`, ~line 179) add a `query` state and a search `Input` (`src/components/forms/Input.jsx`) above the filter tags. Filter `NR_PRODUCTS` by **translated** name/blurb/category (reuse the existing `t('pd.{id}.name')` lookups) combined with the current category filter.
- Show a result count and a friendly empty state when nothing matches. Keep the `Stagger key={...}` re-animation by keying on `catId + query`.

## Feature 3 — Product comparison tray (Catalog UX)

The headline catalog feature — lets buyers shortlist and compare specs side by side, then request one bundled quote.

- New `src/context/CompareContext.jsx` (or a `useCompare` hook backed by `localStorage`): holds up to 4 product ids with add/remove/clear.
- Add a compact "＋ Compare" toggle on each `ProductCard` (`src/pages/Catalog.jsx`, ~line 105) — checkbox-style, must not trigger the card's navigation `onClick`.
- New `src/components/ui/CompareTray.jsx`: a Framer-Motion slide-up bar (like `ContactDock`) showing selected thumbnails, mounted in `src/App.jsx`; opens a `CompareModal` with a side-by-side `SpecTable`-style grid (union of spec labels, "—" where absent).
- "Request quote for all" reuses the existing `QuoteModal` (`src/pages/QuoteModal.jsx`) / Supabase pipeline, passing the selected set — this also satisfies the favorites/shortlist intent without a separate system.

## Feature 4 — FAQ accordion (Conversion & content)

- New reusable `src/components/surfaces/Accordion.jsx` (animated expand/collapse via Framer Motion `AnimatePresence` + `height`), keyboard-accessible (`button` headers, `aria-expanded`).
- New `FAQ` section rendered on the `src/pages/Contact.jsx` page (and optionally a homepage link). Q&A content lives in i18n under a new `faq.items` array in `src/i18n/locales/ru.json` and `uz.json` (lead times, MOQ, delivery/installation, custom orders, warranty).

## Feature 5 — Product image lightbox (Conversion & content)

- New `src/components/ui/Lightbox.jsx`: full-screen overlay (Framer-Motion fade/zoom, `Esc`/backdrop close, focus trap) for the product image and video thumbnails.
- Wire into `ProductMedia` and the thumbnail strip in `ProductDetail` (`src/pages/Catalog.jsx`, ~lines 405–434) — click the photo to open zoomed. Each product has one still `image` plus `videos`, so the lightbox shows those as its gallery (no data-model change needed).

## Feature 6 — Enhanced mobile nav drawer (Conversion & content)

- Upgrade the existing plain dropdown menu in `src/pages/Header.jsx` (~lines 152–177) to an animated slide-in drawer (Framer Motion `AnimatePresence`, backdrop, body-scroll lock, `Esc` to close).
- Move the **language switcher**, the new **theme toggle**, and the **CTA** into the drawer so they're reachable on phones (currently the CTA is hidden ≤420px).

---

## i18n keys to add (both `ru.json` and `uz.json`)

`theme.light` / `theme.dark`, `catalog.search.placeholder` / `catalog.search.noResults` / `catalog.search.count`, `compare.add` / `compare.title` / `compare.requestAll` / `compare.empty`, `faq.heading` + `faq.items` (array of `{q,a}`). Follow the existing nested-key convention already used for `catalog.*` and `pd.*`.

## Files at a glance

- **Edit:** `src/tokens/colors.css`, `src/App.jsx`, `src/pages/Header.jsx`, `src/pages/Catalog.jsx`, `src/pages/Contact.jsx`, `src/pages/Icon.jsx`, `src/i18n/locales/ru.json`, `src/i18n/locales/uz.json`
- **New:** `src/hooks/useTheme.js`, `src/context/CompareContext.jsx`, `src/components/ui/CompareTray.jsx`, `src/components/surfaces/Accordion.jsx`, `src/components/ui/Lightbox.jsx`
- **Reuse:** `Input`, `Button`, `Card`, `SpecTable`, `QuoteModal`, `Reveal`/`Stagger`, `ContactDock` (as the slide-up pattern), the `--ease-*`/`--dur-*` motion tokens.

## Verification

1. `npm run dev` and exercise each feature in the browser:
   - Toggle dark mode → page/cards/text/borders recolor, accent stays orange, header/hero/footer remain intentionally dark, preference persists on reload and respects OS setting on first visit.
   - Catalog search → type partial RU and UZ terms (switch language), confirm filtering + result count + empty state, and that it composes with category tags.
   - Compare → add 2–4 products, open the side-by-side modal, request a bundled quote, confirm the Supabase/Telegram quote payload includes all selected products.
   - FAQ → expand/collapse with mouse and keyboard; verify RU/UZ copy.
   - Lightbox → open from product photo and a video thumb; close via `Esc` and backdrop.
   - Mobile drawer → at ≤768px confirm slide-in animation, language/theme/CTA present, scroll lock, `Esc` close.
2. `npm run build` to confirm no type/build errors. Run `npx eslint .` on changed files.
3. Confirm reduced-motion users get non-animated fallbacks (existing motion components already honor this — keep new ones consistent).
