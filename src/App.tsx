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
        <div className="overflow-x-auto">
          <div ref={matrixRef} className="inline-block bg-white">
            <ContrastMatrix
              palette={palette}
              onCellClick={(row, col) => setSelection({ row, col })}
            />
          </div>
        </div>
      </section>

      <CellDetailDrawer selection={selection} onClose={() => setSelection(null)} />
    </main>
  );
}
