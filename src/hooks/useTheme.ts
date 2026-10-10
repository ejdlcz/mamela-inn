import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../config/defaults';
import { safeGet, safeSet } from '../lib/storage';
import type { Theme } from '../types';

/** Day / night mode. Remembered per device; applied as data-theme on <html>. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() =>
    safeGet(STORAGE_KEYS.theme) === 'dark' ? 'dark' : 'light',
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    safeSet(STORAGE_KEYS.theme, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  return { theme, toggleTheme };
}
