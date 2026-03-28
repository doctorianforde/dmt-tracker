import type { ThemeChoice } from '@/types';

export interface ThemeConfig {
  name: string;
  emoji: string;
  navVariant: 'light' | 'dark';
  pageBg: string;
  cardBg: string;
  cardBorder: string;
  headingColor: string;
  bodyText: string;
  mutedText: string;
  button: string;
  progressGradient: string;
  progressTrack: string;
  sectionCheckedBg: string;
  sectionCheckedBorder: string;
  sectionCheckedText: string;
  sectionUncheckedBg: string;
  sectionUncheckedBorder: string;
  checkboxActiveBg: string;
  checkboxActiveBorder: string;
  checkboxInactiveBg: string;
  checkboxInactiveBorder: string;
  inputBg: string;
  inputBorder: string;
  inputFocus: string;
  inputText: string;
  labelColor: string;
  selectBg: string;
  themeButtonActive: string;
  themeButtonInactive: string;
}

export const THEMES: Record<ThemeChoice, ThemeConfig> = {
  light: {
    name: 'Light',
    emoji: '☀️',
    navVariant: 'light',
    pageBg: 'bg-slate-50',
    cardBg: 'bg-white',
    cardBorder: 'border-slate-200',
    headingColor: 'text-slate-900',
    bodyText: 'text-slate-700',
    mutedText: 'text-slate-500',
    button: 'bg-sky-600 hover:bg-sky-700',
    progressGradient: 'from-sky-400 to-sky-600',
    progressTrack: 'bg-slate-100',
    sectionCheckedBg: 'bg-sky-50',
    sectionCheckedBorder: 'border-sky-300',
    sectionCheckedText: 'text-sky-900',
    sectionUncheckedBg: 'bg-white',
    sectionUncheckedBorder: 'border-slate-200',
    checkboxActiveBg: 'bg-sky-500',
    checkboxActiveBorder: 'border-sky-500',
    checkboxInactiveBg: 'bg-white',
    checkboxInactiveBorder: 'border-slate-300',
    inputBg: 'bg-white',
    inputBorder: 'border-slate-200',
    inputFocus: 'focus:ring-sky-500',
    inputText: 'text-slate-900',
    labelColor: 'text-slate-500',
    selectBg: 'bg-white',
    themeButtonActive: 'border-sky-500 bg-sky-50 text-sky-800',
    themeButtonInactive: 'border-slate-200 text-slate-600 hover:border-slate-300',
  },
  feminine: {
    name: 'Feminine',
    emoji: '🌸',
    navVariant: 'light',
    pageBg: 'bg-pink-100',
    cardBg: 'bg-rose-50',
    cardBorder: 'border-pink-200',
    headingColor: 'text-rose-900',
    bodyText: 'text-rose-800',
    mutedText: 'text-pink-500',
    button: 'bg-rose-500 hover:bg-rose-600',
    progressGradient: 'from-pink-400 to-rose-500',
    progressTrack: 'bg-pink-100',
    sectionCheckedBg: 'bg-rose-100',
    sectionCheckedBorder: 'border-rose-400',
    sectionCheckedText: 'text-rose-900',
    sectionUncheckedBg: 'bg-rose-50',
    sectionUncheckedBorder: 'border-pink-200',
    checkboxActiveBg: 'bg-rose-500',
    checkboxActiveBorder: 'border-rose-500',
    checkboxInactiveBg: 'bg-white',
    checkboxInactiveBorder: 'border-pink-300',
    inputBg: 'bg-white',
    inputBorder: 'border-pink-200',
    inputFocus: 'focus:ring-rose-400',
    inputText: 'text-slate-900',
    labelColor: 'text-pink-600',
    selectBg: 'bg-white',
    themeButtonActive: 'border-rose-500 bg-rose-50 text-rose-800',
    themeButtonInactive: 'border-pink-200 text-pink-700 hover:border-pink-300',
  },
  pastel: {
    name: 'Pastel',
    emoji: '🎨',
    navVariant: 'light',
    pageBg: 'bg-purple-100',
    cardBg: 'bg-purple-50',
    cardBorder: 'border-purple-200',
    headingColor: 'text-purple-900',
    bodyText: 'text-purple-800',
    mutedText: 'text-purple-500',
    button: 'bg-purple-500 hover:bg-purple-600',
    progressGradient: 'from-purple-300 to-indigo-500',
    progressTrack: 'bg-purple-100',
    sectionCheckedBg: 'bg-purple-100',
    sectionCheckedBorder: 'border-purple-400',
    sectionCheckedText: 'text-purple-900',
    sectionUncheckedBg: 'bg-purple-50',
    sectionUncheckedBorder: 'border-purple-200',
    checkboxActiveBg: 'bg-purple-500',
    checkboxActiveBorder: 'border-purple-500',
    checkboxInactiveBg: 'bg-white',
    checkboxInactiveBorder: 'border-purple-300',
    inputBg: 'bg-white',
    inputBorder: 'border-purple-200',
    inputFocus: 'focus:ring-purple-400',
    inputText: 'text-slate-900',
    labelColor: 'text-purple-600',
    selectBg: 'bg-white',
    themeButtonActive: 'border-purple-500 bg-purple-50 text-purple-800',
    themeButtonInactive: 'border-purple-200 text-purple-700 hover:border-purple-300',
  },
  sports: {
    name: 'Sports',
    emoji: '⚽',
    navVariant: 'dark',
    pageBg: 'bg-zinc-900',
    cardBg: 'bg-zinc-800',
    cardBorder: 'border-zinc-700',
    headingColor: 'text-white',
    bodyText: 'text-zinc-300',
    mutedText: 'text-zinc-400',
    button: 'bg-orange-500 hover:bg-orange-600',
    progressGradient: 'from-orange-400 to-red-500',
    progressTrack: 'bg-zinc-700',
    sectionCheckedBg: 'bg-zinc-700',
    sectionCheckedBorder: 'border-orange-500',
    sectionCheckedText: 'text-orange-300',
    sectionUncheckedBg: 'bg-zinc-800',
    sectionUncheckedBorder: 'border-zinc-600',
    checkboxActiveBg: 'bg-orange-500',
    checkboxActiveBorder: 'border-orange-500',
    checkboxInactiveBg: 'bg-zinc-700',
    checkboxInactiveBorder: 'border-zinc-500',
    inputBg: 'bg-zinc-700',
    inputBorder: 'border-zinc-600',
    inputFocus: 'focus:ring-orange-500',
    inputText: 'text-white',
    labelColor: 'text-zinc-400',
    selectBg: 'bg-zinc-700',
    themeButtonActive: 'border-orange-500 bg-zinc-700 text-orange-400',
    themeButtonInactive: 'border-zinc-600 text-zinc-400 hover:border-zinc-500',
  },
  dark: {
    name: 'Dark',
    emoji: '🌙',
    navVariant: 'dark',
    pageBg: 'bg-slate-900',
    cardBg: 'bg-slate-800',
    cardBorder: 'border-slate-700',
    headingColor: 'text-white',
    bodyText: 'text-slate-300',
    mutedText: 'text-slate-400',
    button: 'bg-violet-600 hover:bg-violet-700',
    progressGradient: 'from-violet-500 to-purple-600',
    progressTrack: 'bg-slate-700',
    sectionCheckedBg: 'bg-slate-700',
    sectionCheckedBorder: 'border-violet-500',
    sectionCheckedText: 'text-violet-300',
    sectionUncheckedBg: 'bg-slate-800',
    sectionUncheckedBorder: 'border-slate-600',
    checkboxActiveBg: 'bg-violet-500',
    checkboxActiveBorder: 'border-violet-500',
    checkboxInactiveBg: 'bg-slate-700',
    checkboxInactiveBorder: 'border-slate-500',
    inputBg: 'bg-slate-700',
    inputBorder: 'border-slate-600',
    inputFocus: 'focus:ring-violet-500',
    inputText: 'text-white',
    labelColor: 'text-slate-400',
    selectBg: 'bg-slate-700',
    themeButtonActive: 'border-violet-500 bg-slate-700 text-violet-400',
    themeButtonInactive: 'border-slate-600 text-slate-400 hover:border-slate-500',
  },
};

export const THEME_ORDER: ThemeChoice[] = ['light', 'feminine', 'pastel', 'sports', 'dark'];
