// A "new" quote is considered stale if it's sat unviewed for this long.
// Shared by QuotesPanel (per-row badge) and OverviewPanel (KPI count) so
// there's one definition of "stale", not two.
export const STALE_MS = 48 * 3600 * 1000;

// Curated subset of the shared Icon set relevant to product catalog imagery
// (full set lives in src/pages/Icon.jsx). Shared by IconPicker (default
// options) and ProductForm (initial values for new icon fields) so there's
// one list to keep in sync, not one per file.
export const PRODUCT_ICON_OPTIONS = [
  'package', 'cog', 'shield', 'ruler', 'gauge', 'factory', 'truck', 'wrench',
  'flame', 'check', 'cube', 'layers', 'grid',
];
