import type { WcagVerdict } from '../lib/contrast';

type Props = {
  bg: string;
  fg: string;
  v: WcagVerdict;
  onClick: () => void;
};

function Pip({ pass, label, bg }: { pass: boolean; label: string; bg: string }) {
  return (
    <span
      title={label}
      className="inline-flex items-center justify-center text-[9px] font-medium leading-none px-1 py-[1px] rounded-sm border min-w-[18px]"
      style={{
        borderColor: 'currentColor',
        backgroundColor: pass ? 'currentColor' : 'transparent',
        color: pass ? bg : 'currentColor',
      }}
    >
      {label}
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
            <Pip pass={v.passes.aaNormal} label="AA" bg={bg} />
            <Pip pass={v.passes.aaaNormal} label="AAA" bg={bg} />
          </div>
          <div className="flex gap-1">
            <Pip pass={v.passes.aaLarge} label="AA·L" bg={bg} />
            <Pip pass={v.passes.aaaLarge} label="AAA·L" bg={bg} />
          </div>
        </div>
      )}
    </button>
  );
}
