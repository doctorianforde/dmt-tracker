interface Props {
  percent: number;
  size?: number;
  stroke?: number;
  label?: string;
}

export default function ProgressRing({ percent, size = 120, stroke = 10, label = 'complete' }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={`${clamped}% ${label}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-ink/10" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped / 100)}
          className="stroke-accent transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="display text-3xl text-ink tabular-nums leading-none">{clamped}%</span>
        <span className="text-[10px] uppercase tracking-[0.14em] text-muted mt-1">{label}</span>
      </div>
    </div>
  );
}
