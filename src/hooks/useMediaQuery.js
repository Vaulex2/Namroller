import { useState, useEffect } from 'react';

/* Tracks whether a media query currently matches, updating live on
 * viewport/orientation changes (mirrors the small-hook style of useTheme.js).
 * SSR-safe: matchMedia is unavailable server-side, so it starts `false`. */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
