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

// Improved Storage abstraction with error handling
const Storage = {
    async setItem(key: string, value: string): Promise<void> {
        try {
            if (Platform.OS === 'web') {
                localStorage.setItem(key, value);
            } else {
                await AsyncStorage.setItem(key, value);
            }
        } catch (error) {
            console.error('Storage setItem error:', error);
            throw error;
        }
    },

    async getItem(key: string): Promise<string | null> {
        try {
            if (Platform.OS === 'web') {
                return localStorage.getItem(key);
            } else {
                return await AsyncStorage.getItem(key);
            }
        } catch (error) {
            console.error('Storage getItem error:', error);
            return null;
        }
    },

    async removeItem(key: string): Promise<void> {
        try {
            if (Platform.OS === 'web') {
                localStorage.removeItem(key);
            } else {
                await AsyncStorage.removeItem(key);
            }
        } catch (error) {
            console.error('Storage removeItem error:', error);
            throw error;
        }
    }
};

// Enhanced cross-platform alert
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

// Enhanced API login function with timeout and better error handling
const apiLogin = async (data: { identifier: string; password: string }): Promise<Response> => {
    const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

    if (!API_BASE_URL) {
        throw new Error('API URL tidak dikonfigurasi. Periksa file .env');
    }

    console.log('Attempting login with URL:', `${API_BASE_URL}/api/auth/login`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(data),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout. Periksa koneksi internet dan server.');
            }
            throw error;
        }
        throw new Error('Network error occurred');
    }
};

export default function LoginScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        // Basic input validation
        if (!identifier.trim() || !password.trim()) {
            showAlert(
                'Input Tidak Valid',
                'NIP/Email dan password wajib diisi.'
            );
            return;
        }

        console.log('Starting login process...');
        setIsLoading(true);

        try {
            console.log('Sending login request...');
            const response = await apiLogin({
                identifier: identifier.trim(),
                password,
            });

            console.log('Login response status:', response.status);

            if (!response.ok) {
                let errorMessage = 'Login gagal';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData?.message || `HTTP error! status: ${response.status}`;
                } catch (parseError) {
                    errorMessage = `HTTP error! status: ${response.status}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('Login response data:', { ...data, token: data.token ? '[HIDDEN]' : 'null' });

            if (data.success && data.token) {
                console.log('Login successful, storing user data...');

                // Store user data using cross-platform storage
                await Storage.setItem('userToken', data.token);
                await Storage.setItem('userData', JSON.stringify(data.user));
                await Storage.setItem('userRole', data.user.role);

                const jabatan = data.user.jabatan;
                const role = data.user.role;

                // Determine route based on role
                let route: string;
                switch (role) {
                    case 'bupati':
                        route = '/(app)/(bupati)/home';
                        break;
                    case 'kabbag_umum':
                        route = '/(app)/(kabbag-umum)/home';
                        break;
                    case 'subbag_umum':
                        route = '/(app)/(subbag-umum)/home';
                        break;
                    case 'pelapor':
                        route = '/(app)/(pelapor)/home';
                        break;
                    default:
                        route = '/(app)/(pegawai)/home';
                        break;
                }

                console.log('Navigating to route:', route);

                showAlert(
                    'Login Berhasil',
                    `Selamat datang, ${data.user?.nama || 'User'}! Anda masuk sebagai ${jabatan || role}`,
                    () => {
                        setTimeout(() => {
                            try {
                                router.replace(route as any);
                            } catch (routeError) {
                                console.error('Route error:', routeError);
                                router.replace('/(app)/(pegawai)/home' as any);
                            }
                        }, 100);
                    }
                );
            } else {
                console.log('Login failed - invalid response:', data);
                showAlert(
                    'Login Gagal',
                    data.message || 'Login tidak berhasil. Silakan coba lagi.'
                );
            }
        } catch (error: any) {
            console.error('Login error details:', {
                name: error?.name,
                message: error?.message,
                stack: error?.stack
            });

            let errorMessage = 'Terjadi kesalahan saat login.';

            if (error.message?.includes('timeout') || error.message?.includes('Request timeout')) {
                errorMessage = 'Request timeout. Periksa koneksi internet dan pastikan server aktif.';
            } else if (error.message?.includes('Network request failed') || error.message?.includes('fetch')) {
                errorMessage = 'Tidak dapat terhubung ke server. Pastikan server backend aktif dan koneksi internet stabil.';
            } else if (error.message?.includes('API URL tidak dikonfigurasi')) {
                errorMessage = 'Konfigurasi API tidak ditemukan. Hubungi administrator.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            showAlert('Error Koneksi', errorMessage);
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
                                {/* NIP/Email Input */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>NIP atau Email</Text>
                                    <TextInput
                                        value={identifier}
                                        onChangeText={setIdentifier}
                                        mode="flat"
                                        style={styles.input}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        disabled={isLoading}
                                        placeholder="Masukkan NIP atau Email"
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