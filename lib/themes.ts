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
    pageBg: 'bg-slate-100',
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
    // Rich pink gradient page — obviously feminine at a glance
    pageBg: 'bg-gradient-to-br from-pink-300 via-rose-200 to-fuchsia-200',
    cardBg: 'bg-pink-50',
    cardBorder: 'border-pink-300',
    headingColor: 'text-rose-900',
    bodyText: 'text-rose-800',
    mutedText: 'text-pink-500',
    button: 'bg-fuchsia-600 hover:bg-fuchsia-700',
    progressGradient: 'from-pink-400 to-fuchsia-500',
    progressTrack: 'bg-pink-100',
    sectionCheckedBg: 'bg-rose-100',
    sectionCheckedBorder: 'border-fuchsia-400',
    sectionCheckedText: 'text-rose-900',
    sectionUncheckedBg: 'bg-pink-50',
    sectionUncheckedBorder: 'border-pink-200',
    checkboxActiveBg: 'bg-fuchsia-500',
    checkboxActiveBorder: 'border-fuchsia-500',
    checkboxInactiveBg: 'bg-white',
    checkboxInactiveBorder: 'border-pink-300',
    inputBg: 'bg-white',
    inputBorder: 'border-pink-300',
    inputFocus: 'focus:ring-fuchsia-400',
    inputText: 'text-slate-900',
    labelColor: 'text-pink-600',
    selectBg: 'bg-white',
    themeButtonActive: 'border-fuchsia-500 bg-pink-50 text-fuchsia-800',
    themeButtonInactive: 'border-pink-200 text-pink-700 hover:border-pink-400',
  },

  pastel: {
    name: 'Pastel',
    emoji: '🎨',
    navVariant: 'light',
    // Rainbow-soft gradient — dreamy & colourful
    pageBg: 'bg-gradient-to-br from-violet-200 via-purple-100 to-indigo-200',
    cardBg: 'bg-purple-50',
    cardBorder: 'border-violet-300',
    headingColor: 'text-violet-900',
    bodyText: 'text-purple-800',
    mutedText: 'text-violet-500',
    button: 'bg-violet-600 hover:bg-violet-700',
    progressGradient: 'from-violet-400 to-indigo-500',
    progressTrack: 'bg-violet-100',
    sectionCheckedBg: 'bg-violet-100',
    sectionCheckedBorder: 'border-violet-400',
    sectionCheckedText: 'text-violet-900',
    sectionUncheckedBg: 'bg-purple-50',
    sectionUncheckedBorder: 'border-violet-200',
    checkboxActiveBg: 'bg-violet-500',
    checkboxActiveBorder: 'border-violet-500',
    checkboxInactiveBg: 'bg-white',
    checkboxInactiveBorder: 'border-violet-300',
    inputBg: 'bg-white',
    inputBorder: 'border-violet-200',
    inputFocus: 'focus:ring-violet-400',
    inputText: 'text-slate-900',
    labelColor: 'text-violet-600',
    selectBg: 'bg-white',
    themeButtonActive: 'border-violet-500 bg-violet-50 text-violet-800',
    themeButtonInactive: 'border-violet-200 text-violet-700 hover:border-violet-400',
  },

  sports: {
    name: 'Sports',
    emoji: '⚽',
    navVariant: 'dark',
    // Near-black with bold orange borders — ESPN/scorecard feel
    pageBg: 'bg-zinc-950',
    cardBg: 'bg-zinc-900',
    cardBorder: 'border-orange-500',
    headingColor: 'text-white',
    bodyText: 'text-zinc-300',
    mutedText: 'text-zinc-400',
    button: 'bg-orange-500 hover:bg-orange-600',
    progressGradient: 'from-orange-400 to-red-600',
    progressTrack: 'bg-zinc-700',
    sectionCheckedBg: 'bg-zinc-800',
    sectionCheckedBorder: 'border-orange-400',
    sectionCheckedText: 'text-orange-300',
    sectionUncheckedBg: 'bg-zinc-900',
    sectionUncheckedBorder: 'border-zinc-700',
    checkboxActiveBg: 'bg-orange-500',
    checkboxActiveBorder: 'border-orange-500',
    checkboxInactiveBg: 'bg-zinc-800',
    checkboxInactiveBorder: 'border-zinc-600',
    inputBg: 'bg-zinc-800',
    inputBorder: 'border-zinc-700',
    inputFocus: 'focus:ring-orange-500',
    inputText: 'text-white',
    labelColor: 'text-orange-400',
    selectBg: 'bg-zinc-800',
    themeButtonActive: 'border-orange-500 bg-zinc-800 text-orange-400',
    themeButtonInactive: 'border-zinc-700 text-zinc-400 hover:border-zinc-500',
  },

  dark: {
    name: 'Dark',
    emoji: '🌙',
    navVariant: 'dark',
    // True near-black — clean, minimal dark mode
    pageBg: 'bg-slate-950',
    cardBg: 'bg-slate-900',
    cardBorder: 'border-slate-700',
    headingColor: 'text-white',
    bodyText: 'text-slate-300',
    mutedText: 'text-slate-500',
    button: 'bg-violet-600 hover:bg-violet-700',
    progressGradient: 'from-violet-500 to-indigo-600',
    progressTrack: 'bg-slate-800',
    sectionCheckedBg: 'bg-slate-800',
    sectionCheckedBorder: 'border-violet-500',
    sectionCheckedText: 'text-violet-300',
    sectionUncheckedBg: 'bg-slate-900',
    sectionUncheckedBorder: 'border-slate-700',
    checkboxActiveBg: 'bg-violet-500',
    checkboxActiveBorder: 'border-violet-500',
    checkboxInactiveBg: 'bg-slate-800',
    checkboxInactiveBorder: 'border-slate-600',
    inputBg: 'bg-slate-800',
    inputBorder: 'border-slate-700',
    inputFocus: 'focus:ring-violet-500',
    inputText: 'text-white',
    labelColor: 'text-slate-400',
    selectBg: 'bg-slate-800',
    themeButtonActive: 'border-violet-500 bg-slate-800 text-violet-400',
    themeButtonInactive: 'border-slate-700 text-slate-400 hover:border-slate-600',
  },
};

export const THEME_ORDER: ThemeChoice[] = ['light', 'feminine', 'pastel', 'sports', 'dark'];
