import type { ThemeChoice } from '@/types';

export interface ThemeConfig {
  name: string;
  emoji: string;
  pageBg: string;
  cardBg: string;
  cardBorder: string;
  headingColor: string;
  bodyText: string;
  mutedText: string;
  button: string;
  progressGradient: string;
  sectionCheckedBg: string;
  sectionCheckedBorder: string;
  sectionCheckedText: string;
  checkboxActiveBg: string;
  checkboxActiveBorder: string;
  inputBg: string;
  inputBorder: string;
  inputFocus: string;
  inputText: string;
  labelColor: string;
  selectBg: string;
}

export const THEMES: Record<ThemeChoice, ThemeConfig> = {
  light: {
    name: 'Light',
    emoji: '☀️',
    pageBg: 'bg-slate-50',
    cardBg: 'bg-white',
    cardBorder: 'border-slate-200',
    headingColor: 'text-slate-900',
    bodyText: 'text-slate-700',
    mutedText: 'text-slate-500',
    button: 'bg-sky-600 hover:bg-sky-700',
    progressGradient: 'from-sky-400 to-sky-600',
    sectionCheckedBg: 'bg-sky-50',
    sectionCheckedBorder: 'border-sky-300',
    sectionCheckedText: 'text-sky-900',
    checkboxActiveBg: 'bg-sky-500',
    checkboxActiveBorder: 'border-sky-500',
    inputBg: 'bg-white',
    inputBorder: 'border-slate-200',
    inputFocus: 'focus:ring-sky-500',
    inputText: 'text-slate-900',
    labelColor: 'text-slate-500',
    selectBg: 'bg-white',
  },
  dark: {
    name: 'Dark',
    emoji: '🌙',
    pageBg: 'bg-slate-900',
    cardBg: 'bg-slate-800',
    cardBorder: 'border-slate-700',
    headingColor: 'text-white',
    bodyText: 'text-slate-300',
    mutedText: 'text-slate-400',
    button: 'bg-violet-600 hover:bg-violet-700',
    progressGradient: 'from-violet-500 to-purple-600',
    sectionCheckedBg: 'bg-violet-900',
    sectionCheckedBorder: 'border-violet-600',
    sectionCheckedText: 'text-violet-200',
    checkboxActiveBg: 'bg-violet-500',
    checkboxActiveBorder: 'border-violet-500',
    inputBg: 'bg-slate-700',
    inputBorder: 'border-slate-600',
    inputFocus: 'focus:ring-violet-500',
    inputText: 'text-white',
    labelColor: 'text-slate-400',
    selectBg: 'bg-slate-700',
  },
  feminine: {
    name: 'Feminine',
    emoji: '🌸',
    pageBg: 'bg-pink-50',
    cardBg: 'bg-white',
    cardBorder: 'border-pink-200',
    headingColor: 'text-rose-900',
    bodyText: 'text-rose-800',
    mutedText: 'text-pink-500',
    button: 'bg-rose-500 hover:bg-rose-600',
    progressGradient: 'from-pink-400 to-rose-500',
    sectionCheckedBg: 'bg-rose-50',
    sectionCheckedBorder: 'border-rose-300',
    sectionCheckedText: 'text-rose-900',
    checkboxActiveBg: 'bg-rose-500',
    checkboxActiveBorder: 'border-rose-500',
    inputBg: 'bg-white',
    inputBorder: 'border-pink-200',
    inputFocus: 'focus:ring-rose-400',
    inputText: 'text-slate-900',
    labelColor: 'text-pink-500',
    selectBg: 'bg-white',
  },
  pastel: {
    name: 'Pastel',
    emoji: '🎨',
    pageBg: 'bg-purple-50',
    cardBg: 'bg-white',
    cardBorder: 'border-purple-200',
    headingColor: 'text-purple-900',
    bodyText: 'text-purple-800',
    mutedText: 'text-purple-500',
    button: 'bg-purple-500 hover:bg-purple-600',
    progressGradient: 'from-purple-300 to-indigo-400',
    sectionCheckedBg: 'bg-purple-50',
    sectionCheckedBorder: 'border-purple-300',
    sectionCheckedText: 'text-purple-900',
    checkboxActiveBg: 'bg-purple-400',
    checkboxActiveBorder: 'border-purple-400',
    inputBg: 'bg-white',
    inputBorder: 'border-purple-200',
    inputFocus: 'focus:ring-purple-400',
    inputText: 'text-slate-900',
    labelColor: 'text-purple-500',
    selectBg: 'bg-white',
  },
  sports: {
    name: 'Sports',
    emoji: '⚽',
    pageBg: 'bg-zinc-900',
    cardBg: 'bg-zinc-800',
    cardBorder: 'border-zinc-700',
    headingColor: 'text-white',
    bodyText: 'text-zinc-300',
    mutedText: 'text-zinc-400',
    button: 'bg-orange-500 hover:bg-orange-600',
    progressGradient: 'from-orange-400 to-red-500',
    sectionCheckedBg: 'bg-orange-900',
    sectionCheckedBorder: 'border-orange-600',
    sectionCheckedText: 'text-orange-200',
    checkboxActiveBg: 'bg-orange-500',
    checkboxActiveBorder: 'border-orange-500',
    inputBg: 'bg-zinc-700',
    inputBorder: 'border-zinc-600',
    inputFocus: 'focus:ring-orange-500',
    inputText: 'text-white',
    labelColor: 'text-zinc-400',
    selectBg: 'bg-zinc-700',
  },
};

export const THEME_ORDER: ThemeChoice[] = ['light', 'feminine', 'pastel', 'sports', 'dark'];
