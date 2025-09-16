import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '../hooks/use-color-scheme';
import { Provider as PaperProvider } from 'react-native-paper';
import { LightTheme, DarkTheme, CustomTheme } from '../constants/theme';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  currentTheme: 'light' | 'dark';
  theme: CustomTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedPreference = await AsyncStorage.getItem('themePreference');
        if (storedPreference) {
          setThemePreferenceState(storedPreference as ThemePreference);
        }
      } catch (e) {
        console.error('Failed to load theme preference from AsyncStorage', e);
      }
    };
    loadThemePreference();
  }, []);

  useEffect(() => {
    let resolvedTheme: 'light' | 'dark';
    if (themePreference === 'system') {
      resolvedTheme = systemColorScheme || 'light';
    } else {
      resolvedTheme = themePreference;
    }
    setCurrentTheme(resolvedTheme);
  }, [themePreference, systemColorScheme]);

  const setThemePreference = async (preference: ThemePreference) => {
    try {
      await AsyncStorage.setItem('themePreference', preference);
      setThemePreferenceState(preference);
    } catch (e) {
      console.error('Failed to save theme preference to AsyncStorage', e);
    }
  };

  const theme = currentTheme === 'dark' ? DarkTheme : LightTheme;

  return (
    <ThemeContext.Provider value={{ themePreference, setThemePreference, currentTheme, theme }}>
      <PaperProvider theme={theme}>
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};