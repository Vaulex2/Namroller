import React from 'react';
import { NR_PRODUCTS } from '../pages/data';
import { fetchPublishedProducts } from '../lib/products';

// Module-level cache: one fetch shared by every mount within this page
// session, not per-component. Known limitation: if an admin edits the
// catalog in another tab, an already-open marketing-site tab won't see the
// change until a hard reload (the cache is per-page-load, not per-navigation
// — acceptable for a low-traffic marketing catalog).
let cache = null;
let inflight = null;

/* Centralizes the 3 places that used to import NR_PRODUCTS directly
   (Catalog.jsx, Home.jsx, CompareTray.jsx). Falls back to the hardcoded seed
   when the DB table is empty or Supabase isn't configured — same fallback
   contract as Capabilities.jsx's capability_videos fallback. */
export function useProducts() {
  const [dbProducts, setDbProducts] = React.useState(cache);

  React.useEffect(() => {
    if (cache) return;
    let active = true;
    (inflight ||= fetchPublishedProducts().catch(() => []))
      .then((list) => { cache = list; if (active) setDbProducts(list); });
    return () => { active = false; };
  }, []);

  const products = dbProducts && dbProducts.length ? dbProducts : NR_PRODUCTS;
  return { products, source: dbProducts && dbProducts.length ? 'db' : 'seed' };
}
