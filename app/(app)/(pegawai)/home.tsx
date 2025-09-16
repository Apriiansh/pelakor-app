import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Dimensions, TouchableOpacity } from 'react-native';
import { Avatar, Card, IconButton, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';

const { width } = Dimensions.get('window');

const dummyStats = [
    {
        name: 'Total Laporan',
        value: 45,
        icon: 'file-document-multiple-outline',
        change: '+12%',
        type: 'blue'
    },
    {
        name: 'Selesai',
        value: 28,
        icon: 'check-circle-outline',
        change: '+18%',
        type: 'green'
    },
    {
        name: 'Dalam Proses',
        value: 8,
        icon: 'clock-outline',
        change: '+5%',
        type: 'amber'
    },
    {
        name: 'Butuh Tindakan',
        value: 8,
        icon: 'clock-outline',
        change: '+5%',
        type: 'error'
    },
];

const dummyRecent = [
    {
        id: 'LP001',
        title: 'Kerusakan AC di Ruang Rapat A',
        category: 'Maintenance',
        status: 'Diajukan',
        statusColor: 'secondary',
        date: '2 jam lalu',
        progress: 0
    },
    {
        id: 'LP002',
        title: 'Printer tidak dapat mencetak dengan baik',
        category: 'IT Support',
        status: 'Diproses',
        statusColor: 'warning',
        date: '5 jam lalu',
        progress: 60
    },
    {
        id: 'LP003',
        title: 'Permintaan ATK Bulanan Divisi HR',
        category: 'Procurement',
        status: 'Selesai',
        statusColor: 'success',
        date: '1 hari lalu',
        progress: 100
    },
];

const quickActions = [
    { title: 'Laporan Baru', icon: 'plus-circle', colorType: 'primary', action: 'create' },
    { title: 'Konsumsi', icon: 'food-apple', colorType: 'green', action: 'template', template: { title: 'Laporan Konsumsi', category: 'Konsumsi' } },
    { title: 'Kebutuhan', icon: 'shopping', colorType: 'secondary', action: 'template', template: { title: 'Laporan Kebutuhan', category: 'Kebutuhan' } },
    { title: 'Kerusakan', icon: 'wrench', colorType: 'error', action: 'template', template: { title: 'Laporan Kerusakan', category: 'Kerusakan' } },
];

export default function PegawaiHomeScreen() {
    const [user, setUser] = useState<{ nama: string; role: string; avatar?: string } | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const router = useRouter();
    const { theme } = useAppTheme();

    useEffect(() => {
        (async () => {
            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
                setUser(JSON.parse(userData));
            }
        })();

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

    // Only use color from theme.colors
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

    // Only use color from theme.colors
    const getBackgroundByType = (colorType: string) => {
        switch (colorType) {
            case 'blue': return theme.colors.blueLight;
            case 'amber': return theme.colors.amberLight;
            case 'green': return theme.colors.greenLight;
            case 'error': return theme.colors.error;
            default: return theme.colors.primaryLight + '20';
        }
    };

    // Get icon color that always contrast (light/dark theme proof)
    const getStatIconColor = (statType: string) => {
        // Use onSurface for most, except for error use error (red)
        if (statType === 'error') {
            // if background is red, icon should be white or onSurface
            return theme.colors.onError ? theme.colors.onError : '#fff';
        }
        // for all others, use onSurface
        return theme.colors.onSurface;
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
    };

    const renderStatCard = (stat: typeof dummyStats[0], index: number) => {
        const backgroundColor = getBackgroundByType(stat.type);
        // Use new function for icon color
        const iconColor = getStatIconColor(stat.type);

        return (
            <Card key={stat.name} style={[styles.statCard, { backgroundColor }]} elevation={2}>
                <Card.Content style={styles.statCardContent}>
                    <View style={styles.statCardHeader}>
                        <IconButton
                            icon={stat.icon}
                            size={28}
                            iconColor={iconColor as string}
                            style={styles.statIcon}
                        />
                        <Text style={[styles.statChange, {
                            color: stat.change.startsWith('+') ? theme.colors.success : theme.colors.error
                        }]}>
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
        // Use only from theme, so fallback to primaryLight if not found
        const backgroundColor = theme.colors.primaryLight + '20';

        return (
            <TouchableOpacity key={action.title} onPress={() => handleQuickActionPress(action)}>
                <Card style={[styles.quickActionCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                    <Card.Content style={styles.quickActionContent}>
                        <View style={[styles.quickActionIcon, { backgroundColor }]}>
                            <IconButton
                                icon={action.icon}
                                size={24}
                                iconColor={actionColor as string}
                                style={{ margin: 0 }}
                            />
                        </View>
                        <Text style={[styles.quickActionText, { color: theme.colors.onSurfaceVariant }]}>
                            {action.title}
                        </Text>
                    </Card.Content>
                </Card>
            </TouchableOpacity>
        );
    };

    const renderRecentItem = (item: typeof dummyRecent[0]) => {

        const statusColor = getColorByType(item.statusColor);

        return (
            <Card key={item.id} style={[styles.recentCard, {
                backgroundColor: theme.colors.surface,
                borderLeftColor: theme.colors.primary
            }]} elevation={1}>
                <Card.Content style={styles.recentCardContent}>
                    <View style={styles.recentCardLeft}>
                        <View style={styles.recentCardHeader}>
                            <Text style={[styles.recentId, { color: theme.colors.primary }]}>{item.id}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: theme.colors.primaryLight }]}>
                                <Text style={[styles.statusText, { color: theme.colors.onSurface }]}>
                                    {item.status}
                                </Text>
                            </View>
                        </View>

                        <Text style={[styles.recentTitle, { color: theme.colors.onSurface }]} numberOfLines={2}>
                            {item.title}
                        </Text>
                        <Text style={[styles.recentCategory, { color: theme.colors.onSurfaceVariant }]}>
                            {item.category}
                        </Text>

                        <View style={styles.recentFooter}>
                            <Text style={[styles.recentDate, { color: theme.colors.onSurfaceVariant }]}>
                                {item.date}
                            </Text>
                        </View>

                        {item.progress > 0 && (
                            <View style={styles.progressContainer}>
                                <View style={[styles.progressBar, {
                                    backgroundColor: theme.colors.primaryLight + '20'
                                }]}>
                                    <View style={[styles.progressFill, {
                                        width: `${item.progress}%`,
                                        backgroundColor: statusColor
                                    }]} />
                                </View>
                                <Text style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>
                                    {item.progress}%
                                </Text>
                            </View>
                        )}
                    </View>

                    <IconButton
                        icon="chevron-right"
                        size={20}
                        iconColor={theme.colors.onSurfaceVariant as string}
                        style={{ margin: 0 }}
                    />
                </Card.Content>
            </Card>
        );
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
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

        // Quick Actions
        quickActionsSection: {
            paddingHorizontal: 20,
            paddingTop: 24,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.onSurface,
            marginBottom: 16,
            fontFamily: 'RubikBold',
        },
        quickActionsGrid: {
            flexDirection: 'row',
            gap: 12,
        },
        quickActionCard: {
            flex: 1,
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
            textAlign: 'center',
            fontFamily: 'Rubik',
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
            fontFamily: 'Rubik',
        },
        statValue: {
            fontSize: 28,
            fontWeight: 'bold',
            marginBottom: 4,
            fontFamily: 'RubikBold',
        },
        statName: {
            fontSize: 13,
            fontWeight: '500',
            fontFamily: 'Rubik',
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
            color: theme.colors.primary,
            fontWeight: '600',
            fontFamily: 'Rubik',
        },
        recentList: {
            gap: 12,
        },
        recentCard: {
            borderRadius: 12,
            borderLeftWidth: 4,
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
            fontFamily: 'Rubik',
        },
        statusBadge: {
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 12,
        },
        statusText: {
            fontSize: 10,
            fontWeight: '600',
            fontFamily: 'Rubik',
        },
        recentTitle: {
            fontSize: 15,
            fontWeight: '600',
            lineHeight: 20,
            fontFamily: 'RubikBold',
        },
        recentCategory: {
            fontSize: 12,
            fontWeight: '500',
            fontFamily: 'Rubik',
        },
        recentFooter: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        recentDate: {
            fontSize: 11,
            fontFamily: 'Rubik',
        },
        
        recentStatus: {
            fontSize: 12,
            fontWeight: '600',
            fontFamily: 'Rubik',
        },
        progressContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        progressBar: {
            flex: 1,
            height: 4,
            borderRadius: 2,
        },
        progressFill: {
            height: '100%',
            borderRadius: 2,
        },
        progressText: {
            fontSize: 11,
            fontWeight: '600',
            minWidth: 28,
            fontFamily: 'Rubik',
        },
    });

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
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
                    {quickActions.slice(0, 4).map(renderQuickAction)}
                </View>
                <View style={[styles.quickActionsGrid, { marginTop: 12 }]}>
                    {quickActions.slice(4).map(renderQuickAction)}
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