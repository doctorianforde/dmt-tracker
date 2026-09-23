import type { ThemeChoice, ThemeConfig, ThemeMarkers } from '@/types';

// Each theme's colours, fonts and background are CSS variables in
// app/globals.css under [data-theme="<choice>"]. Components use the semantic
// Tailwind colours (bg-surface, text-ink, bg-accent, …) so they restyle
// automatically when the theme changes.

export const THEMES: Record<ThemeChoice, ThemeConfig> = {
  light: {
    name: 'Paper',
    emoji: '☀️',
    tagline: 'Warm paper, ink and electric blue',
    swatch: ['#F6F4EF', '#FFFFFF', '#3B5BFD'],
  },
  flower: {
    name: 'Bloom',
    emoji: '🌸',
    tagline: 'Blush petals and serif headlines',
    swatch: ['#FFE9EE', '#FFFFFF', '#E0457B'],
  },
  pastel: {
    name: 'Sorbet',
    emoji: '🍧',
    tagline: 'Soft mint, peach and lavender',
    swatch: ['#EFEAFF', '#FFFFFF', '#7C5CFF'],
  },
  football: {
    name: 'Matchday',
    emoji: '⚽',
    tagline: 'Striped pitch, floodlights and gold',
    swatch: ['#0C3A26', '#FFFFFF', '#F5C400'],
  },
  dark: {
    name: 'Midnight',
    emoji: '🌙',
    tagline: 'Deep ink with a lime glow',
    swatch: ['#0B0C10', '#16171D', '#C6F432'],
  },
  mario: {
    name: 'Retro',
    emoji: '🍄',
    tagline: '8-bit skies, bricks and power-ups',
    swatch: ['#5C94FC', '#FFF8DC', '#E4000F'],
  },
};

export const THEME_MARKERS: Record<ThemeChoice, ThemeMarkers> = {
  light: { pending: '○', completed: '●', approved: '✅' },
  flower: { pending: '🌱', completed: '🌸', approved: '💐' },
  pastel: { pending: '🫧', completed: '🍬', approved: '🌈' },
  football: { pending: '⚽', completed: '🥅', approved: '🏆' },
  dark: { pending: '◇', completed: '◆', approved: '⭐' },
  mario: { pending: '🧱', completed: '🍄', approved: '🌟' },
};

export const THEME_ORDER: ThemeChoice[] = ['light', 'flower', 'pastel', 'football', 'dark', 'mario'];

export const THEME_STORAGE_KEY = 'dmt-tracker-theme';

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return typeof value === 'string' && value in THEMES;
}

export function getSavedTheme(): ThemeChoice {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeChoice(saved) ? saved : 'light';
  } catch {
    return 'light';
  }
}

export function setSavedTheme(theme: ThemeChoice): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable (private mode) — the theme still applies
    // for this session and is saved to the user's profile.
  }
}

// ── Motivational Quotes ────────────────────────────────────────────────────────

const MOTIVATIONAL_QUOTES = [
  "It's not about being the best. It's about being better than you were yesterday.",
  "The difference between ordinary and extraordinary is that little extra.",
  "Champions aren't made in gyms. Champions are made from something they have deep inside them: a desire, a dream, a vision.",
  "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing.",
  "Do not let what you cannot do interfere with what you can do.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Winners never quit and quitters never win.",
  "You don't have to be great to start, but you have to start to be great.",
  "The only way to define your limits is by going beyond them.",
  "Focus on the step in front of you, not the whole staircase.",
  "Your limitation—it's only your imagination.",
  "Dream it. Wish it. Do it.",
  "Stay positive, work hard, make it happen.",
  "Don't stop when you're tired. Stop when you're done.",
  "Excellence is not a destination; it is a continuous journey that never ends.",
  "The key to success is to focus on goals, not obstacles.",
  "Your potential is endless. Your growth is optional. Choose growth.",
  "Discipline is choosing between what you want now and what you want most.",
  "Success doesn't just find you. You have to go out and get it.",
  "The pain of discipline weighs ounces while the pain of regret weighs tons.",
  "Don't watch the clock; do what it does. Keep going.",
  "Rise above the storm and you will find the sunshine.",
  "Believe you can and you're halfway there.",
  "The future depends on what you do today.",
  "Quality is not an act, it is a habit.",
  "You are capable of more than you know.",
  "Every accomplishment starts with the decision to try.",
  "Strive for progress, not perfection.",
  "Your hard work will pay off. You just need to keep pushing.",
];

export function getRandomQuote(): string {
  const index = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  return MOTIVATIONAL_QUOTES[index];
}
