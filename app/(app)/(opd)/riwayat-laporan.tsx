
import React, { useState, useEffect, useCallback, useMemo, JSX } from 'react';
import { StyleSheet, View, FlatList, RefreshControl, Alert } from 'react-native';
import {
    ActivityIndicator,
    Button,
    Card,
    Text,
    Appbar,
    Searchbar,
    Snackbar,
    Chip,
    FAB,
    Surface,
} from 'react-native-paper';
import { useAppTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

import * as api from '@/utils/api';
import type { Laporan, DisposisiHistory, TindakLanjutHistory } from '@/utils/api';

import { DetailLaporanDialog } from '@/components/laporan/DetailLaporanDialog';
import { EditLaporanDialog } from '@/components/laporan/EditLaporanDialog';

interface SnackbarState {
    visible: boolean;
    message: string;
    type?: 'success' | 'error' | 'info';
}

type StatusFilter = 'semua' | 'diajukan' | 'diproses' | 'ditolak' | 'ditindaklanjuti' | 'selesai';

export default function RiwayatLaporanScreen(): JSX.Element {
    const { theme } = useAppTheme();
    const router = useRouter();

    const [laporanList, setLaporanList] = useState<Laporan[]>([]);
    const [selectedLaporan, setSelectedLaporan] = useState<Laporan | null>(null);
    const [disposisiHistory, setDisposisiHistory] = useState<DisposisiHistory[]>([]);
    const [tindakLanjutHistory, setTindakLanjutHistory] = useState<TindakLanjutHistory[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isDetailVisible, setDetailVisible] = useState(false);
    const [isEditVisible, setEditVisible] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [isSubmittingEdit, setSubmittingEdit] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('semua');

    const [snackbar, setSnackbar] = useState<SnackbarState>({ visible: false, message: '' });

    const statusOptions: Array<{ value: StatusFilter; label: string; color: string }> = [
        { value: 'semua', label: 'Semua Status', color: theme.colors.outline },
        { value: 'diajukan', label: 'Diajukan', color: theme.colors.primary },
        { value: 'diproses', label: 'Diproses', color: '#FF9800' },
        { value: 'ditolak', label: 'Ditolak', color: theme.colors.error },
        { value: 'ditindaklanjuti', label: 'Ditindaklanjuti', color: '#2196F3' },
        { value: 'selesai', label: 'Selesai', color: '#4CAF50' },
    ];

    const fetchLaporan = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            const data = await api.getLaporan();
            setLaporanList(data);
        } catch (error) {
            const errorMessage = error instanceof api.ApiError ? error.message : 'Gagal memuat riwayat laporan.';
            setSnackbar({ visible: true, message: errorMessage, type: 'error' });
            console.error('Error fetching laporan:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchLaporan();
    }, [fetchLaporan]);

    const filteredData = useMemo(() => {
        let result = laporanList;
        if (statusFilter !== 'semua') {
            result = result.filter(laporan => laporan.status_laporan === statusFilter);
        }
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(laporan =>
                laporan.judul_laporan.toLowerCase().includes(query) ||
                laporan.isi_laporan.toLowerCase().includes(query) ||
                (laporan.kategori && laporan.kategori.toLowerCase().includes(query))
            );
        }
        return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [laporanList, statusFilter, searchQuery]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchLaporan();
    }, [fetchLaporan]);

    const getStatusColor = useCallback((status: string): string => {
        return statusOptions.find(opt => opt.value === status)?.color || theme.colors.outline;
    }, [statusOptions, theme.colors]);

    const formatDate = useCallback((dateString: string): string => {
        try {
            return format(parseISO(dateString), 'd MMM yyyy, HH:mm', { locale: id });
        } catch {
            return dateString;
        }
    }, []);

    const openDetail = useCallback(async (laporan: Laporan): Promise<void> => {
        setSelectedLaporan(laporan);
        setDetailVisible(true);
        setLoadingDetail(true);
        try {
            const [disposisi, tindakLanjut] = await Promise.all([
                api.getDisposisiHistory(laporan.id_laporan.toString()).catch(() => []),
                api.getTindakLanjutHistory(laporan.id_laporan.toString()).catch(() => [])
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

    const openEdit = useCallback((laporan: Laporan) => {
        if (laporan.status_laporan !== 'diajukan') {
            Alert.alert('Tidak Dapat Mengedit', 'Laporan hanya dapat diedit jika status masih "Diajukan".');
            return;
        }
        setDetailVisible(false);
        setEditVisible(true);
    }, []);

    const closeEdit = useCallback(() => {
        setEditVisible(false);
    }, []);

    const handleSubmitEdit = useCallback(async (editForm: { judul_laporan: string; isi_laporan: string; kategori: string }) => {
        if (!selectedLaporan) return;

        setSubmittingEdit(true);
        try {
            const updateData = {
                judul_laporan: editForm.judul_laporan.trim(),
                isi_laporan: editForm.isi_laporan.trim(),
                kategori: editForm.kategori.trim() || undefined,
            };
            // `partialUpdate` kemungkinan tidak memiliki semua field, misal: id_laporan, status_laporan
            const partialUpdate = await api.updateLaporan(selectedLaporan.id_laporan.toString(), updateData);

            setSnackbar({ visible: true, message: 'Laporan berhasil diperbarui', type: 'success' });

            // Gabungkan data lama dengan data baru untuk mendapatkan objek yang utuh
            const updatedLaporan = { ...selectedLaporan, ...partialUpdate };

            // Perbarui daftar laporan di state dengan objek yang sudah digabung
            setLaporanList(prevList =>
                prevList.map(l => (l.id_laporan === updatedLaporan.id_laporan ? updatedLaporan : l))
            );

            closeEdit(); // Tutup modal edit

            // Buka kembali tampilan detail dengan data yang baru dan utuh
            await openDetail(updatedLaporan);

        } catch (error) {
            const errorMessage = error instanceof api.ApiError ? error.message : 'Gagal memperbarui laporan';
            setSnackbar({ visible: true, message: errorMessage, type: 'error' });
            console.error('Error updating laporan:', error);
        } finally {
            setSubmittingEdit(false);
        }
    }, [selectedLaporan, closeEdit, openDetail]);

    const handleDelete = useCallback((laporan: Laporan) => {
        if (laporan.status_laporan !== 'diajukan') {
            Alert.alert('Tidak Dapat Menghapus', 'Laporan hanya dapat dihapus jika status masih "Diajukan".');
            return;
        }
        Alert.alert(
            'Konfirmasi Hapus',
            `Apakah Anda yakin ingin menghapus laporan "${laporan.judul_laporan}"?`,
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.deleteLaporan(laporan.id_laporan.toString());
                            setSnackbar({ visible: true, message: 'Laporan berhasil dihapus', type: 'success' });
                            closeDetail();
                            onRefresh();
                        } catch (error) {
                            const errorMessage = error instanceof api.ApiError ? error.message : 'Gagal menghapus laporan';
                            setSnackbar({ visible: true, message: errorMessage, type: 'error' });
                        }
                    }
                }
            ]
        );
    }, [closeDetail, onRefresh]);

    const renderLaporanItem = useCallback(({ item }: { item: Laporan }): JSX.Element => (
        <Card style={styles.card} onPress={() => openDetail(item)}>
            <Card.Title
                title={item.judul_laporan}
                subtitle={`${formatDate(item.created_at)}${item.kategori ? ` • ${item.kategori}` : ''}`}
                titleStyle={styles.cardTitle}
                subtitleStyle={styles.cardSubtitle}
                right={(props) => (
                    <View style={styles.cardRightContainer}>
                        <Chip
                            {...props}
                            mode="flat"
                            style={[styles.statusChip, {
                                backgroundColor: `${getStatusColor(item.status_laporan)}15`,
                                borderColor: getStatusColor(item.status_laporan)
                            }]}
                            textStyle={{
                                color: getStatusColor(item.status_laporan),
                                fontSize: 11,
                                fontFamily: 'RubikMedium'
                            }}
                        >
                            {item.status_laporan.toUpperCase()}
                        </Chip>
                    </View>
                )}
            />
            <Card.Content>
                <Text variant="bodyMedium" numberOfLines={2} style={styles.cardContent}>
                    {item.isi_laporan}
                </Text>
                {item.lampiran && (
                    <Chip icon="paperclip" mode="outlined" style={styles.attachmentChip} textStyle={{ fontSize: 11 }}>
                        Lampiran
                    </Chip>
                )}
            </Card.Content>
        </Card>
    ), [openDetail, formatDate, getStatusColor]);

    const renderEmptyState = useCallback(() => (
        <View style={styles.centered}>
            <Text variant="headlineSmall" style={[styles.emptyTitle, { color: theme.colors.onSurfaceVariant }]}>
                {searchQuery || statusFilter !== 'semua' ? 'Tidak ada laporan ditemukan' : 'Belum ada laporan'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
                {searchQuery || statusFilter !== 'semua' ? 'Coba ubah filter atau kata kunci pencarian' : 'Buat laporan pertama Anda dengan menekan tombol +'}
            </Text>
            {!searchQuery && statusFilter === 'semua' && (
                <Button mode="contained" onPress={() => router.push('/(app)/(pegawai)/buat-laporan')} style={styles.createButton} icon="plus">
                    Buat Laporan
                </Button>
            )}
        </View>
    ), [theme.colors, searchQuery, statusFilter, router]);

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <Appbar.Header>
                    <Appbar.BackAction onPress={() => router.back()} />
                    <Appbar.Content title="Riwayat Laporan" titleStyle={styles.appbarTitle} />
                </Appbar.Header>
                <View style={styles.centered}>
                    <ActivityIndicator animating size="large" />
                    <Text style={{ marginTop: 16, color: theme.colors.onSurfaceVariant }}>
                        Memuat riwayat laporan...
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title="Riwayat Laporan" titleStyle={styles.appbarTitle} />
                <Appbar.Action icon="refresh" onPress={onRefresh} />
            </Appbar.Header>

            <Surface style={styles.searchContainer} elevation={1}>
                <Searchbar
                    placeholder="Cari laporan..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    inputStyle={{ fontSize: 14 }}
                />
            </Surface>

            <Surface style={styles.filterContainer} elevation={0}>
                <FlatList
                    data={statusOptions}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.value}
                    contentContainerStyle={styles.filterList}
                    renderItem={({ item }) => (
                        <Chip
                            selected={statusFilter === item.value}
                            onPress={() => setStatusFilter(item.value)}
                            mode={statusFilter === item.value ? 'flat' : 'outlined'}
                            style={[styles.filterChip, statusFilter === item.value && { backgroundColor: `${item.color}15`, borderColor: item.color }]}
                            textStyle={[{ fontSize: 12 }, statusFilter === item.value && { color: item.color, fontFamily: 'RubikMedium' }]}
                        >
                            {item.label}
                        </Chip>
                    )}
                />
            </Surface>

            {(searchQuery || statusFilter !== 'semua') && (
                <View style={styles.resultContainer}>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Ditemukan {filteredData.length} laporan
                    </Text>
                    <Button
                        mode="text"
                        onPress={() => {
                            setSearchQuery('');
                            setStatusFilter('semua');
                        }}
                    >
                        Reset Filter
                    </Button>
                </View>
            )}

            <FlatList
                data={filteredData}
                keyExtractor={(item) => item.id_laporan.toString()}
                renderItem={renderLaporanItem}
                contentContainerStyle={[styles.listContent, filteredData.length === 0 && styles.emptyListContent]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
                ListEmptyComponent={renderEmptyState}
                showsVerticalScrollIndicator={false}
            />

            {selectedLaporan && (
                <DetailLaporanDialog
                    visible={isDetailVisible}
                    laporan={selectedLaporan}
                    disposisiHistory={disposisiHistory}
                    tindakLanjutHistory={tindakLanjutHistory}
                    loading={loadingDetail}
                    onDismiss={closeDetail}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    getStatusColor={getStatusColor}
                    formatDate={formatDate}
                />
            )}

            {isEditVisible && selectedLaporan && (
                 <EditLaporanDialog
                    visible={isEditVisible}
                    onDismiss={closeEdit}
                    initialData={{
                        judul_laporan: selectedLaporan.judul_laporan,
                        isi_laporan: selectedLaporan.isi_laporan,
                        kategori: selectedLaporan.kategori || '',
                    }}
                    isSubmitting={isSubmittingEdit}
                    onSubmit={handleSubmitEdit}
                />
            )}

            <Snackbar
                visible={snackbar.visible}
                onDismiss={() => setSnackbar(prev => ({ ...prev, visible: false }))}
                duration={4000}
                style={[
                    styles.snackbar,
                    snackbar.type === 'error' && { backgroundColor: theme.colors.errorContainer },
                    snackbar.type === 'success' && { backgroundColor: theme.colors.primaryContainer },
                ]}
            >
                {snackbar.message}
            </Snackbar>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    searchContainer: { paddingHorizontal: 16, paddingVertical: 8 },
    searchBar: { elevation: 0 },
    filterContainer: { paddingVertical: 8 },
    filterList: { paddingHorizontal: 16, gap: 8 },
    filterChip: { marginRight: 8 },
    resultContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
    listContent: { padding: 16, paddingBottom: 100 },
    emptyListContent: { flexGrow: 1 },
    card: { marginBottom: 12, elevation: 2 },
    cardTitle: { fontFamily: 'RubikBold', fontSize: 16 },
    cardSubtitle: { fontSize: 12, opacity: 0.7 },
    cardRightContainer: { paddingRight: 8 },
    statusChip: { height: 30 },
    cardContent: { lineHeight: 20, opacity: 0.8 },
    attachmentChip: { alignSelf: 'flex-start', marginTop: 4, height: 30 },
    appbarTitle: { fontFamily: 'RubikBold' },
    emptyTitle: { fontFamily: 'RubikBold', textAlign: 'center', marginBottom: 8 },
    emptySubtitle: { textAlign: 'center', lineHeight: 20 },
    createButton: { marginTop: 24 },
    snackbar: { marginBottom: 16, marginHorizontal: 16 },
});
