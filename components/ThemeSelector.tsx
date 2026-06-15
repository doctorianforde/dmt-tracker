'use client';

import React from 'react';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { THEMES, THEME_ORDER } from '@/lib/themes';
import type { ThemeChoice } from '@/types';

export const ThemeSelector: React.FC = () => {
  const { currentTheme, switchTheme, themeConfig } = useTheme();

  return (
    <div className="flex flex-wrap gap-2 p-4">
      {THEME_ORDER.map((themeKey: ThemeChoice) => {
        const theme = THEMES[themeKey];
        const isActive = themeKey === currentTheme;
        
        // Dynamic classes for active/inactive states based on the CURRENT theme's config
        // This ensures the selector buttons always look good within the current active theme context
        const baseClasses = "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all border";
        const activeClasses = `${themeConfig.themeButtonActive} shadow-sm`;
        const inactiveClasses = `${themeConfig.themeButtonInactive}`;

        return (
          <button
            key={themeKey}
            onClick={() => switchTheme(themeKey)}
            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
            aria-label={`Switch to ${theme.name} theme`}
            title={theme.name}
          >
            <span role="img" aria-hidden="true">{theme.emoji}</span>
            <span>{theme.name}</span>
          </button>
        );
      })}
    </div>
  );
};