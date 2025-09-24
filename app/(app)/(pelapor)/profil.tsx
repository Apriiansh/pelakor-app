import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Avatar, Button, Card, useTheme, List, IconButton, Portal, Modal, Divider } from 'react-native-paper';
import { useAppTheme, ThemePreference } from '@/context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeSettings } from '@/components/ThemeSettings';

// Ganti dengan alamat IP backend Anda
const API_URL = `${process.env.EXPO_PUBLIC_API_URL}`;

export default function ProfilPelapor() {
    const [user, setUser] = useState<{ nama: string; nip: string; email: string; jabatan: String; role: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [themeModalVisible, setThemeModalVisible] = useState(false);
    const router = useRouter();
    const theme = useTheme();
    const { themePreference, setThemePreference } = useAppTheme();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                if (!token) {
                    // Jika tidak ada token, paksa logout
                    handleLogout(false);
                    return;
                }

                const response = await fetch(`${API_URL}/api/users/me`, {
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

    const getThemeIcon = () => {
        switch (themePreference) {
            case 'light':
                return 'sunny';
            case 'dark':
                return 'moon';
            default:
                return 'phone-portrait';
        }
    };

    const getThemeLabel = () => {
        switch (themePreference) {
            case 'light':
                return 'Terang';
            case 'dark':
                return 'Gelap';
            default:
                return 'Sistem';
        }
    };

    const handleThemeSelectedFromSettings = (newTheme: ThemePreference) => {
        setThemePreference(newTheme); // Set theme preference via context
        setThemeModalVisible(false); // Dismiss the modal

        // Provide feedback to the user
        const themeOptionsForAlert = [ // Re-create themeOptions for alert only
            { value: 'system', label: 'Ikuti Sistem' },
            { value: 'light', label: 'Tema Terang' },
            { value: 'dark', label: 'Tema Gelap' },
        ];
        const selectedOption = themeOptionsForAlert.find(option => option.value === newTheme);
        Alert.alert(
            'Tema Berhasil Diubah',
            `Tema aplikasi telah diubah ke "${selectedOption?.label}"`,
            [{ text: 'OK' }]
        );
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
                    Memuat profil...
                </Text>
            </View>
        );
    }

    return (
        <>
            <ScrollView
                style={[styles.container, { backgroundColor: theme.colors.background }]}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <Avatar.Icon
                        size={80}
                        icon="account-circle"
                        color={theme.colors.surface}
                        style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
                    />
                    <Text style={[styles.name, { color: theme.colors.onSurface }]}>
                        {user?.nama || '-'}
                    </Text>
                    {/* <Text style={[styles.role, { color: theme.colors.primary }]}>
                        {user?.role || '-'}
                    </Text> */}
                </View>

                {/* User Info Card */}
                <Card style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
                    <Card.Content>
                        <View style={[styles.infoRow, { borderBottomColor: theme.colors.outlineVariant }]}>
                            <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>NIP</Text>
                            <Text style={[styles.value, { color: theme.colors.onSurface }]}>{user?.nip || '-'}</Text>
                        </View>
                        <View style={[styles.infoRow, { borderBottomColor: theme.colors.outlineVariant }]}>
                            <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Email</Text>
                            <Text style={[styles.value, { color: theme.colors.onSurface }]}>{user?.email || '-'}</Text>
                        </View>
                        <View style={[styles.infoRowLast, { borderBottomColor: theme.colors.outlineVariant }]}>
                            <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Jabatan</Text>
                            <Text style={[styles.value, { color: theme.colors.onSurface }]}>{user?.jabatan || '-'}</Text>
                        </View>
                        {/* <View style={[styles.infoRowLast, { borderBottomColor: theme.colors.outlineVariant }]}>
                            <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Role</Text>
                            <Text style={[styles.value, { color: theme.colors.onSurface }]}>{user?.role || '-'}</Text>
                        </View> */}
                    </Card.Content>
                </Card>

                {/* Settings Card */}
                <Card style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
                    <Card.Content style={styles.cardContent}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                            Pengaturan
                        </Text>

                        {/* Theme Toggle */}
                        <List.Item
                            title="Tema Aplikasi"
                            description={`Saat ini: ${getThemeLabel()}`}
                            left={(props) => (
                                <View style={styles.listIconContainer}>
                                    <Ionicons
                                        name={getThemeIcon() as any}
                                        size={24}
                                        color={theme.colors.primary}
                                    />
                                </View>
                            )}
                            right={(props) => (
                                <IconButton
                                    icon="chevron-right"
                                    iconColor={theme.colors.onSurfaceVariant}
                                    size={20}
                                />
                            )}
                            onPress={() => setThemeModalVisible(true)}
                            titleStyle={[styles.listTitle, { color: theme.colors.onSurface }]}
                            descriptionStyle={[styles.listDescription, { color: theme.colors.onSurfaceVariant }]}
                            style={styles.listItem}
                        />
                    </Card.Content>
                </Card>

                {/* Logout Button */}
                <Button
                    mode="contained"
                    style={styles.logoutBtn}
                    onPress={() => handleLogout()}
                    buttonColor={theme.colors.error}
                    textColor={theme.colors.onError}
                    icon="logout"
                >
                    Keluar dari Aplikasi
                </Button>
            </ScrollView>

            {/* Theme Selection Modal */}
            <Portal>
                <Modal
                    visible={themeModalVisible}
                    onDismiss={() => setThemeModalVisible(false)}
                    contentContainerStyle={[
                        styles.modalContainer,
                        { backgroundColor: theme.colors.surface }
                    ]}
                >
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                            Pilih Tema Aplikasi
                        </Text>
                        <IconButton
                            icon="close"
                            size={24}
                            iconColor={theme.colors.onSurfaceVariant}
                            onPress={() => setThemeModalVisible(false)}
                        />
                    </View>

                    <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />

                    {/* Use ThemeSettings component here */}
                    <ThemeSettings onThemeSelected={handleThemeSelectedFromSettings} />

                </Modal>
            </Portal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 24,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        fontFamily: 'Rubik',
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatar: {
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    name: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 4,
        fontFamily: 'RubikBold',
    },
    role: {
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 12,
        fontFamily: 'Rubik',
    },
    infoCard: {
        borderRadius: 16,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 0.5,
    },
    infoRowLast: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    label: {
        fontSize: 15,
        fontWeight: '500',
        fontFamily: 'Rubik',
    },
    value: {
        fontSize: 15,
        fontWeight: '600',
        fontFamily: 'RubikBold',
    },
    settingsCard: {
        borderRadius: 16,
        marginBottom: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    cardContent: {
        paddingVertical: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        fontFamily: 'RubikBold',
    },
    listIconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 40,
        height: 40,
    },
    listItem: {
        paddingVertical: 8,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'RubikBold',
    },
    listDescription: {
        fontSize: 14,
        fontFamily: 'Rubik',
    },
    logoutBtn: {
        marginTop: 24,
        borderRadius: 12,
        paddingVertical: 6,
        elevation: 2,
    },
    modalContainer: {
        margin: 20,
        borderRadius: 16,
        elevation: 8,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 12,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        fontFamily: 'RubikBold',
    },
});