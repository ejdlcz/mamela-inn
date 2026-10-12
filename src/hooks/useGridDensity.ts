import { useEffect, useState, type RefObject } from 'react';
import { densityForCellHeight, phoneGridColumnCount, type Density } from '../lib/layout';

/**
 * On a portrait phone the room grid is squeezed to fit the screen. This watches
 * the grid's real height (it changes with the phone, the browser's toolbars, text
 * size and zoom) and says how much detail each room button can afford, so the
 * time left is never cut off.
 */
export function useGridDensity(
  gridRef: RefObject<HTMLElement>,
  roomCount: number,
  enabled: boolean,
): Density {
  const [density, setDensity] = useState<Density>('comfortable');

  useEffect(() => {
    const el = gridRef.current;
    if (!enabled || !el || typeof ResizeObserver === 'undefined') {
      setDensity('comfortable');
      return;
    }
    const measure = () => {
      const rows = Math.max(1, Math.ceil(roomCount / phoneGridColumnCount(roomCount)));
      const gap = parseFloat(getComputedStyle(el).rowGap) || 0;
      setDensity(densityForCellHeight((el.clientHeight - gap * (rows - 1)) / rows));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [gridRef, roomCount, enabled]);

  return density;
}
