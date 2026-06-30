import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { Header, Footer } from './pages/Header';
import { Home } from './pages/Home';
import { Products, ProductDetail } from './pages/Catalog';
import { Capabilities } from './pages/Capabilities';
import { Contact } from './pages/Contact';
import { ScrollContext } from './components/motion/ScrollContext';
import { PageTransition } from './components/motion/PageTransition';
import { ContactDock } from './components/ui/ContactDock';

const TITLES = {
  ru: 'Nam Roller — Конвейерные ролики и системы',
  uz: 'Nam Roller — Konveyer roliklari va tizimlari',
};

export default function App() {
  const [route, setRoute] = useState('home');
  const [productId, setProductId] = useState(null);
  const scrollRef = useRef(null);
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = i18n.language;
    document.documentElement.lang = lang;
    document.title = TITLES[lang] || TITLES.ru;
  }, [i18n.language]);

  const go = (r, id = null) => {
    setRoute(r);
    if (id) setProductId(id);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  return (
    <ScrollContext.Provider value={scrollRef}>
      <div
        ref={scrollRef}
        style={{ position: 'relative', height: '100vh', overflowY: 'auto', background: 'var(--surface-card)' }}
      >
        <Header route={route} go={go} />
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={route}>
            {route === 'home'     && <Home go={go} />}
            {route === 'products' && <Products go={go} />}
            {route === 'product'  && <ProductDetail id={productId} go={go} />}
            {route === 'contact'  && <Contact />}
            {route === 'about'    && <Capabilities />}
          </PageTransition>
        </AnimatePresence>
        <Footer go={go} />
        <ContactDock />
      </div>
    </ScrollContext.Provider>
  );
}
