import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import {
    Portal,
    Modal,
    Button,
    TextInput,
    IconButton,
    Card,
    Avatar,
    RadioButton,
    Divider,
} from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { postTindakLanjut, Laporan, ApiError, getTindakLanjutHistory } from '@/utils/api';
import { useAppTheme } from '@/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TindakLanjutLaporan extends Laporan {
    catatan_disposisi?: string;
    tanggal_disposisi?: string;
    kabbag_umum?: string;
}

interface TindakLanjutDialogProps {
    visible: boolean;
    onDismiss: () => void;
    laporan: TindakLanjutLaporan | null;
    onSuccess: () => void;
}

interface TindakLanjutHistoryItem {
    id_tindak_lanjut: number;
    catatan_tindak_lanjut: string;
    status_tindak_lanjut: string;
    lampiran?: string;
    created_at: string;
    penindak: string;
    jabatan: string;
}

export function TindakLanjutDialog({ visible, onDismiss, laporan, onSuccess }: TindakLanjutDialogProps) {
    const { theme } = useAppTheme();
    const styles = createStyles(theme);

    const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
    const [catatan, setCatatan] = useState('');
    const [statusTindakLanjut, setStatusTindakLanjut] = useState('ditindaklanjuti');
    const [lampiran, setLampiran] = useState<DocumentPicker.DocumentPickerAsset | ImagePicker.ImagePickerAsset | null>(null);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<TindakLanjutHistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const statusOptions = [
        { value: 'ditolak', label: 'Tolak Laporan', icon: 'close-circle', color: theme.colors.error },
        { value: 'ditindaklanjuti', label: 'Sedang Ditindaklanjuti', icon: 'progress-check', color: theme.colors.backdrop },
        { value: 'selesai', label: 'Selesai Ditangani', icon: 'check-circle', color: theme.colors.success },
    ];

    useEffect(() => {
        if (visible && laporan) {
            // Reset form state
            setCatatan('');
            setStatusTindakLanjut(laporan.status_laporan === 'diproses' ? 'ditindaklanjuti' : 'selesai');
            setLampiran(null);
            setActiveTab('form');
            setHistory([]);

            // Load history if needed
            loadHistory();
        }
    }, [visible, laporan]);

    const loadHistory = async () => {
        if (!laporan) return;

        try {
            setHistoryLoading(true);
            const data = await getTindakLanjutHistory(String(laporan.id_laporan));
            setHistory(data);
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const pickFileFromDevice = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets[0]) {
                setLampiran(result.assets[0]);
            }
        } catch (error) {
            console.error('Error picking document:', error);
            Alert.alert('Error', 'Gagal memilih file');
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
        });
        if (!result.canceled && result.assets[0]) {
            setLampiran(result.assets[0]);
        }
    };

    const removeLampiran = () => {
        setLampiran(null);
    };

    const getLampiranName = () => {
        if (!lampiran) return '';
        if ('fileName' in lampiran && lampiran.fileName) return lampiran.fileName;
        if ('name' in lampiran) return lampiran.name;
        return 'file';
    }
    
    const getLampiranSize = () => {
        if (!lampiran) return '';
        let size = 0;
        if ('fileSize' in lampiran && lampiran.fileSize) { // ImagePickerAsset
            size = lampiran.fileSize;
        } else if ('size' in lampiran && lampiran.size) { // DocumentPickerAsset
            size = lampiran.size;
        }
        
        if (size === 0) return '';
        return `${Math.round(size / 1024)} KB`;
    }

    const handleSubmit = async () => {
        if (!laporan) return;

        if (!catatan.trim()) {
            Alert.alert('Validasi Error', 'Catatan tindak lanjut wajib diisi');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                Alert.alert('Error', 'Autentikasi gagal. Silakan login kembali.');
                setLoading(false);
                return;
            }

            const formData = new FormData();
            formData.append('catatan_tindak_lanjut', catatan.trim());
            formData.append('status', statusTindakLanjut);

            if (lampiran && lampiran.uri) {
                formData.append('lampiran', {
                    uri: lampiran.uri,
                    name: getLampiranName(),
                    type: lampiran.mimeType || 'application/octet-stream',
                } as any);
            }

            const API_URL = process.env.EXPO_PUBLIC_API_URL;
            const response = await fetch(`${API_URL}/api/tindaklanjut/${laporan.id_laporan}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Gagal menyimpan tindak lanjut');
            }

            const statusLabel = statusOptions.find(s => s.value === statusTindakLanjut)?.label || 'Diupdate';

            Alert.alert(
                'Tindak Lanjut Berhasil! ✅',
                `Status laporan telah diubah menjadi "${statusLabel}"`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            onDismiss();
                            onSuccess();
                        }
                    }
                ]
            );
        } catch (err: any) {
            console.error('Error tindak lanjut:', err);
            Alert.alert('Error', err.message || 'Terjadi kesalahan saat menyimpan tindak lanjut');
        } finally {
            setLoading(false);
        }
    };

    const getStatusInfo = (status: string) => {
        return statusOptions.find(s => s.value === status) || statusOptions[0];
    };

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={styles.modalContent}
            >
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Tindak Lanjut Laporan</Text>
                    <IconButton
                        icon="close"
                        size={20}
                        onPress={onDismiss}
                        style={styles.closeButton}
                    />
                </View>

                {laporan && (
                    <>
                        {/* Laporan Summary */}
                        <Card style={styles.summaryCard} elevation={1}>
                            <Card.Content style={styles.summaryContent}>
                                <Text style={styles.summaryTitle} numberOfLines={2}>
                                    {laporan.judul_laporan}
                                </Text>
                                <Text style={styles.summaryPelapor}>
                                    Pelapor: {laporan.pelapor}
                                </Text>
                                <Text style={styles.summaryDate}>
                                    {formatDate(laporan.created_at)}
                                </Text>
                                {laporan.catatan_disposisi && (
                                    <View style={styles.disposisiNote}>
                                        <Text style={styles.disposisiLabel}>Catatan Disposisi:</Text>
                                        <Text style={styles.disposisiText}>{laporan.catatan_disposisi}</Text>
                                    </View>
                                )}
                            </Card.Content>
                        </Card>

                        {/* Tab Navigation */}
                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'form' && styles.activeTab]}
                                onPress={() => setActiveTab('form')}
                            >
                                <Text style={[styles.tabText, activeTab === 'form' && styles.activeTabText]}>
                                    Form Tindak Lanjut
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'history' && styles.activeTab]}
                                onPress={() => {
                                    setActiveTab('history');
                                    if (history.length === 0) loadHistory();
                                }}
                            >
                                <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
                                    Riwayat ({history.length})
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
                            {activeTab === 'form' ? (
                                <View style={styles.formContainer}>
                                    {/* Status Selection */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Status Tindak Lanjut *</Text>
                                        <Text style={styles.inputHint}>
                                            Pilih status yang sesuai dengan kondisi penanganan
                                        </Text>
                                        {statusOptions.map((option) => (
                                            <TouchableOpacity
                                                key={option.value}
                                                style={[
                                                    styles.radioOption,
                                                    statusTindakLanjut === option.value && styles.radioOptionSelected
                                                ]}
                                                onPress={() => setStatusTindakLanjut(option.value)}
                                            >
                                                <RadioButton
                                                    value={option.value}
                                                    status={statusTindakLanjut === option.value ? 'checked' : 'unchecked'}
                                                    color={option.color}
                                                />
                                                <View style={styles.radioContent}>
                                                    <IconButton
                                                        icon={option.icon}
                                                        size={20}
                                                        iconColor={option.color}
                                                        style={styles.radioIcon}
                                                    />
                                                    <Text style={[
                                                        styles.radioLabel,
                                                        statusTindakLanjut === option.value && styles.radioLabelSelected
                                                    ]}>
                                                        {option.label}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Catatan */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Catatan Tindak Lanjut *</Text>
                                        <TextInput
                                            value={catatan}
                                            onChangeText={setCatatan}
                                            mode="outlined"
                                            multiline
                                            numberOfLines={4}
                                            placeholder="Jelaskan langkah-langkah yang telah atau akan dilakukan untuk menangani laporan ini..."
                                            style={[styles.textInput, styles.textArea]}
                                            outlineColor={theme.colors.outline}
                                            activeOutlineColor={theme.colors.primary}
                                            maxLength={500}
                                        />
                                        <Text style={styles.charCount}>{catatan.length}/500</Text>
                                    </View>

                                    {/* Lampiran */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Lampiran (Opsional)</Text>
                                        <Text style={styles.inputHint}>
                                            Unggah foto atau dokumen sebagai bukti tindak lanjut
                                        </Text>

                                        {!lampiran ? (
                                            <View style={styles.attachmentOptions}>
                                                <TouchableOpacity style={styles.attachmentButton} onPress={pickCamera}>
                                                    <View style={[styles.attachmentIconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
                                                        <IconButton icon="camera" size={24} iconColor={theme.colors.primary} />
                                                    </View>
                                                    <Text style={styles.attachmentLabel}>Kamera</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity style={styles.attachmentButton} onPress={pickFileFromDevice}>
                                                    <View style={[styles.attachmentIconContainer, { backgroundColor: theme.colors.secondaryContainer }]}>
                                                        <IconButton icon="paperclip" size={24} iconColor={theme.colors.secondary} />
                                                    </View>
                                                    <Text style={styles.attachmentLabel}>Upload</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <View style={styles.filePreview}>
                                                <View style={styles.fileInfo}>
                                                    <IconButton
                                                        icon={lampiran.mimeType?.includes('image') ? 'image' : 'file-document'}
                                                        size={24}
                                                        iconColor={theme.colors.primary}
                                                    />
                                                    <View style={styles.fileDetails}>
                                                        <Text style={styles.fileName} numberOfLines={1}>
                                                            {getLampiranName()}
                                                        </Text>
                                                        <Text style={styles.fileSize}>
                                                            {getLampiranSize()}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <IconButton
                                                    icon="close"
                                                    size={20}
                                                    onPress={removeLampiran}
                                                    iconColor={theme.colors.error}
                                                />
                                            </View>
                                        )}
                                    </View>

                                    {/* Submit Button */}
                                    <Button
                                        mode="contained"
                                        onPress={handleSubmit}
                                        loading={loading}
                                        disabled={loading || !catatan.trim()}
                                        style={styles.submitButton}
                                        contentStyle={styles.submitButtonContent}
                                        buttonColor={theme.colors.primary}
                                    >
                                        Simpan Tindak Lanjut
                                    </Button>
                                </View>
                            ) : (
                                <View style={styles.historyContainer}>
                                    {historyLoading ? (
                                        <View style={styles.historyLoading}>
                                            <Text style={styles.loadingText}>Memuat riwayat...</Text>
                                        </View>
                                    ) : history.length === 0 ? (
                                        <View style={styles.emptyHistory}>
                                            <IconButton
                                                icon="clipboard-text-outline"
                                                size={48}
                                                iconColor={theme.colors.onSurfaceVariant}
                                            />
                                            <Text style={styles.emptyHistoryText}>
                                                Belum ada riwayat tindak lanjut
                                            </Text>
                                        </View>
                                    ) : (
                                        history.map((item, index) => (
                                            <View key={item.id_tindak_lanjut}>
                                                <View style={styles.historyItem}>
                                                    <View style={styles.historyHeader}>
                                                        <Avatar.Text
                                                            size={36}
                                                            label={getInitials(item.penindak)}
                                                            style={styles.historyAvatar}
                                                        />
                                                        <View style={styles.historyInfo}>
                                                            <Text style={styles.historyPenindak}>
                                                                {item.penindak}
                                                            </Text>
                                                            <Text style={styles.historyJabatan}>
                                                                {item.jabatan}
                                                            </Text>
                                                            <Text style={styles.historyDate}>
                                                                {formatDate(item.created_at)}
                                                            </Text>
                                                        </View>
                                                        <View style={styles.historyStatus}>
                                                            {(() => {
                                                                const statusInfo = getStatusInfo(item.status_tindak_lanjut);
                                                                return (
                                                                    <View style={[
                                                                        styles.statusBadge,
                                                                        { backgroundColor: statusInfo.color + '20' }
                                                                    ]}>
                                                                        <IconButton
                                                                            icon={statusInfo.icon}
                                                                            size={16}
                                                                            iconColor={statusInfo.color}
                                                                            style={styles.statusIcon}
                                                                        />
                                                                        <Text style={[
                                                                            styles.statusBadgeText,
                                                                            { color: statusInfo.color }
                                                                        ]}>
                                                                            {statusInfo.label}
                                                                        </Text>
                                                                    </View>
                                                                );
                                                            })()}
                                                        </View>
                                                    </View>
                                                    {item.catatan_tindak_lanjut && (
                                                        <Text style={styles.historyCatatan}>
                                                            {item.catatan_tindak_lanjut}
                                                        </Text>
                                                    )}
                                                    {item.lampiran && (
                                                        <View style={styles.historyLampiran}>
                                                            <IconButton
                                                                icon="paperclip"
                                                                size={16}
                                                                iconColor={theme.colors.primary}
                                                            />
                                                            <Text style={styles.lampiranText}>
                                                                Ada lampiran
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                                {index < history.length - 1 && <Divider style={styles.historyDivider} />} 
                                            </View>
                                        ))
                                    )}
                                </View>
                            )}
                        </ScrollView>
                    </>
                )}
            </Modal>
        </Portal>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    modalContent: {
        backgroundColor: theme.colors.surface,
        margin: 16,
        borderRadius: 16,
        maxHeight: '90%',
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outline,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.onSurface,
    },
    closeButton: {
        margin: 0,
    },
    summaryCard: {
        backgroundColor: theme.colors.primaryContainer,
        borderRadius: 12,
        margin: 20,
        marginBottom: 16,
    },
    summaryContent: {
        padding: 16,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.onSurface,
        marginBottom: 8,
        lineHeight: 22,
    },
    summaryPelapor: {
        fontSize: 14,
        color: theme.colors.onSurfaceVariant,
        marginBottom: 4,
    },
    summaryDate: {
        fontSize: 12,
        color: theme.colors.onSurfaceVariant,
    },
    disposisiNote: {
        marginTop: 12,
        padding: 8,
        backgroundColor: theme.colors.secondaryContainer,
        borderRadius: 8,
    },
    disposisiLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.onSecondaryContainer,
        marginBottom: 4,
    },
    disposisiText: {
        fontSize: 13,
        color: theme.colors.onSecondaryContainer,
        fontStyle: 'italic',
    },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: theme.colors.surfaceVariant,
        borderRadius: 8,
        marginHorizontal: 2,
    },
    activeTab: {
        backgroundColor: theme.colors.primary,
    },
    tabText: {
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.onSurfaceVariant,
    },
    activeTabText: {
        color: 'white',
        fontWeight: '600',
    },
    tabContent: {
        flex: 1,
        paddingHorizontal: 20,
    },
    formContainer: {
        paddingBottom: 20,
    },
    inputGroup: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.onSurface,
        marginBottom: 8,
    },
    inputHint: {
        fontSize: 12,
        color: theme.colors.onSurfaceVariant,
        marginBottom: 12,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: theme.colors.outline,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: theme.colors.surface,
    },
    radioOptionSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryContainer + '40',
    },
    radioContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginLeft: 8,
    },
    radioIcon: {
        margin: 0,
        marginRight: 8,
    },
    radioLabel: {
        fontSize: 14,
        color: theme.colors.onSurface,
        flex: 1,
    },
    radioLabelSelected: {
        fontWeight: '600',
        color: theme.colors.primary,
    },
    textInput: {
        backgroundColor: theme.colors.surface,
        fontSize: 16,
    },
    textArea: {
        minHeight: 100,
    },
    charCount: {
        fontSize: 12,
        color: theme.colors.onSurfaceVariant,
        textAlign: 'right',
        marginTop: 4,
    },
    attachmentOptions: {
        flexDirection: 'row',
        gap: 16,
        justifyContent: 'space-evenly',
        marginBottom: 16,
    },
    attachmentButton: {
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    attachmentIconContainer: {
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: theme.colors.outline,
        alignItems: 'center',
        width: '100%',
    },
    attachmentLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: theme.colors.onSurfaceVariant,
    },
    filePreview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: theme.colors.surfaceVariant,
        borderRadius: 8,
    },
    fileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    fileDetails: {
        flex: 1,
        marginLeft: 8,
    },
    fileName: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.onSurface,
    },
    fileSize: {
        fontSize: 12,
        color: theme.colors.onSurfaceVariant,
    },
    submitButton: {
        borderRadius: 12,
        marginTop: 16,
    },
    submitButtonContent: {
        paddingVertical: 8,
    },

    // History Styles
    historyContainer: {
        paddingBottom: 20,
    },
    historyLoading: {
        padding: 40,
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 14,
        color: theme.colors.onSurfaceVariant,
    },
    emptyHistory: {
        padding: 40,
        alignItems: 'center',
    },
    emptyHistoryText: {
        fontSize: 14,
        color: theme.colors.onSurfaceVariant,
        textAlign: 'center',
        marginTop: 8,
    },
    historyItem: {
        paddingVertical: 16,
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    historyAvatar: {
        backgroundColor: theme.colors.primary,
    },
    historyInfo: {
        flex: 1,
        marginLeft: 12,
    },
    historyPenindak: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.onSurface,
    },
    historyJabatan: {
        fontSize: 12,
        color: theme.colors.onSurfaceVariant,
        marginTop: 2,
    },
    historyDate: {
        fontSize: 11,
        color: theme.colors.onSurfaceVariant,
        marginTop: 4,
    },
    historyStatus: {
        marginLeft: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusIcon: {
        margin: 0,
        marginRight: 4,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    historyCatatan: {
        fontSize: 14,
        color: theme.colors.onSurface,
        lineHeight: 20,
        marginBottom: 8,
        paddingLeft: 48,
    },
    historyLampiran: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 48,
        marginTop: 4,
    },
    lampiranText: {
        fontSize: 12,
        color: theme.colors.primary,
        fontWeight: '500',
    },
    historyDivider: {
        marginVertical: 8,
        backgroundColor: theme.colors.outline,
    },
});