import { normalizeHex } from './contrast';

export type Color = {
  id: string;
  hex: string;
  label?: string;
};

export type Palette = Color[];

export function createColor(hex: string, label?: string): Color {
  const canonical = normalizeHex(hex);
  if (!canonical) throw new Error(`Invalid hex: ${hex}`);
  return {
    id: crypto.randomUUID(),
    hex: canonical,
    ...(label !== undefined ? { label } : {}),
  };
}

export function addColor(palette: Palette, color: Color): Palette {
  return [...palette, color];
}

export function removeColor(palette: Palette, id: string): Palette {
  const idx = palette.findIndex((c) => c.id === id);
  if (idx === -1) return palette;
  return [...palette.slice(0, idx), ...palette.slice(idx + 1)];
}

export function updateColor(
  palette: Palette,
  id: string,
  patch: Partial<Pick<Color, 'hex' | 'label'>>,
): Palette {
  const idx = palette.findIndex((c) => c.id === id);
  if (idx === -1) return palette;
  const current = palette[idx];
  const next: Color = { ...current };
  if (patch.hex !== undefined) {
    const canonical = normalizeHex(patch.hex);
    if (canonical) next.hex = canonical;
  }
  if (patch.label !== undefined) {
    next.label = patch.label;
  }
  return [...palette.slice(0, idx), next, ...palette.slice(idx + 1)];
}

export function findDuplicateIds(palette: Palette): string[] {
  const byHex = new Map<string, string[]>();
  for (const c of palette) {
    const list = byHex.get(c.hex) ?? [];
    list.push(c.id);
    byHex.set(c.hex, list);
  }
  const dups: string[] = [];
  for (const ids of byHex.values()) {
    if (ids.length > 1) dups.push(...ids);
  }
  return dups;
}
