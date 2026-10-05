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
