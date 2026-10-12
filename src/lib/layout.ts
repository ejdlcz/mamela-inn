/**
 * Column sizing for the room grid. Buttons scale with the screen width (vw)
 * and with how many rooms exist, so few rooms don't look lost on a desktop and
 * many rooms don't feel crowded. Tweak the numbers to taste.
 */
export function roomGridColumns(roomCount: number) {
  let min = 150;
  let max = 210;
  if (roomCount > 24) [min, max] = [105, 140];
  else if (roomCount > 16) [min, max] = [120, 160];
  else if (roomCount > 10) [min, max] = [135, 185];
  else if (roomCount <= 6) [min, max] = [170, 260];
  return `repeat(auto-fill, minmax(clamp(${min}px, 11vw, ${max}px), 1fr))`;
}

/**
 * Narrow screens (phones): a fixed number of equal columns, so the whole grid
 * fits on one screen without scrolling. More rooms -> more, smaller columns.
 */
export function phoneGridColumnCount(roomCount: number) {
  return roomCount <= 6 ? 2 : roomCount <= 12 ? 3 : roomCount <= 20 ? 4 : 5;
}

export function phoneGridColumns(roomCount: number) {
  return `repeat(${phoneGridColumnCount(roomCount)}, minmax(0, 1fr))`;
}

/** How much detail a room button can show for the height it ends up with. */
export type Density = 'comfortable' | 'compact' | 'tiny';

export function densityForCellHeight(heightPx: number): Density {
  if (heightPx >= 136) return 'comfortable'; // status, number, time left, guest name
  if (heightPx >= 106) return 'compact'; // status, number, time left
  return 'tiny'; // number, time left (always visible)
}
