'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ThemeChoice, ThemeConfig, ThemeMarkers } from '@/types';
import { getSavedTheme, setSavedTheme, getThemeAspects, getRandomQuote } from '@/lib/themes';

interface ThemeContextType {
  currentTheme: ThemeChoice;
  themeConfig: ThemeConfig;
  themeMarkers: ThemeMarkers;
  switchTheme: (theme: ThemeChoice) => void;
  activeQuote: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeChoice>(() => getSavedTheme());
  const [activeQuote, setActiveQuote] = useState<string>(() => getRandomQuote());

  useEffect(() => {
    setSavedTheme(currentTheme);
    const root = document.documentElement;
    root.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  const switchTheme = (theme: ThemeChoice) => {
    setCurrentTheme(theme);
  };

  const themeAspects = useMemo(() => getThemeAspects(currentTheme), [currentTheme]);

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      themeConfig: themeAspects.config,
      themeMarkers: themeAspects.markers,
      switchTheme,
      activeQuote,
    }}>
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
