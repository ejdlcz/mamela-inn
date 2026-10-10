import { describe, expect, it } from 'vitest';
import { genReference } from './ids';

describe('genReference', () => {
  it('uses the INN-YYYYMMDD-XXXX format', () => {
    expect(genReference(new Set(), new Date(2026, 8, 18))).toMatch(/^INN-20260918-\d{4}$/);
  });

  it('never returns a reference that already exists', () => {
    const date = new Date(2026, 8, 18);
    const used = new Set<string>();
    for (let i = 0; i < 300; i++) {
      const ref = genReference(used, date);
      expect(used.has(ref)).toBe(false);
      used.add(ref);
    }
  });

  it('still finds a free code when almost everything is taken', () => {
    const date = new Date(2026, 8, 18);
    const used = new Set<string>();
    for (let n = 1000; n <= 9998; n++) used.add(`INN-20260918-${n}`);
    expect(genReference(used, date)).toBe('INN-20260918-9999');
  });
});
