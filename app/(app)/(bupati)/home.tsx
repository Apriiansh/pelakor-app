import React from 'react';
import { ScrollView, StyleSheet, View, RefreshControl } from 'react-native';
import { Card, Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

// Dummy hook for fetching data
const useDashboardStats = () => {
    const [stats, setStats] = React.useState({
        totalLaporan: 125,
        laporanSelesai: 98,
        laporanDiproses: 15,
        laporanBaru: 12,
    });
    const [loading, setLoading] = React.useState(false);

    const refetch = React.useCallback(() => {
        setLoading(true);
        setTimeout(() => {
            // Simulate fetching new data
            setStats(prevStats => ({
                totalLaporan: prevStats.totalLaporan + Math.floor(Math.random() * 5),
                laporanSelesai: prevStats.laporanSelesai + Math.floor(Math.random() * 3),
                laporanDiproses: 15 + Math.floor(Math.random() * 3),
                laporanBaru: 12 - Math.floor(Math.random() * 4),
            }));
            setLoading(false);
        }, 1500);
    }, []);

    return { stats, loading, refetch };
};


export default function BupatiHomeScreen() {
    const insets = useSafeAreaInsets();
    const theme = useTheme();
    const { stats, loading, refetch } = useDashboardStats();

    const statItems = [
        { title: 'Total Laporan', value: stats.totalLaporan, icon: 'assignment', color: '#42A5F5' },
        { title: 'Laporan Selesai', value: stats.laporanSelesai, icon: 'check-circle', color: '#66BB6A' },
        { title: 'Laporan Diproses', value: stats.laporanDiproses, icon: 'hourglass-empty', color: '#FFA726' },
        { title: 'Laporan Baru', value: stats.laporanBaru, icon: 'new-releases', color: '#EF5350' },
    ];

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        >
            <View style={styles.header}>
                <Text variant="headlineMedium" style={styles.headerTitle}>Dashboard Eksekutif</Text>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>Ringkasan Laporan Kabupaten</Text>
            </View>

            {loading && !stats ? (
                <ActivityIndicator style={{ marginTop: 50 }} size="large" />
            ) : (
                <View style={styles.statsContainer}>
                    {statItems.map((item, index) => (
                        <Card key={index} style={styles.statCard} elevation={2}>
                            <Card.Content style={styles.cardContent}>
                                <View style={styles.iconContainer}>
                                    <MaterialIcons name={item.icon as any} size={32} color={item.color} />
                                </View>
                                <View style={styles.textContainer}>
                                    <Text variant="headlineLarge" style={[styles.statValue, { color: theme.colors.onSurface }]}>{item.value}</Text>
                                    <Text variant="bodyMedium" style={[styles.statTitle, { color: theme.colors.onSurfaceVariant }]}>{item.title}</Text>
                                </View>
                            </Card.Content>
                        </Card>
                    ))}
                </View>
            )}

            <View style={styles.infoSection}>
                 <Card style={{backgroundColor: theme.colors.surface}} elevation={2}>
                    <Card.Title
                        title="Analisis Laporan"
                        titleStyle={{ fontWeight: 'bold' }}
                        left={(props) => <MaterialIcons {...props} name="bar-chart" size={24} color={theme.colors.primary} />}
                    />
                    <Card.Content>
                        <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant}}>
                            Fitur analisis mendalam dan grafik performa OPD akan tersedia di sini pada pembaruan selanjutnya.
                        </Text>
                    </Card.Content>
                </Card>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    headerTitle: {
        fontWeight: 'bold',
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
    },
    statCard: {
        width: '100%',
        marginBottom: 16,
        backgroundColor: '#FFFFFF'
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
    statValue: {
        fontWeight: 'bold',
    },
    statTitle: {
        marginTop: 2,
    },
    infoSection: {
        marginTop: 20,
        paddingHorizontal: 24,
    }
});
