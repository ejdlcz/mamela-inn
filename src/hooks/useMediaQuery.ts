import { useEffect, useState } from 'react';

/** Same query as the `phone:` screen in tailwind.config.ts (portrait phones). */
export const PHONE_QUERY = '(max-width: 639px) and (orientation: portrait)';
/** Any narrow window, portrait or not. */
export const NARROW_QUERY = '(max-width: 639px)';

const supported = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function';

/** true while the browser window matches the CSS media query. */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => supported() && window.matchMedia(query).matches);

  useEffect(() => {
    if (!supported()) return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

export const useIsNarrow = () => useMediaQuery(NARROW_QUERY);
