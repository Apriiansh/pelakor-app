import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Platform, Alert } from 'react-native';
import { Text, Card, Button, IconButton, Searchbar } from 'react-native-paper';
import { useAppTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

import { getLaporanSelesai, Laporan, getDisposisiHistory, getTindakLanjutHistory, DisposisiHistory, TindakLanjutHistory } from '@/utils/api';
import { LinearGradient } from 'expo-linear-gradient';
import { DetailLaporanDialog } from '@/components/laporan/DetailLaporanDialog';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { generateLaporanPDF } from '@/utils/pdfExports';

export default function ArsipScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();

  const [laporan, setLaporan] = useState<Laporan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // State for date filtering
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');

  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedLaporan, setSelectedLaporan] = useState<Laporan | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [disposisiHistory, setDisposisiHistory] = useState<DisposisiHistory[]>([]);
  const [tindakLanjutHistory, setTindakLanjutHistory] = useState<TindakLanjutHistory[]>([]);

  const loadData = useCallback(async (currentStartDate: Date | null = null, currentEndDate: Date | null = null) => {
    setLoading(true);
    setError(null);
    try {
      const apiFilters: { startDate?: string; endDate?: string } = {};
      if (currentStartDate) {
        apiFilters.startDate = currentStartDate.toISOString().split('T')[0];
      }
      if (currentEndDate) {
        apiFilters.endDate = currentEndDate.toISOString().split('T')[0];
      }

      const data = await getLaporanSelesai(apiFilters);
      setLaporan(data || []);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData(); // Initial load without filters
    }, [loadData])
  );

  const handleFilterPress = useCallback(() => {
    if (startDate && endDate && startDate > endDate) {
      console.warn('Tanggal mulai tidak boleh lebih dari tanggal akhir');
      return;
    }
    loadData(startDate, endDate);
  }, [startDate, endDate, loadData]);

  const handleResetPress = useCallback(() => {
    setStartDate(null);
    setEndDate(null);
    loadData();
  }, [loadData]);

  const showDatePicker = useCallback((mode: 'start' | 'end') => {
    setDatePickerMode(mode);
    setDatePickerVisibility(true);
  }, []);

  const hideDatePicker = useCallback(() => {
    setDatePickerVisibility(false);
  }, []);

  const handleConfirmDate = useCallback((date: Date) => {
    if (datePickerMode === 'start') {
      setStartDate(date);
      if (endDate && date > endDate) {
        setEndDate(null);
      }
    } else {
      if (startDate && date < startDate) {
        console.warn('Tanggal akhir tidak boleh sebelum tanggal mulai');
        hideDatePicker();
        return;
      }
      setEndDate(date);
      setTimeout(() => {
        loadData(startDate, date);
      }, 100);
    }
    hideDatePicker();
  }, [datePickerMode, endDate, startDate, hideDatePicker, loadData]);

  const [isExporting, setIsExporting] = useState(false);

  const filteredLaporan = useMemo(() => {
    if (!searchQuery) return laporan;
    return laporan.filter((item) =>
      item.judul_laporan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.pelapor?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [laporan, searchQuery]);

  const formatShortDate = useCallback((date: Date | null) => {
    if (!date) return 'Pilih Tanggal';
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  }, []);

  const handleExportPDF = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);

    let title = 'Laporan Selesai';
    if (startDate && endDate) {
      title = `Laporan Selesai Periode ${formatShortDate(startDate)} - ${formatShortDate(endDate)}`;
    } else if (startDate) {
      title = `Laporan Selesai Sejak ${formatShortDate(startDate)}`;
    } else if (endDate) {
      title = `Laporan Selesai Hingga ${formatShortDate(endDate)}`;
    }

    try {
      await generateLaporanPDF({
        laporan: filteredLaporan,
        title,
        startDate,
        endDate,
      });
    } catch (error) {
      console.error('Failed to export PDF:', error);
    } finally {
      setIsExporting(false);
    }
  }, [filteredLaporan, startDate, endDate, isExporting, formatShortDate]);

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
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleDismissDialog = useCallback(() => {
    setDialogVisible(false);
    setSelectedLaporan(null);
    setDisposisiHistory([]);
    setTindakLanjutHistory([]);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'diajukan': return theme.colors.warning;
      case 'didisposisikan': return theme.colors.backdrop;
      case 'ditindaklanjuti': return theme.colors.primary;
      case 'selesai': return theme.colors.success;
      default: return theme.colors.onSurface;
    }
  }, [theme.colors]);

  const renderItem = useCallback(({ item }: { item: Laporan }) => (
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
  ), [theme.colors, handleItemPress]);

  if (loading && !laporan.length) {
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
        <Button mode="contained" onPress={() => loadData(startDate, endDate)}>
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
          placeholder="Cari judul atau nama pelapor..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          elevation={1}
        />
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.dateInput, { borderColor: theme.colors.outline }]}
            onPress={() => showDatePicker('start')}
          >
            <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.onSurface }}>{formatShortDate(startDate)}</Text>
          </TouchableOpacity>
          <Text style={{ color: theme.colors.onSurfaceVariant }}> - </Text>
          <TouchableOpacity
            style={[styles.dateInput, { borderColor: theme.colors.outline }]}
            onPress={() => showDatePicker('end')}
          >
            <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.onSurface }}>{formatShortDate(endDate)}</Text>
          </TouchableOpacity>
          <IconButton
            icon="refresh"
            size={20}
            iconColor={theme.colors.primary}
            style={styles.resetButton}
            onPress={handleResetPress}
            disabled={loading}
          />
          <IconButton
            icon="download"
            size={20}
            iconColor={theme.colors.primary}
            style={styles.resetButton}
            onPress={handleExportPDF}
            disabled={loading || isExporting}
          />
        </View>
      </View>

      <FlatList
        data={filteredLaporan}
        renderItem={renderItem}
        keyExtractor={(item) => item.id_laporan.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.centerContainer}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              {searchQuery || startDate || endDate ? 'Laporan tidak ditemukan.' : 'Belum ada laporan yang diarsipkan.'}
            </Text>
          </View>
        )}
        onRefresh={() => loadData(startDate, endDate)}
        refreshing={loading}
      />

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirmDate}
        onCancel={hideDatePicker}
        maximumDate={new Date()}
      />

      {selectedLaporan && (
        <DetailLaporanDialog
          visible={dialogVisible}
          laporan={selectedLaporan}
          disposisiHistory={disposisiHistory}
          tindakLanjutHistory={tindakLanjutHistory}
          loading={detailLoading}
          onDismiss={handleDismissDialog}
          onEdit={() => { }}
          onDelete={() => { }}
          getStatusColor={getStatusColor}
          formatDate={formatDate}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  headerGradient: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 },
  headerContent: { gap: 12 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { backgroundColor: 'rgba(255, 255, 255, 0.2)', margin: 0 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white', flex: 1, textAlign: 'center' },
  placeholder: { width: 40 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center' },
  searchContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 12 },
  searchbar: { borderRadius: 12 },
  listContainer: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 16 },
  card: { marginBottom: 12, borderRadius: 12 },
  itemContent: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 16 },
  textContainer: { flex: 1 },
  filterContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateInput: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  resetButton: { margin: 0, backgroundColor: 'rgba(0, 0, 0, 0.05)' }
});
