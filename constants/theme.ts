import { Platform } from 'react-native';
import { MD3DarkTheme, MD3LightTheme, MD3Theme } from 'react-native-paper';

// Extend the MD3Theme to include custom colors
export interface CustomTheme extends MD3Theme {
  colors: MD3Theme['colors'] & {
    primaryDark: string;
    primaryLight: string;
    gradientStart: string;
    gradientEnd: string;
    success: string;
    warning: string;
    blueLight: string;
    amberLight: string;
    greenLight: string;
  };
}

export const LightTheme: CustomTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6366f1',
    primaryDark: '#4f46e5',
    primaryLight: '#a5b4fc',
    background: '#f8fafc',
    surface: '#ffffff',
    onSurface: '#0f172a', // Mapped from text
    onSurfaceVariant: '#475569', // Mapped from textSecondary
    outlineVariant: '#64748b', // Mapped from subtle
    secondary: '#3b82f6', // Mapped from accent
    error: '#ef4444',
    onError: '#ffffff',
    outline: '#e2e8f0',
    shadow: '#000000',
    gradientStart: '#667eea',
    gradientEnd: '#764ba2',
    success: '#10b981',
    warning: '#f59e0b',
    blueLight: '#dbeafe',
    amberLight: '#fef3c7',
    greenLight: '#d1fae5',
  },
};

export const DarkTheme: CustomTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#6366f1',
    primaryDark: '#4f46e5',
    primaryLight: '#a5b4fc',
    background: '#1a202c',
    surface: '#2d3748',
    onSurface: '#e2e8f0', // Mapped from text
    onSurfaceVariant: '#a0aec0', // Mapped from textSecondary
    outlineVariant: '#718096', // Mapped from subtle
    secondary: '#3b82f6', // Mapped from accent
    error: '#ef4444',
    onError: '#ffffff',
    outline: '#4a5568',
    shadow: '#000000',
    gradientStart: '#667eea',
    gradientEnd: '#764ba2',
    success: '#10b981',
    warning: '#f59e0b',
    blueLight: '#dbeafe',
    amberLight: '#fef3c7',
    greenLight: '#d1fae5',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});