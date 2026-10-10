import { describe, expect, it } from 'vitest';
import { roomGridColumns } from './layout';

describe('roomGridColumns', () => {
  it('makes buttons bigger for few rooms and smaller for many', () => {
    const minOf = (n: number) => Number(/clamp\((\d+)px/.exec(roomGridColumns(n))![1]);
    expect(minOf(4)).toBeGreaterThan(minOf(10));
    expect(minOf(10)).toBeGreaterThan(minOf(20));
    expect(minOf(20)).toBeGreaterThan(minOf(40));
  });
});
