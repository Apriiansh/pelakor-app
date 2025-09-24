
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Text, Card, Button, IconButton } from 'react-native-paper';
import { useAppTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { getLaporanSelesai, Laporan, getDisposisiHistory, getTindakLanjutHistory, DisposisiHistory, TindakLanjutHistory } from '@/utils/api';
import { LinearGradient } from 'expo-linear-gradient';
import { DetailLaporanDialog } from '@/components/laporan/DetailLaporanDialog';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

export default function LaporanBupatiScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  
  const [laporan, setLaporan] = useState<Laporan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [selectedLaporan, setSelectedLaporan] = useState<Laporan | null>(null);
  const [disposisiHistory, setDisposisiHistory] = useState<DisposisiHistory[]>([]);
  const [tindakLanjutHistory, setTindakLanjutHistory] = useState<TindakLanjutHistory[]>([]);
  const [isDetailVisible, setDetailVisible] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

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

  const openDetail = useCallback(async (laporan: Laporan): Promise<void> => {
    setSelectedLaporan(laporan);
    setDetailVisible(true);
    setLoadingDetail(true);
    try {
        const [disposisi, tindakLanjut] = await Promise.all([
            getDisposisiHistory(laporan.id_laporan.toString()).catch(() => []),
            getTindakLanjutHistory(laporan.id_laporan.toString()).catch(() => [])
        ]);
        setDisposisiHistory(disposisi);
        setTindakLanjutHistory(tindakLanjut);
    } catch (error) {
        console.error('Error fetching detail:', error);
    } finally {
        setLoadingDetail(false);
    }
  }, []);

  const closeDetail = useCallback(() => {
      setDetailVisible(false);
      setSelectedLaporan(null);
      setDisposisiHistory([]);
      setTindakLanjutHistory([]);
  }, []);

  const getStatusColor = (status: string): string => {
    const statusColors: { [key: string]: string } = {
        diajukan: theme.colors.primary,
        diproses: '#FF9800',
        ditolak: theme.colors.error,
        ditindaklanjuti: '#2196F3',
        selesai: '#4CAF50',
    };
    return statusColors[status] || theme.colors.outline;
  };

  const formatDate = (dateString: string): string => {
      try {
          return format(parseISO(dateString), 'd MMM yyyy, HH:mm', { locale: id });
      } catch {
          return dateString;
      }
  };

  const renderItem = ({ item }: { item: Laporan }) => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} onPress={() => openDetail(item)}>
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
        <Text style={{ marginTop: 10, color: theme.colors.onSurfaceVariant }}>Memuat data laporan...</Text>
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
                        onPress={() => router.replace('/(app)/(bupati)/home')}
                        style={styles.backButton}
                    />
                    <Text style={styles.headerTitle}>Laporan Selesai</Text>
                    <View style={styles.placeholder} />
                </View>
                <Text style={styles.headerSubtitle}>
                    Daftar semua laporan yang telah selesai di lingkup kabupaten
                </Text>
            </View>
        </LinearGradient>
      
      <FlatList
        data={laporan}
        renderItem={renderItem}
        keyExtractor={(item) => item.id_laporan.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.centerContainer}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>Belum ada laporan yang selesai.</Text>
          </View>
        )}
        onRefresh={loadData}
        refreshing={loading}
      />

      {selectedLaporan && (
          <DetailLaporanDialog
              visible={isDetailVisible}
              laporan={selectedLaporan}
              disposisiHistory={disposisiHistory}
              tindakLanjutHistory={tindakLanjutHistory}
              loading={loadingDetail}
              onDismiss={closeDetail}
              onEdit={() => {}}
              onDelete={() => {}}
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
  description: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 16,
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
