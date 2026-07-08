// A "new" quote is considered stale if it's sat unviewed for this long.
// Shared by QuotesPanel (per-row badge) and OverviewPanel (KPI count) so
// there's one definition of "stale", not two.
export const STALE_MS = 48 * 3600 * 1000;
