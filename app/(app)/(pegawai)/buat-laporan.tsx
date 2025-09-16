import React, { useEffect, useState } from 'react';
import { View, Alert, Image, ScrollView, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { TextInput, Button, IconButton, Card, Chip, Portal, Modal } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL;

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
    // Light colors
    blue50: '#eff6ff',
    blue100: '#dbeafe',
    green50: '#f0fdf4',
    amber50: '#fffbeb',
};

const categories = [
    { label: 'Makan & Minum', value: 'konsumsi', icon: 'food', color: theme.accent },
    { label: 'Kebutuhan', value: 'kebutuhan', icon: 'pen', color: theme.primary },
    { label: 'Kerusakan', value: 'kerusakan', icon: 'alert-circle', color: theme.error },
];

export default function BuatLaporanScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [judul_laporan, setJudul] = useState('');
    const [isi_laporan, setDeskripsi] = useState('');
    const [kategori, setKategori] = useState('');
    const [lampiran, setLampiran] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    useEffect(() => {
        if (params.title) {
            setJudul(params.title as string);
        }
        if (params.category) {
            setKategori(params.category as string);
        }
    }, [params]);

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                copyToCacheDirectory: true,
            });
            if (!result.canceled) {
                setLampiran(result.assets[0]);
            }
        } catch (error) {
            console.error('Error picking document:', error);
            Alert.alert('Error', 'Gagal memilih dokumen.');
        }
    };

    const pickCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Izin ditolak', 'Akses kamera dibutuhkan untuk ambil foto.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
            aspect: [4, 3],
        });
        if (!result.canceled) {
            setLampiran(result.assets[0]);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Izin ditolak', 'Akses galeri dibutuhkan untuk pilih foto.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
            aspect: [4, 3],
        });
        if (!result.canceled) {
            setLampiran(result.assets[0]);
        }
    };

    const clearLampiran = () => setLampiran(null);

    const handleSubmit = async () => {
        if (!judul_laporan.trim() || !isi_laporan.trim()) {
            Alert.alert('Validasi Error', 'Judul dan Deskripsi wajib diisi');
            return;
        }
        if (!kategori) {
            Alert.alert('Validasi Error', 'Pilih kategori laporan');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                Alert.alert('Error', 'Anda belum login');
                setLoading(false);
                return;
            }

            const formData = new FormData();
            formData.append('judul_laporan', judul_laporan.trim());
            formData.append('isi_laporan', isi_laporan.trim());
            formData.append('kategori', kategori);

            if (lampiran) {
                formData.append('lampiran', {
                    uri: lampiran.uri,
                    name: lampiran.name || `lampiran.${lampiran.mimeType?.split('/')[1] || 'jpg'}`,
                    type: lampiran.mimeType || 'image/jpeg'
                } as any);
            }

            const response = await fetch(`${API_URL}/laporan`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
                body: formData
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Gagal membuat laporan');
            }

            Alert.alert(
                'Laporan Berhasil Dibuat! ✅',
                'Laporan Anda telah diterima dan akan segera diproses oleh tim terkait.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setJudul('');
                            setDeskripsi('');
                            setKategori('');
                            setLampiran(null);
                            router.back();
                        }
                    }
                ]
            );
        } catch (err: any) {
            console.error(err);
            Alert.alert('Error', err.message || 'Terjadi kesalahan saat mengirim laporan');
        } finally {
            setLoading(false);
        }
    };

    const getCategoryLabel = (value: string) => {
        return categories.find(cat => cat.value === value)?.label || value;
    };

    return (
        <View style={styles.container}>
            {/* Header with Gradient */}
            <LinearGradient
                colors={[theme.gradientStart, theme.gradientEnd]}
                style={styles.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerTop}>
                        <IconButton
                            icon="arrow-left"
                            size={24}
                            iconColor="white"
                            onPress={() => router.back()}
                            style={styles.backButton}
                        />
                        <Text style={styles.headerTitle}>Buat Laporan Baru</Text>
                        <View style={styles.placeholder} />
                    </View>
                    <Text style={styles.headerSubtitle}>
                        Sampaikan keluhan atau permintaan Anda dengan detail yang jelas
                    </Text>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Form Card */}
                <Card style={styles.formCard} elevation={3}>
                    <Card.Content style={styles.formContent}>
                        {/* Judul Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Judul Laporan *</Text>
                            <TextInput
                                value={judul_laporan}
                                onChangeText={setJudul}
                                mode="outlined"
                                placeholder="Contoh: Kerusakan AC di Ruang Meeting A"
                                style={styles.textInput}
                                outlineColor={theme.subtle}
                                activeOutlineColor={theme.primary}
                                maxLength={100}
                            />
                            <Text style={styles.charCount}>{judul_laporan.length}/100</Text>
                        </View>

                        {/* Kategori Selection */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Kategori *</Text>
                            <TouchableOpacity
                                style={styles.categorySelector}
                                onPress={() => setShowCategoryModal(true)}
                            >
                                <View style={styles.categorySelectorContent}>
                                    {kategori ? (
                                        <View style={styles.selectedCategoryContainer}>
                                            <IconButton
                                                icon={categories.find(c => c.value === kategori)?.icon || 'help-circle'}
                                                size={20}
                                                iconColor={categories.find(c => c.value === kategori)?.color}
                                                style={styles.categoryIcon}
                                            />
                                            <Text style={styles.selectedCategoryText}>
                                                {getCategoryLabel(kategori)}
                                            </Text>
                                        </View>
                                    ) : (
                                        <Text style={styles.categoryPlaceholder}>Pilih kategori laporan</Text>
                                    )}
                                    <IconButton icon="chevron-down" size={20} iconColor={theme.subtle} />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Deskripsi Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Deskripsi Detail *</Text>
                            <TextInput
                                value={isi_laporan}
                                onChangeText={setDeskripsi}
                                mode="outlined"
                                multiline
                                numberOfLines={5}
                                placeholder="Jelaskan masalah atau permintaan Anda secara detail..."
                                style={[styles.textInput, styles.textArea]}
                                outlineColor={theme.subtle}
                                activeOutlineColor={theme.primary}
                                maxLength={500}
                            />
                            <Text style={styles.charCount}>{isi_laporan.length}/500</Text>
                        </View>

                        {/* Attachment Section */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Lampiran (Opsional)</Text>
                            <Text style={styles.inputHint}>
                                Tambahkan foto atau dokumen pendukung
                            </Text>

                            <View style={styles.attachmentOptions}>
                                <TouchableOpacity style={styles.attachmentButton} onPress={pickCamera}>
                                    <View style={[styles.attachmentIconContainer, { backgroundColor: theme.blue50 }]}>
                                        <IconButton icon="camera" size={24} iconColor={theme.accent} />
                                    </View>
                                    <Text style={styles.attachmentLabel}>Kamera</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.attachmentButton} onPress={pickImage}>
                                    <View style={[styles.attachmentIconContainer, { backgroundColor: theme.green50 }]}>
                                        <IconButton icon="image" size={24} iconColor={theme.success} />
                                    </View>
                                    <Text style={styles.attachmentLabel}>Galeri</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.attachmentButton} onPress={pickDocument}>
                                    <View style={[styles.attachmentIconContainer, { backgroundColor: theme.amber50 }]}>
                                        <IconButton icon="file-document" size={24} iconColor={theme.warning} />
                                    </View>
                                    <Text style={styles.attachmentLabel}>Dokumen</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Attachment Preview */}
                            {lampiran && (
                                <Card style={styles.attachmentPreview} elevation={1}>
                                    <Card.Content style={styles.attachmentPreviewContent}>
                                        <View style={styles.attachmentInfo}>
                                            {lampiran.mimeType?.startsWith('image') ? (
                                                <Image
                                                    source={{ uri: lampiran.uri }}
                                                    style={styles.attachmentImage}
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <View style={styles.attachmentFileIcon}>
                                                    <IconButton
                                                        icon="file-document"
                                                        size={32}
                                                        iconColor={theme.primary}
                                                    />
                                                </View>
                                            )}
                                            <View style={styles.attachmentDetails}>
                                                <Text style={styles.attachmentName} numberOfLines={1}>
                                                    {lampiran.name}
                                                </Text>
                                                <Text style={styles.attachmentSize}>
                                                    {lampiran.size ? `${(lampiran.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                                                </Text>
                                            </View>
                                        </View>
                                        <IconButton
                                            icon="close-circle"
                                            size={24}
                                            iconColor={theme.error}
                                            onPress={clearLampiran}
                                        />
                                    </Card.Content>
                                </Card>
                            )}
                        </View>
                    </Card.Content>
                </Card>

                {/* Submit Button */}
                <Card style={styles.submitCard} elevation={2}>
                    <Card.Content style={styles.submitContent}>
                        <Button
                            mode="contained"
                            onPress={handleSubmit}
                            loading={loading}
                            disabled={loading || !judul_laporan.trim() || !isi_laporan.trim() || !kategori}
                            style={styles.submitButton}
                            contentStyle={styles.submitButtonContent}
                            buttonColor={theme.primary}
                        >
                            <Text style={styles.submitButtonText}>
                                {loading ? 'Mengirim Laporan...' : 'Kirim Laporan'}
                            </Text>
                        </Button>

                        <Text style={styles.submitHint}>
                            Pastikan semua informasi sudah benar sebelum mengirim
                        </Text>
                    </Card.Content>
                </Card>
            </ScrollView>

            {/* Category Selection Modal */}
            <Portal>
                <Modal
                    visible={showCategoryModal}
                    onDismiss={() => setShowCategoryModal(false)}
                    contentContainerStyle={styles.modalContent}
                >
                    <Text style={styles.modalTitle}>Pilih Kategori Laporan</Text>
                    <ScrollView style={styles.categoryList}>
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category.value}
                                style={[
                                    styles.categoryItem,
                                    kategori === category.value && styles.categoryItemSelected
                                ]}
                                onPress={() => {
                                    setKategori(category.value);
                                    setShowCategoryModal(false);
                                }}
                            >
                                <View style={styles.categoryItemContent}>
                                    <IconButton
                                        icon={category.icon}
                                        size={24}
                                        iconColor={category.color}
                                        style={styles.categoryItemIcon}
                                    />
                                    <Text style={[
                                        styles.categoryItemText,
                                        kategori === category.value && styles.categoryItemTextSelected
                                    ]}>
                                        {category.label}
                                    </Text>
                                </View>
                                {kategori === category.value && (
                                    <IconButton icon="check" size={20} iconColor={theme.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </Modal>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    headerGradient: {
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20,
    },
    headerContent: {
        gap: 12,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        margin: 0,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        flex: 1,
        textAlign: 'center',
    },
    placeholder: {
        width: 40,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
    },

    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 100,
    },

    formCard: {
        backgroundColor: theme.surface,
        borderRadius: 16,
        marginBottom: 16,
    },
    formContent: {
        padding: 20,
    },

    inputGroup: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 8,
    },
    inputHint: {
        fontSize: 12,
        color: theme.subtle,
        marginBottom: 12,
    },
    textInput: {
        backgroundColor: theme.surface,
        fontSize: 16,
    },
    textArea: {
        minHeight: 120,
    },
    charCount: {
        fontSize: 12,
        color: theme.subtle,
        textAlign: 'right',
        marginTop: 4,
    },

    categorySelector: {
        borderWidth: 1,
        borderColor: theme.subtle,
        borderRadius: 8,
        backgroundColor: theme.surface,
    },
    categorySelectorContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    selectedCategoryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    categoryIcon: {
        margin: 0,
        marginRight: 8,
    },
    selectedCategoryText: {
        fontSize: 16,
        color: theme.text,
        fontWeight: '500',
    },
    categoryPlaceholder: {
        fontSize: 16,
        color: theme.subtle,
    },
    attachmentOptions: {
        flexDirection: 'row',
        gap: 16,
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    attachmentButton: {
        alignItems: 'center',
        gap: 8,
    },
    attachmentIconContainer: {
        borderRadius: 16,
        padding: 8,
    },
    attachmentLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: theme.textSecondary,
    },

    attachmentPreview: {
        backgroundColor: theme.blue50,
        borderRadius: 12,
        marginTop: 8,
    },
    attachmentPreviewContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
    },
    attachmentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    attachmentImage: {
        width: 48,
        height: 48,
        borderRadius: 8,
    },
    attachmentFileIcon: {
        width: 48,
        height: 48,
        backgroundColor: theme.surface,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    attachmentDetails: {
        flex: 1,
    },
    attachmentName: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.text,
    },
    attachmentSize: {
        fontSize: 12,
        color: theme.subtle,
    },

    submitCard: {
        backgroundColor: theme.surface,
        borderRadius: 16,
    },
    submitContent: {
        padding: 20,
        alignItems: 'center',
    },
    submitButton: {
        width: '100%',
        borderRadius: 12,
    },
    submitButtonContent: {
        paddingVertical: 8,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    submitHint: {
        fontSize: 12,
        color: theme.subtle,
        textAlign: 'center',
        marginTop: 12,
    },

    // Modal styles
    modalContent: {
        backgroundColor: theme.surface,
        margin: 20,
        borderRadius: 16,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text,
        textAlign: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    categoryList: {
        maxHeight: 400,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    categoryItemSelected: {
        backgroundColor: theme.blue50,
    },
    categoryItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    categoryItemIcon: {
        margin: 0,
        marginRight: 12,
    },
    categoryItemText: {
        fontSize: 16,
        color: theme.text,
    },
    categoryItemTextSelected: {
        fontWeight: '600',
        color: theme.primary,
    },
});