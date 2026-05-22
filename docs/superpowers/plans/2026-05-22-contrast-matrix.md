# Contrast Matrix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a client-side React app that renders a WCAG contrast-ratio matrix for a user-supplied color palette, with AA/AAA badges, localStorage persistence, URL share, and CSV/PNG export.

**Architecture:** Three pure-logic modules (`contrast`, `palette`, `share`) under `src/lib/` provide testable building blocks. Thin React components under `src/components/` render the UI. `App.tsx` owns state and composes everything. No backend.

**Tech Stack:** Vite + React 19 + TypeScript, Tailwind CSS v4, Vitest + @testing-library/react + jsdom, `html-to-image` for PNG export.

**Spec:** `docs/superpowers/specs/2026-05-22-contrast-matrix-design.md`

---

## File Structure

```
.
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.ts            # only if v4 needs it; v4 uses CSS @theme instead
├── src/
│   ├── main.tsx                  # React root
│   ├── App.tsx                   # Owns palette + selectedCell state; useMemo verdict grid
│   ├── index.css                 # @import "tailwindcss"
│   ├── setupTests.ts             # jest-dom matchers
│   ├── lib/
│   │   ├── contrast.ts           # hex parsing, luminance, ratio, WCAG verdict
│   │   ├── palette.ts            # Palette/Color types, add/remove/edit, hex normalize, dedupe
│   │   └── share.ts              # URL hash encode/decode, localStorage, CSV export, PNG export wrapper
│   └── components/
│       ├── PaletteEditor.tsx     # Rows of color inputs + Add color button
│       ├── ContrastMatrix.tsx    # N×N grid; renders MatrixCell
│       ├── MatrixCell.tsx        # One cell: bg/fg/ratio/pips
│       ├── CellDetailDrawer.tsx  # Slide-in detail panel for a selected cell
│       └── Toolbar.tsx           # Share / PNG / CSV / Clear actions
└── src/lib/__tests__/            # Vitest test files mirroring lib/
    ├── contrast.test.ts
    ├── palette.test.ts
    └── share.test.ts
```

Component tests live next to components as `<Name>.test.tsx`.

---

## Conventions

- **TDD throughout:** write the failing test, run it red, implement, run green, commit. Steps are kept to 2-5 minutes each.
- **Commit messages:** Conventional commits (`feat:`, `test:`, `chore:`, `style:`, `docs:`). One topic per commit.
- **Path style:** all `src/...` paths in the plan are relative to repo root.
- **Color IDs:** generated with `crypto.randomUUID()` — no external uuid library needed.
- **WCAG thresholds (constants used in multiple tasks):**
  - AA normal: `4.5`
  - AA large:  `3.0`
  - AAA normal: `7.0`
  - AAA large: `4.5`

---

## Task 1: Project scaffold (Vite + React TS + Tailwind v4 + Vitest)

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/index.css`
- Create: `src/setupTests.ts`
- Create: `.gitignore`

- [ ] **Step 1: Write `.gitignore`**

Create `.gitignore`:

```gitignore
node_modules
dist
.DS_Store
*.local
```

- [ ] **Step 2: Write `package.json`**

Create `package.json`:

```json
{
  "name": "contrast-matrix",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run",
    "lint": "tsc -b --noEmit"
  },
  "dependencies": {
    "html-to-image": "^1.11.13",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^25.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 3: Write `index.html`**

Create `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Contrast Matrix</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Write `vite.config.ts`**

Create `vite.config.ts`:

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
  },
});
```

- [ ] **Step 5: Write `tsconfig.json` and `tsconfig.node.json`**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 6: Write `src/index.css`**

Create `src/index.css`:

```css
@import "tailwindcss";

html, body, #root {
  height: 100%;
}
body {
  margin: 0;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
```

- [ ] **Step 7: Write `src/main.tsx`**

Create `src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 8: Write placeholder `src/App.tsx`**

Create `src/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="min-h-full p-6">
      <h1 className="text-2xl font-semibold">Contrast Matrix</h1>
    </main>
  );
}
```

- [ ] **Step 9: Write `src/setupTests.ts`**

Create `src/setupTests.ts`:

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 10: Install dependencies**

Run: `npm install`
Expected: installs cleanly with no peer-dep errors. There may be a deprecation warning — that's OK.

- [ ] **Step 11: Verify dev server boots**

Run: `npm run dev` (then Ctrl+C after Vite reports the local URL).
Expected: Vite prints `Local: http://localhost:5173/` within ~2s.

- [ ] **Step 12: Verify type check passes**

Run: `npm run lint`
Expected: exits 0 with no output.

- [ ] **Step 13: Verify Vitest runs (no tests yet)**

Run: `npm run test:run`
Expected: Vitest reports "No test files found" and exits 0 (or non-zero with the same message). Either is fine — we just want to confirm the runner is wired.

- [ ] **Step 14: Commit**

```bash
git add .gitignore package.json package-lock.json index.html vite.config.ts tsconfig.json tsconfig.node.json src/
git commit -m "chore: scaffold Vite + React 19 + TS + Tailwind v4 + Vitest"
```

---

## Task 2: `lib/contrast.ts` part 1 — hex normalize + hexToRgb

**Files:**
- Create: `src/lib/contrast.ts`
- Create: `src/lib/__tests__/contrast.test.ts`

- [ ] **Step 1: Write failing tests for `normalizeHex`**

Create `src/lib/__tests__/contrast.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/contrast.test.ts`
Expected: FAIL — module `../contrast` cannot be resolved.

- [ ] **Step 3: Implement `normalizeHex` minimally**

Create `src/lib/contrast.ts`:

```ts
export function normalizeHex(input: string): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(trimmed)) {
    const [r, g, b] = trimmed.split('');
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  if (/^[0-9a-f]{6}$/i.test(trimmed)) {
    return `#${trimmed.toLowerCase()}`;
  }
  return null;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = normalizeHex(hex);
  if (!normalized) {
    throw new Error(`Invalid hex: ${hex}`);
  }
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return { r, g, b };
}
```

- [ ] **Step 4: Run normalizeHex tests — they should pass**

Run: `npx vitest run src/lib/__tests__/contrast.test.ts -t normalizeHex`
Expected: 5 tests pass.

- [ ] **Step 5: Add failing tests for `hexToRgb`**

Append to `src/lib/__tests__/contrast.test.ts`:

```ts
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
```

- [ ] **Step 6: Run all contrast tests — should pass**

Run: `npx vitest run src/lib/__tests__/contrast.test.ts`
Expected: 10 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/contrast.ts src/lib/__tests__/contrast.test.ts
git commit -m "feat(contrast): hex normalize and RGB parsing"
```

