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
      aria-modal="true"
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
