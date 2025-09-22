
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Card, Appbar, Button, Surface } from 'react-native-paper';
import { useAppTheme } from '@/context/ThemeContext';
import DetailArsipDialog from '@/components/laporan/DetailArsipDialog';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { getLaporanSelesai, Laporan } from '@/utils/api';

export default function ArsipScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLaporan, setSelectedLaporan] = useState<Laporan | null>(null);
  
  const [laporan, setLaporan] = useState<Laporan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLaporanSelesai(); 
      setLaporan(data || []);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleOpenModal = (lprn: Laporan) => {
    setSelectedLaporan(lprn);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedLaporan(null);
  };

  const renderItem = ({ item }: { item: Laporan }) => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} onPress={() => handleOpenModal(item)}>
      <Card.Content>
        <View style={styles.itemContent}>
          <Ionicons name="checkmark-done-circle" size={24} color={theme.colors.success} style={styles.icon} />
          <View style={styles.textContainer}>
            <Text variant="titleMedium" style={{ fontFamily: 'Rubik-Bold' }}>{item.judul_laporan}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
              Selesai: {item.updated_at ? new Date(item.updated_at).toLocaleDateString('id-ID') : '-'} | 
              Pelapor: {item.pelapor ?? '-'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.onSurfaceVariant} />
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10, color: theme.colors.onSurfaceVariant }}>Memuat data arsip...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={{ marginBottom: 10, color: theme.colors.error }}>Gagal memuat data: {error.message}</Text>
        <Button mode="contained" onPress={loadData}>
          Coba Lagi
        </Button>
      </View>
    );
  }

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Arsip Laporan Selesai" titleStyle={{ fontFamily: 'Rubik-Bold' }} />
      </Appbar.Header>
      
      <FlatList
        data={laporan}
        renderItem={renderItem}
        keyExtractor={(item) => item.id_laporan.toString()}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={() => (
          <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
            Berikut adalah daftar semua laporan yang telah ditindaklanjuti dan diselesaikan.
          </Text>
        )}
        ListEmptyComponent={() => (
          <View style={styles.centerContainer}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>Belum ada laporan yang diarsipkan.</Text>
          </View>
        )}
        onRefresh={loadData}
        refreshing={loading}
      />

      <DetailArsipDialog
        laporan={selectedLaporan}
        visible={modalVisible}
        onClose={handleCloseModal}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  description: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    marginBottom: 12,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
});
