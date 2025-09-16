import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Avatar, Button, Card } from 'react-native-paper';

// Ganti dengan alamat IP backend Anda
const API_URL = `${process.env.EXPO_PUBLIC_API_URL}`;

export default function ProfilKabbagUmum() {
    const [user, setUser] = useState<{ nama: string; nik: string; email: string; role: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                if (!token) {
                    // Jika tidak ada token, paksa logout
                    handleLogout(false);
                    return;
                }

                const response = await fetch(`${API_URL}/users/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
                    }
                    throw new Error('Gagal mengambil data profil.');
                }

                const data = await response.json();
                setUser(data);
                // Simpan juga data terbaru ke AsyncStorage untuk referensi offline cepat
                await AsyncStorage.setItem('userData', JSON.stringify(data));

            } catch (error: any) {
                Alert.alert('Error', error.message || 'Terjadi kesalahan jaringan.');
                // Jika ada error otentikasi, arahkan ke login
                if (error.message.includes('Sesi')) {
                    handleLogout(false);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleLogout = async (showAlert = true) => {
        await AsyncStorage.multiRemove(['userToken', 'userData']);
        if (showAlert) {
            Alert.alert('Logout', 'Anda telah berhasil keluar.', [
                { text: 'OK', onPress: () => router.replace('/(auth)/login') }
            ]);
        } else {
            router.replace('/(auth)/login');
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' }}>
                <ActivityIndicator size="large" color="#6366f1" />
            </View>
        );
    }

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#f1f5f9' }} contentContainerStyle={{ padding: 24 }}>
            <View style={styles.centered}>
                <Avatar.Icon size={80} icon="account-circle" color="#fff" style={{ backgroundColor: '#6366f1', marginBottom: 16 }} />
                <Text style={styles.name}>{user?.nama || '-'}</Text>
                <Text style={styles.role}>{user?.role || '-'}</Text>
            </View>
            <Card style={styles.infoCard}>
                <Card.Content>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>NIK</Text>
                        <Text style={styles.value}>{user?.nik || '-'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Email</Text>
                        <Text style={styles.value}>{user?.email || '-'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Role</Text>
                        <Text style={styles.value}>{user?.role || '-'}</Text>
                    </View>
                </Card.Content>
            </Card>
            <Button mode="contained" style={styles.logoutBtn} onPress={() => handleLogout()} buttonColor="#ef4444">
                Logout
            </Button>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    centered: {
        alignItems: 'center',
        marginBottom: 32,
    },
    name: {
        fontSize: 22,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 4,
    },
    role: {
        fontSize: 15,
        color: '#6366f1',
        fontWeight: '500',
        marginBottom: 12,
    },
    infoCard: {
        borderRadius: 14,
        backgroundColor: '#fff',
        marginBottom: 32,
        elevation: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: '#e5e7eb',
    },
    label: {
        fontSize: 15,
        color: '#64748b',
        fontWeight: '500',
    },
    value: {
        fontSize: 15,
        color: '#0f172a',
        fontWeight: '600',
    },
    logoutBtn: {
        marginTop: 24,
        borderRadius: 8,
        paddingVertical: 6,
    },
});
