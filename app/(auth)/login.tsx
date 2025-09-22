import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { ActivityIndicator, Button, Card, Text, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// Storage abstraction for cross-platform compatibility
const Storage = {
    async setItem(key: string, value: string) {
        if (Platform.OS === 'web') {
            localStorage.setItem(key, value);
        } else {
            await AsyncStorage.setItem(key, value);
        }
    },

    async getItem(key: string): Promise<string | null> {
        if (Platform.OS === 'web') {
            return localStorage.getItem(key);
        } else {
            return await AsyncStorage.getItem(key);
        }
    },

    async removeItem(key: string) {
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
        } else {
            await AsyncStorage.removeItem(key);
        }
    }
};

// Cross-platform alert
const showAlert = (title: string, message: string, onPress?: () => void) => {
    if (Platform.OS === 'web') {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        if (confirmed && onPress) {
            onPress();
        }
    } else {
        Alert.alert(title, message, [
            {
                text: onPress ? 'Lanjutkan' : 'OK',
                style: 'default',
                onPress
            }
        ]);
    }
};

export default function LoginScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Get API URL with fallback
    const getApiUrl = () => {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL;

        if (!apiUrl) {
            console.warn('EXPO_PUBLIC_API_URL not found, using fallback');
            // Fallback URL - sesuaikan dengan setup development Anda
            return Platform.OS === 'web'
                ? 'http://localhost:3001' // Untuk web development
                : 'http://192.168.1.100:3001'; // Untuk mobile (ganti dengan IP server Anda)
        }

        return apiUrl;
    };

    const handleLogin = async () => {
        // Validasi input dasar
        if (!identifier.trim() || !password.trim()) {
            showAlert(
                'Input Tidak Valid',
                'NIK/Email dan password wajib diisi.'
            );
            return;
        }

        setIsLoading(true);

        try {
            const apiUrl = getApiUrl();
            console.log('Attempting login with API URL:', apiUrl);

            const response = await fetch(`${apiUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add CORS headers if needed
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    identifier: identifier.trim(),
                    password
                }),
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Login response:', { success: data.success, user: data.user?.nama });

            if (data.success && data.token) {
                // Store user data using cross-platform storage
                await Storage.setItem('userToken', data.token);
                await Storage.setItem('userData', JSON.stringify(data.user));
                await Storage.setItem('userRole', data.user.role);

                const jabatan = data.user.jabatan;
                const role = data.user.role;

                // Tentukan rute berdasarkan peran
                let route: string;
                switch (role) {
                    case 'kabbag_umum':
                        route = '/(app)/(kabbag-umum)/home';
                        break;
                    case 'subbag_umum':
                        route = '/(app)/(subbag-umum)/home';
                        break;
                    default:
                        route = '/(app)/(pegawai)/home';
                        break;
                }

                showAlert(
                    '✅ Login Berhasil',
                    `Selamat datang, ${data.user?.nama || 'User'}! Anda masuk sebagai ${jabatan || role}`,
                    () => {
                        // Use a timeout to ensure storage is complete
                        setTimeout(() => {
                            try {
                                router.replace(route as never);
                            } catch (routeError) {
                                console.error('Route error:', routeError);
                                // Fallback route
                                router.replace('/(app)/(pegawai)/home' as never);
                            }
                        }, 100);
                    }
                );
            } else {
                showAlert(
                    '❌ Login Gagal',
                    data.message || 'Login tidak berhasil. Silakan coba lagi.'
                );
            }
        } catch (error: any) {
            console.error('Login error:', error);

            let errorMessage = 'Terjadi kesalahan saat login.';

            if (error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
                errorMessage = 'Tidak dapat terhubung ke server. Pastikan:\n\n• Server backend sudah aktif\n• Perangkat terhubung ke jaringan yang sama\n• Koneksi internet stabil';
            } else if (error.message?.includes('CORS')) {
                errorMessage = 'Error CORS. Pastikan server backend mengizinkan akses dari web.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            showAlert('🔌 Error Koneksi', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#fafafa', '#f4f4f5']}
            style={[styles.container, { paddingTop: insets.top }]}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Logo Section */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoWrapper}>
                            <Image
                                source={require('@/assets/images/logo-kabupaten-ogan-ilir.png')}
                                style={styles.logo}
                                contentFit="contain"
                            />
                        </View>
                        <Text style={styles.logoTitle}>
                            PELAKOR
                        </Text>
                        <Text style={styles.logoSubtitle}>
                            Kabupaten Ogan Ilir
                        </Text>
                    </View>

                    {/* Login Card */}
                    <Card style={styles.loginCard} elevation={3}>
                        <Card.Content style={styles.cardContent}>
                            {/* Welcome Header */}
                            <View style={styles.welcomeSection}>
                                <Text style={styles.welcomeTitle}>
                                    Masuk
                                </Text>
                                <Text style={styles.welcomeSubtitle}>
                                    Gunakan akun Anda untuk melanjutkan
                                </Text>
                            </View>

                            {/* Login Form */}
                            <View style={styles.formContainer}>
                                {/* NIK/Email Input */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>NIK atau Email</Text>
                                    <TextInput
                                        value={identifier}
                                        onChangeText={setIdentifier}
                                        mode="flat"
                                        style={styles.input}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        disabled={isLoading}
                                        placeholder="Masukkan NIK atau Email"
                                        underlineColor="transparent"
                                        activeUnderlineColor="#6366f1"
                                        contentStyle={styles.inputContent}
                                        theme={{
                                            colors: {
                                                onSurfaceVariant: '#9ca3af',
                                                surfaceVariant: '#f9fafb',
                                                onSurface: '#9ca3af'
                                            }
                                        }}
                                    />
                                </View>

                                {/* Password Input */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Password</Text>
                                    <TextInput
                                        value={password}
                                        onChangeText={setPassword}
                                        mode="flat"
                                        style={styles.input}
                                        secureTextEntry={!showPassword}
                                        disabled={isLoading}
                                        right={
                                            <TextInput.Icon
                                                icon={showPassword ? 'eye-off' : 'eye'}
                                                onPress={() => setShowPassword(!showPassword)}
                                                color={"#4185fa"}
                                            />
                                        }
                                        placeholder="Masukkan password"
                                        underlineColor="transparent"
                                        activeUnderlineColor="#6366f1"
                                        contentStyle={styles.inputContent}
                                        theme={{
                                            colors: {
                                                onSurfaceVariant: '#9ca3af',
                                                surfaceVariant: '#f9fafb'
                                            }
                                        }}
                                    />
                                </View>

                                {/* Login Button */}
                                <Button
                                    mode="contained"
                                    onPress={handleLogin}
                                    loading={isLoading}
                                    disabled={isLoading || !identifier.trim() || !password.trim()}
                                    style={[
                                        styles.loginButton,
                                        (!identifier.trim() || !password.trim()) && !isLoading
                                            ? styles.loginButtonDisabled
                                            : null
                                    ]}
                                    contentStyle={styles.loginButtonContent}
                                    labelStyle={styles.loginButtonLabel}
                                    buttonColor="#6366f1"
                                    rippleColor="rgba(255,255,255,0.2)"
                                >
                                    {isLoading ? 'Memproses...' : 'Masuk'}
                                </Button>

                                {/* Loading Indicator */}
                                {isLoading && (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="small" color="#6366f1" />
                                        <Text style={styles.loadingText}>
                                            Memverifikasi kredensial...
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </Card.Content>
                    </Card>

                    {/* Footer */}
                    <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                        <Text style={styles.footerText}>
                            © 2024 Sekretariat Daerah Kabupaten Ogan Ilir
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoWrapper: {
        width: 80,
        height: 80,
        borderRadius: 6,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    logo: {
        width: 56,
        height: 56,
    },
    logoTitle: {
        fontSize: 28,
        fontWeight: '600',
        color: '#1f2937',
        textAlign: 'center',
        marginBottom: 4,
        letterSpacing: 1,
    },
    logoSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        fontWeight: '400',
    },
    loginCard: {
        borderRadius: 6,
        marginBottom: 32,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    cardContent: {
        paddingVertical: 32,
        paddingHorizontal: 24,
    },
    welcomeSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 8,
    },
    welcomeSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
    },
    formContainer: {
        gap: 24,
    },
    inputGroup: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#f9fafb',
        borderRadius: 6,
    },
    inputContent: {
        fontSize: 16,
        paddingHorizontal: 16,
    },
    loginButton: {
        borderRadius: 6,
        marginTop: 8,
    },
    loginButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    loginButtonContent: {
        height: 48,
    },
    loginButtonLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        gap: 10,
    },
    loadingText: {
        fontSize: 14,
        color: '#6b7280',
        fontStyle: 'italic',
    },
    footer: {
        alignItems: 'center',
        marginTop: 20,
    },
    footerText: {
        fontSize: 12,
        color: '#9ca3af',
        textAlign: 'center',
    },
});