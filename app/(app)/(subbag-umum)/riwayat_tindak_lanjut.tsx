import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';

export default function RiwayatTindakLanjutScreen() {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Riwayat Tindak Lanjut</Text>
      <Text style={styles.subtitle}>Halaman ini sedang dalam pengembangan.</Text>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.onSurface,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.onSurfaceVariant,
        marginTop: 8,
    }
});
