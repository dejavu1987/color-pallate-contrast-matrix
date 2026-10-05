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
