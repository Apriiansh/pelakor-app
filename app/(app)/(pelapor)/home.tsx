import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View, Dimensions, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Avatar, Card, IconButton, Button, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';
import { getLaporan, Laporan, ApiError } from '@/utils/api';

const { width } = Dimensions.get('window');

interface Stats {
    total: number;
    selesai: number;
    proses: number;
    diajukan: number;
}

const initialStats: Stats = {
    total: 0,
    selesai: 0,
    proses: 0,
    diajukan: 0,
};

const quickActions = [
    { title: 'Laporan Baru', icon: 'plus-circle', colorType: 'primary', action: 'create' },
    { title: 'Konsumsi', icon: 'food-apple', colorType: 'green', action: 'template', template: { title: 'Laporan Konsumsi', category: 'konsumsi' } },
    { title: 'Kebutuhan', icon: 'shopping', colorType: 'secondary', action: 'template', template: { title: 'Laporan Kebutuhan', category: 'kebutuhan' } },
    { title: 'Kerusakan', icon: 'wrench', colorType: 'error', action: 'template', template: { title: 'Laporan Kerusakan', category: 'kerusakan' } },
];

export default function PelaporHomeScreen() {
    const [user, setUser] = useState<{ nama: string; jabatan: string; avatar?: string } | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    // State untuk data asli
    const [stats, setStats] = useState<Stats>(initialStats);
    const [recentReports, setRecentReports] = useState<Laporan[]>([]);

    const router = useRouter();
    const { theme } = useAppTheme();

    useEffect(() => {
        const fetchUserData = async () => {
            try { 
                const userData = await AsyncStorage.getItem('userData');
                if (userData) {
                    setUser(JSON.parse(userData));
                }
            } catch (error) {
                console.error("Failed to fetch user data from AsyncStorage", error);
            }
        };

        fetchUserData();
        fetchDashboardData();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const laporanData = await getLaporan();

            // Kalkulasi statistik
            const total = laporanData.length;
            const selesai = laporanData.filter(l => l.status_laporan === 'selesai').length;
            const proses = laporanData.filter(l => ['diproses', 'ditindaklanjuti'].includes(l.status_laporan)).length;
            const diajukan = laporanData.filter(l => l.status_laporan === 'diajukan').length;

            setStats({ total, selesai, proses, diajukan });
            setRecentReports(laporanData.slice(0, 3)); // Ambil 3 laporan terbaru

        } catch (error) {
            const message = error instanceof ApiError ? error.message : "Gagal memuat data dashboard";
            Alert.alert('Error', message);
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchDashboardData();
            setRefreshing(false);
    }, [fetchDashboardData]);

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Selamat Pagi';
        if (hour < 17) return 'Selamat Siang';
        if (hour < 20) return 'Selamat Sore';
        return 'Selamat Malam';
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('id-ID', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const getColorByType = (colorType: string) => {
        switch (colorType) {
            case 'primary': return theme.colors.primary;
            case 'secondary': return theme.colors.secondary;
            case 'green': return theme.colors.success;
            case 'error': return theme.colors.error;
            case 'warning': return theme.colors.warning;
            case 'success': return theme.colors.success;
            case 'blue': return theme.colors.primary;
            case 'orange': return theme.colors.warning;
            case 'amber': return theme.colors.warning;
            default: return theme.colors.primary;
        }
    };

    const handleQuickActionPress = useCallback((action: typeof quickActions[0]) => {
        if (action.action === 'create') {
            router.push('/(app)/(pelapor)/buat-laporan');
        } else if (action.action === 'template' && action.template) {
            router.push({
                pathname: '/(app)/(pelapor)/buat-laporan',
                params: { title: action.template.title, category: action.template.category },
            });
        }
    }, [router]);

    // --- RENDER FUNCTIONS ---
    const renderStatCard = (name: string, value: number, icon: string, type: string) => {
        const iconColor = getColorByType(type);

        return (
            <Card key={name} style={styles.statCard} elevation={2}>
                <Card.Content style={styles.statCardContent}>
                    <IconButton icon={icon} size={28} iconColor={iconColor as string} style={styles.statIcon} />
                    <Text style={styles.statValue}>{value}</Text>
                    <Text style={styles.statName}>{name}</Text>
                </Card.Content>
            </Card>
        );
    };

    const renderQuickAction = (action: typeof quickActions[0]) => {
        const actionColor = getColorByType(action.colorType);
        const backgroundColor = theme.colors.primaryLight + '20';

        return (
            <TouchableOpacity key={action.title} onPress={() => handleQuickActionPress(action)} style={styles.quickActionContainer}>
                <Card style={[styles.quickActionCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                    <Card.Content style={styles.quickActionContent}>
                        <View style={[styles.quickActionIcon, { backgroundColor }]}>
                            <IconButton icon={action.icon} size={24} iconColor={actionColor as string} style={{ margin: 0 }} />
                        </View>
                        <Text style={[styles.quickActionText, { color: theme.colors.onSurfaceVariant }]}>{action.title}</Text>
                    </Card.Content>
                </Card>
            </TouchableOpacity>
        );
    };

    const renderRecentItem = (item: Laporan) => {
        const statusConfig = {
            diajukan: { label: 'Diajukan', color: theme.colors.secondary },
            diproses: { label: 'Diproses', color: theme.colors.warning },
            ditindaklanjuti: { label: 'Ditindaklanjuti', color: theme.colors.blueLight },
            ditolak: { label: 'Ditolak', color: theme.colors.error },
            selesai: { label: 'Selesai', color: theme.colors.success },
        };
        const statusInfo = statusConfig[item.status_laporan] || { label: item.status_laporan, color: theme.colors.onSurfaceVariant };
        const date = new Date(item.created_at);
        const formattedDate = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

        return (
            <Card key={item.id_laporan} style={[styles.recentCard, { backgroundColor: theme.colors.surface, borderLeftColor: theme.colors.primary }]} elevation={1}>
                <TouchableOpacity onPress={() => router.push('/(app)/(pelapor)/riwayat-laporan')}>
                    <Card.Content style={styles.recentCardContent}>
                        <View style={styles.recentCardLeft}>
                            <View style={styles.recentCardHeader}>
                                <Text style={[styles.recentId, { color: theme.colors.primary }]}>ID: {item.id_laporan}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                                    <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                                </View>
                            </View>
                            <Text style={[styles.recentTitle, { color: theme.colors.onSurface }]} numberOfLines={2}>{item.judul_laporan}</Text>
                            {item.kategori && (
                                <Text style={[styles.recentCategory, { color: theme.colors.onSurfaceVariant }]}>{item.kategori}</Text>
                            )}
                            <View style={styles.recentFooter}>
                                <Text style={[styles.recentDate, { color: theme.colors.onSurfaceVariant }]}>{formattedDate}</Text>
                            </View>
                        </View>
                        <IconButton icon="chevron-right" size={20} iconColor={theme.colors.onSurfaceVariant as string} style={{ margin: 0 }} />
                    </Card.Content>
                </TouchableOpacity>
            </Card>
        );
    };

    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.colors.background },
        contentContainer: { paddingBottom: 100 },
        headerGradient: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
        headerContent: { gap: 16 },
        headerTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
        userInfo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
        avatar: { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
        avatarLabel: { color: 'white', fontFamily: 'RubikBold' },
        greeting: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'Rubik' },
        userName: { fontSize: 20, color: 'white', marginTop: 2, fontFamily: 'RubikBold' },
        userJabatan: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'Rubik' },
        headerActions: { flexDirection: 'row', alignItems: 'center' },
        notificationButton: { backgroundColor: 'rgba(255, 255, 255, 0.2)', margin: 0 },
        dateText: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)', textAlign: 'center', fontFamily: 'Rubik' },
        quickActionsSection: { paddingHorizontal: 20, paddingTop: 24 },
        sectionTitle: { fontSize: 18, color: theme.colors.onSurface, marginBottom: 16, fontFamily: 'RubikBold' },
        quickActionsGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'center',
        },
        quickActionContainer: {
            flexGrow: 1,
            flexBasis: 120,
            maxWidth: 160,
        },
        quickActionCard: {
            borderRadius: 12,
        },
        quickActionContent: { alignItems: 'center', padding: 16, gap: 8 },
        quickActionIcon: { borderRadius: 24, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
        quickActionText: { fontSize: 12, textAlign: 'center', fontFamily: 'RubikBold' },
        statsSection: { paddingHorizontal: 20, paddingTop: 32 },
        statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
        statCard: { width: (width - 52) / 2, borderRadius: 16, backgroundColor: theme.colors.surface },
        statCardContent: { padding: 16, alignItems: 'center', justifyContent: 'center' },
        statIcon: { margin: 0, marginBottom: 8 },
        statValue: { fontSize: 28, marginBottom: 4, fontFamily: 'RubikBold', color: theme.colors.onSurface },
        statName: { fontSize: 13, fontFamily: 'Rubik', color: theme.colors.onSurfaceVariant },
        recentSection: { paddingHorizontal: 20, paddingTop: 32 },
        recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
        viewAllText: { fontSize: 14, color: theme.colors.primary, fontFamily: 'RubikBold' },
        recentList: { gap: 12 },
        recentCard: { borderRadius: 12, borderLeftWidth: 4 },
        recentCardContent: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 12 },
        recentCardLeft: { flex: 1, gap: 8 },
        recentCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        recentId: { fontSize: 12, fontFamily: 'RubikBold' },
        statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
        statusText: { fontSize: 11, fontFamily: 'RubikBold' },
        recentTitle: { fontSize: 15, lineHeight: 20, fontFamily: 'RubikBold' },
        recentCategory: { fontSize: 12, fontFamily: 'Rubik' },
        recentFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        recentDate: { fontSize: 11, fontFamily: 'Rubik' },
    });

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[theme.colors.primary]} // Warna indikator untuk Android
                    tintColor={theme.colors.primary} // Warna indikator untuk iOS
                />
            }
        >
            <LinearGradient
                colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
                style={styles.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerTop}>
                        <View style={styles.userInfo}>
                            <Avatar.Text size={52} label={user?.nama?.charAt(0) || 'U'} style={styles.avatar} labelStyle={styles.avatarLabel} />
                            <View>
                                <Text style={styles.greeting}>{getGreeting()}</Text>
                                <Text style={styles.userName}>{user?.nama || 'Pengguna'}</Text>
                                <Text style={styles.userJabatan}>{user?.jabatan || 'Pelapor'}</Text>
                            </View>
                        </View>
                        <View style={styles.headerActions}>
                            <IconButton icon="bell-outline" size={24} iconColor="white" style={styles.notificationButton} />
                        </View>
                    </View>
                    <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
                </View>
            </LinearGradient>

            <View style={styles.quickActionsSection}>
                <Text style={styles.sectionTitle}>Aksi Cepat</Text>
                <View style={styles.quickActionsGrid}>
                    {quickActions.slice(0, 4).map(renderQuickAction)}
                </View>
                {quickActions.length > 4 && (
                    <View style={[styles.quickActionsGrid, { marginTop: 12 }]}>
                        {quickActions.slice(4).map(renderQuickAction)}
                    </View>
                )}
            </View>

            <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>Overview</Text>
                {loading ? <ActivityIndicator style={{ marginVertical: 20 }} /> : (
                    <View style={styles.statsGrid}>
                        {renderStatCard('Total Laporan', stats.total, 'file-document-multiple-outline', 'blue')}
                        {renderStatCard('Selesai', stats.selesai, 'check-circle-outline', 'green')}
                        {renderStatCard('Dalam Proses', stats.proses, 'clock-outline', 'amber')}
                        {renderStatCard('Diajukan', stats.diajukan, 'alert-circle-outline', 'orange')}
                    </View>
                )}
            </View>

            <View style={styles.recentSection}>
                <View style={styles.recentHeader}>
                    <Text style={styles.sectionTitle}>Laporan Terbaru</Text>
                    <Button mode="text" onPress={() => router.push('/(app)/(pelapor)/riwayat-laporan')} labelStyle={styles.viewAllText}>
                        Lihat Semua
                    </Button>
                </View>
                {loading ? <ActivityIndicator style={{ marginVertical: 20 }} /> : (
                    recentReports.length > 0 ? (
                        <View style={styles.recentList}>
                            {recentReports.map(renderRecentItem)}
                        </View>
                    ) : (
                        <Text style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant, padding: 20 }}>
                            Anda belum membuat laporan.
                        </Text>
                    )
                )}
            </View>
        </ScrollView>
    );
}
