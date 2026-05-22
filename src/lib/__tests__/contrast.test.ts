import { describe, it, expect } from 'vitest';
import { normalizeHex, hexToRgb } from '../contrast';

describe('normalizeHex', () => {
  it('expands 3-digit hex with leading #', () => {
    expect(normalizeHex('#abc')).toBe('#aabbcc');
  });
  it('expands 3-digit hex without #', () => {
    expect(normalizeHex('abc')).toBe('#aabbcc');
  });
  it('lowercases 6-digit hex', () => {
    expect(normalizeHex('#AABBCC')).toBe('#aabbcc');
  });
  it('passes through already-canonical hex', () => {
    expect(normalizeHex('#aabbcc')).toBe('#aabbcc');
  });
  it('returns null for invalid hex', () => {
    expect(normalizeHex('#zzzzzz')).toBeNull();
    expect(normalizeHex('#ab')).toBeNull();
    expect(normalizeHex('')).toBeNull();
    expect(normalizeHex('not a color')).toBeNull();
  });
});

describe('hexToRgb', () => {
  it('parses white', () => {
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
  });
  it('parses black', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
  });
  it('parses mid-grey', () => {
    expect(hexToRgb('#808080')).toEqual({ r: 128, g: 128, b: 128 });
  });
  it('accepts 3-digit hex', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
  });
  it('throws on invalid hex', () => {
    expect(() => hexToRgb('not hex')).toThrow();
  });
});
