'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ThemeChoice, ThemeConfig, ThemeMarkers } from '@/types';
import { THEMES, THEME_MARKERS, getSavedTheme, setSavedTheme, isThemeChoice, getRandomQuote } from '@/lib/themes';
import { useAuth } from '@/lib/auth-context';
import { updateUserProfile } from '@/lib/firestore';

interface ThemeContextType {
  currentTheme: ThemeChoice;
  themeConfig: ThemeConfig;
  themeMarkers: ThemeMarkers;
  switchTheme: (theme: ThemeChoice) => void;
  activeQuote: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// The single source of truth for the active theme. Priority: a theme picked in
// this session (by the current user) → the theme saved on the signed-in
// user's profile → the last theme used in this browser.
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile } = useAuth();
  const [storedTheme] = useState<ThemeChoice>(() => getSavedTheme());
  const [picked, setPicked] = useState<{ uid: string | null; theme: ThemeChoice } | null>(null);
  const [activeQuote] = useState<string>(() => getRandomQuote());

  const uid = user?.uid ?? null;
  const profileTheme = isThemeChoice(userProfile?.theme) ? userProfile.theme : null;
  const currentTheme: ThemeChoice =
    (picked && picked.uid === uid ? picked.theme : null) ?? profileTheme ?? storedTheme;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    setSavedTheme(currentTheme);
  }, [currentTheme]);

  const switchTheme = useCallback(
    (theme: ThemeChoice) => {
      setPicked({ uid, theme });
      if (uid) {
        updateUserProfile(uid, { theme }).catch((err) =>
          console.error('Failed to save theme to profile:', err)
        );
      }
    },
    [uid]
  );

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        themeConfig: THEMES[currentTheme],
        themeMarkers: THEME_MARKERS[currentTheme],
        switchTheme,
        activeQuote,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
