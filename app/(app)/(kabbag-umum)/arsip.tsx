
import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Text, Card, Button, IconButton, Searchbar } from 'react-native-paper';
import { useAppTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { getLaporanSelesai, Laporan, getDisposisiHistory, getTindakLanjutHistory, DisposisiHistory, TindakLanjutHistory } from '@/utils/api';
import { LinearGradient } from 'expo-linear-gradient';
import { DetailLaporanDialog } from '@/components/laporan/DetailLaporanDialog';

export default function ArsipScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();

  const [laporan, setLaporan] = useState<Laporan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedLaporan, setSelectedLaporan] = useState<Laporan | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [disposisiHistory, setDisposisiHistory] = useState<DisposisiHistory[]>([]);
  const [tindakLanjutHistory, setTindakLanjutHistory] = useState<TindakLanjutHistory[]>([]);

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

  const handleItemPress = useCallback(async (item: Laporan) => {
    setSelectedLaporan(item);
    setDialogVisible(true);
    setDetailLoading(true);
    try {
      const [disposisiData, tindakLanjutData] = await Promise.all([
        getDisposisiHistory(String(item.id_laporan)),
        getTindakLanjutHistory(String(item.id_laporan))
      ]);
      setDisposisiHistory(disposisiData || []);
      setTindakLanjutHistory(tindakLanjutData || []);
    } catch (err) {
      console.error("Failed to load detail history:", err);
      // Optionally set an error state for the dialog
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleDismissDialog = () => {
    setDialogVisible(false);
    setSelectedLaporan(null);
    setDisposisiHistory([]);
    setTindakLanjutHistory([]);
  };

  const filteredLaporan = useMemo(() => {
    if (!searchQuery) {
      return laporan;
    }
    return laporan.filter((item) =>
      item.judul_laporan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.pelapor?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [laporan, searchQuery]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'diajukan': return theme.colors.warning;
      case 'didisposisikan': return theme.colors.backdrop;
      case 'ditindaklanjuti': return theme.colors.primary;
      case 'selesai': return theme.colors.success;
      default: return theme.colors.onSurface;
    }
  };

  const renderItem = ({ item }: { item: Laporan }) => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} onPress={() => handleItemPress(item)}>
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <IconButton
              icon="arrow-left"
              size={24}
              iconColor="white"
              onPress={() => router.back()}
              style={styles.backButton}
            />
            <Text style={styles.headerTitle}>Arsip Laporan</Text>
            <View style={styles.placeholder} />
          </View>
          <Text style={styles.headerSubtitle}>
            Daftar semua laporan yang telah selesai
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Cari laporan..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          elevation={1}
        />
      </View>

      <FlatList
        data={filteredLaporan}
        renderItem={renderItem}
        keyExtractor={(item) => item.id_laporan.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.centerContainer}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              {searchQuery ? 'Laporan tidak ditemukan.' : 'Belum ada laporan yang diarsipkan.'}
            </Text>
          </View>
        )}
        onRefresh={loadData}
        refreshing={loading}
      />

      {selectedLaporan && (
        <DetailLaporanDialog
          visible={dialogVisible}
          laporan={selectedLaporan}
          disposisiHistory={disposisiHistory}
          tindakLanjutHistory={tindakLanjutHistory}
          loading={detailLoading}
          onDismiss={handleDismissDialog}
          onEdit={() => {}} // Not applicable in archive
          onDelete={() => {}} // Not applicable in archive
          getStatusColor={getStatusColor}
          formatDate={formatDate}
        />
      )}
    </View>
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
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    gap: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    margin: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchbar: {
    borderRadius: 12,
    marginBottom: 16,
  },
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
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
