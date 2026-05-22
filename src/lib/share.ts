import { normalizeHex } from './contrast';
import { createColor, type Color, type Palette } from './palette';

const HASH_PREFIX = '#p=';

function encodeLabel(label: string): string {
  return encodeURIComponent(label).replace(/~/g, '%7E');
}

function decodeLabel(encoded: string): string {
  return decodeURIComponent(encoded);
}

export function encodePaletteToHash(palette: Palette): string {
  const parts = palette.map((c) => {
    const hexNoHash = c.hex.replace(/^#/, '');
    return c.label === undefined ? hexNoHash : `${hexNoHash}~${encodeLabel(c.label)}`;
  });
  return `${HASH_PREFIX}${parts.join(',')}`;
}

export function decodePaletteFromHash(hash: string): Palette {
  if (!hash) return [];
  const normalized = hash.startsWith('#') ? hash : `#${hash}`;
  if (!normalized.startsWith(HASH_PREFIX)) return [];
  const body = normalized.slice(HASH_PREFIX.length);
  if (!body) return [];
  const entries = body.split(',');
  const palette: Palette = [];
  for (const entry of entries) {
    const [hexPart, ...labelParts] = entry.split('~');
    const labelEncoded = labelParts.join('~');
    // Only accept 6-char hex in the hash format (3-char abbreviations are not stored)
    if (!/^[0-9a-f]{6}$/i.test(hexPart)) continue;
    const canonical = normalizeHex(hexPart);
    if (!canonical) continue;
    try {
      const label = labelEncoded ? decodeLabel(labelEncoded) : undefined;
      palette.push(createColor(canonical, label));
    } catch {
      // skip
    }
  }
  return palette;
}

export type { Color, Palette };

const STORAGE_KEY = 'contrast-matrix:palette:v1';

export function savePaletteToStorage(palette: Palette): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(palette));
  } catch {
    // Quota or disabled storage — silently ignore.
  }
}

export function loadPaletteFromStorage(): Palette | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const palette: Palette = [];
    for (const item of parsed) {
      if (
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.hex === 'string'
      ) {
        const canonical = normalizeHex(item.hex);
        if (!canonical) continue;
        palette.push({
          id: item.id,
          hex: canonical,
          ...(typeof item.label === 'string' ? { label: item.label } : {}),
        });
      }
    }
    return palette;
  } catch {
    return null;
  }
}
