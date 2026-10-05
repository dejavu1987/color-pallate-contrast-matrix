import { describe, it, expect } from 'vitest';
import { normalizeHex, hexToRgb } from '../contrast';
import { relativeLuminance, contrastRatio, verdict } from '../contrast';

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

describe('relativeLuminance', () => {
  it('returns 1 for white', () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 4);
  });
  it('returns 0 for black', () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
  });
  it('matches a known mid-grey reference (#777777 ≈ 0.184)', () => {
    expect(relativeLuminance({ r: 0x77, g: 0x77, b: 0x77 })).toBeCloseTo(0.184, 2);
  });
});

describe('contrastRatio', () => {
  it('white vs black is 21:1', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 2);
  });
  it('is symmetric', () => {
    expect(contrastRatio('#1e88e5', '#111111'))
      .toBeCloseTo(contrastRatio('#111111', '#1e88e5'), 4);
  });
  it('same color is 1:1', () => {
    expect(contrastRatio('#808080', '#808080')).toBeCloseTo(1, 4);
  });
});

describe('verdict', () => {
  it('passes everything at 21:1', () => {
    const v = verdict(21);
    expect(v.passes.aaNormal).toBe(true);
    expect(v.passes.aaLarge).toBe(true);
    expect(v.passes.aaaNormal).toBe(true);
    expect(v.passes.aaaLarge).toBe(true);
    expect(v.ratio).toBe(21);
  });
  it('fails everything at 1:1', () => {
    const v = verdict(1);
    expect(v.passes.aaNormal).toBe(false);
    expect(v.passes.aaLarge).toBe(false);
    expect(v.passes.aaaNormal).toBe(false);
    expect(v.passes.aaaLarge).toBe(false);
  });
  it('boundary at 4.5: aaNormal passes, aaaNormal fails', () => {
    const v = verdict(4.5);
    expect(v.passes.aaNormal).toBe(true);
    expect(v.passes.aaaNormal).toBe(false);
    expect(v.passes.aaLarge).toBe(true);
    expect(v.passes.aaaLarge).toBe(true);
  });
  it('boundary at 3.0: aaLarge passes, aaNormal fails', () => {
    const v = verdict(3.0);
    expect(v.passes.aaLarge).toBe(true);
    expect(v.passes.aaNormal).toBe(false);
  });
  it('boundary at 7.0: aaaNormal passes', () => {
    const v = verdict(7);
    expect(v.passes.aaaNormal).toBe(true);
  });
});
