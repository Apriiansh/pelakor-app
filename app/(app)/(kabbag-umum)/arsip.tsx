import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Platform, Alert, TextInput } from 'react-native';
import { Text, Card, Button, IconButton, Searchbar } from 'react-native-paper';
import { useAppTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Asset } from 'expo-asset';

import * as Sharing from 'expo-sharing';
import { getLaporanSelesai, Laporan, getDisposisiHistory, getTindakLanjutHistory, DisposisiHistory, TindakLanjutHistory } from '@/utils/api';
import { LinearGradient } from 'expo-linear-gradient';
import { DetailLaporanDialog } from '@/components/laporan/DetailLaporanDialog';

import DateTimePickerModal from "react-native-modal-datetime-picker";
import DatePicker from "react-datepicker";

// Import PDF generator berdasarkan platform
let generateLaporanPDF: any;
if (Platform.OS === 'web') {
  generateLaporanPDF = require('@/utils/pdfExports.web').generateLaporanPDF;
} else {
  generateLaporanPDF = require('@/utils/pdfExports').generateLaporanPDF;
}

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

  const hideDatePicker = useCallback(() => {
    setDatePickerVisibility(false);
  }, []);

  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');

  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedLaporan, setSelectedLaporan] = useState<Laporan | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [disposisiHistory, setDisposisiHistory] = useState<DisposisiHistory[]>([]);
  const [tindakLanjutHistory, setTindakLanjutHistory] = useState<TindakLanjutHistory[]>([]);
  const [canShare, setCanShare] = useState(false);

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

  useEffect(() => {
    const checkSharingAvailability = async () => {
      if (Platform.OS !== 'web') {
        const isAvailable = await Sharing.isAvailableAsync();
        setCanShare(isAvailable);
      } else {
        // Di web, selalu bisa download
        setCanShare(true);
      }
    };
    checkSharingAvailability();
  }, []);

  const handleFilterPress = useCallback(() => {
    if (startDate && endDate && startDate > endDate) {
      console.warn('Tanggal mulai tidak boleh lebih dari tanggal akhir');
      return;
    }
    loadData(startDate, endDate);
  }, [startDate, endDate, loadData]);

  const handleConfirmDate = useCallback((date: Date, mode?: 'start' | 'end') => {
    const dateMode = mode || datePickerMode;

    if (dateMode === 'start') {
      setStartDate(date);
      if (endDate && date > endDate) {
        setEndDate(null);
      }
    } else {
      if (startDate && date < startDate) {
        const message = 'Tanggal akhir tidak boleh sebelum tanggal mulai';
        if (Platform.OS === 'web') {
          alert(message);
        } else {
          console.warn(message);
        }
        if (Platform.OS !== 'web') {
          hideDatePicker();
        }
        return;
      }
      setEndDate(date);
      setTimeout(() => {
        loadData(startDate, date);
      }, 100);
    }

    if (Platform.OS !== 'web') {
      hideDatePicker();
    }
  }, [datePickerMode, endDate, startDate, hideDatePicker, loadData]);

  const handleResetPress = useCallback(() => {
    setStartDate(null);
    setEndDate(null);
    loadData();
  }, [loadData]);

  const showDatePicker = useCallback((mode: 'start' | 'end') => {
    setDatePickerMode(mode);
    setDatePickerVisibility(true);
  }, []);

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

    if (!filteredLaporan || filteredLaporan.length === 0) {
      if (Platform.OS === 'web') {
        alert('Tidak ada data laporan untuk diekspor.');
      } else {
        Alert.alert('Perhatian', 'Tidak ada data laporan untuk diekspor.');
      }
      return;
    }

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
      let exportOptions: any = {
        laporan: filteredLaporan,
        title,
        startDate,
        endDate,
      };

      if (Platform.OS === 'web') {
        try {
          const asset = Asset.fromModule(require('@/assets/images/logo-kabupaten-ogan-ilir.png'));
          await asset.downloadAsync();

          const response = await fetch(asset.uri);
          const blob = await response.blob();

          const reader = new FileReader();
          reader.readAsDataURL(blob);

          exportOptions.logoBase64 = await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
          });

        } catch (logoError) {
          console.warn('Gagal memuat logo untuk PDF:', logoError);
        }
      }

      const result = await generateLaporanPDF({
        ...exportOptions
      });

      if (Platform.OS === 'web') {
        console.log('PDF export initiated for web:', result);
      } else {
        Alert.alert('Berhasil', 'File PDF berhasil dibuat dan siap dibagikan.');
      }
    } catch (error) {
      console.error('Failed to export PDF:', error);
      const errorMessage = 'Gagal membuat PDF: ' + (error instanceof Error ? error.message : 'Unknown error');

      if (Platform.OS === 'web') {
        alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
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

  const getExportIcon = useCallback(() => {
    if (Platform.OS === 'web') {
      return "download";
    } else {
      return "share";
    }
  }, []);

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

  const CustomDateInput = React.forwardRef(({ value, onClick, empty }: any, ref: any) => (
    <TouchableOpacity
      style={[styles.dateInput, { borderColor: theme.colors.outline }]}
      onPress={onClick}
      ref={ref}
    >
      <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
      <Text style={{ color: theme.colors.onSurface }}>{empty ? 'Pilih Tanggal' : value}</Text>
    </TouchableOpacity>
  ));

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
          {Platform.OS === 'web' ? (
            <View style={styles.datePickerWrapper}>
              <DatePicker
                selected={startDate}
                onChange={(date) => handleConfirmDate(date as Date, 'start')}
                customInput={<CustomDateInput value={formatShortDate(startDate)} empty={!startDate} />}
                popperPlacement="bottom-start"
                maxDate={new Date()}
                portalId="date-picker-portal"
                popperProps={{
                  strategy: "fixed"
                }}
              />
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.dateInput, { borderColor: theme.colors.outline }]}
              onPress={() => showDatePicker('start')}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.onSurface }}>{formatShortDate(startDate)}</Text>
            </TouchableOpacity>
          )}
          <Text style={{ color: theme.colors.onSurfaceVariant }}> - </Text>
          {Platform.OS === 'web' ? (
            <View style={styles.datePickerWrapper}>
              <DatePicker
                selected={endDate}
                onChange={(date) => handleConfirmDate(date as Date, 'end')}
                customInput={<CustomDateInput value={formatShortDate(endDate)} empty={!endDate} />}
                popperPlacement="bottom-end"
                minDate={startDate || undefined}
                maxDate={new Date()}
                portalId="date-picker-portal"
                popperProps={{
                  strategy: "fixed"
                }}
              />
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.dateInput, { borderColor: theme.colors.outline }]}
              onPress={() => showDatePicker('end')}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.onSurface }}>{formatShortDate(endDate)}</Text>
            </TouchableOpacity>
          )}
          <IconButton
            icon="refresh"
            size={20}
            iconColor={theme.colors.primary}
            style={styles.resetButton}
            onPress={handleResetPress}
            disabled={loading}
          />
          {canShare && (
            <IconButton
              icon={getExportIcon()}
              size={20}
              iconColor={theme.colors.primary}
              style={styles.resetButton}
              onPress={handleExportPDF}
              disabled={loading || isExporting || filteredLaporan.length === 0}
            />
          )}
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

      {Platform.OS !== 'web' && (
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={(date) => handleConfirmDate(date, datePickerMode)}
          onCancel={hideDatePicker}
          maximumDate={new Date()}
        />
      )}

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

      {/* Portal untuk DatePicker di web */}
      {Platform.OS === 'web' && <div id="date-picker-portal"></div>}
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
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  datePickerWrapper: {
    flex: 1,
    zIndex: 9999, 
    position: 'relative',
  },
  resetButton: { margin: 0, backgroundColor: 'rgba(0, 0, 0, 0.05)' }
});