import { useState, useEffect } from 'react';
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
  const [hexDraft, setHexDraft] = useState(color.hex);

  // Sync from parent when color.hex changes (e.g. color picker)
  useEffect(() => {
    setHexDraft(color.hex);
  }, [color.hex]);

  const isValid = normalizeHex(hexDraft) !== null;

  function handleHexChange(raw: string) {
    setHexDraft(raw);
    onEdit({ hex: raw });
  }

  return (
    <div className="flex items-center gap-2 py-1">
      <input
        type="text"
        aria-label="Hex"
        value={hexDraft}
        onChange={(e) => handleHexChange(e.target.value)}
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
