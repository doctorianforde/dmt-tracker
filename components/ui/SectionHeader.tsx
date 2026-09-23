interface SectionHeaderProps {
  index: number;
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

// Case-study style section heading: a big index number, an eyebrow label and
// a display-font title. Sits directly on the page canvas, not in a card.
export default function SectionHeader({ index, eyebrow, title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
      <div className="flex items-start gap-4 min-w-0">
        <span className="display text-5xl leading-none text-accent on-canvas-text tabular-nums select-none" aria-hidden>
          {String(index).padStart(2, '0')}
        </span>
        <div className="min-w-0">
          <p className="eyebrow text-on-canvas-muted">{eyebrow}</p>
          <h2 className="display text-3xl leading-tight text-on-canvas on-canvas-text mt-0.5">{title}</h2>
          {description && <p className="text-sm text-on-canvas-muted mt-1 max-w-prose">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
