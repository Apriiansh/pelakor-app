import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View, Dimensions, TouchableOpacity, RefreshControl } from 'react-native';
import { Avatar, Card, IconButton, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';

const { width } = Dimensions.get('window');

// --- DUMMY DATA (Dapat diganti dengan data dari API) ---
const dummyStats = [
    { name: 'Total Laporan', value: 45, icon: 'file-document-multiple-outline', change: '+12%', type: 'blue' },
    { name: 'Selesai', value: 28, icon: 'check-circle-outline', change: '+18%', type: 'green' },
    { name: 'Dalam Proses', value: 8, icon: 'clock-outline', change: '+5%', type: 'amber' },
    { name: 'Butuh Tindakan', value: 8, icon: 'alert-circle-outline', change: '+15%', type: 'onSurface' },
];

const dummyRecent = [
    { id: 'LP001', title: 'Kerusakan AC di Ruang Rapat A', category: 'Maintenance', status: 'Diajukan', statusColor: 'secondary', date: '2 jam lalu', progress: 0 },
    { id: 'LP002', title: 'Printer tidak dapat mencetak dengan baik', category: 'IT Support', status: 'Diproses', statusColor: 'warning', date: '5 jam lalu', progress: 60 },
    { id: 'LP003', title: 'Permintaan ATK Bulanan Divisi HR', category: 'Procurement', status: 'Selesai', statusColor: 'success', date: '1 hari lalu', progress: 100 },
];

const quickActions = [
    { title: 'Laporan Baru', icon: 'plus-circle', colorType: 'primary', action: 'create' },
    { title: 'Konsumsi', icon: 'food-apple', colorType: 'green', action: 'template', template: { title: 'Laporan Konsumsi', category: 'Konsumsi' } },
    { title: 'Kebutuhan', icon: 'shopping', colorType: 'secondary', action: 'template', template: { title: 'Laporan Kebutuhan', category: 'Kebutuhan' } },
    { title: 'Kerusakan', icon: 'wrench', colorType: 'error', action: 'template', template: { title: 'Laporan Kerusakan', category: 'Kerusakan' } },
];
// --- END DUMMY DATA ---

export default function PegawaiHomeScreen() {
    const [user, setUser] = useState<{ nama: string; role: string; avatar?: string } | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [refreshing, setRefreshing] = useState(false);

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
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    // IMPROVEMENT: Implementasi fungsi onRefresh dengan useCallback untuk performa
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        // Simulasi fetch data baru (misal: laporan terbaru, statistik)
        // Di aplikasi nyata, di sini Anda akan memanggil API
        setTimeout(() => {
            console.log("Data refreshed!");
            setRefreshing(false);
        }, 2000);
    }, []);

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
            case 'blue': return theme.colors.blueLight;
            case 'amber': return theme.colors.amberLight;
            default: return theme.colors.primary;
        }
    };

    const getBackgroundByType = (colorType: string) => {
        switch (colorType) {
            case 'blue': return theme.colors.blueLight;
            case 'amber': return theme.colors.amberLight;
            case 'green': return theme.colors.greenLight;
            case 'onSurface': return theme.colors.inversePrimary;
            case 'error': return theme.colors.error;
            default: return theme.colors.primaryLight + '20';
        }
    };

    const getStatIconColor = (statType: string) => {
        if (statType === 'error') {
            return theme.colors.error;
        }
        return theme.colors.onSurface;
    };

    // IMPROVEMENT: Gunakan useCallback untuk optimasi performa
    const handleQuickActionPress = useCallback((action: typeof quickActions[0]) => {
        if (action.action === 'create') {
            router.push('/(app)/(pegawai)/buat-laporan');
        } else if (action.action === 'template' && action.template) {
            router.push({
                pathname: '/(app)/(pegawai)/buat-laporan',
                params: { title: action.template.title, category: action.template.category },
            });
        }
    }, [router]);

    // --- RENDER FUNCTIONS ---
    const renderStatCard = (stat: typeof dummyStats[0]) => {
        const backgroundColor = getBackgroundByType(stat.type);
        const iconColor = getStatIconColor(stat.type);

        return (
            <Card key={stat.name} style={[styles.statCard, { backgroundColor }]} elevation={2}>
                <Card.Content style={styles.statCardContent}>
                    <View style={styles.statCardHeader}>
                        <IconButton icon={stat.icon} size={28} iconColor={iconColor as string} style={styles.statIcon} />
                        <Text style={[styles.statChange, { color: stat.change.startsWith('+') ? theme.colors.success : theme.colors.error }]}>
                            {stat.change}
                        </Text>
                    </View>
                    <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>{stat.value}</Text>
                    <Text style={[styles.statName, { color: theme.colors.onSurfaceVariant }]}>{stat.name}</Text>
                </Card.Content>
            </Card>
        );
    };

    const renderQuickAction = (action: typeof quickActions[0]) => {
        const actionColor = getColorByType(action.colorType);
        const backgroundColor = theme.colors.primaryLight + '20';

        return (
            <TouchableOpacity key={action.title} onPress={() => handleQuickActionPress(action)}>
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

    const renderRecentItem = (item: typeof dummyRecent[0]) => {
        const statusColor = getColorByType(item.statusColor);
        return (
            <Card key={item.id} style={[styles.recentCard, { backgroundColor: theme.colors.surface, borderLeftColor: theme.colors.primary }]} elevation={1}>
                <Card.Content style={styles.recentCardContent}>
                    <View style={styles.recentCardLeft}>
                        <View style={styles.recentCardHeader}>
                            <Text style={[styles.recentId, { color: theme.colors.primary }]}>{item.id}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: theme.colors.primaryLight }]}>
                                <Text style={[styles.statusText, { color: theme.colors.onSurface }]}>{item.status}</Text>
                            </View>
                        </View>
                        <Text style={[styles.recentTitle, { color: theme.colors.onSurface }]} numberOfLines={2}>{item.title}</Text>
                        <Text style={[styles.recentCategory, { color: theme.colors.onSurfaceVariant }]}>{item.category}</Text>
                        <View style={styles.recentFooter}>
                            <Text style={[styles.recentDate, { color: theme.colors.onSurfaceVariant }]}>{item.date}</Text>
                        </View>
                        {item.progress > 0 && (
                            <View style={styles.progressContainer}>
                                <View style={[styles.progressBar, { backgroundColor: theme.colors.primaryLight + '20' }]}>
                                    <View style={[styles.progressFill, { width: `${item.progress}%`, backgroundColor: statusColor }]} />
                                </View>
                                <Text style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>{item.progress}%</Text>
                            </View>
                        )}
                    </View>
                    <IconButton icon="chevron-right" size={20} iconColor={theme.colors.onSurfaceVariant as string} style={{ margin: 0 }} />
                </Card.Content>
            </Card>
        );
    };

    // --- STYLES ---
    // IMPROVEMENT: Styles di-generate sekali dan menggunakan theme
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
        userRole: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'Rubik' },
        headerActions: { flexDirection: 'row', alignItems: 'center' },
        notificationButton: { backgroundColor: 'rgba(255, 255, 255, 0.2)', margin: 0 },
        dateText: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)', textAlign: 'center', fontFamily: 'Rubik' },
        quickActionsSection: { paddingHorizontal: 20, paddingTop: 24 },
        sectionTitle: { fontSize: 18, color: theme.colors.onSurface, marginBottom: 16, fontFamily: 'RubikBold' },
        quickActionsGrid: { flexDirection: 'row', gap: 5 },
        quickActionCard: { flex: 1, borderRadius: 12 },
        quickActionContent: { alignItems: 'center', padding: 16, gap: 8 },
        quickActionIcon: { borderRadius: 24, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
        quickActionText: { fontSize: 12, textAlign: 'center', fontFamily: 'RubikBold' },
        statsSection: { paddingHorizontal: 20, paddingTop: 32 },
        statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
        statCard: { width: (width - 52) / 2, borderRadius: 16 },
        statCardContent: { padding: 16 },
        statCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
        statIcon: { margin: 0 },
        statChange: { fontSize: 12, fontFamily: 'RubikBold' },
        statValue: { fontSize: 28, marginBottom: 4, fontFamily: 'RubikBold' },
        statName: { fontSize: 13, fontFamily: 'Rubik' },
        recentSection: { paddingHorizontal: 20, paddingTop: 32 },
        recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
        viewAllText: { fontSize: 14, color: theme.colors.primary, fontFamily: 'RubikBold' },
        recentList: { gap: 12 },
        recentCard: { borderRadius: 12, borderLeftWidth: 4 },
        recentCardContent: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 12 },
        recentCardLeft: { flex: 1, gap: 8 },
        recentCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        recentId: { fontSize: 12, fontFamily: 'RubikBold' },
        statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
        statusText: { fontSize: 10, fontFamily: 'RubikBold' },
        recentTitle: { fontSize: 15, lineHeight: 20, fontFamily: 'RubikBold' },
        recentCategory: { fontSize: 12, fontFamily: 'Rubik' },
        recentFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        recentDate: { fontSize: 11, fontFamily: 'Rubik' },
        progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        progressBar: { flex: 1, height: 4, borderRadius: 2 },
        progressFill: { height: '100%', borderRadius: 2 },
        progressText: { fontSize: 11, minWidth: 28, fontFamily: 'RubikBold' },
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
                                <Text style={styles.userRole}>{user?.role || 'Pegawai'}</Text>
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
                <View style={styles.statsGrid}>
                    {dummyStats.map(renderStatCard)}
                </View>
            </View>

            <View style={styles.recentSection}>
                <View style={styles.recentHeader}>
                    <Text style={styles.sectionTitle}>Laporan Terbaru</Text>
                    <Button mode="text" onPress={() => router.push('/(app)/(pegawai)/riwayat-laporan')} labelStyle={styles.viewAllText}>
                        Lihat Semua
                    </Button>
                </View>
                <View style={styles.recentList}>
                    {dummyRecent.map(renderRecentItem)}
                </View>
            </View>
        </ScrollView>
    );
}
