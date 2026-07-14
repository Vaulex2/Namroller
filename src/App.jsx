import { useRef, useState, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { Header, Footer } from './pages/Header';
import { Home } from './pages/Home';
import { Products, ProductDetail } from './pages/Catalog';
import { Capabilities } from './pages/Capabilities';
import { Contact } from './pages/Contact';
import { PrivacyPolicy, TermsOfService, CookiePolicy } from './pages/Legal';
import { ScrollContext } from './components/motion/ScrollContext';
import { PageTransition } from './components/motion/PageTransition';
import { ContactDock } from './components/ui/ContactDock';
import { CookieConsent } from './components/ui/CookieConsent';
import { CompareProvider } from './context/CompareContext';
import { CompareTray } from './components/ui/CompareTray';
import { useTheme } from './hooks/useTheme';

// Admin panel is code-split behind an unlinked hash, so normal visitors never
// download it. Enforcement is server-side (RLS + edge fn); the hash is just an
// unadvertised entry point.
const ADMIN_HASH = '#/admin-namroller-8f2a';
const AdminApp = lazy(() => import('./pages/admin/AdminApp'));

const TITLES = {
  ru: 'Nam Roller — Конвейерные ролики и системы',
  uz: 'Nam Roller — Konveyer roliklari va tizimlari',
  en: 'Nam Roller — Conveyor Rollers & Systems',
  zh: 'Nam Roller — 输送辊筒与系统',
  fa: 'Nam Roller — غلتک‌ها و سیستم‌های نوار نقاله',
};

// Maps a real URL path to the route name the page tree below switches on,
// and pulls the product id out of /products/:id. Unknown paths fall back to
// Home rather than a dedicated 404 (there's no 404 page to route to).
function routeFromPath(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  const productMatch = path.match(/^\/products\/([^/]+)$/);
  if (productMatch) return { route: 'product', productId: decodeURIComponent(productMatch[1]) };
  const known = ['products', 'contact', 'about', 'privacy', 'terms', 'cookies'];
  const name = path.slice(1);
  if (path === '/') return { route: 'home', productId: null };
  if (known.includes(name)) return { route: name, productId: null };
  return { route: 'home', productId: null };
}

function AppShell() {
  const scrollRef = useRef(null);
  const { i18n } = useTranslation();
  const { theme, toggle: toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { route, productId } = routeFromPath(location.pathname);

  useEffect(() => {
    const lang = i18n.language;
    document.documentElement.lang = lang;
    document.title = TITLES[lang] || TITLES.ru;
  }, [i18n.language]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [location.pathname]);

  // Keep the canonical/OG url tags honest per-route — they start out hardcoded
  // to "/" in index.html for pre-render/social-share purposes, but must match
  // the actual page once the SPA takes over, or every page tells crawlers
  // its "real" URL is the homepage.
  useEffect(() => {
    const url = `https://namroller.com${location.pathname === '/' ? '' : location.pathname}`;
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', url);
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', url);
  }, [location.pathname]);

  const go = (r, id = null) => {
    const path = r === 'home' ? '/' : r === 'product' ? `/products/${id}` : `/${r}`;
    navigate(path);
  };

  return (
    <ScrollContext.Provider value={scrollRef}>
      <CompareProvider>
        <div
          ref={scrollRef}
          style={{ position: 'relative', height: '100vh', overflowY: 'auto', background: 'var(--surface-card)' }}
        >
          <Header route={route} go={go} theme={theme} toggleTheme={toggleTheme} />
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={location.pathname}>
              {route === 'home'     && <Home go={go} />}
              {route === 'products' && <Products go={go} />}
              {route === 'product'  && <ProductDetail id={productId} go={go} />}
              {route === 'contact'  && <Contact />}
              {route === 'about'    && <Capabilities />}
              {route === 'privacy'  && <PrivacyPolicy />}
              {route === 'terms'    && <TermsOfService />}
              {route === 'cookies'  && <CookiePolicy />}
            </PageTransition>
          </AnimatePresence>
          <Footer go={go} />
          <ContactDock />
          <CompareTray go={go} />
          <CookieConsent go={go} />
        </div>
      </CompareProvider>
    </ScrollContext.Provider>
  );
}

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState(
    typeof window !== 'undefined' && window.location.hash === ADMIN_HASH,
  );

  // Toggle the admin route off the URL hash (mount + on change).
  useEffect(() => {
    const sync = () => setIsAdminRoute(window.location.hash === ADMIN_HASH);
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  // Admin panel renders full-screen, outside the marketing chrome and router.
  if (isAdminRoute) {
    return (
      <Suspense fallback={null}>
        <AdminApp />
      </Suspense>
    );
  }

  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
