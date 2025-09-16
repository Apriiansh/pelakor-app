import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Avatar, Badge, Card, IconButton } from 'react-native-paper';

const dummyStats = [
    { name: 'Bagian 1', value: 120, color: '#a7f3d0' },
    { name: 'Bagian 2', value: 80, color: '#93c5fd' },
    { name: 'Bagian 3', value: 60, color: '#fbcfe8' },
];

const dummyRecent = [
    {
        title: 'Konsumsi rapat koordinasi',
        desc: '50 Snack dan 50 air mineral',
        from: 'Bagian 1',
    },
    {
        title: 'Laporan kerusakan printer',
        desc: 'Printer tidak dapat mencetak dan tinta habis',
        from: 'Bagian 2',
    },
    {
        title: 'Laporan alat kantor',
        desc: 'Pena, Kertas, staples dan isinya, tinta stampel, dll',
        from: 'Bagian 3',
    },
];

export default function HomeKabbagUmum() {
    const [user, setUser] = useState<{ nama: string; role: string } | null>(null);

    useEffect(() => {
        (async () => {
            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
                const parsed = JSON.parse(userData);
                setUser({ nama: parsed.nama, role: parsed.role });
            }
        })();
    }, []);

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#f1f5f9' }} contentContainerStyle={{ padding: 20 }}>
            {/* Header */}
            <View style={styles.headerRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Avatar.Icon size={48} icon="account-circle" color="#fff" style={{ backgroundColor: '#6366f1' }} />
                    <View>
                        <Text style={styles.welcomeText}>Welcome, {user?.nama || 'Name'}</Text>
                        <Text style={styles.roleText}>{user?.role || 'Kepala Bagian Umum'}</Text>
                    </View>
                </View>
                <IconButton icon="bell-outline" size={28} iconColor="#6366f1" style={{ marginRight: 0 }} />
            </View>

            {/* Statistic Cards */}
            <View style={styles.statsRow}>
                <Card style={[styles.statCard, { backgroundColor: '#e0f2fe' }]}>
                    <Card.Content style={styles.statContent}>
                        <Text style={styles.statLabel}>Total Pelaporan</Text>
                        <Text style={styles.statValue}>505</Text>
                    </Card.Content>
                </Card>
                <Card style={[styles.statCard, { backgroundColor: '#fef9c3' }]}>
                    <Card.Content style={styles.statContent}>
                        <Text style={styles.statLabel}>Total Pengguna</Text>
                        <Text style={styles.statValue}>505</Text>
                    </Card.Content>
                </Card>
            </View>

            {/* Bidang/Bagian Section */}
            <View style={{ marginTop: 24 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                    {dummyStats.map((b, idx) => (
                        <Card key={b.name} style={[styles.bagianCard, { backgroundColor: b.color }]}>
                            <Card.Content style={{ alignItems: 'center', justifyContent: 'center' }}>
                                <IconButton icon="chart-bar" size={36} iconColor="#0f172a" style={{ margin: 0 }} />
                                <Text style={styles.bagianName}>{b.name}</Text>
                                <Text style={styles.bagianValue}>{b.value} laporan</Text>
                            </Card.Content>
                        </Card>
                    ))}
                </ScrollView>
            </View>

            {/* Recent Activity Section */}
            <View style={{ marginTop: 32 }}>
                <View style={styles.recentHeader}>
                    <Text style={styles.recentTitle}>Menunggu verifikasi</Text>
                    <Badge style={styles.badge}>{dummyRecent.length}</Badge>
                </View>
                <View style={{ gap: 12 }}>
                    {dummyRecent.map((item, idx) => (
                        <Card key={idx} style={styles.recentCard}>
                            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.recentItemTitle}>{item.title}</Text>
                                    <Text style={styles.recentItemDesc}>{item.desc}</Text>
                                    <Text style={styles.recentItemFrom}>dari: {item.from}</Text>
                                </View>
                                <IconButton icon="eye-outline" size={24} iconColor="#6366f1" />
                            </TouchableOpacity>
                        </Card>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    welcomeText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
    },
    roleText: {
        fontSize: 14,
        color: '#6366f1',
        fontWeight: '500',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 8,
    },
    statCard: {
        flex: 1,
        borderRadius: 16,
        elevation: 0,
    },
    statContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
    },
    statLabel: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    bagianCard: {
        width: 120,
        borderRadius: 16,
        elevation: 0,
        paddingVertical: 8,
    },
    bagianName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0f172a',
        marginTop: 8,
    },
    bagianValue: {
        fontSize: 13,
        color: '#334155',
        marginTop: 2,
    },
    recentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 8,
    },
    recentTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
        flex: 1,
    },
    badge: {
        backgroundColor: '#6366f1',
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
        alignSelf: 'center',
    },
    recentCard: {
        borderRadius: 12,
        backgroundColor: '#fff',
        elevation: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
    },
    recentItemTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 2,
    },
    recentItemDesc: {
        fontSize: 13,
        color: '#334155',
        marginBottom: 2,
    },
    recentItemFrom: {
        fontSize: 12,
        color: '#64748b',
        fontStyle: 'italic',
    },
});