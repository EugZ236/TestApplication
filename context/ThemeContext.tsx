import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeName = 'light' | 'dark' | null;

const THEME_KEY = 'app_theme_pref';

const ThemeContext = createContext<{
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  toggleTheme: () => void;
} | null>(null);

export const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeName>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(THEME_KEY);
        if (raw === 'light' || raw === 'dark') setThemeState(raw);
      } catch (e) {
        console.error('Failed to load theme pref', e);
      }
    })();
  }, []);

  const setTheme = (t: ThemeName) => {
    setThemeState(t);
    try {
      if (t === null) AsyncStorage.removeItem(THEME_KEY);
      else AsyncStorage.setItem(THEME_KEY, t);
    } catch (e) {
      console.error('Failed to save theme pref', e);
    }
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        AsyncStorage.setItem(THEME_KEY, next as string);
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: null, setTheme: (_: ThemeName) => {}, toggleTheme: () => {} };
  return ctx;
};

export default ThemeContext;
