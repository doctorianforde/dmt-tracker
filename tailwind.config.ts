import type { Config } from 'tailwindcss';

// Semantic colours backed by the per-theme CSS variables in app/globals.css.
const token = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: token('canvas'),
        'on-canvas': token('on-canvas'),
        'on-canvas-muted': token('on-canvas-muted'),
        surface: token('surface'),
        surface2: token('surface2'),
        ink: token('ink'),
        muted: token('muted'),
        line: token('line'),
        accent: token('accent'),
        'on-accent': token('on-accent'),
        'accent-soft': token('accent-soft'),
        ok: token('ok'),
        warn: token('warn'),
        gold: token('gold'),
        danger: token('danger'),
        info: token('info'),
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        card: 'var(--radius-card)',
        control: 'var(--radius-control)',
      },
    },
  },
  plugins: [],
};

export default config;
