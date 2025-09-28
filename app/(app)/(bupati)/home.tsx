import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { ScrollView, StyleSheet, View, RefreshControl, Dimensions, Alert, TouchableOpacity } from 'react-native';
import { Card, Text, ActivityIndicator, Avatar, IconButton, Badge } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart } from 'react-native-chart-kit';
import { getBupatiStats, BupatiStats, ApiError, getLaporan, Laporan } from '@/utils/api';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';

const initialStats: BupatiStats = {
    total: 0,
    selesai: 0,
    proses: 0,
    diajukan: 0,
};

const { width } = Dimensions.get('window');

export default function BupatiHomeScreen() {
    const insets = useSafeAreaInsets();
    const { theme } = useAppTheme();
    const router = useRouter();
    const [stats, setStats] = useState<BupatiStats>(initialStats);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ nama: string; jabatan: string; role: string } | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [recentReports, setRecentReports] = useState<Laporan[]>([]);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const [statsData, laporanData] = await Promise.all([
                getBupatiStats(),
                getLaporan() // getLaporan for Bupati role fetches all reports
            ]);
            setStats(statsData);
            setRecentReports(laporanData.slice(0, 5)); // Ambil 5 laporan terbaru
        } catch (error) {
            const message = error instanceof ApiError ? error.message : "Gagal memuat statistik";
            Alert.alert('Error', message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const loadUserData = async () => {
            try {
                const userData = await AsyncStorage.getItem('userData');
                if (userData) {
                    const parsed = JSON.parse(userData);
                    setUser({
                        nama: parsed.nama,
                        jabatan: parsed.jabatan || 'Bupati',
                        role: parsed.role
                    });
                }
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        };

        loadUserData();
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        return () => clearInterval(timer);
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
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const statItems = [
        { title: 'Total Laporan', value: stats.total, icon: 'assignment', color: theme.colors.primary },
        { title: 'Laporan Selesai', value: stats.selesai, icon: 'check-circle', color: theme.colors.success },
        { title: 'Laporan Diproses', value: stats.proses, icon: 'hourglass-empty', color: theme.colors.warning },
        { title: 'Laporan Baru', value: stats.diajukan, icon: 'new-releases', color: theme.colors.error },
    ];

    const pieChartData = useMemo(() => {
        const data = [
            { name: 'Diajukan', population: stats.diajukan, color: theme.colors.warning, legendFontColor: theme.colors.onSurfaceVariant, legendFontSize: 12 },
            { name: 'Diproses', population: stats.proses, color: theme.colors.blueLight, legendFontColor: theme.colors.onSurfaceVariant, legendFontSize: 12 },
            { name: 'Selesai', population: stats.selesai, color: theme.colors.success, legendFontColor: theme.colors.onSurfaceVariant, legendFontSize: 12 },
        ];
        // Filter out items with 0 population to avoid cluttering the chart
        return data.filter(item => item.population > 0);
    }, [stats, theme.colors]);

    const chartConfig = {
        backgroundColor: theme.colors.surface,
        backgroundGradientFrom: theme.colors.surface,
        backgroundGradientTo: theme.colors.surface,
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            contentContainerStyle={styles.contentContainer}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchStats} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />}
        >
            {/* Header with Gradient */}
            <LinearGradient
                colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
                style={styles.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerTop}>
                        <View style={styles.userInfo}>
                            <Avatar.Text
                                size={52}
                                label={user?.nama?.charAt(0) || 'B'}
                                style={styles.avatar}
                                labelStyle={styles.avatarLabel}
                            />
                            <View>
                                <Text style={styles.greeting}>{getGreeting()}</Text>
                                <Text style={styles.userName}>{user?.nama || 'Bupati'}</Text>
                                <Text style={styles.userRole}>{user?.jabatan || 'Bupati'}</Text>
                            </View>
                        </View>
                        <View style={styles.headerActions}>
                            <IconButton
                                icon="bell-outline"
                                size={24}
                                iconColor="white"
                                style={styles.notificationButton}
                            />
                        </View>
                    </View>

                    <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
                </View>
            </LinearGradient>

            {/* Statistics Cards */}
            <View style={styles.statsSection}>
                <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Overview Laporan</Text>
                {loading ? (
                    <ActivityIndicator style={{ marginVertical: 20 }} />
                ) : (
                    <View style={styles.statsGrid}>
                        {statItems.map((item, index) => (
                            <Card key={index} style={styles.statCard} elevation={2}>
                                <Card.Content style={styles.statContent}>
                                    <MaterialIcons name={item.icon as any} size={32} color={item.color} />
                                    <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
                                    <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>{item.title}</Text>
                                </Card.Content>
                            </Card>
                        ))}
                    </View>
                )}
            </View>

            {/* Chart Section */}
            {loading ? (
                <ActivityIndicator style={{ marginTop: 50 }} size="large" />
            ) : (
                <View style={styles.chartSection}>
                    <Text style={styles.sectionTitle}>Distribusi Status Laporan</Text>
                    <Card style={styles.chartCard} elevation={2}>
                        <View style={styles.chartContainer}>
                            {pieChartData.length > 0 ? (
                                <PieChart
                                    data={pieChartData}
                                    width={width - 80}
                                    height={220}
                                    chartConfig={chartConfig}
                                    accessor="population"
                                    backgroundColor="transparent"
                                    paddingLeft="15"
                                    center={[10, -10]}
                                    absolute
                                />
                            ) : (
                                <Text style={{ color: theme.colors.onSurfaceVariant, padding: 20 }}>
                                    Belum ada laporan dalam sistem.
                                </Text>
                            )}
                        </View>
                    </Card>
                </View>
            )}

            {/* Recent Activity Section */}
            <View style={styles.recentSection}>
                <View style={styles.recentHeader}>
                    <Text style={styles.recentTitle}>Laporan Terbaru</Text>
                    <Badge style={styles.badge} size={24}>{recentReports.length}</Badge>
                </View>
                <View>
                    {loading ? (
                        <ActivityIndicator style={{ marginVertical: 20 }} />
                    ) : recentReports.length === 0 ? (
                        <Text style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant, padding: 20 }}>
                            Tidak ada laporan terbaru.
                        </Text>
                    ) : (
                        recentReports.map((item, idx) => (
                            <Card key={item.id_laporan} style={styles.recentCard} elevation={1}>
                                <TouchableOpacity style={styles.recentCardContent} onPress={() => router.push('/(app)/(bupati)/laporan')}>
                                    <View style={styles.recentCardLeft}>
                                        <Text style={styles.recentItemTitle} numberOfLines={1}>{item.judul_laporan}</Text>
                                        <Text style={styles.recentItemDesc} numberOfLines={1}>Oleh: {item.pelapor} ({item.unit_kerja || 'N/A'})</Text>
                                        <Text style={styles.recentItemFrom}>Status: {item.status_laporan}</Text>
                                    </View>
                                    <IconButton
                                        icon="eye-outline"
                                        size={20}
                                        iconColor={theme.colors.primary}
                                        style={{ margin: 0 }}
                                    />
                                </TouchableOpacity>
                            </Card>
                        ))
                    )}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    contentContainer: {
      paddingBottom: 100,
    },
    headerGradient: {
      paddingTop: 60,
      paddingBottom: 24,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    headerContent: {
      gap: 16,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    avatar: {
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    avatarLabel: {
      color: 'white',
      fontWeight: 'bold',
      fontFamily: 'RubikBold',
    },
    greeting: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
      fontFamily: 'Rubik',
    },
    userName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: 'white',
      marginTop: 2,
      fontFamily: 'RubikBold',
    },
    userRole: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
      fontFamily: 'Rubik',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    notificationButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      margin: 0,
    },
    dateText: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      fontFamily: 'Rubik',
    },

    // Statistics Section
    statsSection: {
      paddingHorizontal: 20,
      paddingTop: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333', // Will be overridden by theme.colors.onSurface
      fontFamily: 'RubikBold',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 12,
    },
    statCard: {
      width: '48%', // Adjust width for two cards per row
      borderRadius: 16,
      backgroundColor: '#FFFFFF', // Will be overridden by theme.colors.surface
    },
    statContent: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 18,
      gap: 8,
    },
    statLabel: {
      fontSize: 14,
      color: '#666', // Will be overridden by theme.colors.onSurfaceVariant
      fontWeight: '500',
      fontFamily: 'Rubik',
      textAlign: 'center',
    },
    statValue: {
      fontSize: 32,
      fontWeight: 'bold',
      fontFamily: 'RubikBold',
    },

    // Chart Section
    chartSection: {
      paddingHorizontal: 20,
      paddingTop: 32,
    },
    chartCard: {
      borderRadius: 16,
      backgroundColor: '#FFFFFF', // Will be overridden by theme.colors.surface
      padding: 16,
    },
    chartContainer: {
      alignItems: 'center',
      marginVertical: 8,
    },

    // Recent Activity
    recentSection: {
      paddingHorizontal: 20,
      paddingTop: 32,
    },
    recentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    recentTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333', // Will be overridden by theme.colors.onSurface
      fontFamily: 'RubikBold',
    },
    badge: {
      backgroundColor: '#6366f1', // Will be overridden by theme.colors.primary
      color: 'white',
    },
    recentCard: {
      borderRadius: 12,
      backgroundColor: '#FFFFFF', // Will be overridden by theme.colors.surface
      marginBottom: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#6366f1', // Will be overridden by theme.colors.primary
    },
    recentCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 12,
    },
    recentCardLeft: {
      flex: 1,
    },
    recentItemTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: '#333', // Will be overridden by theme.colors.onSurface
      marginBottom: 4,
      fontFamily: 'RubikBold',
    },
    recentItemDesc: {
      fontSize: 13,
      color: '#666', // Will be overridden by theme.colors.onSurfaceVariant
      marginBottom: 4,
      fontFamily: 'Rubik',
    },
    recentItemFrom: {
      fontSize: 12,
      color: '#6366f1', // Will be overridden by theme.colors.primary
      fontWeight: '600',
      fontFamily: 'Rubik',
    },

    // Old styles, removed or replaced
    infoSection: {
        marginTop: 20,
        paddingHorizontal: 24,
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        marginRight: 16,
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.05)'
    },
    textContainer: {
        flex: 1,
    },
});
