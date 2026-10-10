import { pad2 } from './format';

/** Reference numbers look like INN-20260918-4821 */
export function referencePrefix(date = new Date()) {
  return `INN-${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`;
}

/**
 * Generates a reference that is not in `existing`. Tries random codes first,
 * then falls back to scanning sequentially so it can never return a duplicate.
 */
export function genReference(existing: Set<string>, date = new Date()) {
  const prefix = referencePrefix(date);
  for (let i = 0; i < 50; i++) {
    const candidate = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!existing.has(candidate)) return candidate;
  }
  for (let n = 1000; n <= 9999; n++) {
    const candidate = `${prefix}-${n}`;
    if (!existing.has(candidate)) return candidate;
  }
  throw new Error('No free reference numbers left for today.');
}
