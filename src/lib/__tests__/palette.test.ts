import { describe, it, expect } from 'vitest';
import {
  createColor,
  addColor,
  removeColor,
  updateColor,
  findDuplicateIds,
  type Palette,
} from '../palette';

describe('createColor', () => {
  it('creates a color with a generated id and canonical hex', () => {
    const c = createColor('#FFF', 'Surface');
    expect(c.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(c.hex).toBe('#ffffff');
    expect(c.label).toBe('Surface');
  });
  it('creates without a label', () => {
    const c = createColor('#000');
    expect(c.label).toBeUndefined();
  });
  it('throws on invalid hex', () => {
    expect(() => createColor('not a hex')).toThrow();
  });
});

describe('addColor', () => {
  it('appends a color', () => {
    const p: Palette = [createColor('#fff')];
    const p2 = addColor(p, createColor('#000'));
    expect(p2).toHaveLength(2);
    expect(p2[1].hex).toBe('#000000');
  });
  it('does not mutate the input', () => {
    const p: Palette = [createColor('#fff')];
    addColor(p, createColor('#000'));
    expect(p).toHaveLength(1);
  });
});

describe('removeColor', () => {
  it('removes by id', () => {
    const c1 = createColor('#fff');
    const c2 = createColor('#000');
    const p: Palette = [c1, c2];
    const p2 = removeColor(p, c1.id);
    expect(p2).toEqual([c2]);
  });
  it('returns the same list if id not found', () => {
    const c1 = createColor('#fff');
    const p: Palette = [c1];
    expect(removeColor(p, 'missing-id')).toEqual([c1]);
  });
});

describe('updateColor', () => {
  it('updates hex by id and normalizes', () => {
    const c1 = createColor('#fff');
    const p: Palette = [c1];
    const p2 = updateColor(p, c1.id, { hex: '#ABC' });
    expect(p2[0].hex).toBe('#aabbcc');
  });
  it('updates label by id', () => {
    const c1 = createColor('#fff');
    const p: Palette = [c1];
    const p2 = updateColor(p, c1.id, { label: 'Body' });
    expect(p2[0].label).toBe('Body');
  });
  it('returns the same list if id not found', () => {
    const c1 = createColor('#fff');
    const p: Palette = [c1];
    expect(updateColor(p, 'missing-id', { label: 'x' })).toEqual([c1]);
  });
  it('rejects invalid hex by leaving the entry unchanged', () => {
    const c1 = createColor('#fff');
    const p: Palette = [c1];
    const p2 = updateColor(p, c1.id, { hex: 'not hex' });
    expect(p2[0].hex).toBe('#ffffff');
  });
});

describe('findDuplicateIds', () => {
  it('returns ids of colors sharing the same canonical hex', () => {
    const c1 = createColor('#fff');
    const c2 = createColor('#000');
    const c3 = createColor('#FFFFFF');
    const dups = findDuplicateIds([c1, c2, c3]);
    expect(new Set(dups)).toEqual(new Set([c1.id, c3.id]));
  });
  it('returns empty array when no duplicates', () => {
    const c1 = createColor('#fff');
    const c2 = createColor('#000');
    expect(findDuplicateIds([c1, c2])).toEqual([]);
  });
});
