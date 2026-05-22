# Contrast Matrix — Design Spec

**Date:** 2026-05-22
**Status:** Approved (pending user spec review)
**Author:** anil@gamerprofiles.com

## Summary

A client-side React app that generates a WCAG accessibility report for a user-supplied color palette. Given N colors, the app renders an N×N matrix where each cell shows the contrast ratio between two colors of the palette. Each cell uses the column color as background and the row color as foreground text, and the text displayed is the ratio itself — so every cell is simultaneously a number and a visual preview of that color combination. Cells additionally show pass/fail badges for WCAG AA and AAA at both normal and large text sizes.

The entire app is static and runs in the browser. No backend, no auth, no analytics.

## Goals

- Make it trivial to enter a palette and immediately see contrast across every pair.
- Surface WCAG AA/AAA pass/fail for normal and large text per cell.
- Persist a palette locally and share it via URL.
- Export the report as PNG or CSV.

## Non-goals

- APCA or any non-WCAG-2.1 contrast model.
- Color-blindness simulation.
- Saved-palettes library, accounts, multi-palette comparison.
- Server-side rendering or any backend.

## Tech stack

- Vite + React 19 + TypeScript.
- Tailwind CSS v4 for styling.
- Vitest + `@testing-library/react` + `jsdom` for tests.
- `html-to-image` for PNG export (small dependency; avoids hand-rolling canvas drawing of a styled DOM grid).

## Architecture

```
src/
├── lib/
│   ├── contrast.ts        # WCAG math: hex → relative luminance → ratio → AA/AAA verdicts
│   ├── palette.ts         # Palette type, add/remove/edit/reorder, validation, dedupe
│   └── share.ts           # URL-hash encode/decode, localStorage load/save, CSV/PNG export
├── components/
│   ├── PaletteEditor.tsx  # Rows of color inputs; add/remove; uses palette.ts
│   ├── ContrastMatrix.tsx # NxN grid; consumes contrast.ts
│   ├── MatrixCell.tsx     # Single cell: background, foreground, ratio, AA/AAA pips
│   ├── CellDetailDrawer.tsx # Opens on cell click; large preview + full WCAG breakdown
│   └── Toolbar.tsx        # Share URL / export PNG / export CSV / clear
├── App.tsx                # Composes everything; owns palette state + selected cell
└── main.tsx
```

**Boundary rationale:**

- `contrast.ts` is pure math — no React, no DOM. Heavily unit-tested.
- `palette.ts` is pure state operations on an array — testable in isolation.
- `share.ts` isolates side-effects (`window.location`, `localStorage`, `Blob`/`canvas`).
- React components stay thin and just render; no global state library — `useState` in `App.tsx` for palette and selected cell.

With N ≤ 30 (a soft cap for UI sanity), the matrix is at most 900 cells of trivial arithmetic. The full verdict grid is recomputed in a single `useMemo` keyed on the palette.

## Data model

```ts
type Color = {
  id: string;           // stable uuid for React keys + reorder
  hex: string;          // canonical "#rrggbb", lowercase
  label?: string;       // optional user-provided name
};

type Palette = Color[];

type WcagVerdict = {
  ratio: number;        // e.g. 4.62, rounded to 2 decimals for display
  passes: {
    aaNormal: boolean;  // ratio ≥ 4.5
    aaLarge:  boolean;  // ratio ≥ 3.0
    aaaNormal: boolean; // ratio ≥ 7.0
    aaaLarge:  boolean; // ratio ≥ 4.5
  };
};
```

## Contrast math (WCAG 2.1)

No external library — formula is short and stable.

1. `hexToRgb(hex)` → `{r, g, b}` in 0–255.
2. `relativeLuminance(rgb)` → apply the sRGB transfer function per channel:
   `c_lin = c ≤ 0.03928 ? c/12.92 : ((c+0.055)/1.055)^2.4`,
   then `L = 0.2126·R + 0.7152·G + 0.0722·B`.
3. `contrastRatio(L1, L2)` → `(max + 0.05) / (min + 0.05)`.
4. `verdict(ratio)` → checks the four WCAG thresholds above.

**Invariants & edge cases:**

- Hex is normalized to `#rrggbb` on input — `#abc` expands to `#aabbcc`, uppercase is lowercased, leading `#` enforced.
- Invalid hex (bad chars, wrong length) → the input row shows an error state and is excluded from the matrix until valid.
- Same color × same color (diagonal): ratio is `1.00`; cell is rendered but visually muted (reduced opacity, no badges) since it is not a meaningful combination.
- Duplicate hexes are allowed but flagged with a small warning icon — useful when two distinct labels happen to share a color.

## UI layout

Single column, max-width ~1400px, centered.

```
┌──────────────────────────────────────────────────────────┐
│ Header: title + Toolbar (Share | PNG | CSV | Clear)      │
├──────────────────────────────────────────────────────────┤
│ PaletteEditor                                             │
│  ┌──────────────────────────────────────────────────┐    │
│  │ [🟦] #1e88e5  [Primary blue        ] ✕           │    │
│  │ [⬜] #ffffff  [Surface             ] ✕           │    │
│  │ [⬛] #111111  [Body text           ] ✕           │    │
│  │ + Add color                                       │    │
│  └──────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────┤
│ ContrastMatrix (sticky row & col headers)                │
│      │ #1e88e5 │ #ffffff │ #111111 │                     │
│ ─────┼─────────┼─────────┼─────────┤                     │
│ #1e..│  1.00   │  3.14   │  8.59   │                     │
│ #ff..│  3.14   │  1.00   │ 18.88   │                     │
│ #11..│  8.59   │ 18.88   │  1.00   │                     │
└──────────────────────────────────────────────────────────┘
```

