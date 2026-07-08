import { useCallback, useEffect, useState } from 'react';

/* Theme (light/dark) state, persisted to localStorage.
 *
 * Resolution order on first visit: stored preference → OS `prefers-color-scheme`
 * → light. The resolved theme is written to `document.documentElement.dataset.theme`
 * so the semantic tokens in tokens/colors.css flip the whole app.
 *
 * Exposes { theme, toggle, setTheme }. Mirrors the i18n/document.title effect
 * pattern already used in App.jsx. */

const STORAGE_KEY = 'nr-theme';

function getInitialTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* storage blocked — fall through to OS preference */
  }
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

export function useTheme() {
  const [theme, setThemeState] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage blocked — theme still applies for this session */
    }
  }, [theme]);

  const setTheme = useCallback((next) => setThemeState(next), []);
  const toggle = useCallback(
    () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')),
    []
  );

  return { theme, toggle, setTheme };
}
