import { describe, it, expect, beforeEach } from 'vitest';
import { encodePaletteToHash, decodePaletteFromHash } from '../share';
import { createColor, type Palette } from '../palette';
import { savePaletteToStorage, loadPaletteFromStorage } from '../share';

describe('encodePaletteToHash / decodePaletteFromHash', () => {
  it('round-trips a palette without labels', () => {
    const p: Palette = [createColor('#1e88e5'), createColor('#ffffff'), createColor('#111111')];
    const hash = encodePaletteToHash(p);
    const decoded = decodePaletteFromHash(hash);
    expect(decoded.map((c) => c.hex)).toEqual(['#1e88e5', '#ffffff', '#111111']);
    expect(decoded.every((c) => c.label === undefined)).toBe(true);
  });

  it('round-trips a palette with labels', () => {
    const p: Palette = [
      createColor('#1e88e5', 'Primary'),
      createColor('#ffffff', 'Surface'),
    ];
    const hash = encodePaletteToHash(p);
    const decoded = decodePaletteFromHash(hash);
    expect(decoded[0].label).toBe('Primary');
    expect(decoded[1].label).toBe('Surface');
  });

  it('escapes ~ in labels so the separator is unambiguous', () => {
    const p: Palette = [createColor('#1e88e5', 'has ~ tilde')];
    const hash = encodePaletteToHash(p);
    const decoded = decodePaletteFromHash(hash);
    expect(decoded[0].label).toBe('has ~ tilde');
  });

  it('escapes , in labels', () => {
    const p: Palette = [createColor('#1e88e5', 'a, b')];
    const hash = encodePaletteToHash(p);
    const decoded = decodePaletteFromHash(hash);
    expect(decoded[0].label).toBe('a, b');
  });

  it('returns empty palette for malformed hash', () => {
    expect(decodePaletteFromHash('')).toEqual([]);
    expect(decodePaletteFromHash('#nope=garbage')).toEqual([]);
    expect(decodePaletteFromHash('#p=zzzzzz,123')).toEqual([]);
  });

  it('skips invalid colors but keeps valid ones', () => {
    const decoded = decodePaletteFromHash('#p=1e88e5,zzzzzz,ffffff');
    expect(decoded.map((c) => c.hex)).toEqual(['#1e88e5', '#ffffff']);
  });

  it('hash starts with #p=', () => {
    const p: Palette = [createColor('#000')];
    expect(encodePaletteToHash(p)).toMatch(/^#p=/);
  });
});

import { buildMatrixCsv } from '../share';

describe('buildMatrixCsv', () => {
  it('produces a labeled NxN matrix with ratios', () => {
    const a = createColor('#ffffff', 'Surface');
    const b = createColor('#000000', 'Ink');
    const csv = buildMatrixCsv([a, b]);
    const lines = csv.trim().split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe(',Surface,Ink');
    expect(lines[1]).toMatch(/^Surface,1\.00,21\.00$/);
    expect(lines[2]).toMatch(/^Ink,21\.00,1\.00$/);
  });

  it('falls back to hex when no label is set', () => {
    const a = createColor('#ffffff');
    const b = createColor('#000000');
    const csv = buildMatrixCsv([a, b]);
    const lines = csv.trim().split('\n');
    expect(lines[0]).toBe(',#ffffff,#000000');
  });

  it('quotes labels that contain commas', () => {
    const a = createColor('#ffffff', 'A, B');
    const b = createColor('#000000');
    const csv = buildMatrixCsv([a, b]);
    const lines = csv.trim().split('\n');
    expect(lines[0]).toBe(',"A, B",#000000');
  });

  it('returns empty string for empty palette', () => {
    expect(buildMatrixCsv([])).toBe('');
  });
});

describe('savePaletteToStorage / loadPaletteFromStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips a palette through localStorage', () => {
    const p: Palette = [createColor('#1e88e5', 'Primary'), createColor('#fff')];
    savePaletteToStorage(p);
    const loaded = loadPaletteFromStorage();
    expect(loaded).not.toBeNull();
    expect(loaded!.map((c) => c.hex)).toEqual(['#1e88e5', '#ffffff']);
    expect(loaded![0].label).toBe('Primary');
  });

  it('returns null when nothing is stored', () => {
    expect(loadPaletteFromStorage()).toBeNull();
  });

  it('returns null on malformed JSON', () => {
    localStorage.setItem('contrast-matrix:palette:v1', 'not json');
    expect(loadPaletteFromStorage()).toBeNull();
  });

  it('returns null on schema mismatch', () => {
    localStorage.setItem('contrast-matrix:palette:v1', JSON.stringify({ foo: 'bar' }));
    expect(loadPaletteFromStorage()).toBeNull();
  });
});