---

## Task 3: `lib/contrast.ts` part 2 — luminance, ratio, verdict

**Files:**
- Modify: `src/lib/contrast.ts`
- Modify: `src/lib/__tests__/contrast.test.ts`

- [ ] **Step 1: Add failing tests for `relativeLuminance`**

Append to `src/lib/__tests__/contrast.test.ts`:

```ts
import { relativeLuminance, contrastRatio, verdict } from '../contrast';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/contrast.test.ts -t relativeLuminance`
Expected: FAIL — `relativeLuminance` not exported.

- [ ] **Step 3: Implement `relativeLuminance`**

Append to `src/lib/contrast.ts`:

```ts
export function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const channel = (c8: number): number => {
    const c = c8 / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
```

- [ ] **Step 4: Run luminance tests — should pass**

Run: `npx vitest run src/lib/__tests__/contrast.test.ts -t relativeLuminance`
Expected: 3 tests pass.

- [ ] **Step 5: Add failing tests for `contrastRatio`**

Append to `src/lib/__tests__/contrast.test.ts`:

```ts
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
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/contrast.test.ts -t contrastRatio`
Expected: FAIL — `contrastRatio` not exported.

- [ ] **Step 7: Implement `contrastRatio`**

Append to `src/lib/contrast.ts`:

```ts
export function contrastRatio(hexA: string, hexB: string): number {
  const la = relativeLuminance(hexToRgb(hexA));
  const lb = relativeLuminance(hexToRgb(hexB));
  const [lighter, darker] = la >= lb ? [la, lb] : [lb, la];
  return (lighter + 0.05) / (darker + 0.05);
}
```

- [ ] **Step 8: Run contrast tests — should pass**

Run: `npx vitest run src/lib/__tests__/contrast.test.ts -t contrastRatio`
Expected: 3 tests pass.

- [ ] **Step 9: Add failing tests for `verdict`**

Append to `src/lib/__tests__/contrast.test.ts`:

```ts
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
```

- [ ] **Step 10: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/contrast.test.ts -t verdict`
Expected: FAIL — `verdict` not exported.

- [ ] **Step 11: Implement `verdict` and the `WcagVerdict` type**

Append to `src/lib/contrast.ts`:

```ts
export type WcagVerdict = {
  ratio: number;
  passes: {
    aaNormal: boolean;
    aaLarge: boolean;
    aaaNormal: boolean;
    aaaLarge: boolean;
  };
};

export function verdict(ratio: number): WcagVerdict {
  return {
    ratio,
    passes: {
      aaNormal: ratio >= 4.5,
      aaLarge: ratio >= 3.0,
      aaaNormal: ratio >= 7.0,
      aaaLarge: ratio >= 4.5,
    },
  };
}
```

- [ ] **Step 12: Run all contrast tests — should all pass**

Run: `npx vitest run src/lib/__tests__/contrast.test.ts`
Expected: all tests pass (~18 total).

- [ ] **Step 13: Commit**

```bash
git add src/lib/contrast.ts src/lib/__tests__/contrast.test.ts
git commit -m "feat(contrast): luminance, ratio, and WCAG verdict"
```

---

## Task 4: `lib/palette.ts` — types and CRUD operations

**Files:**
- Create: `src/lib/palette.ts`
- Create: `src/lib/__tests__/palette.test.ts`

- [ ] **Step 1: Write failing tests for palette operations**

Create `src/lib/__tests__/palette.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/palette.test.ts`
Expected: FAIL — `../palette` not found.

- [ ] **Step 3: Implement `src/lib/palette.ts`**

Create `src/lib/palette.ts`:

```ts
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
```

- [ ] **Step 4: Run palette tests — should pass**

Run: `npx vitest run src/lib/__tests__/palette.test.ts`
Expected: all tests pass (~12).

- [ ] **Step 5: Commit**

```bash
git add src/lib/palette.ts src/lib/__tests__/palette.test.ts
git commit -m "feat(palette): types and CRUD operations"
```

---

## Task 5: `lib/share.ts` — URL hash encode/decode

**Files:**
- Create: `src/lib/share.ts`
- Create: `src/lib/__tests__/share.test.ts`

- [ ] **Step 1: Write failing tests for hash encode/decode**

Create `src/lib/__tests__/share.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { encodePaletteToHash, decodePaletteFromHash } from '../share';
import { createColor, type Palette } from '../palette';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/share.test.ts`
Expected: FAIL — `../share` not found.

- [ ] **Step 3: Implement hash encode/decode**

Create `src/lib/share.ts`:

```ts
import { normalizeHex } from './contrast';
import { createColor, type Color, type Palette } from './palette';

const HASH_PREFIX = '#p=';

