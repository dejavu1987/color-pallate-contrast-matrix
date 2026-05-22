import { normalizeHex, contrastRatio } from './contrast';
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

function csvCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildMatrixCsv(palette: Palette): string {
  if (palette.length === 0) return '';
  const labels = palette.map((c) => c.label && c.label.length > 0 ? c.label : c.hex);
  const header = [''].concat(labels.map(csvCell)).join(',');
  const rows = palette.map((rowColor, i) => {
    const cells = palette.map((colColor) => contrastRatio(rowColor.hex, colColor.hex).toFixed(2));
    return [csvCell(labels[i]), ...cells].join(',');
  });
  return [header, ...rows].join('\n') + '\n';
}

export function triggerDownload(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function todayStamp(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
