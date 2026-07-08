import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
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
};

export default function App() {
  const [route, setRoute] = useState('home');
  const [productId, setProductId] = useState(null);
  const [isAdminRoute, setIsAdminRoute] = useState(
    typeof window !== 'undefined' && window.location.hash === ADMIN_HASH,
  );
  const scrollRef = useRef(null);
  const { i18n } = useTranslation();
  const { theme, toggle: toggleTheme } = useTheme();

  useEffect(() => {
    const lang = i18n.language;
    document.documentElement.lang = lang;
    document.title = TITLES[lang] || TITLES.ru;
  }, [i18n.language]);

  // Toggle the admin route off the URL hash (mount + on change).
  useEffect(() => {
    const sync = () => setIsAdminRoute(window.location.hash === ADMIN_HASH);
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  // Admin panel renders full-screen, outside the marketing chrome.
  if (isAdminRoute) {
    return (
      <Suspense fallback={null}>
        <AdminApp />
      </Suspense>
    );
  }

  const go = (r, id = null) => {
    setRoute(r);
    if (id) setProductId(id);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
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
            <PageTransition key={route}>
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
