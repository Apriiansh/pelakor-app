import React from 'react';
import { View, StyleSheet, Image, Linking, Alert, TouchableOpacity } from 'react-native';
import {
    ActivityIndicator,
    Button,
    Dialog,
    Portal,
    Text,
    Divider,
    Surface,
} from 'react-native-paper';
import { useAppTheme } from '@/context/ThemeContext';
import { getFileUrl, type Laporan, type DisposisiHistory, type TindakLanjutHistory } from '@/utils/api';

// Helper untuk memeriksa jenis lampiran dari URL
const getAttachmentInfo = (url: string): { type: 'image' | 'pdf' | 'document', extension: string } => {
    if (!url) return { type: 'document', extension: '' };

    // Ambil bagian setelah titik terakhir, dan sebelum query parameter
    const path = url.split('?')[0];
    const extension = path.split('.').pop()?.toLowerCase() || '';

    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(extension)) {
        return { type: 'image', extension };
    }
    if (extension === 'pdf') {
        return { type: 'pdf', extension };
    }
    return { type: 'document', extension };
};

const handleOpenAttachment = async (url: string | null) => {
    if (!url) return;
    try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            Alert.alert('Error', `Tidak dapat membuka URL: ${url}`);
        }
    } catch (error) {
        Alert.alert('Error', 'Gagal membuka lampiran.');
    }
};

interface DetailLaporanDialogProps {
    visible: boolean;
    laporan: Laporan | null;
    disposisiHistory: DisposisiHistory[];
    tindakLanjutHistory: TindakLanjutHistory[];
    loading: boolean;
    onDismiss: () => void;
    onEdit: (laporan: Laporan) => void;
    onDelete: (laporan: Laporan) => void;
    getStatusColor: (status: string) => string;
    formatDate: (date: string) => string;
}

