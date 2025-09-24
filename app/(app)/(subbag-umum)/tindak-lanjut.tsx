import React, { useEffect, useState } from 'react';
import {
    View,
    Alert,
    ScrollView,
    Text,
    StyleSheet,
    RefreshControl,
} from 'react-native';
import {
    Button,
    IconButton,
    Card,
    Chip,
    ActivityIndicator,
    Avatar,
    Badge
} from 'react-native-paper';
import { router, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/context/ThemeContext';
import { getTindakLanjut, Laporan, ApiError } from '@/utils/api';
import { TindakLanjutDialog } from '@/components/laporan/TindakLanjutDialog';

interface TindakLanjutLaporan extends Laporan {
    catatan_disposisi?: string;
    tanggal_disposisi?: string;
    kabbag_umum?: string;
}

export default function TindakLanjutScreen() {
    const router = useRouter();
    const { theme } = useAppTheme();
    const styles = createStyles(theme);

    const [laporan, setLaporan] = useState<TindakLanjutLaporan[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal state
    const [showTindakLanjutModal, setShowTindakLanjutModal] = useState(false);
    const [selectedLaporan, setSelectedLaporan] = useState<TindakLanjutLaporan | null>(null);

    const categories = {
        konsumsi: { label: 'Makan & Minum', icon: 'food', color: theme.colors.secondary },
        kebutuhan: { label: 'Kebutuhan', icon: 'pen', color: theme.colors.primary },
        kerusakan: { label: 'Kerusakan', icon: 'alert-circle', color: theme.colors.error },
        lainnya: { label: 'Lainnya', icon: 'help-circle', color: theme.colors.onSurfaceVariant },
    };

    const statusConfig = {
        diproses: { label: 'Dalam Proses', color: theme.colors.warning, icon: 'clock-outline' },
        ditindaklanjuti: { label: 'Ditindaklanjuti', color: theme.colors.backdrop, icon: 'progress-check' },
        selesai: { label: 'Selesai', color: theme.colors.success, icon: 'check-circle' },
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getTindakLanjut();
            setLaporan(data);
        } catch (error) {
            console.error('Error loading data:', error);
            const errorMessage = error instanceof ApiError ? error.message : 'Gagal memuat data';
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const openTindakLanjutModal = (laporanItem: TindakLanjutLaporan) => {
        setSelectedLaporan(laporanItem);
        setShowTindakLanjutModal(true);
    };

    const closeTindakLanjutModal = () => {
        setShowTindakLanjutModal(false);
        setSelectedLaporan(null);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getCategoryInfo = (kategori: string) => {
        return categories[kategori as keyof typeof categories] || categories.lainnya;
    };

    const getStatusInfo = (status: string) => {
        return statusConfig[status as keyof typeof statusConfig] || statusConfig.diproses;
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();
    };

    const getPriorityLevel = (createdAt: string) => {
        const now = new Date();
        const created = new Date(createdAt);
        const diffHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));

        if (diffHours > 72) return { level: 'high', label: 'Prioritas Tinggi', color: theme.colors.error };
        if (diffHours > 24) return { level: 'medium', label: 'Prioritas Sedang', color: theme.colors.warning };
        return { level: 'normal', label: 'Normal', color: theme.colors.success };
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Memuat daftar laporan...</Text>
            </View>
        );
    }

    const laporanProses = laporan.filter(item => item.status_laporan === 'diproses');
    const laporanDitindaklanjuti = laporan.filter(item => item.status_laporan === 'ditindaklanjuti');

    return (
        <View style={styles.container}>
            {/* Header with Gradient */}
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
                        <Text style={styles.headerTitle}>Tindak Lanjut</Text>
                        <IconButton
                            icon="history"
                            size={24}
                            iconColor="white"
                            onPress={() => router.push('/(app)/(subbag-umum)/riwayat_tindak_lanjut')}
                        />
                    </View>
                    <Text style={styles.headerSubtitle}>
                        Kelola laporan yang menjadi tanggung jawab Anda
                    </Text>
                    <View style={styles.headerStats}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{laporanProses.length}</Text>
                            <Text style={styles.statLabel}>Baru</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{laporanDitindaklanjuti.length}</Text>
                            <Text style={styles.statLabel}>Proses</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[theme.colors.primary]}
                        tintColor={theme.colors.primary}
                    />
                }
            >
                {laporan.length === 0 ? (
                    <Card style={styles.emptyCard} elevation={2}>
                        <Card.Content style={styles.emptyContent}>
                            <IconButton
                                icon="clipboard-text-outline"
                                size={64}
                                iconColor={theme.colors.onSurfaceVariant}
                            />
                            <Text style={styles.emptyTitle}>Tidak Ada Laporan</Text>
                            <Text style={styles.emptyText}>
                                Saat ini tidak ada laporan yang menjadi tanggung jawab Anda
                            </Text>
                        </Card.Content>
                    </Card>
                ) : (
                    <>
                        {/* Laporan Baru (Diproses) */}
                        {laporanProses.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Laporan Baru</Text>
                                    <Badge style={styles.sectionBadge}>{laporanProses.length}</Badge>
                                </View>
                                {laporanProses.map((item) => (
                                    <LaporanCard
                                        key={item.id_laporan}
                                        item={item}
                                        styles={styles}
                                        theme={theme}
                                        categories={categories}
                                        statusConfig={statusConfig}
                                        formatDate={formatDate}
                                        getCategoryInfo={getCategoryInfo}
                                        getStatusInfo={getStatusInfo}
                                        getInitials={getInitials}
                                        getPriorityLevel={getPriorityLevel}
                                        onTindakLanjut={openTindakLanjutModal}
                                    />
                                ))}
                            </View>
                        )}

                        {/* Laporan Dalam Proses */}
                        {laporanDitindaklanjuti.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Sedang Ditindaklanjuti</Text>
                                    <Badge style={styles.sectionBadge}>{laporanDitindaklanjuti.length}</Badge>
                                </View>
                                {laporanDitindaklanjuti.map((item) => (
                                    <LaporanCard
                                        key={item.id_laporan}
                                        item={item}
                                        styles={styles}
                                        theme={theme}
                                        categories={categories}
                                        statusConfig={statusConfig}
                                        formatDate={formatDate}
                                        getCategoryInfo={getCategoryInfo}
                                        getStatusInfo={getStatusInfo}
                                        getInitials={getInitials}
                                        getPriorityLevel={getPriorityLevel}
                                        onTindakLanjut={openTindakLanjutModal}
                                    />
                                ))}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            <TindakLanjutDialog
                visible={showTindakLanjutModal}
                onDismiss={closeTindakLanjutModal}
                laporan={selectedLaporan}
                onSuccess={() => {
                    closeTindakLanjutModal();
                    loadData();
                }}
            />
        </View>
    );
}

interface LaporanCardProps {
    item: TindakLanjutLaporan;
    styles: any;
    theme: any;
    categories: any;
    statusConfig: any;
    formatDate: (date: string) => string;
    getCategoryInfo: (kategori: string) => any;
    getStatusInfo: (status: string) => any;
    getInitials: (name: string) => string;
    getPriorityLevel: (createdAt: string) => any;
    onTindakLanjut: (item: TindakLanjutLaporan) => void;
}

function LaporanCard({
    item,
    styles,
    theme,
    formatDate,
    getCategoryInfo,
    getStatusInfo,
    getInitials,
    getPriorityLevel,
    onTindakLanjut
}: LaporanCardProps) {
    const router = useRouter();
    const categoryInfo = getCategoryInfo(item.kategori || 'lainnya');
    const statusInfo = getStatusInfo(item.status_laporan);
    const priority = getPriorityLevel(item.created_at);

    const getChipBackgroundColor = (color: string) => {
        if (color.startsWith('rgba')) {
            return color;
        }
        return color + '20';
    };

    return (
        <Card style={styles.laporanCard} elevation={3}>
            <Card.Content style={styles.laporanContent}>
                {/* Header Laporan */}
                <View style={styles.laporanHeader}>
                    <View style={styles.laporanInfo}>
                        <View style={styles.categoryChip}>
                            <IconButton
                                icon={categoryInfo.icon}
                                size={16}
                                iconColor={categoryInfo.color}
                                style={styles.categoryIcon}
                            />
                            <Text style={[styles.categoryText, { color: categoryInfo.color }]}>
                                {categoryInfo.label}
                            </Text>
                        </View>
                        <Text style={styles.dateText}>
                            {formatDate(item.created_at)}
                        </Text>
                    </View>
                    <View style={styles.headerChips}>
                        <Chip
                            mode="flat"
                            style={[styles.statusChip, { backgroundColor: getChipBackgroundColor(statusInfo.color) }]}
                            textStyle={[styles.statusText, { color: statusInfo.color }]}
                            icon={statusInfo.icon}
                        >
                            {statusInfo.label}
                        </Chip>
                        {priority.level !== 'normal' && (
                            <Chip
                                mode="flat"
                                style={[styles.priorityChip, { backgroundColor: getChipBackgroundColor(priority.color) }]}
                                textStyle={[styles.priorityText, { color: priority.color }]}
                                icon="flag"
                            >
                                {priority.label}
                            </Chip>
                        )}
                    </View>
                </View>

                {/* Judul Laporan */}
                <Text style={styles.judulLaporan} numberOfLines={2}>
                    {item.judul_laporan}
                </Text>

                {/* Isi Laporan */}
                <Text style={styles.isiLaporan} numberOfLines={3}>
                    {item.isi_laporan}
                </Text>

                {/* Catatan Disposisi */}
                {item.catatan_disposisi && (
                    <View style={styles.disposisiInfo}>
                        <Text style={styles.disposisiLabel}>Catatan Disposisi:</Text>
                        <Text style={styles.disposisiText} numberOfLines={2}>
                            {item.catatan_disposisi}
                        </Text>
                        {item.kabbag_umum && (
                            <Text style={styles.disposisiBy}>
                                — {item.kabbag_umum} ({formatDate(item.tanggal_disposisi || '')})
                            </Text>
                        )}
                    </View>
                )}

                {/* Pelapor Info */}
                <View style={styles.pelaporInfo}>
                    <Avatar.Text
                        size={32}
                        label={getInitials(item.pelapor)}
                        style={styles.pelaporAvatar}
                        labelStyle={styles.pelaporAvatarLabel}
                    />
                    <View style={styles.pelaporDetails}>
                        <Text style={styles.pelaporNama}>{item.pelapor}</Text>
                        <Text style={styles.pelaporNiP}>NIP: {item.nip_pelapor}</Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <Button
                        mode="contained"
                        onPress={() => onTindakLanjut(item)}
                        style={styles.tindakLanjutButton}
                        contentStyle={styles.buttonContent}
                        buttonColor={theme.colors.primary}
                        icon={item.status_laporan === 'diproses' ? 'play' : 'pencil'}
                    >
                        {item.status_laporan === 'diproses' ? 'Mulai Tindak Lanjut' : 'Update Progress'}
                    </Button>
                    <IconButton
                        icon="information-outline"
                        size={20}
                        iconColor={theme.colors.onSurfaceVariant}
                        onPress={() => router.push({ pathname: '/modal', params: { id_laporan: item.id_laporan } })}
                        style={styles.infoButton}
                    />
                </View>
            </Card.Content>
        </Card>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: theme.colors.onSurfaceVariant,
    },

    // Header Styles
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
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
    },
    headerStats: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignSelf: 'center',
        marginTop: 8,
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    statNumber: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    statLabel: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },

    // Scroll Styles
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 100,
    },

    // Section Styles
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.onSurface,
    },
    sectionBadge: {
        backgroundColor: theme.colors.primary,
        color: 'white',
    },

    // Empty State
    emptyCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        marginTop: 40,
    },
    emptyContent: {
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.onSurface,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: theme.colors.onSurfaceVariant,
        textAlign: 'center',
        lineHeight: 20,
    },

    // Laporan Card Styles
    laporanCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        marginBottom: 16,
    },
    laporanContent: {
        padding: 20,
    },
    laporanHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    laporanInfo: {
        flex: 1,
        gap: 4,
    },
    headerChips: {
        gap: 8,
        alignItems: 'flex-end',
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primaryContainer,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    categoryIcon: {
        margin: 0,
        marginRight: 4,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
    },
    dateText: {
        fontSize: 12,
        color: theme.colors.onSurfaceVariant,
    },
    statusChip: {
        height: 28,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    priorityChip: {
        height: 24,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: '600',
    },
    judulLaporan: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.onSurface,
        marginBottom: 8,
        lineHeight: 22,
    },
    isiLaporan: {
        fontSize: 14,
        color: theme.colors.onSurfaceVariant,
        lineHeight: 20,
        marginBottom: 16,
    },
    disposisiInfo: {
        backgroundColor: theme.colors.secondaryContainer,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    disposisiLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.onSecondaryContainer,
        marginBottom: 4,
    },
    disposisiText: {
        fontSize: 13,
        color: theme.colors.onSecondaryContainer,
        fontStyle: 'italic',
        lineHeight: 18,
        marginBottom: 4,
    },
    disposisiBy: {
        fontSize: 11,
        color: theme.colors.onSecondaryContainer,
        opacity: 0.7,
    },
    pelaporInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    pelaporAvatar: {
        backgroundColor: theme.colors.primary,
    },
    pelaporAvatarLabel: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    pelaporDetails: {
        flex: 1,
    },
    pelaporNama: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.onSurface,
    },
    pelaporNip: {
        fontSize: 12,
        color: theme.colors.onSurfaceVariant,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    tindakLanjutButton: {
        flex: 1,
        borderRadius: 12,
    },
    infoButton: {
        backgroundColor: theme.colors.surfaceVariant,
        margin: 0,
    },
    buttonContent: {
        paddingVertical: 6,
    },
});