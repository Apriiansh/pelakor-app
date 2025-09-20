import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, Alert, Image, Linking, TouchableOpacity } from 'react-native';
import { Appbar, ActivityIndicator, Text, Card, Divider, Chip, Surface, Button } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';
import * as api from '@/utils/api';
import type { Laporan, DisposisiHistory, TindakLanjutHistory } from '@/utils/api';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

export default function ModalScreen() {
    const { id_laporan } = useLocalSearchParams<{ id_laporan: string }>();
    const router = useRouter();
    const { theme } = useAppTheme();
    const styles = createStyles(theme);

    const [laporan, setLaporan] = useState<Laporan | null>(null);
    const [disposisiHistory, setDisposisiHistory] = useState<DisposisiHistory[]>([]);
    const [tindakLanjutHistory, setTindakLanjutHistory] = useState<TindakLanjutHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        if (!id_laporan) return;
        setLoading(true);
        try {
            const [laporanData, disposisiData, tindakLanjutData] = await Promise.all([
                api.getLaporanDetail(id_laporan),
                api.getDisposisiHistory(id_laporan).catch(() => []),
                api.getTindakLanjutHistory(id_laporan).catch(() => [])
            ]);
            setLaporan(laporanData);
            setDisposisiHistory(disposisiData);
            setTindakLanjutHistory(tindakLanjutData);
        } catch (error) {
            const errorMessage = error instanceof api.ApiError ? error.message : 'Gagal memuat detail laporan.';
            Alert.alert('Error', errorMessage);
            console.error('Error fetching details:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id_laporan]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const formatDate = (dateString: string): string => {
        try {
            return format(parseISO(dateString), 'd MMMM yyyy, HH:mm', { locale: id });
        } catch {
            return dateString;
        }
    };

    const getStatusInfo = (status: string) => {
        const config: { [key: string]: { color: string, icon: string } } = {
            diajukan: { color: theme.colors.backdrop, icon: 'file-upload-outline' },
            diproses: { color: theme.colors.warning, icon: 'clock-outline' },
            ditolak: { color: theme.colors.error, icon: 'close-circle-outline' },
            ditindaklanjuti: { color: theme.colors.backdrop, icon: 'progress-check' },
            selesai: { color: theme.colors.success, icon: 'check-circle-outline' },
        };
        return config[status] || { color: theme.colors.outline, icon: 'help-circle-outline' };
    };

    const getChipBackgroundColor = (color: string) => {
        if (color.startsWith('rgba')) {
            return color;
        }
        return color + '20';
    };

    const handleOpenAttachment = async (url: string | null) => {
        if (!url) return;
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Error', `Tidak dapat membuka URL: ${url}`);
            }
        } catch (error) {
            Alert.alert('Error', 'Gagal membuka lampiran.');
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator animating={true} size="large" />
                <Text style={styles.loadingText}>Memuat Detail Laporan...</Text>
            </View>
        );
    }

    if (!laporan) {
        return (
            <View style={styles.centered}>
                <Text>Laporan tidak ditemukan.</Text>
                <Button onPress={() => router.back()}>Kembali</Button>
            </View>
        );
    }

    const statusInfo = getStatusInfo(laporan.status_laporan);
    const fullAttachmentUrl = api.getFileUrl(laporan.lampiran);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: `Laporan #${laporan.id_laporan}` }} />
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title={`Laporan #${laporan.id_laporan}`} subtitle={laporan.kategori} titleStyle={styles.appbarTitle} />
            </Appbar.Header>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <Card style={styles.card}>
                    <Card.Title 
                        title={laporan.judul_laporan}
                        titleNumberOfLines={3}
                        titleStyle={styles.cardTitle}
                        subtitle={`Oleh: ${laporan.pelapor} • ${formatDate(laporan.created_at)}`}
                        subtitleStyle={styles.cardSubtitle}
                    />
                    <Card.Content>
                        <Chip icon={statusInfo.icon} style={[styles.statusChip, { backgroundColor: getChipBackgroundColor(statusInfo.color) }]} textStyle={{ color: statusInfo.color }}>
                            Status: {laporan.status_laporan}
                        </Chip>
                        <Divider style={styles.divider} />
                        <Text style={styles.contentBody}>{laporan.isi_laporan}</Text>
                    </Card.Content>
                </Card>

                {fullAttachmentUrl && (
                    <Card style={styles.card}>
                        <Card.Content>
                            <Text style={styles.sectionTitle}>Lampiran</Text>
                            <TouchableOpacity onPress={() => handleOpenAttachment(fullAttachmentUrl)}>
                                <Image source={{ uri: fullAttachmentUrl }} style={styles.lampiranImage} resizeMode="cover" />
                            </TouchableOpacity>
                        </Card.Content>
                    </Card>
                )}

                {disposisiHistory.length > 0 && (
                    <Card style={styles.card}>
                        <Card.Content>
                            <Text style={styles.sectionTitle}>Riwayat Disposisi</Text>
                            {disposisiHistory.map((item, index) => (
                                <Surface key={index} style={styles.historyItem} elevation={1}>
                                    <Text style={styles.historyDate}>{formatDate(item.created_at)}</Text>
                                    <Text style={styles.historyText}><Text style={styles.boldText}>{item.kabbag_umum}</Text> mendisposisikan ke <Text style={styles.boldText}>{item.penanggung_jawab || 'Sub Bagian Umum'}</Text></Text>
                                    {item.catatan_disposisi && <Text style={styles.historyCatatan}>Catatan: {item.catatan_disposisi}</Text>}
                                </Surface>
                            ))}
                        </Card.Content>
                    </Card>
                )}

                {tindakLanjutHistory.length > 0 && (
                     <Card style={styles.card}>
                        <Card.Content>
                            <Text style={styles.sectionTitle}>Riwayat Tindak Lanjut</Text>
                            {tindakLanjutHistory.map((item, index) => (
                                <Surface key={index} style={styles.historyItem} elevation={1}>
                                    <Text style={styles.historyDate}>{formatDate(item.created_at)}</Text>
                                    <Text style={styles.historyText}><Text style={styles.boldText}>{item.penindak}</Text> ({item.jabatan})</Text>
                                    <Chip style={[styles.statusChip, { backgroundColor: getChipBackgroundColor(getStatusInfo(item.status_tindak_lanjut).color), alignSelf: 'flex-start' }]} textStyle={{ color: getStatusInfo(item.status_tindak_lanjut).color }}>
                                        {item.status_tindak_lanjut}
                                    </Chip>
                                    {item.catatan_tindak_lanjut && <Text style={styles.historyCatatan}>Catatan: {item.catatan_tindak_lanjut}</Text>}
                                    {item.lampiran && <Button icon="attachment" onPress={() => handleOpenAttachment(api.getFileUrl(item.lampiran))}>Lihat Lampiran</Button>}
                                </Surface>
                            ))}
                        </Card.Content>
                    </Card>
                )}
            </ScrollView>
        </View>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: theme.colors.background },
    loadingText: { marginTop: 16, fontSize: 16, color: theme.colors.onSurfaceVariant },
    appbarTitle: { fontFamily: 'RubikBold' },
    scrollContent: { padding: 16, paddingBottom: 100 },
    card: { marginBottom: 16, backgroundColor: theme.colors.surface },
    cardTitle: { fontFamily: 'RubikBold', fontSize: 20, lineHeight: 28 },
    cardSubtitle: { fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 4 },
    statusChip: { marginTop: 16, alignSelf: 'flex-start' },
    divider: { marginVertical: 16 },
    contentBody: { fontSize: 16, lineHeight: 24, color: theme.colors.onSurface },
    sectionTitle: { fontSize: 18, fontFamily: 'RubikBold', marginBottom: 12, color: theme.colors.onSurface },
    lampiranImage: { width: '100%', height: 200, borderRadius: 8, backgroundColor: theme.colors.surfaceVariant },
    historyItem: { padding: 12, marginBottom: 8, borderRadius: 8, backgroundColor: theme.colors.background },
    historyDate: { opacity: 0.7, marginBottom: 4, fontSize: 12 },
    historyText: { marginBottom: 4, fontSize: 14, lineHeight: 20 },
    historyCatatan: { fontStyle: 'italic', lineHeight: 18, marginTop: 4, color: theme.colors.onSurfaceVariant },
    boldText: { fontFamily: 'RubikBold' },
});
