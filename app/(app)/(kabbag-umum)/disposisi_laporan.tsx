
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
    Avatar
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/context/ThemeContext';
import { getLaporanDiajukan, getSubbagUmum, Laporan, User, ApiError } from '@/utils/api';
import { DisposisiDialog } from '@/components/laporan/DisposisiDialog';

export default function DisposisiScreen() {
    const router = useRouter();
    const { theme } = useAppTheme();
    const styles = createStyles(theme);

    const [laporan, setLaporan] = useState<Laporan[]>([]);
    const [subbagUsers, setSubbagUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal state
    const [showDisposisiModal, setShowDisposisiModal] = useState(false);
    const [selectedLaporan, setSelectedLaporan] = useState<Laporan | null>(null);

    const categories = {
        konsumsi: { label: 'Makan & Minum', icon: 'food', color: theme.colors.secondary },
        kebutuhan: { label: 'Kebutuhan', icon: 'pen', color: theme.colors.primary },
        kerusakan: { label: 'Kerusakan', icon: 'alert-circle', color: theme.colors.error },
        lainnya: { label: 'Lainnya', icon: 'help-circle', color: theme.colors.onSurfaceVariant },
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [laporanData, subbagData] = await Promise.all([
                getLaporanDiajukan(),
                getSubbagUmum()
            ]);
            setLaporan(laporanData);
            setSubbagUsers(subbagData);
        } catch (error) {
            console.error('Error loading data:', error);
            const errorMessage = error instanceof ApiError ? error.message : 'Gagal memuat data';
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const loadLaporanDisposisi = async () => {
        try {
            const data = await getLaporanDiajukan();
            setLaporan(data);
        } catch (error) {
            console.error('Error loading laporan:', error);
            const errorMessage = error instanceof ApiError ? error.message : 'Gagal memuat laporan';
            Alert.alert('Error', errorMessage);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const openDisposisiModal = (laporanItem: Laporan) => {
        setSelectedLaporan(laporanItem);
        setShowDisposisiModal(true);
    };

    const closeDisposisiModal = () => {
        setShowDisposisiModal(false);
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

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Memuat data laporan...</Text>
            </View>
        );
    }

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
                        <Text style={styles.headerTitle}>Disposisi Laporan</Text>
                        <IconButton
                            icon="history"
                            size={24}
                            iconColor="white"
                            onPress={() => router.push('/(app)/(kabbag-umum)/riwayat_disposisi')}
                        />
                    </View>
                    <Text style={styles.headerSubtitle}>
                        Kelola dan disposisikan laporan yang masuk
                    </Text>
                    <View style={styles.headerStats}>
                        <Text style={styles.statsText}>
                            {laporan.length} laporan menunggu disposisi
                        </Text>
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
                                icon="clipboard-check"
                                size={64}
                                iconColor={theme.colors.onSurfaceVariant}
                            />
                            <Text style={styles.emptyTitle}>Tidak Ada Laporan</Text>
                            <Text style={styles.emptyText}>
                                Saat ini tidak ada laporan yang menunggu disposisi
                            </Text>
                        </Card.Content>
                    </Card>
                ) : (
                    laporan.map((item) => {
                        const categoryInfo = getCategoryInfo(item.kategori || 'lainnya');
                        return (
                            <Card key={item.id_laporan} style={styles.laporanCard} elevation={3}>
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
                                        <Chip
                                            mode="flat"
                                            style={[styles.statusChip, { backgroundColor: theme.colors.warning + '20' }]}
                                            textStyle={[styles.statusText, { color: theme.colors.warning }]}
                                        >
                                            Menunggu
                                        </Chip>
                                    </View>

                                    {/* Judul Laporan */}
                                    <Text style={styles.judulLaporan} numberOfLines={2}>
                                        {item.judul_laporan}
                                    </Text>

                                    {/* Isi Laporan */}
                                    <Text style={styles.isiLaporan} numberOfLines={3}>
                                        {item.isi_laporan}
                                    </Text>

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
                                            <Text style={styles.pelaporNik}>NIK: {item.nik_pelapor}</Text>
                                        </View>
                                    </View>

                                    {/* Action Buttons */}
                                    <View style={styles.actionButtons}>
                                        <Button
                                            mode="contained"
                                            onPress={() => openDisposisiModal(item)}
                                            style={styles.disposisiButton}
                                            contentStyle={styles.buttonContent}
                                            buttonColor={theme.colors.primary}
                                        >
                                            Disposisi
                                        </Button>
                                    </View>
                                </Card.Content>
                            </Card>
                        );
                    })
                )}
            </ScrollView>

            <DisposisiDialog
                visible={showDisposisiModal}
                onDismiss={closeDisposisiModal}
                laporan={selectedLaporan}
                subbagUsers={subbagUsers}
                onSuccess={() => {
                    closeDisposisiModal();
                    loadLaporanDisposisi();
                }}
            />
        </View>
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
    placeholder: {
        width: 40,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
    },
    headerStats: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignSelf: 'center',
        marginTop: 8,
    },
    statsText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
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
    pelaporNik: {
        fontSize: 12,
        color: theme.colors.onSurfaceVariant,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    disposisiButton: {
        flex: 1,
        borderRadius: 12,
    },
    buttonContent: {
        paddingVertical: 6,
    },
});
