import React from 'react';
import { CompareContext, MAX_COMPARE, readStored } from '../hooks/useCompare';

/* Product comparison shortlist provider.
 *
 * Holds up to MAX_COMPARE product ids so buyers can shortlist items across the
 * catalog and compare specs side by side, then request one bundled quote.
 * Persisted to localStorage so the shortlist survives navigation and reloads.
 * The context object and `useCompare` hook live in hooks/useCompare.js. */

export function CompareProvider({ children }) {
  const [ids, setIds] = React.useState(readStored);

  React.useEffect(() => {
    try {
      localStorage.setItem('nr-compare', JSON.stringify(ids));
    } catch {
      /* storage blocked — shortlist still works for this session */
    }
  }, [ids]);

  const value = React.useMemo(() => {
    const has = (id) => ids.includes(id);
    return {
      ids,
      count: ids.length,
      isFull: ids.length >= MAX_COMPARE,
      has,
      add: (id) =>
        setIds((prev) =>
          prev.includes(id) || prev.length >= MAX_COMPARE ? prev : [...prev, id]
        ),
      remove: (id) => setIds((prev) => prev.filter((x) => x !== id)),
      toggle: (id) =>
        setIds((prev) => {
          if (prev.includes(id)) return prev.filter((x) => x !== id);
          if (prev.length >= MAX_COMPARE) return prev;
          return [...prev, id];
        }),
      clear: () => setIds([]),
    };
  }, [ids]);

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}
