// app/_layout.tsx
import { useFonts } from 'expo-font';
import { Slot, SplashScreen } from 'expo-router';
import { useEffect } from 'react';
import { MD3LightTheme as DefaultTheme, PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DefaultTheme,
  fonts: {
    ...DefaultTheme.fonts,
    bodyLarge: { ...DefaultTheme.fonts.bodyLarge, fontFamily: 'Rubik' },
    bodyMedium: { ...DefaultTheme.fonts.bodyMedium, fontFamily: 'Rubik' },
    bodySmall: { ...DefaultTheme.fonts.bodySmall, fontFamily: 'Rubik' },
    titleLarge: { ...DefaultTheme.fonts.titleLarge, fontFamily: 'RubikBold' },
    titleMedium: { ...DefaultTheme.fonts.titleMedium, fontFamily: 'RubikBold' },
    titleSmall: { ...DefaultTheme.fonts.titleSmall, fontFamily: 'RubikBold' },
  },
};

export default function RootLayout() {
  const [loaded] = useFonts({
    Rubik: require('../assets/fonts/Rubik-Regular.ttf'),
    RubikBold: require('../assets/fonts/Rubik-Bold.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <Slot />
      </PaperProvider>
    </SafeAreaProvider>
  );
}