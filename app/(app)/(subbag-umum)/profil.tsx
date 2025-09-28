import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, ActivityIndicator, Platform } from 'react-native';
import { Avatar, Button, Card, useTheme, List, IconButton, Portal, Modal, Divider } from 'react-native-paper';
import { useAppTheme, ThemePreference } from '@/context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeSettings } from '@/components/ThemeSettings';
import { apiLogout } from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = `${process.env.EXPO_PUBLIC_API_URL}`;

// Web Modal Component
const WebModal = ({ visible, onClose, children, theme }: {
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
    theme: any;
}) => {
    if (!visible || Platform.OS !== 'web') return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999,
                backdropFilter: 'blur(4px)',
            }}
            onClick={(e) => {
                // Close modal when clicking backdrop
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: 16,
                    margin: 20,
                    maxWidth: 400,
                    width: '90%',
                    maxHeight: '70vh',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};

export default function ProfilSubbagUmum() {
    const [user, setUser] = useState<{ nama: string; nip: string; email: string; jabatan: String; role: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [themeModalVisible, setThemeModalVisible] = useState(false);
    const router = useRouter();
    const theme = useTheme();
    const { themePreference, setThemePreference } = useAppTheme();

    const showAlertDialog = (title: string, message: string, buttons?: any[]) => {
        if (Platform.OS === 'web') {
            if (buttons && buttons.length > 1) {
                // For confirmation dialogs
                const confirmed = window.confirm(`${title}\n\n${message}`);
                if (confirmed && buttons[1].onPress) {
                    buttons[1].onPress();
                }
            } else {
                // For simple alerts
                window.alert(`${title}\n\n${message}`);
            }
        } else {
            Alert.alert(title, message, buttons);
        }
    };

    const handleLogout = (showAlert = true) => {
        const performLogout = async () => {
            try {
                await apiLogout();
                router.replace('/(auth)/login');
            } catch (error) {
                console.error('Logout failed:', error);
                if (showAlert) {
                    showAlertDialog('Error', 'Gagal untuk keluar. Silakan coba lagi.');
                } else {
                    router.replace('/(auth)/login');
                }
            }
        };

        if (showAlert) {
            showAlertDialog(
                'Konfirmasi Keluar',
                'Apakah Anda yakin ingin keluar dari aplikasi?',
                [
                    {
                        text: 'Batal',
                        style: 'cancel',
                    },
                    {
                        text: 'Keluar',
                        onPress: performLogout,
                        style: 'destructive',
                    },
                ]
            );
        } else {
            performLogout();
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                if (!token) {
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
                showAlertDialog('Error', error.message || 'Terjadi kesalahan jaringan.');
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
        showAlertDialog(
            'Tema Berhasil Diubah',
            `Tema aplikasi telah diubah ke "${selectedOption?.label}"`
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

    const ModalContent = () => (
        <>
            <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                    Pilih Tema Aplikasi
                </Text>
                <IconButton
                    icon="close"
                    size={24}
                    iconColor={theme.colors.onSurfaceVariant}
                    onPress={() => setThemeModalVisible(false)}
                    style={{ margin: 0 }}
                />
            </View>

            <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />

            {/* Use ThemeSettings component here */}
            <ThemeSettings onThemeSelected={handleThemeSelectedFromSettings} />
        </>
    );

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
                    <Text style={[styles.jabatan, { color: theme.colors.primary }]}>
                        {user?.jabatan || '-'}
                    </Text>
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
                            onPress={() => {
                                console.log('Theme button pressed');
                                setThemeModalVisible(true);
                            }}
                            titleStyle={[styles.listTitle, { color: theme.colors.onSurface }]}
                            descriptionStyle={[styles.listDescription, { color: theme.colors.onSurfaceVariant }]}
                            style={[styles.listItem, Platform.OS === 'web' && { cursor: 'pointer' }]}
                        />
                    </Card.Content>
                </Card>

                {/* Logout Button */}
                <Button
                    mode="contained"
                    style={[styles.logoutBtn, Platform.OS === 'web' && { cursor: 'pointer' }]}
                    onPress={() => {
                        console.log('Logout button pressed');
                        handleLogout();
                    }}
                    buttonColor={theme.colors.error}
                    textColor={theme.colors.onError}
                    icon="logout"
                >
                    Keluar dari Aplikasi
                </Button>
            </ScrollView>

            {/* Theme Selection Modal */}
            {Platform.OS === 'web' ? (
                <WebModal
                    visible={themeModalVisible}
                    onClose={() => setThemeModalVisible(false)}
                    theme={theme}
                >
                    <ModalContent />
                </WebModal>
            ) : (
                <Portal>
                    <Modal
                        visible={themeModalVisible}
                        onDismiss={() => setThemeModalVisible(false)}
                        contentContainerStyle={[
                            styles.modalContainer,
                            { backgroundColor: theme.colors.surface, pointerEvents: 'auto' }
                        ]}
                    >
                        <ModalContent />
                    </Modal>
                </Portal>
            )}
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
    jabatan: {
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
        zIndex: 999,
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