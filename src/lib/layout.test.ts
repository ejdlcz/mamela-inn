import { describe, expect, it } from 'vitest';
import { densityForCellHeight, phoneGridColumns, roomGridColumns } from './layout';

describe('roomGridColumns', () => {
  it('makes buttons bigger for few rooms and smaller for many', () => {
    const minOf = (n: number) => Number(/clamp\((\d+)px/.exec(roomGridColumns(n))![1]);
    expect(minOf(4)).toBeGreaterThan(minOf(10));
    expect(minOf(10)).toBeGreaterThan(minOf(20));
    expect(minOf(20)).toBeGreaterThan(minOf(40));
  });
});

describe('phoneGridColumns', () => {
  const cols = (n: number) => Number(/repeat\((\d+),/.exec(phoneGridColumns(n))![1]);
  it('adds columns as rooms are added so everything fits one screen', () => {
    expect(cols(4)).toBe(2);
    expect(cols(10)).toBe(3);
    expect(cols(16)).toBe(4);
    expect(cols(30)).toBe(5);
  });
});

describe('densityForCellHeight', () => {
  it('shows less detail as the room buttons get shorter, but always keeps the time', () => {
    expect(densityForCellHeight(150)).toBe('comfortable');
    expect(densityForCellHeight(120)).toBe('compact');
    expect(densityForCellHeight(80)).toBe('tiny');
  });
});
