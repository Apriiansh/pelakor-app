import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Dimensions, TouchableOpacity } from 'react-native';
import { Avatar, Card, IconButton, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// Enhanced theme colors
const theme = {
    primary: '#6366f1',
    primaryDark: '#4f46e5',
    primaryLight: '#a5b4fc',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    textSecondary: '#475569',
    subtle: '#64748b',
    accent: '#3b82f6',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    // Gradient colors
    gradientStart: '#667eea',
    gradientEnd: '#764ba2',
    // Card colors
    blue: '#3b82f6',
    blueLight: '#dbeafe',
    amber: '#f59e0b',
    amberLight: '#fef3c7',
    green: '#10b981',
    greenLight: '#d1fae5',
};

const dummyStats = [
    {
        name: 'Total Laporan',
        value: 45,
        color: theme.blueLight,
        iconColor: theme.blue,
        icon: 'file-document-multiple-outline',
        change: '+12%'
    },
    {
        name: 'Selesai',
        value: 28,
        color: theme.greenLight,
        iconColor: theme.green,
        icon: 'check-circle-outline',
        change: '+23%'
    },
    {
        name: 'Dalam Proses',
        value: 8,
        color: theme.amberLight,
        iconColor: theme.amber,
        icon: 'clock-outline',
        change: '+5%'
    },
    {
        name: 'Butuh Tindakan',
        value: 9,
        color: '#fef2f2',
        iconColor: theme.error,
        icon: 'alert-circle-outline',
        change: '-8%'
    },
];

const dummyRecent = [
    {
        id: 'LP001',
        title: 'Kerusakan AC di Ruang Rapat A',
        category: 'Maintenance',
        status: 'Diajukan',
        statusColor: theme.accent,
        date: '2 jam lalu',
        progress: 0
    },
    {
        id: 'LP002',
        title: 'Printer tidak dapat mencetak dengan baik',
        category: 'IT Support',
        status: 'Diproses',
        statusColor: theme.warning,
        date: '5 jam lalu',
        progress: 60
    },
    {
        id: 'LP003',
        title: 'Permintaan ATK Bulanan Divisi HR',
        category: 'Procurement',
        status: 'Selesai',
        statusColor: theme.success,
        date: '1 hari lalu',
        progress: 100
    },
];

const quickActions = [
    { title: 'Laporan Baru', icon: 'plus-circle', color: theme.primary, action: 'create' },
    { title: 'Konsumsi', icon: 'food-apple', color: theme.green, action: 'template', template: { title: 'Laporan Konsumsi', category: 'Konsumsi' } },
    { title: 'Kebutuhan', icon: 'shopping', color: theme.accent, action: 'template', template: { title: 'Laporan Kebutuhan', category: 'Kebutuhan' } },
    { title: 'Kerusakan', icon: 'wrench', color: theme.error, action: 'template', template: { title: 'Laporan Kerusakan', category: 'Kerusakan' } },
];

export default function PegawaiHomeScreen() {
    const [user, setUser] = useState<{ nama: string; role: string; avatar?: string } | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const router = useRouter();

    useEffect(() => {
        (async () => {
            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
                setUser(JSON.parse(userData));
            }
        })();

        // Update time every minute
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

    const handleQuickActionPress = (action: typeof quickActions[0]) => {
        if (action.action === 'create') {
            router.push('/(app)/(pegawai)/buat-laporan');
        } else if (action.action === 'template' && action.template) {
            router.push({
                pathname: '/(app)/(pegawai)/buat-laporan',
                params: { title: action.template.title, category: action.template.category },
            });
        }
        // Handle other actions like 'scan', 'emergency', 'history' if needed
    };

    const renderStatCard = (stat: typeof dummyStats[0], index: number) => (
        <Card key={stat.name} style={[styles.statCard, { backgroundColor: stat.color }]} elevation={2}>
            <Card.Content style={styles.statCardContent}>
                <View style={styles.statCardHeader}>
                    <IconButton
                        icon={stat.icon}
                        size={28}
                        iconColor={stat.iconColor}
                        style={styles.statIcon}
                    />
                    <Text style={[styles.statChange, {
                        color: stat.change.startsWith('+') ? theme.success : theme.error
                    }]}>
                        {stat.change}
                    </Text>
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statName}>{stat.name}</Text>
            </Card.Content>
        </Card>
    );

    const renderQuickAction = (action: typeof quickActions[0]) => (
        <TouchableOpacity key={action.title} onPress={() => handleQuickActionPress(action)}>
            <Card style={styles.quickActionCard} elevation={1}>
                <Card.Content style={styles.quickActionContent}>
                    <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
                        <IconButton
                            icon={action.icon}
                            size={24}
                            iconColor={action.color}
                            style={{ margin: 0 }}
                        />
                    </View>
                    <Text style={styles.quickActionText}>{action.title}</Text>
                </Card.Content>
            </Card>
        </TouchableOpacity>
    );

    const renderRecentItem = (item: typeof dummyRecent[0]) => (
        <Card key={item.id} style={styles.recentCard} elevation={1}>
            <Card.Content style={styles.recentCardContent}>
                <View style={styles.recentCardLeft}>
                    <View style={styles.recentCardHeader}>
                        <Text style={styles.recentId}>{item.id}</Text>
                        
                    </View>

                    <Text style={styles.recentTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.recentCategory}>{item.category}</Text>

                    <View style={styles.recentFooter}>
                        <Text style={styles.recentDate}>{item.date}</Text>
                        <View style={styles.statusContainer}>
                            <View style={[styles.statusDot, { backgroundColor: item.statusColor }]} />
                            <Text style={[styles.recentStatus, { color: item.statusColor }]}>{item.status}</Text>
                        </View>
                    </View>

                    {item.progress > 0 && (
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, {
                                    width: `${item.progress}%`,
                                    backgroundColor: item.statusColor
                                }]} />
                            </View>
                            <Text style={styles.progressText}>{item.progress}%</Text>
                        </View>
                    )}
                </View>

                <IconButton
                    icon="chevron-right"
                    size={20}
                    iconColor={theme.subtle}
                    style={{ margin: 0 }}
                />
            </Card.Content>
        </Card>
    );

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
        >
            {/* Header with Gradient */}
            <LinearGradient
                colors={[theme.gradientStart, theme.gradientEnd]}
                style={styles.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerTop}>
                        <View style={styles.userInfo}>
                            <Avatar.Text
                                size={52}
                                label={user?.nama?.charAt(0) || 'U'}
                                style={styles.avatar}
                                labelStyle={styles.avatarLabel}
                            />
                            <View>
                                <Text style={styles.greeting}>{getGreeting()}</Text>
                                <Text style={styles.userName}>{user?.nama || 'Pengguna'}</Text>
                                <Text style={styles.userRole}>{user?.role || 'Pegawai'}</Text>
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

            {/* Quick Actions */}
            <View style={styles.quickActionsSection}>
                <Text style={styles.sectionTitle}>Aksi Cepat</Text>
                <View style={styles.quickActionsGrid}>
                    {quickActions.map(renderQuickAction)}
                </View>
            </View>

            {/* Statistics */}
            <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>Overview</Text>
                <View style={styles.statsGrid}>
                    {dummyStats.map(renderStatCard)}
                </View>
            </View>

            {/* Recent Activity */}
            <View style={styles.recentSection}>
                <View style={styles.recentHeader}>
                    <Text style={styles.sectionTitle}>Laporan Terbaru</Text>
                    <Button
                        mode="text"
                        onPress={() => { }}
                        labelStyle={styles.viewAllText}
                    >
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
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
    },
    greeting: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginTop: 2,
    },
    userRole: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
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
    },

    // Quick Actions
    quickActionsSection: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 16,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    quickActionCard: {
        flex: 1,
        backgroundColor: theme.surface,
        borderRadius: 12,
    },
    quickActionContent: {
        alignItems: 'center',
        padding: 16,
        gap: 8,
    },
    quickActionIcon: {
        borderRadius: 24,
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickActionText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.textSecondary,
        textAlign: 'center',
    },

    // Statistics
    statsSection: {
        paddingHorizontal: 20,
        paddingTop: 32,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        width: (width - 52) / 2,
        borderRadius: 16,
    },
    statCardContent: {
        padding: 16,
    },
    statCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    statIcon: {
        margin: 0,
    },
    statChange: {
        fontSize: 12,
        fontWeight: '600',
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 4,
    },
    statName: {
        fontSize: 13,
        color: theme.textSecondary,
        fontWeight: '500',
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
    viewAllText: {
        fontSize: 14,
        color: theme.primary,
        fontWeight: '600',
    },
    recentList: {
        gap: 12,
    },
    recentCard: {
        backgroundColor: theme.surface,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: theme.primary,
    },
    recentCardContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        gap: 12,
    },
    recentCardLeft: {
        flex: 1,
        gap: 8,
    },
    recentCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    recentId: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.primary,
    },
    recentTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.text,
        lineHeight: 20,
    },
    recentCategory: {
        fontSize: 12,
        color: theme.subtle,
        fontWeight: '500',
    },
    recentFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    recentDate: {
        fontSize: 11,
        color: theme.subtle,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    recentStatus: {
        fontSize: 12,
        fontWeight: '600',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    progressBar: {
        flex: 1,
        height: 4,
        backgroundColor: '#f1f5f9',
        borderRadius: 2,
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    progressText: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.subtle,
        minWidth: 28,
    },
});