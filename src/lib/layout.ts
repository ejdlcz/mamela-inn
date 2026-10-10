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
