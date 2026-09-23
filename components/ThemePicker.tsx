'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { THEMES, THEME_ORDER } from '@/lib/themes';

export default function ThemePicker() {
  const { currentTheme, switchTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const active = THEMES[currentTheme];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="btn-ghost !px-3 !py-2"
      >
        <span aria-hidden>{active.emoji}</span>
        <span className="hidden md:inline">{active.name}</span>
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M5.5 7.5 10 12l4.5-4.5" stroke="currentColor" strokeWidth={1.8} fill="none" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div role="menu" className="card absolute right-0 mt-2 w-[19rem] p-2 z-30">
          <p className="eyebrow text-muted px-2 pt-1 pb-2">Theme</p>
          <div className="grid grid-cols-2 gap-2">
            {THEME_ORDER.map((t) => {
              const theme = THEMES[t];
              const selected = t === currentTheme;
              const [canvas, surface, accent] = theme.swatch;
              return (
                <button
                  key={t}
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => {
                    switchTheme(t);
                    setOpen(false);
                  }}
                  className={`text-left rounded-xl p-2 border-2 transition hover:bg-ink/5 ${
                    selected ? 'border-accent' : 'border-transparent'
                  }`}
                >
                  <span
                    className="block h-14 rounded-lg relative overflow-hidden border border-black/10"
                    style={{ background: canvas }}
                    aria-hidden
                  >
                    <span className="absolute left-2 top-2 right-5 bottom-0 rounded-t-md" style={{ background: surface }} />
                    <span className="absolute left-4 top-5 w-8 h-2.5 rounded-full" style={{ background: accent }} />
                    <span className="absolute right-2 top-2 text-sm">{theme.emoji}</span>
                  </span>
                  <span className="block text-sm font-semibold text-ink mt-1.5">{theme.name}</span>
                  <span className="block text-[11px] leading-snug text-muted">{theme.tagline}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