**MatrixCell:**

- Background = column color, text color = row color, displayed text = ratio (e.g. `8.59`).
- Two tiny pip rows below the ratio: `AA AAA` for normal text, then for large text. Pips are filled (pass) or outlined (fail), color-matched to the foreground for legibility.
- `aria-label` carries full info: *"Background #1e88e5, foreground #111111, contrast ratio 8.59, passes AA normal and AAA normal."*
- Cell is rendered as `<button>`, so Tab + Enter works.
- Click → opens `CellDetailDrawer`.

**Component contracts:**

- `PaletteEditor({ palette, onChange })` — emits the full new palette on every edit.
- `ContrastMatrix({ palette, onCellClick })` — pure render of a precomputed verdict grid (computed in `App` via `useMemo`).
- `MatrixCell({ bg, fg, verdict, onClick })` — no awareness of the broader palette.
- `CellDetailDrawer({ cell, onClose })` — slides in from the right; ESC closes; shows a large preview swatch with sample text at body and large sizes, plus a verdict table.
- `Toolbar({ palette, onClear })` — calls into `share.ts` for share/export.

**Responsive:** Below ~640px the matrix scrolls horizontally inside its container — sticky headers keep orientation. Editing the palette on mobile is supported but not the primary target.

## Persistence, sharing, export

**localStorage:**

- Key: `contrast-matrix:palette:v1`. Value: JSON of the `Palette` array.
- Saved via a debounced effect (~250ms) on every palette change.
- Loaded once on mount; falls back to a small default palette (white, black, mid-blue) if nothing stored or parse fails.
- Versioned key so future schema changes don't break older saved state.

**URL share:**

- Encoding: compact representation in the URL hash, e.g. `#p=1e88e5,ffffff~Surface,111111~Body`. Each color is `hex` or `hex~label`; commas separate colors; `~` separates hex from label. Labels are escaped with `encodeURIComponent`, then any remaining `~` is additionally replaced with `%7E` so the separator is unambiguous. Decoding reverses both steps. Comma is already encoded by `encodeURIComponent` (as `%2C`).
- On mount, if `location.hash` contains `p=…`, it takes precedence over localStorage and is written back to localStorage.
- "Share" button copies the current URL to clipboard and shows a brief "Copied" confirmation.
- Hash format chosen over base64 for human readability and to stay diff-friendly.

**CSV export:**

- Plain comma-separated grid: first row and first column are color labels (or hex if unlabeled). Cell values are raw contrast ratios to 2 decimals.
- Generated via a string builder, downloaded with `Blob` + `URL.createObjectURL` + a hidden `<a>` click.
- Filename: `contrast-matrix-YYYY-MM-DD.csv`.

**PNG export:**

- Uses `html-to-image` to render the matrix DOM node to a PNG.
- Triggered by the toolbar button. Filename: `contrast-matrix-YYYY-MM-DD.png`.

**Clear:**

- Confirms via `window.confirm`, then resets palette to default and clears localStorage + URL hash.

## Testing strategy

**Runner:** Vitest with `@testing-library/react` + `jsdom`. The math and state-operation modules carry the load-bearing logic and get thorough unit tests; UI components get light smoke tests.

**`lib/contrast.ts`:**

- `hexToRgb`: `#fff` → `{255,255,255}`; `#FFF` → same; `#000000` → `{0,0,0}`; mixed case; invalid input throws.
- `relativeLuminance`: known anchors — white `≈ 1`, black `= 0`, `#777777 ≈ 0.184`.
- `contrastRatio`: white-on-black `= 21`, white-on-white `= 1`, `#000` vs `#777` matches a hand-computed value.
- `verdict`: boundary cases at `3.0`, `4.5`, `7.0` — both just-passing and just-failing sides.
- Symmetry: `ratio(a, b) === ratio(b, a)`.

**`lib/palette.ts`:**

- Add/remove/edit by id preserves order and other entries.
- Hex normalization: `abc`, `#ABC`, `#aabbcc` all converge to `#aabbcc`.
- Invalid hex flagged but not silently dropped.
- Duplicate detection: same canonical hex flagged.

**`lib/share.ts`:**

- Round-trip: `encode(decode(s)) === s` for representative palettes (with and without labels, with special characters in labels).
- Malformed hash strings decode to an empty palette without throwing.
- localStorage save/load round-trips through a mocked storage.

**Component smoke tests:**

- `PaletteEditor`: typing a hex updates the emitted palette; clicking remove shrinks it; "Add color" appends.
- `ContrastMatrix`: renders N×N cells for a palette of size N; cell at (i, j) has the expected `aria-label`.
- `MatrixCell`: AA/AAA pip pass/fail states for a known boundary input.
- `CellDetailDrawer`: ESC key triggers `onClose`.

**Intentionally not tested:** real clipboard / real download behavior, `html-to-image` PNG output. These are brittle in jsdom — left to manual QA.

**CI:** `npm test` runs all tests; `npm run lint` runs TypeScript + ESLint. No e2e or visual regression in v1.

## Open questions / risks

- **Soft cap on palette size.** UI is most usable at ≤30 colors; matrix becomes hard to scan beyond that. The app does not hard-block but does not optimize for huge palettes.
- **PNG export of very large palettes.** For very wide matrices, `html-to-image` may produce a tall/wide PNG. Acceptable for v1 — manual QA will confirm the typical-size case (≤15 colors) is clean.
