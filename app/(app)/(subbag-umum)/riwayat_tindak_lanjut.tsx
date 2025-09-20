import React, { useState, useEffect, useCallback, useMemo, JSX } from 'react';
import { StyleSheet, View, FlatList, RefreshControl } from 'react-native';
import {
    ActivityIndicator,
    Card,
    Text,
    Appbar,
    Searchbar,
    Chip,
} from 'react-native-paper';
import { useAppTheme } from '@/context/ThemeContext';
import { useRouter, Stack } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

import * as api from '@/utils/api';
import type { Laporan, DisposisiHistory, TindakLanjutHistory } from '@/utils/api';

import { DetailDisposisiDialog } from '@/components/laporan/DetailRiwayatDisposisi';

export default function RiwayatTindakLanjutScreen(): JSX.Element {
    const { theme } = useAppTheme();
    const router = useRouter();
    const styles = createStyles(theme);

    const [laporanList, setLaporanList] = useState<Laporan[]>([]);
    const [selectedLaporan, setSelectedLaporan] = useState<Laporan | null>(null);
    const [disposisiHistory, setDisposisiHistory] = useState<DisposisiHistory[]>([]);
    const [tindakLanjutHistory, setTindakLanjutHistory] = useState<TindakLanjutHistory[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isDetailVisible, setDetailVisible] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');

    const fetchRiwayat = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            // Fetches all reports relevant to the user, then we filter for completed ones.
            const data = await api.getLaporan(); 
            const historyLaporan = data.filter(
                (l: Laporan) => l.status_laporan === 'selesai'
            );
            setLaporanList(historyLaporan);
        } catch (error) {
            const errorMessage = error instanceof api.ApiError ? error.message : 'Gagal memuat riwayat tindak lanjut.';
            console.error('Error fetching riwayat:', error);
            // You can add a snackbar here if you have one
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchRiwayat();
    }, [fetchRiwayat]);

    const filteredData = useMemo(() => {
        let result = laporanList;
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(laporan =>
                laporan.judul_laporan.toLowerCase().includes(query) ||
                laporan.isi_laporan.toLowerCase().includes(query) ||
                laporan.pelapor.toLowerCase().includes(query)
            );
        }
        return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [laporanList, searchQuery]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchRiwayat();
    }, [fetchRiwayat]);

    const getStatusColor = useCallback((status: string): string => {
        if (status === 'selesai') return '#4CAF50';
        return theme.colors.outline;
    }, [theme.colors]);

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

    const renderLaporanItem = useCallback(({ item }: { item: Laporan }): JSX.Element => (
        <Card style={styles.card} onPress={() => openDetail(item)}>
            <Card.Title
                title={item.judul_laporan}
                subtitle={`${formatDate(item.created_at)}`}
                titleStyle={styles.cardTitle}
                subtitleStyle={styles.cardSubtitle}
                right={(props) => (
                    <View style={styles.cardRightContainer}>
                        <Chip
                            {...props}
                            mode="flat"
                            icon="check-circle"
                            style={[styles.statusChip, { backgroundColor: `${getStatusColor(item.status_laporan)}15` }]}
                            textStyle={{ color: getStatusColor(item.status_laporan), fontSize: 11, fontFamily: 'RubikMedium' }}
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
                    <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>Pelapor:</Text>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.colors.onSurface }}>{item.pelapor}</Text>
                </View>
            </Card.Content>
        </Card>
    ), [openDetail, formatDate, getStatusColor, theme]);

    const renderEmptyState = useCallback(() => (
        <View style={styles.centered}>
            <Text variant="headlineSmall" style={[styles.emptyTitle, { color: theme.colors.onSurfaceVariant }]}>
                {searchQuery ? 'Tidak ada riwayat ditemukan' : 'Belum ada riwayat'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
                {searchQuery ? 'Coba ubah kata kunci pencarian' : 'Riwayat laporan yang telah selesai akan muncul di sini.'}
            </Text>
        </View>
    ), [theme.colors, searchQuery]);

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <Stack.Screen options={{ title: 'Riwayat Tindak Lanjut' }} />
                <Appbar.Header>
                    <Appbar.BackAction onPress={() => router.back()} />
                    <Appbar.Content title="Riwayat Tindak Lanjut" titleStyle={styles.appbarTitle} />
                </Appbar.Header>
                <View style={styles.centered}>
                    <ActivityIndicator animating size="large" />
                    <Text style={{ marginTop: 16, color: theme.colors.onSurfaceVariant }}>
                        Memuat riwayat...
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Stack.Screen options={{ title: 'Riwayat Tindak Lanjut' }} />
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title="Riwayat Tindak Lanjut" titleStyle={styles.appbarTitle} />
                <Appbar.Action icon="refresh" onPress={onRefresh} />
            </Appbar.Header>

            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder="Cari riwayat laporan..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    inputStyle={{ fontSize: 14 }}
                />
            </View>

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
                <DetailDisposisiDialog
                    visible={isDetailVisible}
                    laporan={selectedLaporan}
                    disposisiHistory={disposisiHistory}
                    tindakLanjutHistory={tindakLanjutHistory}
                    loading={loadingDetail}
                    onDismiss={closeDetail}
                    getStatusColor={getStatusColor}
                    formatDate={formatDate}
                />
            )}
        </View>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    searchContainer: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: theme.colors.background },
    searchBar: { elevation: 1, backgroundColor: theme.colors.surface },
    listContent: { padding: 16, paddingBottom: 100 },
    emptyListContent: { flexGrow: 1 },
    card: { marginBottom: 12, elevation: 2, backgroundColor: theme.colors.surface },
    cardTitle: { fontFamily: 'RubikBold', fontSize: 16 },
    cardSubtitle: { fontSize: 12, opacity: 0.7 },
    cardRightContainer: { paddingRight: 8 },
    statusChip: { height: 30, borderWidth: 1, borderStyle: 'dashed' },
    cardContent: { lineHeight: 20, opacity: 0.8 },
    appbarTitle: { fontFamily: 'RubikBold' },
    emptyTitle: { fontFamily: 'RubikBold', textAlign: 'center', marginBottom: 8 },
    emptySubtitle: { textAlign: 'center', lineHeight: 20 },
});