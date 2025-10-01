import { Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react';
import {
    KeyboardAvoidingView,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { ActivityIndicator, Button, Card, Text, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Storage, apiLogin } from '@/utils/auth';
import { useAppTheme } from '@/context/ThemeContext';
import { Notification } from '@/components/Notification';
import { useNotification } from '@/hooks/use-notification';

export default function LoginScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useAppTheme();
    const { notification, showSuccess, showError, hideNotification } = useNotification();

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const styles = useMemo(() => StyleSheet.create({
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
            backgroundColor: theme.colors.surface,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
            shadowColor: theme.colors.shadow,
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
            color: theme.colors.onSurface,
            textAlign: 'center',
            marginBottom: 4,
            letterSpacing: 1,
        },
        logoSubtitle: {
            fontSize: 14,
            color: theme.colors.onSurfaceVariant,
            textAlign: 'center',
            fontWeight: '400',
        },
        loginCard: {
            borderRadius: 6,
            marginBottom: 32,
            backgroundColor: theme.colors.surface,
            shadowColor: theme.colors.shadow,
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
            color: theme.colors.onSurface,
            marginBottom: 8,
        },
        welcomeSubtitle: {
            fontSize: 14,
            color: theme.colors.onSurfaceVariant,
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
            color: theme.colors.onSurface,
            fontWeight: '500',
            marginLeft: 4,
        },
        input: {
            backgroundColor: theme.colors.background,
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
        loginButtonContent: {
            height: 48,
        },
        loginButtonLabel: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.onPrimary,
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
            color: theme.colors.onSurfaceVariant,
            fontStyle: 'italic',
        },
        footer: {
            alignItems: 'center',
            marginTop: 20,
        },
        footerText: {
            fontSize: 12,
            color: theme.colors.onSurfaceVariant,
            textAlign: 'center',
        },
    }), [theme]);

    const handleLogin = async () => {
        // Basic input validation
        if (!identifier.trim() || !password.trim()) {
            showError('NIP/Email dan password wajib diisi.');
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
                    case 'kabbag':
                        route = '/(app)/(kabbag)/home';
                        break;
                    case 'pelapor':
                        route = '/(app)/(pelapor)/home';
                        break;
                    default:
                        route = '/(app)/(pelapor)/home';
                        break;
                }

                console.log('Navigating to route:', route);

                // Show success notification
                showSuccess(`Selamat datang, ${data.user?.nama || 'User'}! Anda masuk sebagai ${jabatan || role}`);

                // Navigate after a short delay
                setTimeout(() => {
                    try {
                        router.replace(route as any);
                    } catch (routeError) {
                        console.error('Route error:', routeError);
                        router.replace('/(app)/(pelapor)/home' as any);
                    }
                }, 1500);
            } else {
                console.log('Login failed - invalid response:', data);
                showError(data.message || 'Login tidak berhasil. Silakan coba lagi.');
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

            showError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={[theme.colors.background, theme.colors.background]}
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
                            PELAKOR OGAN ILIR
                        </Text>
                        <Text style={styles.logoSubtitle}>
                            Pelayanan Laporan Online Terpadu
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
                                        activeUnderlineColor={theme.colors.primary}
                                        contentStyle={styles.inputContent}
                                        theme={{
                                            colors: {
                                                onSurfaceVariant: theme.colors.onSurfaceVariant,
                                                surfaceVariant: theme.colors.background,
                                                onSurface: theme.colors.onSurfaceVariant
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
                                                color={theme.colors.primary}
                                            />
                                        }
                                        placeholder="Masukkan password"
                                        underlineColor="transparent"
                                        activeUnderlineColor={theme.colors.primary}
                                        contentStyle={styles.inputContent}
                                        theme={{
                                            colors: {
                                                onSurfaceVariant: theme.colors.onSurfaceVariant,
                                                surfaceVariant: theme.colors.background
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
                                    style={styles.loginButton}
                                    contentStyle={styles.loginButtonContent}
                                    labelStyle={styles.loginButtonLabel}
                                    buttonColor={theme.colors.primary}
                                    textColor={theme.colors.onPrimary}
                                    rippleColor="rgba(255,255,255,0.2)"
                                >
                                    {isLoading ? 'Memproses...' : 'Masuk'}
                                </Button>

                                {/* Loading Indicator */}
                                {isLoading && (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="small" color={theme.colors.primary} />
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

            {/* Notification Component */}
            <Notification
                visible={notification.visible}
                message={notification.message}
                type={notification.type}
                onDismiss={hideNotification}
                duration={4000}
            />
        </LinearGradient>
    );
}