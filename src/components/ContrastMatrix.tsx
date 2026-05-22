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
