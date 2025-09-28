
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View, Dimensions, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Avatar, Card, IconButton, Button, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';
import { getTindakLanjut, getLaporanSelesai, Laporan, ApiError } from '@/utils/api';

const { width } = Dimensions.get('window');

interface TindakLanjutLaporan extends Laporan {
    catatan_disposisi?: string;
    tanggal_disposisi?: string;
    kabbag_umum?: string;
}

const initialStats = { perluTindakLanjut: 0, selesai: 0 };

export default function SubbagUmumHomeScreen() {
    const [user, setUser] = useState<{ nama: string; jabatan: string } | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    // State untuk data asli
    const [stats, setStats] = useState(initialStats);
    const [tindakLanjutList, setTindakLanjutList] = useState<TindakLanjutLaporan[]>([]);

    const router = useRouter();
    const { theme } = useAppTheme();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userData = await AsyncStorage.getItem('userData');
                if (userData) {
                    const parsed = JSON.parse(userData);
                    setUser({ nama: parsed.nama, jabatan: 'Sub Bagian Umum' });
                }
            } catch (error) {
                console.error("Failed to fetch user data", error);
            }
        };

        fetchDashboardData();
        fetchUserData();

        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            // Ambil data secara paralel
            const [tindakLanjutData, selesaiData] = await Promise.all([
                getTindakLanjut(),
                getLaporanSelesai()
            ]);

            setTindakLanjutList(tindakLanjutData);
            setStats({
                perluTindakLanjut: tindakLanjutData.length,
                selesai: selesaiData.length,
            });

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

    const getStatColorByType = (type: string) => {
        switch (type) {
            case 'amber': return theme.colors.warning;
            case 'green': return theme.colors.success;
            default: return theme.colors.primary;
        }
    };

    const handleTindakLanjutPress = () => {
        router.push('/(app)/(subbag-umum)/tindak-lanjut');
    };

    // --- RENDER FUNCTIONS ---
    const renderStatCard = (name: string, value: number, icon: string, type: 'amber' | 'green') => {
        const statColor = getStatColorByType(type);
        return (
            <Card key={name} style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
                <Card.Content style={styles.statCardContent}>
                    <IconButton icon={icon} size={32} iconColor={statColor} style={styles.statIcon} />
                    <Text style={[styles.statValue, { color: statColor }]}>{value}</Text>
                    <Text style={[styles.statName, { color: theme.colors.onSurfaceVariant }]}>{name}</Text>
                </Card.Content>
            </Card>
        );
    };

    const renderTindakLanjutItem = (item: TindakLanjutLaporan) => {
        const statusConfig = {
            diproses: { label: 'Baru', color: theme.colors.warning },
            ditindaklanjuti: { label: 'Dalam Proses', color: theme.colors.backdrop },
        };
        const statusInfo = statusConfig[item.status_laporan as keyof typeof statusConfig] || { label: item.status_laporan, color: theme.colors.onSurfaceVariant };

        return (
            <Card key={item.id_laporan} style={[styles.recentCard, { backgroundColor: theme.colors.surface, borderLeftColor: theme.colors.primary }]} elevation={1}>
                <TouchableOpacity onPress={handleTindakLanjutPress}>
                    <Card.Content style={styles.recentCardContent}>
                        <View style={styles.recentCardLeft}>
                            {/* <View style={styles.recentCardHeader}>
                                <Text style={[styles.recentId, { color: theme.colors.primary }]}>ID: {item.id_laporan}</Text>
                            </View> */}
                            <Text style={[styles.recentTitle, { color: theme.colors.onSurface }]} numberOfLines={2}>{item.judul_laporan}</Text>
                            <Text style={[styles.recentInfo, { color: theme.colors.onSurfaceVariant }]}>
                                Dari: {item.pelapor}
                            </Text>
                            <View style={styles.recentFooter}>
                                <Text style={[styles.recentDate, { color: theme.colors.onSurfaceVariant }]}>
                                    {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </Text>
                                <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                                    <Text style={[styles.statusText, { color: theme.colors.onError }]}>{statusInfo.label}</Text>
                                </View>
                            </View>
                        </View>
                        <IconButton icon="chevron-right" size={24} iconColor={theme.colors.onSurfaceVariant as string} style={{ alignSelf: 'center' }} />
                    </Card.Content>
                </TouchableOpacity>
            </Card>
        );
    };

    // --- STYLES ---
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
        
        statsSection: { paddingHorizontal: 20, paddingTop: 24 },
        sectionTitle: { fontSize: 18, color: theme.colors.onSurface, marginBottom: 16, fontFamily: 'RubikBold' },
        statsGrid: { flexDirection: 'row', gap: 12 },
        statCard: { flex: 1, borderRadius: 16 },
        statCardContent: { padding: 16, alignItems: 'center', gap: 8 },
        statIcon: { margin: 0 },
        statValue: { fontSize: 28, fontFamily: 'RubikBold' },
        statName: { fontSize: 13, fontFamily: 'Rubik', textAlign: 'center' },

        recentSection: { paddingHorizontal: 20, paddingTop: 32 },
        recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
        viewAllButton: { fontFamily: 'RubikBold' },
        recentList: { gap: 12 },
        recentCard: { borderRadius: 12, borderLeftWidth: 5 },
        recentCardContent: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 12 },
        recentCardLeft: { flex: 1, gap: 8 },
        recentCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        recentId: { fontSize: 12, fontFamily: 'RubikBold' },
        recentTitle: { fontSize: 15, lineHeight: 20, fontFamily: 'RubikBold' },
        recentInfo: { fontSize: 12, fontFamily: 'Rubik' },
        recentFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
        recentDate: { fontSize: 11, fontFamily: 'Rubik' },
        statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
        statusText: { fontSize: 11, fontFamily: 'RubikBold' },
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
                    colors={[theme.colors.primary]}
                    tintColor={theme.colors.primary}
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
                            <Avatar.Text size={52} label={user?.nama?.charAt(0) || 'S'} style={styles.avatar} labelStyle={styles.avatarLabel} />
                            <View>
                                <Text style={styles.greeting}>{getGreeting()}</Text>
                                <Text style={styles.userName}>{user?.nama || 'Staff'}</Text>
                                <Text style={styles.userJabatan}>{user?.jabatan || 'Sub Bagian Umum'}</Text>
                            </View>
                        </View>
                        <View style={styles.headerActions}>
                            <IconButton icon="bell-outline" size={24} iconColor="white" style={styles.notificationButton} />
                        </View>
                    </View>
                    <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
                </View>
            </LinearGradient>

            <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>Overview Pekerjaan</Text>
                {loading ? <ActivityIndicator style={{ marginVertical: 20 }} /> : (
                    <View style={styles.statsGrid}>
                        {renderStatCard('Perlu Tindak Lanjut', stats.perluTindakLanjut, 'progress-wrench', 'amber')}
                        {renderStatCard('Selesai Dikerjakan', stats.selesai, 'check-decagram', 'green')}
                    </View>
                )}
            </View>

            <View style={styles.recentSection}>
                <View style={styles.recentHeader}>
                    <Text style={styles.sectionTitle}>Daftar Tindak Lanjut</Text>
                    <Button 
                        mode="text" 
                        onPress={handleTindakLanjutPress}
                        labelStyle={styles.viewAllButton}
                        textColor={theme.colors.primary}
                    >
                        Lihat Semua
                    </Button>
                </View>
                {loading ? <ActivityIndicator style={{ marginVertical: 20 }} /> : (
                    tindakLanjutList.length > 0 ? (
                        <View style={styles.recentList}>
                            {tindakLanjutList.slice(0, 3).map(renderTindakLanjutItem)}
                        </View>
                    ) : (
                        <Text style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant, padding: 20 }}>
                            Tidak ada pekerjaan yang perlu ditindaklanjuti saat ini.
                        </Text>
                    )
                )}
            </View>
        </ScrollView>
    );
}