function encodeLabel(label: string): string {
  // encodeURIComponent escapes ',' but not '~'; escape '~' manually so it cannot collide with the separator.
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
  // Tolerate hash with or without leading '#'.
  const normalized = hash.startsWith('#') ? hash : `#${hash}`;
  if (!normalized.startsWith(HASH_PREFIX)) return [];
  const body = normalized.slice(HASH_PREFIX.length);
  if (!body) return [];
  const entries = body.split(',');
  const palette: Palette = [];
  for (const entry of entries) {
    const [hexPart, ...labelParts] = entry.split('~');
    const labelEncoded = labelParts.join('~'); // labels may have escaped %7E that decode back to ~, but raw ~ wouldn't be re-introduced after encode
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

// Re-export type for downstream test imports.
export type { Color, Palette };
```

- [ ] **Step 4: Run share tests — should pass**

Run: `npx vitest run src/lib/__tests__/share.test.ts`
Expected: all tests pass (~7).

- [ ] **Step 5: Commit**

```bash
git add src/lib/share.ts src/lib/__tests__/share.test.ts
git commit -m "feat(share): URL hash encode/decode with ~ escape"
```

---

## Task 6: `lib/share.ts` — localStorage save/load

**Files:**
- Modify: `src/lib/share.ts`
- Modify: `src/lib/__tests__/share.test.ts`

- [ ] **Step 1: Write failing tests for localStorage round-trip**

Append to `src/lib/__tests__/share.test.ts`:

```ts
import { savePaletteToStorage, loadPaletteFromStorage } from '../share';

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
```

Also add this import at the top of the test file:

```ts
import { beforeEach } from 'vitest';
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/share.test.ts -t localStorage`
Expected: FAIL — symbols not exported.

- [ ] **Step 3: Implement localStorage functions**

Append to `src/lib/share.ts`:

```ts
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
```

- [ ] **Step 4: Run share tests — should pass**

Run: `npx vitest run src/lib/__tests__/share.test.ts`
Expected: all tests pass (~11).

- [ ] **Step 5: Commit**

```bash
git add src/lib/share.ts src/lib/__tests__/share.test.ts
git commit -m "feat(share): localStorage save/load"
```

---

## Task 7: `lib/share.ts` — CSV export

**Files:**
- Modify: `src/lib/share.ts`
- Modify: `src/lib/__tests__/share.test.ts`

- [ ] **Step 1: Write failing test for CSV builder**

Append to `src/lib/__tests__/share.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/share.test.ts -t buildMatrixCsv`
Expected: FAIL — `buildMatrixCsv` not exported.

- [ ] **Step 3: Implement CSV builder**

Append to `src/lib/share.ts`:

```ts
import { contrastRatio } from './contrast';

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
```

- [ ] **Step 4: Run CSV tests — should pass**

Run: `npx vitest run src/lib/__tests__/share.test.ts -t buildMatrixCsv`
Expected: 4 tests pass.

- [ ] **Step 5: Add a download helper (no test — DOM side-effect)**

Append to `src/lib/share.ts`:

```ts
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
```

- [ ] **Step 6: Run full test suite — sanity**

Run: `npm run test:run`
Expected: all tests pass; no regressions.

- [ ] **Step 7: Commit**

```bash
git add src/lib/share.ts src/lib/__tests__/share.test.ts
git commit -m "feat(share): CSV builder and download helper"
```

---

## Task 8: `MatrixCell` component

**Files:**
- Create: `src/components/MatrixCell.tsx`
- Create: `src/components/MatrixCell.test.tsx`

- [ ] **Step 1: Write failing tests for `MatrixCell`**

Create `src/components/MatrixCell.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MatrixCell } from './MatrixCell';
import { verdict } from '../lib/contrast';

describe('MatrixCell', () => {
  it('renders the ratio to 2 decimals', () => {
    render(<MatrixCell bg="#ffffff" fg="#000000" v={verdict(21)} onClick={() => {}} />);
    expect(screen.getByText('21.00')).toBeInTheDocument();
  });

  it('uses background and foreground colors via inline style', () => {
    render(<MatrixCell bg="#ffffff" fg="#000000" v={verdict(21)} onClick={() => {}} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveStyle({ backgroundColor: '#ffffff', color: '#000000' });
  });

  it('renders an aria-label describing the combination', () => {
    render(<MatrixCell bg="#ffffff" fg="#000000" v={verdict(21)} onClick={() => {}} />);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-label')).toMatch(/#ffffff/);
    expect(btn.getAttribute('aria-label')).toMatch(/#000000/);
    expect(btn.getAttribute('aria-label')).toMatch(/21\.00/);
  });

  it('mutes the cell when bg and fg are equal (diagonal)', () => {
    render(<MatrixCell bg="#808080" fg="#808080" v={verdict(1)} onClick={() => {}} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('data-diagonal', 'true');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<MatrixCell bg="#fff" fg="#000" v={verdict(21)} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/MatrixCell.test.tsx`
Expected: FAIL — `./MatrixCell` not found.

- [ ] **Step 3: Implement `MatrixCell`**

Create `src/components/MatrixCell.tsx`:

```tsx
import type { WcagVerdict } from '../lib/contrast';

type Props = {
  bg: string;
  fg: string;
  v: WcagVerdict;
  onClick: () => void;
};

function Pip({ pass, label }: { pass: boolean; label: string }) {
  return (
    <span
      title={label}
      className="inline-flex items-center justify-center text-[9px] leading-none px-1 py-[1px] rounded-sm border"
      style={{
        borderColor: 'currentColor',
        backgroundColor: pass ? 'currentColor' : 'transparent',
        color: 'inherit',
      }}
    >
      <span style={{ color: pass ? 'transparent' : 'inherit', mixBlendMode: 'difference' }}>
        {label}
      </span>
    </span>
  );
}

export function MatrixCell({ bg, fg, v, onClick }: Props) {
  const isDiagonal = bg.toLowerCase() === fg.toLowerCase();
  const ariaLabel =
    `Background ${bg}, foreground ${fg}, contrast ratio ${v.ratio.toFixed(2)}. ` +
    `AA normal: ${v.passes.aaNormal ? 'pass' : 'fail'}, ` +
    `AAA normal: ${v.passes.aaaNormal ? 'pass' : 'fail'}, ` +
    `AA large: ${v.passes.aaLarge ? 'pass' : 'fail'}, ` +
    `AAA large: ${v.passes.aaaLarge ? 'pass' : 'fail'}.`;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      data-diagonal={isDiagonal ? 'true' : undefined}
      className="w-24 h-24 flex flex-col items-center justify-center gap-1 border border-black/10 focus:outline focus:outline-2 focus:outline-blue-500"
      style={{
        backgroundColor: bg,
        color: fg,
        opacity: isDiagonal ? 0.45 : 1,
        cursor: 'pointer',
      }}
    >
      <span className="text-lg font-semibold tabular-nums">{v.ratio.toFixed(2)}</span>
      {!isDiagonal && (
        <div className="flex flex-col gap-[2px] items-center">
          <div className="flex gap-1">
            <Pip pass={v.passes.aaNormal} label="AA" />
            <Pip pass={v.passes.aaaNormal} label="AAA" />
          </div>
          <div className="flex gap-1 text-[8px] opacity-90">
            <Pip pass={v.passes.aaLarge} label="AA·L" />
            <Pip pass={v.passes.aaaLarge} label="AAA·L" />
          </div>
        </div>
      )}
    </button>
  );
}
```

- [ ] **Step 4: Run `MatrixCell` tests — should pass**

Run: `npx vitest run src/components/MatrixCell.test.tsx`
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/MatrixCell.tsx src/components/MatrixCell.test.tsx
git commit -m "feat(ui): MatrixCell component with ratio and WCAG pips"
```

---

## Task 9: `ContrastMatrix` component

**Files:**
- Create: `src/components/ContrastMatrix.tsx`
- Create: `src/components/ContrastMatrix.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/ContrastMatrix.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContrastMatrix } from './ContrastMatrix';
import { createColor } from '../lib/palette';

describe('ContrastMatrix', () => {
  it('renders N×N cells for a palette of N colors', () => {
    const palette = [createColor('#ffffff'), createColor('#000000'), createColor('#1e88e5')];
    render(<ContrastMatrix palette={palette} onCellClick={() => {}} />);
    // Each cell is a button.
    expect(screen.getAllByRole('button')).toHaveLength(9);
  });

  it('shows hex/label headers along the top and left', () => {
    const palette = [createColor('#ffffff', 'Surface'), createColor('#000000', 'Ink')];
    render(<ContrastMatrix palette={palette} onCellClick={() => {}} />);
    // Headers appear twice each (once row, once column).
    expect(screen.getAllByText('Surface')).toHaveLength(2);
    expect(screen.getAllByText('Ink')).toHaveLength(2);
  });

  it('calls onCellClick with (rowColor, colColor) when a cell is clicked', () => {
    const palette = [createColor('#ffffff'), createColor('#000000')];
    const onCellClick = vi.fn();
    render(<ContrastMatrix palette={palette} onCellClick={onCellClick} />);
    const cells = screen.getAllByRole('button');
    cells[1].click();
    expect(onCellClick).toHaveBeenCalledTimes(1);
    const call = onCellClick.mock.calls[0];
    expect(call[0].hex).toBe('#ffffff'); // row 0
    expect(call[1].hex).toBe('#000000'); // col 1
  });

  it('renders nothing visible if palette is empty', () => {
    render(<ContrastMatrix palette={[]} onCellClick={() => {}} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ContrastMatrix.test.tsx`
Expected: FAIL — `./ContrastMatrix` not found.

- [ ] **Step 3: Implement `ContrastMatrix`**

Create `src/components/ContrastMatrix.tsx`:

```tsx
import { useMemo } from 'react';
import { MatrixCell } from './MatrixCell';
import { contrastRatio, verdict, type WcagVerdict } from '../lib/contrast';
import type { Color, Palette } from '../lib/palette';

type Props = {
  palette: Palette;
  onCellClick: (rowColor: Color, colColor: Color) => void;
};

function headerLabel(c: Color) {
  return c.label && c.label.length > 0 ? c.label : c.hex;
}

export function ContrastMatrix({ palette, onCellClick }: Props) {
  const grid: WcagVerdict[][] = useMemo(() => {
    return palette.map((rowColor) =>
      palette.map((colColor) => verdict(contrastRatio(rowColor.hex, colColor.hex))),
    );
  }, [palette]);

  if (palette.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="border-separate" style={{ borderSpacing: 0 }}>
        <thead>
          <tr>
            <th aria-hidden className="w-24 h-10 bg-white sticky top-0 left-0 z-20" />
            {palette.map((c) => (
              <th
                key={c.id}
                scope="col"
                className="w-24 h-10 text-xs font-medium px-1 sticky top-0 bg-white z-10 border-b border-black/10"
              >
                <div className="truncate" title={`${headerLabel(c)} (${c.hex})`}>
                  {headerLabel(c)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {palette.map((rowColor, i) => (
            <tr key={rowColor.id}>
              <th
                scope="row"
                className="w-24 h-24 text-xs font-medium px-1 sticky left-0 bg-white z-10 border-r border-black/10"
              >
                <div className="truncate" title={`${headerLabel(rowColor)} (${rowColor.hex})`}>
                  {headerLabel(rowColor)}
                </div>
              </th>
              {palette.map((colColor, j) => (
                <td key={colColor.id} className="p-0">
                  <MatrixCell
                    bg={colColor.hex}
                    fg={rowColor.hex}
                    v={grid[i][j]}
                    onClick={() => onCellClick(rowColor, colColor)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: Run `ContrastMatrix` tests — should pass**

Run: `npx vitest run src/components/ContrastMatrix.test.tsx`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/ContrastMatrix.tsx src/components/ContrastMatrix.test.tsx
git commit -m "feat(ui): ContrastMatrix grid with sticky headers"
```

---

## Task 10: `CellDetailDrawer` component

**Files:**
- Create: `src/components/CellDetailDrawer.tsx`
- Create: `src/components/CellDetailDrawer.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/CellDetailDrawer.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CellDetailDrawer } from './CellDetailDrawer';
import { createColor } from '../lib/palette';

describe('CellDetailDrawer', () => {
  it('shows nothing when selection is null', () => {
    const { container } = render(<CellDetailDrawer selection={null} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the ratio for a selection', () => {
    const row = createColor('#000000', 'Ink');
    const col = createColor('#ffffff', 'Surface');
    render(
      <CellDetailDrawer
        selection={{ row, col }}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/21\.00/)).toBeInTheDocument();
    expect(screen.getByText(/Ink/)).toBeInTheDocument();
    expect(screen.getByText(/Surface/)).toBeInTheDocument();
  });

  it('closes on ESC key', () => {
    const onClose = vi.fn();
    const row = createColor('#000000');
    const col = createColor('#ffffff');
    render(<CellDetailDrawer selection={{ row, col }} onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when close button is clicked', () => {
    const onClose = vi.fn();
    const row = createColor('#000000');
    const col = createColor('#ffffff');
    render(<CellDetailDrawer selection={{ row, col }} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/CellDetailDrawer.test.tsx`
Expected: FAIL — `./CellDetailDrawer` not found.

- [ ] **Step 3: Implement `CellDetailDrawer`**

Create `src/components/CellDetailDrawer.tsx`:

```tsx
import { useEffect } from 'react';
import { contrastRatio, verdict } from '../lib/contrast';
import type { Color } from '../lib/palette';

export type Selection = { row: Color; col: Color };

type Props = {
  selection: Selection | null;
  onClose: () => void;
};

function VerdictRow({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm py-1 border-b border-black/5">
      <span>{label}</span>
      <span
        className={`px-2 py-[1px] rounded-sm text-xs font-medium ${
          pass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}
      >
        {pass ? 'PASS' : 'FAIL'}
      </span>
    </div>
  );
}

export function CellDetailDrawer({ selection, onClose }: Props) {
  useEffect(() => {
    if (!selection) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selection, onClose]);

  if (!selection) return null;

  const { row, col } = selection;
  const v = verdict(contrastRatio(row.hex, col.hex));
  const rowLabel = row.label && row.label.length > 0 ? row.label : row.hex;
  const colLabel = col.label && col.label.length > 0 ? col.label : col.hex;

  return (
    <aside
      role="dialog"
      aria-label="Contrast details"
      className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl border-l border-black/10 z-30 flex flex-col"
    >
      <header className="flex items-center justify-between p-4 border-b border-black/10">
        <h2 className="text-base font-semibold">Contrast details</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="px-3 py-1 text-sm rounded hover:bg-black/5"
        >
          ✕
        </button>
      </header>

      <div className="p-4 flex-1 overflow-y-auto">
        <div
          className="rounded p-4 mb-4"
          style={{ backgroundColor: col.hex, color: row.hex }}
        >
          <div className="text-3xl font-semibold mb-1">{v.ratio.toFixed(2)} : 1</div>
          <p className="text-base leading-snug">
            Sample text — normal size. The quick brown fox jumps over the lazy dog.
          </p>
          <p className="text-xl font-semibold mt-2 leading-snug">
            Sample text — large size.
          </p>
        </div>

        <div className="text-sm text-black/70 mb-3">
          Foreground: <span className="font-mono">{row.hex}</span> ({rowLabel}) ·
          Background: <span className="font-mono">{col.hex}</span> ({colLabel})
        </div>

        <VerdictRow label="WCAG AA — Normal text (≥ 4.5:1)" pass={v.passes.aaNormal} />
        <VerdictRow label="WCAG AA — Large text (≥ 3:1)" pass={v.passes.aaLarge} />
        <VerdictRow label="WCAG AAA — Normal text (≥ 7:1)" pass={v.passes.aaaNormal} />
        <VerdictRow label="WCAG AAA — Large text (≥ 4.5:1)" pass={v.passes.aaaLarge} />
      </div>
    </aside>
  );
}
```

- [ ] **Step 4: Run `CellDetailDrawer` tests — should pass**

Run: `npx vitest run src/components/CellDetailDrawer.test.tsx`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/CellDetailDrawer.tsx src/components/CellDetailDrawer.test.tsx
git commit -m "feat(ui): CellDetailDrawer with WCAG verdict breakdown"
```

---

## Task 11: `PaletteEditor` component

**Files:**
- Create: `src/components/PaletteEditor.tsx`
- Create: `src/components/PaletteEditor.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/PaletteEditor.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaletteEditor } from './PaletteEditor';
import { createColor } from '../lib/palette';

describe('PaletteEditor', () => {
  it('renders one row per color', () => {
    const palette = [createColor('#ffffff'), createColor('#000000')];
    render(<PaletteEditor palette={palette} onChange={() => {}} />);
    expect(screen.getAllByRole('textbox')).toHaveLength(palette.length * 2); // hex + label per row
  });

  it('appends a color when "Add color" is clicked', async () => {
    const palette = [createColor('#ffffff')];
    const onChange = vi.fn();
    render(<PaletteEditor palette={palette} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /add color/i }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0];
    expect(next).toHaveLength(2);
  });

  it('removes a color when the row remove button is clicked', () => {
    const c1 = createColor('#ffffff');
    const c2 = createColor('#000000');
    const onChange = vi.fn();
    render(<PaletteEditor palette={[c1, c2]} onChange={onChange} />);
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    fireEvent.click(removeButtons[0]);
    const next = onChange.mock.calls[0][0];
    expect(next).toHaveLength(1);
    expect(next[0].id).toBe(c2.id);
  });

  it('updates label when typing into the label input', async () => {
    const c1 = createColor('#ffffff');
    const onChange = vi.fn();
    render(<PaletteEditor palette={[c1]} onChange={onChange} />);
    const labelInput = screen.getByPlaceholderText(/label/i);
    await userEvent.type(labelInput, 'A');
    // First keystroke produces one onChange.
    expect(onChange).toHaveBeenCalled();
    const lastCallPalette = onChange.mock.calls.at(-1)![0];
    expect(lastCallPalette[0].label).toBe('A');
  });

  it('updates hex when typing a valid hex into the hex input', async () => {
    const c1 = createColor('#ffffff');
    const onChange = vi.fn();
    render(<PaletteEditor palette={[c1]} onChange={onChange} />);
    const hexInput = screen.getByDisplayValue('#ffffff');
    await userEvent.clear(hexInput);
    await userEvent.type(hexInput, '#000000');
    const lastCallPalette = onChange.mock.calls.at(-1)![0];
    expect(lastCallPalette[0].hex).toBe('#000000');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/PaletteEditor.test.tsx`
Expected: FAIL — `./PaletteEditor` not found.

- [ ] **Step 3: Implement `PaletteEditor`**

Create `src/components/PaletteEditor.tsx`:

```tsx
import { addColor, createColor, removeColor, updateColor, type Color, type Palette } from '../lib/palette';
import { normalizeHex } from '../lib/contrast';

type Props = {
  palette: Palette;
  onChange: (next: Palette) => void;
};

function Row({
  color,
  onEdit,
  onRemove,
}: {
  color: Color;
  onEdit: (patch: { hex?: string; label?: string }) => void;
  onRemove: () => void;
}) {
  const isValid = normalizeHex(color.hex) !== null;

  return (
    <div className="flex items-center gap-2 py-1">
      <input
        type="color"
        aria-label="Color picker"
        value={color.hex}
        onChange={(e) => onEdit({ hex: e.target.value })}
        className="w-10 h-10 rounded border border-black/10 p-0 cursor-pointer"
      />
      <input
        type="text"
        aria-label="Hex"
        value={color.hex}
        onChange={(e) => onEdit({ hex: e.target.value })}
        className={`w-32 font-mono text-sm px-2 py-1 rounded border ${
          isValid ? 'border-black/15' : 'border-red-400'
        }`}
      />
      <input
        type="text"
        placeholder="Label (optional)"
        value={color.label ?? ''}
        onChange={(e) => onEdit({ label: e.target.value })}
        className="flex-1 max-w-xs text-sm px-2 py-1 rounded border border-black/15"
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove color"
        className="w-8 h-8 rounded hover:bg-black/5 text-lg"
      >
        ✕
      </button>
    </div>
  );
}

export function PaletteEditor({ palette, onChange }: Props) {
  function handleEdit(id: string, patch: { hex?: string; label?: string }) {
    onChange(updateColor(palette, id, patch));
  }
  function handleRemove(id: string) {
    onChange(removeColor(palette, id));
  }
  function handleAdd() {
    const fresh = createColor('#888888');
    onChange(addColor(palette, fresh));
  }

  return (
    <section aria-label="Palette editor" className="space-y-1">
      {palette.map((c) => (
        <Row
          key={c.id}
          color={c}
          onEdit={(patch) => handleEdit(c.id, patch)}
          onRemove={() => handleRemove(c.id)}
        />
      ))}
      <button
        type="button"
        onClick={handleAdd}
        className="mt-2 inline-flex items-center gap-1 px-3 py-1 text-sm rounded border border-black/15 hover:bg-black/5"
      >
        + Add color
      </button>
    </section>
  );
}
```

- [ ] **Step 4: Run `PaletteEditor` tests — should pass**

Run: `npx vitest run src/components/PaletteEditor.test.tsx`
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/PaletteEditor.tsx src/components/PaletteEditor.test.tsx
git commit -m "feat(ui): PaletteEditor with hex/label inputs and add/remove"
```

---

## Task 12: `Toolbar` component (Share / CSV / PNG / Clear)

**Files:**
- Create: `src/components/Toolbar.tsx`
- Create: `src/components/Toolbar.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/Toolbar.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toolbar } from './Toolbar';
import { createColor } from '../lib/palette';

describe('Toolbar', () => {
  it('renders Share, CSV, PNG, and Clear buttons', () => {
    render(
      <Toolbar
        palette={[createColor('#fff'), createColor('#000')]}
        matrixRef={{ current: null }}
        onClear={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /csv/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /png/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('calls onClear (after confirm) when Clear is clicked', () => {
    const onClear = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(
      <Toolbar palette={[]} matrixRef={{ current: null }} onClear={onClear} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClear if confirm is cancelled', () => {
    const onClear = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(
      <Toolbar palette={[]} matrixRef={{ current: null }} onClear={onClear} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(onClear).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Toolbar.test.tsx`
Expected: FAIL — `./Toolbar` not found.

- [ ] **Step 3: Implement `Toolbar`**

Create `src/components/Toolbar.tsx`:

```tsx
import { useState, type RefObject } from 'react';
import { toPng } from 'html-to-image';
import {
  buildMatrixCsv,
  encodePaletteToHash,
  todayStamp,
  triggerDownload,
} from '../lib/share';
import type { Palette } from '../lib/palette';

type Props = {
  palette: Palette;
  matrixRef: RefObject<HTMLElement | null>;
  onClear: () => void;
};

export function Toolbar({ palette, matrixRef, onClear }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const hash = encodePaletteToHash(palette);
    const url = `${window.location.origin}${window.location.pathname}${hash}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable; surface the URL via the hash anyway.
      window.location.hash = hash;
    }
  }

  function handleCsv() {
    const csv = buildMatrixCsv(palette);
    if (!csv) return;
    triggerDownload(`contrast-matrix-${todayStamp()}.csv`, csv, 'text/csv;charset=utf-8');
  }

  async function handlePng() {
    if (!matrixRef.current) return;
    const dataUrl = await toPng(matrixRef.current, { cacheBust: true, pixelRatio: 2 });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `contrast-matrix-${todayStamp()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function handleClear() {
    if (window.confirm('Clear the palette and reset to default?')) {
      onClear();
    }
  }

  const btn =
    'px-3 py-1 text-sm rounded border border-black/15 hover:bg-black/5 disabled:opacity-50';

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={handleShare} className={btn} disabled={palette.length === 0}>
        {copied ? 'Copied!' : 'Share'}
      </button>
      <button type="button" onClick={handleCsv} className={btn} disabled={palette.length === 0}>
        Export CSV
      </button>
      <button type="button" onClick={handlePng} className={btn} disabled={palette.length === 0}>
        Export PNG
      </button>
      <button type="button" onClick={handleClear} className={btn}>
        Clear
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run `Toolbar` tests — should pass**

Run: `npx vitest run src/components/Toolbar.test.tsx`
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/Toolbar.tsx src/components/Toolbar.test.tsx
git commit -m "feat(ui): Toolbar with Share, CSV, PNG, Clear"
```

---

## Task 13: `App.tsx` composition + state wiring

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/App.test.tsx`

- [ ] **Step 1: Write failing smoke tests for App**

Create `src/components/App.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('renders the title', () => {
    render(<App />);
    expect(screen.getByText(/Contrast Matrix/i)).toBeInTheDocument();
  });

  it('starts with a default palette of at least 2 colors and renders the matrix', () => {
    render(<App />);
    // Each matrix cell is a button. Toolbar adds 4 more, plus PaletteEditor adds buttons (Add + Remove per row).
    // We assert the matrix has cells by finding at least one cell aria-label.
    const cells = screen.getAllByLabelText(/contrast ratio/i);
    expect(cells.length).toBeGreaterThanOrEqual(4); // 2x2 minimum
  });

  it('opens the detail drawer when a matrix cell is clicked', () => {
    render(<App />);
    const cells = screen.getAllByLabelText(/contrast ratio/i);
    fireEvent.click(cells[0]);
    expect(screen.getByRole('dialog', { name: /contrast details/i })).toBeInTheDocument();
  });

  it('hydrates palette from URL hash when present on mount', () => {
    window.history.replaceState(null, '', '/#p=ff0000,00ff00');
    render(<App />);
    const cells = screen.getAllByLabelText(/contrast ratio/i);
    // 2 colors → 4 cells.
    expect(cells).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/App.test.tsx`
Expected: FAIL — App is still the placeholder.

- [ ] **Step 3: Replace `src/App.tsx` with full composition**

Replace contents of `src/App.tsx`:

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { PaletteEditor } from './components/PaletteEditor';
import { ContrastMatrix } from './components/ContrastMatrix';
import { CellDetailDrawer, type Selection } from './components/CellDetailDrawer';
import { Toolbar } from './components/Toolbar';
import { createColor, type Palette } from './lib/palette';
import {
  decodePaletteFromHash,
  encodePaletteToHash,
  loadPaletteFromStorage,
  savePaletteToStorage,
} from './lib/share';

function defaultPalette(): Palette {
  return [
    createColor('#ffffff', 'Surface'),
    createColor('#111111', 'Ink'),
    createColor('#1e88e5', 'Primary'),
  ];
}

function initialPalette(): Palette {
  const fromHash = decodePaletteFromHash(window.location.hash);
  if (fromHash.length > 0) {
    savePaletteToStorage(fromHash);
    return fromHash;
  }
  const fromStorage = loadPaletteFromStorage();
  if (fromStorage && fromStorage.length > 0) return fromStorage;
  return defaultPalette();
}

export default function App() {
  const [palette, setPalette] = useState<Palette>(initialPalette);
  const [selection, setSelection] = useState<Selection | null>(null);
  const matrixRef = useRef<HTMLDivElement | null>(null);

  // Debounced localStorage save.
  useEffect(() => {
    const t = window.setTimeout(() => savePaletteToStorage(palette), 250);
    return () => window.clearTimeout(t);
  }, [palette]);

  // Keep the URL hash in sync with the palette so manual navigation/copy works.
  // We update silently to avoid scroll jumps.
  useEffect(() => {
    const hash = encodePaletteToHash(palette);
    if (`#${hash.slice(1)}` !== window.location.hash) {
      const url = `${window.location.pathname}${window.location.search}${hash}`;
      window.history.replaceState(null, '', url);
    }
  }, [palette]);

  const handleClear = useMemo(
    () => () => {
      setPalette(defaultPalette());
      setSelection(null);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    },
    [],
  );

  return (
    <main className="min-h-full p-4 sm:p-6 max-w-[1400px] mx-auto">
      <header className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Contrast Matrix</h1>
        <Toolbar palette={palette} matrixRef={matrixRef} onClear={handleClear} />
      </header>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-black/70 mb-2">Palette</h2>
        <PaletteEditor palette={palette} onChange={setPalette} />
      </section>

      <section>
        <h2 className="text-sm font-medium text-black/70 mb-2">Contrast matrix</h2>
        <div ref={matrixRef} className="inline-block bg-white">
          <ContrastMatrix
            palette={palette}
            onCellClick={(row, col) => setSelection({ row, col })}
          />
        </div>
      </section>

      <CellDetailDrawer selection={selection} onClose={() => setSelection(null)} />
    </main>
  );
}
```

- [ ] **Step 4: Run App tests — should pass**

Run: `npx vitest run src/components/App.test.tsx`
Expected: 4 tests pass.

- [ ] **Step 5: Run full test suite**

Run: `npm run test:run`
Expected: every test passes; no regressions.

- [ ] **Step 6: Type-check**

Run: `npm run lint`
Expected: exits 0.

- [ ] **Step 7: Smoke-test the dev server manually**

Run: `npm run dev`
Open the local URL. Verify:
- Three default colors render.
- The 3×3 matrix shows ratios.
- Editing a hex updates the matrix.
- Adding/removing colors updates the matrix.
- Clicking a cell opens the drawer; ESC closes it.
- Share button copies a URL containing `#p=...`.
- Reloading the page restores the palette from localStorage.

Stop the dev server when done.

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx src/components/App.test.tsx
git commit -m "feat(app): compose editor/matrix/drawer/toolbar with persistence and URL share"
```

---

## Task 14: Styling polish + responsive scroll + duplicate warning

**Files:**
- Modify: `src/components/PaletteEditor.tsx`
- Modify: `src/components/ContrastMatrix.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add duplicate warning to `PaletteEditor`**

Modify `src/components/PaletteEditor.tsx`. Add an import:

```ts
import { findDuplicateIds } from '../lib/palette';
```

In `PaletteEditor`, compute the duplicates and pass an `isDuplicate` flag to each row. Replace the body with:

```tsx
export function PaletteEditor({ palette, onChange }: Props) {
  const duplicates = new Set(findDuplicateIds(palette));

  function handleEdit(id: string, patch: { hex?: string; label?: string }) {
    onChange(updateColor(palette, id, patch));
  }
  function handleRemove(id: string) {
    onChange(removeColor(palette, id));
  }
  function handleAdd() {
    const fresh = createColor('#888888');
    onChange(addColor(palette, fresh));
  }

  return (
    <section aria-label="Palette editor" className="space-y-1">
      {palette.map((c) => (
        <Row
          key={c.id}
          color={c}
          isDuplicate={duplicates.has(c.id)}
          onEdit={(patch) => handleEdit(c.id, patch)}
          onRemove={() => handleRemove(c.id)}
        />
      ))}
      <button
        type="button"
        onClick={handleAdd}
        className="mt-2 inline-flex items-center gap-1 px-3 py-1 text-sm rounded border border-black/15 hover:bg-black/5"
      >
        + Add color
      </button>
    </section>
  );
}
```

Add `isDuplicate: boolean` to `Row` props and render a small icon if true. Replace `Row` with:

```tsx
function Row({
  color,
  isDuplicate,
  onEdit,
  onRemove,
}: {
  color: Color;
  isDuplicate: boolean;
  onEdit: (patch: { hex?: string; label?: string }) => void;
  onRemove: () => void;
}) {
  const isValid = normalizeHex(color.hex) !== null;

  return (
    <div className="flex items-center gap-2 py-1">
      <input
        type="color"
        aria-label="Color picker"
        value={color.hex}
        onChange={(e) => onEdit({ hex: e.target.value })}
        className="w-10 h-10 rounded border border-black/10 p-0 cursor-pointer"
      />
      <input
        type="text"
        aria-label="Hex"
        value={color.hex}
        onChange={(e) => onEdit({ hex: e.target.value })}
        className={`w-32 font-mono text-sm px-2 py-1 rounded border ${
          isValid ? 'border-black/15' : 'border-red-400'
        }`}
      />
      <input
        type="text"
        placeholder="Label (optional)"
        value={color.label ?? ''}
        onChange={(e) => onEdit({ label: e.target.value })}
        className="flex-1 max-w-xs text-sm px-2 py-1 rounded border border-black/15"
      />
      {isDuplicate && (
        <span
          title="Another row uses the same color"
          aria-label="Duplicate color"
          className="text-amber-600 text-sm"
        >
          ⚠
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove color"
        className="w-8 h-8 rounded hover:bg-black/5 text-lg"
      >
        ✕
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Add a horizontal scroll wrapper around the matrix in `App.tsx`**

In `src/App.tsx`, change the matrix section to:

```tsx
      <section>
        <h2 className="text-sm font-medium text-black/70 mb-2">Contrast matrix</h2>
        <div className="overflow-x-auto">
          <div ref={matrixRef} className="inline-block bg-white">
            <ContrastMatrix
              palette={palette}
              onCellClick={(row, col) => setSelection({ row, col })}
            />
          </div>
        </div>
      </section>
```

- [ ] **Step 3: Run test suite — confirm no regressions**

Run: `npm run test:run`
Expected: all tests pass.

- [ ] **Step 4: Manual smoke test in browser**

Run: `npm run dev`
Verify:
- Adding two colors with the same hex shows a ⚠ warning on each duplicate.
- With 10+ colors, the matrix scrolls horizontally on a narrow window without breaking the layout.

- [ ] **Step 5: Commit**

```bash
git add src/components/PaletteEditor.tsx src/App.tsx
git commit -m "style(ui): duplicate warning and responsive matrix scroll"
```

---

## Task 15: README + manual QA checklist

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write the README**

Create `README.md`:

```markdown
# Contrast Matrix

A client-side React app that generates a WCAG accessibility report for a color palette.

Enter N colors. The app renders an N×N matrix where each cell shows the contrast ratio between two palette colors — using one as background and the other as text — plus AA/AAA pass/fail badges for normal and large text.

## Development

    npm install
    npm run dev

Open the URL Vite prints (default `http://localhost:5173`).

## Scripts

- `npm run dev` — start the dev server.
- `npm run build` — production build.
- `npm run preview` — preview the production build locally.
- `npm test` — run tests in watch mode.
- `npm run test:run` — run tests once (CI-friendly).
- `npm run lint` — TypeScript type-check.

## Features

- N×N contrast matrix with live updates as the palette changes.
- AA / AAA pass/fail pips per cell for normal and large text.
- Click a cell to see a larger preview and full WCAG breakdown.
- Auto-save to localStorage.
- Share a palette via URL hash (the URL contains the palette; copying it shares it).
- Export the matrix as PNG or CSV.

## Manual QA checklist

Run through these by hand before considering a release done.

- [ ] Default palette loads on first visit.
- [ ] Editing a hex updates the matrix immediately.
- [ ] Color picker and hex text input stay in sync.
- [ ] Invalid hex shows a red border but does not crash the matrix.
- [ ] Adding a color appends a row + column.
- [ ] Removing a color drops the correct row + column.
- [ ] Two colors with the same hex show a ⚠ warning.
- [ ] Clicking a cell opens the detail drawer; ESC and ✕ both close it.
- [ ] AA/AAA pip pass/fail state matches the verdict shown in the drawer.
- [ ] Share button copies a URL containing `#p=…`.
- [ ] Opening a shared URL in a new tab restores the palette.
- [ ] Refreshing the page restores the palette from localStorage.
- [ ] Clear button (after confirm) resets to the default palette and clears the URL hash.
- [ ] CSV download contains the right labels and ratios.
- [ ] PNG download contains the rendered matrix (headers + cells).
- [ ] Matrix scrolls horizontally with sticky headers on a narrow window.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README with usage, scripts, and manual QA checklist"
```

---

## Self-review

**Spec coverage:**
- Goals — matrix UI, AA/AAA badges, persistence, URL share, PNG/CSV → Tasks 2-13.
- Tech stack — Vite/React/TS/Tailwind v4/Vitest/html-to-image → Task 1.
- Architecture file split → Tasks 2-13 follow the spec's file layout exactly.
- Data model (`Color`, `Palette`, `WcagVerdict`) → Tasks 3-4.
- Contrast math → Tasks 2-3.
- Invariants & edge cases — hex normalize, invalid hex, diagonal mute, duplicate detection → Tasks 2, 4, 8, 14.
- UI layout, MatrixCell semantics, component contracts, responsive → Tasks 8-14.
- localStorage `v1` key, debounced save → Tasks 6, 13.
- URL hash format with `~` escape → Task 5.
- CSV format and PNG export → Tasks 7, 12.
- Testing strategy → Tasks 2-13.

**Placeholder scan:** No TBD/TODO/`appropriate`/`similar to`/`etc.` placeholders.

**Type consistency:**
- `WcagVerdict` defined in Task 3; used in `MatrixCell` Task 8 and `CellDetailDrawer` Task 10 — same shape.
- `Color`/`Palette` defined Task 4; consumed in Tasks 5–13 — consistent names.
- `Selection` defined in Task 10 (`CellDetailDrawer.tsx`); imported in Task 13 (`App.tsx`) — same name.
- `MatrixCell` signature `{ bg, fg, v, onClick }` matches the spec's `{ bg, fg, verdict, onClick }` with `v` renamed for brevity inside the component; documented consistently between Task 8 and Task 9 usage.
- `findDuplicateIds` used in Task 14 with the same shape declared in Task 4.

All checks pass.

---

Plan complete and saved to `docs/superpowers/plans/2026-05-22-contrast-matrix.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
