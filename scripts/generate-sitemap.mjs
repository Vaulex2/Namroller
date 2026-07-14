import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

// Minimal .env loader (no dotenv dependency); no-ops if the file is missing
// since Vercel injects real env vars instead of a physical .env file.
function loadDotEnv() {
  const envPath = path.resolve('.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
loadDotEnv();

const BASE = 'https://namroller.com';
const STATIC_ROUTES = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/products', changefreq: 'weekly', priority: '0.9' },
  { loc: '/about', changefreq: 'monthly', priority: '0.6' },
  { loc: '/contact', changefreq: 'monthly', priority: '0.6' },
  { loc: '/privacy', changefreq: 'yearly', priority: '0.2' },
  { loc: '/terms', changefreq: 'yearly', priority: '0.2' },
  { loc: '/cookies', changefreq: 'yearly', priority: '0.2' },
];

// Best-effort: a failed/missing Supabase fetch should never break the build,
// it should just fall back to the static routes above.
async function fetchProductIds() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn('[sitemap] VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY not set — sitemap will only list static routes.');
    return [];
  }
  try {
    const res = await fetch(`${url}/rest/v1/products?select=id&published=eq.true`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return (await res.json()).map((row) => row.id);
  } catch (err) {
    console.warn('[sitemap] Failed to fetch products, sitemap will only list static routes:', err.message);
    return [];
  }
}

function urlEntry({ loc, changefreq, priority }) {
  return `  <url>\n    <loc>${BASE}${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

const productIds = await fetchProductIds();
const productEntries = productIds.map((id) =>
  urlEntry({ loc: `/products/${encodeURIComponent(id)}`, changefreq: 'weekly', priority: '0.7' }),
);

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...STATIC_ROUTES.map(urlEntry), ...productEntries].join('\n')}\n</urlset>\n`;

writeFileSync(path.resolve('public/sitemap.xml'), xml);
console.log(`[sitemap] Wrote public/sitemap.xml — ${STATIC_ROUTES.length} static routes + ${productEntries.length} product routes.`);