export const DetailLaporanDialog = ({
    visible,
    laporan,
    disposisiHistory,
    tindakLanjutHistory,
    loading,
    onDismiss,
    onEdit,
    onDelete,
    getStatusColor,
    formatDate,
}: DetailLaporanDialogProps) => {
    const { theme } = useAppTheme();

    if (!laporan) return null;

    const fullAttachmentUrl = getFileUrl(laporan.lampiran);
    const attachmentInfo = fullAttachmentUrl ? getAttachmentInfo(fullAttachmentUrl) : null;

    return (
        <Portal>
            <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
                <Dialog.Title style={styles.dialogTitle}>{laporan.judul_laporan}</Dialog.Title>
                <Dialog.ScrollArea>
                    <Dialog.Content>
                        {loading ? (
                            <View style={styles.dialogLoading}>
                                <ActivityIndicator animating size="small" />
                                <Text style={{ marginLeft: 12 }}>Memuat detail...</Text>
                            </View>
                        ) : (
                            <>
                                {/* Basic Info */}
                                <View style={styles.detailSection}>
                                    <Text variant="labelLarge" style={styles.sectionTitle}>
                                        Informasi Laporan
                                    </Text>
                                    <Text variant="bodyMedium" style={styles.detailText}>
                                        <Text style={styles.boldText}>Status:</Text>{' '}
                                        <Text style={{ color: getStatusColor(laporan.status_laporan) }}>
                                            {laporan.status_laporan.toUpperCase()}
                                        </Text>
                                    </Text>
                                    <Text variant="bodyMedium" style={styles.detailText}>
                                        <Text style={styles.boldText}>Dibuat:</Text>{' '}
                                        {formatDate(laporan.created_at)}
                                    </Text>
                                    {laporan.kategori && (
                                        <Text variant="bodyMedium" style={styles.detailText}>
                                            <Text style={styles.boldText}>Kategori:</Text> {laporan.kategori}
                                        </Text>
                                    )}
                                </View>

                                <Divider style={styles.divider} />

                                {/* Isi Laporan */}
                                <View style={styles.detailSection}>
                                    <Text variant="labelLarge" style={styles.sectionTitle}>
                                        Isi Laporan
                                    </Text>
                                    <Surface style={styles.contentSurface} elevation={0}>
                                        <Text variant="bodyMedium" style={styles.contentText}>
                                            {laporan.isi_laporan}
                                        </Text>
                                    </Surface>
                                </View>

                                {/* Lampiran Section */}
                                {fullAttachmentUrl && attachmentInfo && (
                                    <>
                                        <Divider style={styles.divider} />
                                        <View style={styles.detailSection}>
                                            <Text variant="labelLarge" style={styles.sectionTitle}>
                                                Lampiran
                                            </Text>
                                            {attachmentInfo.type === 'image' ? (
                                                <TouchableOpacity onPress={() => handleOpenAttachment(fullAttachmentUrl)}>
                                                    <Image
                                                        source={{ uri: fullAttachmentUrl }}
                                                        style={styles.lampiranImage}
                                                        resizeMode="cover"
                                                    />
                                                </TouchableOpacity>
                                            ) : (
                                                <Button
                                                    icon={attachmentInfo.type === 'pdf' ? 'file-pdf-box' : 'file-document'}
                                                    mode="outlined"
                                                    onPress={() => handleOpenAttachment(fullAttachmentUrl)}
                                                    style={{ alignSelf: 'flex-start' }}
                                                >
                                                    Lihat Lampiran ({attachmentInfo.extension.toUpperCase()})
                                                </Button>
                                            )}
                                        </View>
                                    </>
                                )}

                                {/* Disposisi History */}
                                {disposisiHistory.length > 0 && (
                                    <>
                                        <Divider style={styles.divider} />
                                        <View style={styles.detailSection}>
                                            <Text variant="labelLarge" style={styles.sectionTitle}>
                                                Riwayat Disposisi
                                            </Text>
                                            {disposisiHistory.map((item, index) => (
                                                <Surface key={index} style={styles.historyItem} elevation={1}>
                                                    <Text variant="bodySmall" style={styles.historyDate}>
                                                        {formatDate(item.created_at)}
                                                    </Text>
                                                    <Text variant="bodyMedium" style={styles.historyText}>
                                                        <Text style={styles.boldText}>{item.kabbag}</Text>
                                                        {item.penanggung_jawab && ` → ${item.penanggung_jawab}`}
                                                    </Text>
                                                    {item.catatan && (
                                                        <Text variant="bodySmall" style={styles.historyCatatan}>
                                                            {item.catatan}
                                                        </Text>
                                                    )}
                                                </Surface>
                                            ))}
                                        </View>
                                    </>
                                )}

                                {/* Tindak Lanjut History */}
                                {tindakLanjutHistory.length > 0 && (
                                    <>
                                        <Divider style={styles.divider} />
                                        <View style={styles.detailSection}>
                                            <Text variant="labelLarge" style={styles.sectionTitle}>
                                                Riwayat Tindak Lanjut
                                            </Text>
                                            {tindakLanjutHistory.map((item, index) => (
                                                <Surface key={index} style={styles.historyItem} elevation={1}>
                                                    <Text variant="bodySmall" style={styles.historyDate}>
                                                        {formatDate(item.created_at)}
                                                    </Text>
                                                    <Text variant="bodyMedium" style={styles.historyText}>
                                                        <Text style={styles.boldText}>{item.penindak}</Text>
                                                    </Text>
                                                    {item.catatan && (
                                                        <Text variant="bodySmall" style={styles.historyCatatan}>
                                                            {item.catatan}
                                                        </Text>
                                                    )}
                                                    {item.lampiran && (
                                                        <Text variant="bodySmall" style={styles.historyCatatan}>
                                                            📎 Lampiran tersedia
                                                        </Text>
                                                    )}
                                                </Surface>
                                            ))}
                                        </View>
                                    </>
                                )}
                            </>
                        )}
                    </Dialog.Content>
                </Dialog.ScrollArea>
                <Dialog.Actions style={styles.dialogActions}>
                    <Button onPress={onDismiss}>Tutup</Button>
                    {laporan.status_laporan === 'diajukan' && (
                        <>
                            <Button onPress={() => onEdit(laporan)} icon="pencil">
                                Edit
                            </Button>
                            <Button onPress={() => onDelete(laporan)} textColor={theme.colors.error} icon="delete">
                                Hapus
                            </Button>
                        </>
                    )}
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
};

const styles = StyleSheet.create({
    dialog: { maxHeight: '85%' },
    dialogTitle: { fontFamily: 'RubikBold', fontSize: 18, lineHeight: 24 },
    dialogLoading: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    detailSection: { marginBottom: 16 },
    sectionTitle: { fontFamily: 'RubikBold', marginBottom: 8 },
    detailText: { marginBottom: 4, lineHeight: 20 },
    boldText: { fontFamily: 'RubikBold' },
    divider: { marginVertical: 16 },
    contentSurface: { padding: 12, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.03)' },
    contentText: { lineHeight: 22 },
    historyItem: { padding: 12, marginBottom: 8, borderRadius: 8 },
    historyDate: { opacity: 0.6, marginBottom: 4 },
    historyText: { marginBottom: 4 },
    historyCatatan: { opacity: 0.8, fontStyle: 'italic', lineHeight: 18 },
    dialogActions: { paddingHorizontal: 24, paddingVertical: 16 },
    lampiranImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginTop: 8,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
});