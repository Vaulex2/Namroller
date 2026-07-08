import React from 'react';

/* Extracts the loading/error/reloadKey + "alive"-guarded-effect pattern that
   was duplicated across every admin panel. `fetcher` must be a stable
   reference (wrap with useCallback at the call site) or the effect will
   refetch on every render. Error is the raw thrown value, not pre-translated
   — callers still map it through t() themselves so i18n stays out of the hook. */
export function useAdminResource(fetcher) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    fetcher()
      .then((result) => { if (alive) { setData(result); setError(null); setLoading(false); } })
      .catch((err) => { if (alive) { setError(err); setLoading(false); } });
    return () => { alive = false; };
  }, [fetcher, reloadKey]);

  // setLoading(true) lives here (an event-handler-triggered callback), not in
  // the effect body, so a reload doesn't synchronously cascade a render from
  // inside the effect.
  const reload = React.useCallback(() => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  return { data, setData, loading, error, reload };
}
