'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'night';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  isNight: boolean;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
  isNight: false,
  mounted: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  const applyThemeToDocument = (t: ThemeMode) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (t === 'night') {
      root.classList.add('night-theme', 'dark');
      root.classList.remove('light-theme', 'light');
      root.setAttribute('data-theme', 'night');
    } else {
      root.classList.add('light-theme', 'light');
      root.classList.remove('night-theme', 'dark');
      root.setAttribute('data-theme', 'light');
    }
  };

  useEffect(() => {
    setMounted(true);
    try {
      const savedTheme = localStorage.getItem('nady_theme') as ThemeMode | null;
      if (savedTheme === 'night' || savedTheme === 'light') {
        setThemeState(savedTheme);
        applyThemeToDocument(savedTheme);
      } else {
        // Default to beautiful Pink #FF8DA1 theme
        setThemeState('light');
        applyThemeToDocument('light');
      }
    } catch {
      applyThemeToDocument('light');
    }
  }, []);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('nady_theme', newTheme);
    } catch {}
    applyThemeToDocument(newTheme);
  };

  const toggleTheme = () => {
    const next: ThemeMode = theme === 'light' ? 'night' : 'light';
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isNight: theme === 'night', mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
