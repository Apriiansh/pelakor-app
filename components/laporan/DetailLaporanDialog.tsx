import React, { useState } from 'react';
import { View, StyleSheet, Image, Linking, Alert, TouchableOpacity, ScrollView } from 'react-native';
import {
    ActivityIndicator,
    Button,
    Dialog,
    Portal,
    Text,
    Divider,
    Surface,
    Chip,
    Card,
} from 'react-native-paper';
import { useAppTheme } from '@/context/ThemeContext';
import { getFileUrl, type Laporan, type DisposisiHistory, type TindakLanjutHistory } from '@/utils/api';
import { CustomTheme } from '@/constants/theme';

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
    const styles = getStyles(theme);
    const [expandedContent, setExpandedContent] = useState(false);

    if (!laporan) return null;

    const fullAttachmentUrl = getFileUrl(laporan.lampiran);
    const attachmentInfo = fullAttachmentUrl ? getAttachmentInfo(fullAttachmentUrl) : null;

    // Truncate content if too long
    const maxContentLength = 200;
    const shouldTruncate = laporan.isi_laporan.length > maxContentLength;
    const displayContent = expandedContent || !shouldTruncate
        ? laporan.isi_laporan
        : `${laporan.isi_laporan.substring(0, maxContentLength)}...`;

    return (
        <Portal>
            <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
                <Dialog.Title style={styles.dialogTitle}>
                    {laporan.judul_laporan}
                </Dialog.Title>

                <Dialog.ScrollArea style={styles.scrollArea}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Dialog.Content style={styles.dialogContent}>
                            {loading ? (
                                <View style={styles.dialogLoading}>
                                    <ActivityIndicator animating size="small" />
                                    <Text style={{ marginLeft: 12 }}>Memuat detail...</Text>
                                </View>
                            ) : (
                                <>
                                    {/* Header Info Card */}
                                    <Card style={styles.headerCard} elevation={1}>
                                        <Card.Content style={styles.headerContent}>
                                            <View style={styles.statusRow}>
                                                <Chip
                                                    mode="flat"
                                                    textStyle={{
                                                        color: getStatusColor(laporan.status_laporan),
                                                        fontWeight: 'bold',
                                                        fontSize: 12
                                                    }}
                                                    style={[styles.statusChip, {
                                                        backgroundColor: getStatusColor(laporan.status_laporan) + '20'
                                                    }]}
                                                >
                                                    {laporan.status_laporan.toUpperCase()}
                                                </Chip>
                                                <Text variant="bodySmall" style={styles.dateText}>
                                                    {formatDate(laporan.created_at)}
                                                </Text>
                                            </View>

                                            {laporan.kategori && (
                                                <View style={styles.categoryRow}>
                                                    <Text variant="bodySmall" style={styles.categoryLabel}>
                                                        Kategori:
                                                    </Text>
                                                    <Text variant="bodySmall" style={styles.categoryText}>
                                                        {laporan.kategori}
                                                    </Text>
                                                </View>
                                            )}
                                        </Card.Content>
                                    </Card>

                                    {/* Content Section */}
                                    <View style={styles.section}>
                                        <Text variant="titleSmall" style={styles.sectionTitle}>
                                            Isi Laporan
                                        </Text>
                                        <Surface style={styles.contentSurface} elevation={0}>
                                            <Text variant="bodyMedium" style={styles.contentText}>
                                                {displayContent}
                                            </Text>
                                            {shouldTruncate && (
                                                <TouchableOpacity
                                                    onPress={() => setExpandedContent(!expandedContent)}
                                                    style={styles.expandButton}
                                                >
                                                    <Text style={styles.expandText}>
                                                        {expandedContent ? 'Tampilkan lebih sedikit' : 'Baca selengkapnya'}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        </Surface>
                                    </View>

                                    {/* Attachment Section */}
                                    {fullAttachmentUrl && attachmentInfo && (
                                        <View style={styles.section}>
                                            <Text variant="titleSmall" style={styles.sectionTitle}>
                                                Lampiran
                                            </Text>
                                            {attachmentInfo.type === 'image' ? (
                                                <TouchableOpacity onPress={() => handleOpenAttachment(fullAttachmentUrl)}>
                                                    <Image
                                                        source={{ uri: fullAttachmentUrl }}
                                                        style={styles.attachmentImage}
                                                        resizeMode="cover"
                                                    />
                                                </TouchableOpacity>
                                            ) : (
                                                <Button
                                                    icon={attachmentInfo.type === 'pdf' ? 'file-pdf-box' : 'file-document'}
                                                    mode="outlined"
                                                    onPress={() => handleOpenAttachment(fullAttachmentUrl)}
                                                    style={styles.attachmentButton}
                                                    compact
                                                >
                                                    Lihat {attachmentInfo.extension.toUpperCase()}
                                                </Button>
                                            )}
                                        </View>
                                    )}

                                    {/* Disposisi History */}
                                    {disposisiHistory.length > 0 && (
                                        <View style={styles.section}>
                                            <Text variant="titleSmall" style={styles.sectionTitle}>
                                                Riwayat Disposisi ({disposisiHistory.length})
                                            </Text>
                                            {disposisiHistory.map((item, index) => (
                                                <Card key={index} style={styles.historyCard} elevation={1}>
                                                    <Card.Content style={styles.historyContent}>
                                                        <View style={styles.historyHeader}>
                                                            <Text variant="bodySmall" style={styles.historyDate}>
                                                                {formatDate(item.created_at)}
                                                            </Text>
                                                        </View>
                                                        <Text variant="bodyMedium" style={styles.historyText}>
                                                            <Text style={styles.boldText}>{item.kabbag_umum}</Text>
                                                            {item.penanggung_jawab && (
                                                                <>
                                                                    <Text style={styles.arrowText}> → </Text>
                                                                    <Text>{item.penanggung_jawab}</Text>
                                                                </>
                                                            )}
                                                        </Text>
                                                        {item.catatan_disposisi && (
                                                            <Text variant="bodySmall" style={styles.historyNote}>
                                                                💬 {item.catatan_disposisi}
                                                            </Text>
                                                        )}
                                                    </Card.Content>
                                                </Card>
                                            ))}
                                        </View>
                                    )}

                                    {/* Tindak Lanjut History */}
                                    {tindakLanjutHistory.length > 0 && (
                                        <View style={styles.section}>
                                            <Text variant="titleSmall" style={styles.sectionTitle}>
                                                Riwayat Tindak Lanjut ({tindakLanjutHistory.length})
                                            </Text>
                                            {tindakLanjutHistory.map((item, index) => {
                                                const fullTindakLanjutUrl = item.lampiran ? getFileUrl(item.lampiran) : null;
                                                const tindakLanjutAttachmentInfo = fullTindakLanjutUrl ? getAttachmentInfo(fullTindakLanjutUrl) : null;

                                                return (
                                                    <Card key={index} style={styles.historyCard} elevation={1}>
                                                        <Card.Content style={styles.historyContent}>
                                                            <View style={styles.historyHeader}>
                                                                <Text variant="bodySmall" style={styles.historyDate}>
                                                                    {formatDate(item.created_at)}
                                                                </Text>
                                                            </View>
                                                            <Text variant="bodyMedium" style={styles.historyText}>
                                                                <Text style={styles.boldText}>{item.penindak}</Text>
                                                            </Text>
                                                            {item.catatan_tindak_lanjut && (
                                                                <Text variant="bodySmall" style={styles.historyNote}>
                                                                    📝 {item.catatan_tindak_lanjut}
                                                                </Text>
                                                            )}

                                                            {/* Lampiran Tindak Lanjut */}
                                                            {fullTindakLanjutUrl && tindakLanjutAttachmentInfo && (
                                                                <View style={{ marginTop: 12 }}>
                                                                    <Text
                                                                        variant="labelSmall"
                                                                        style={styles.attachmentLabel}
                                                                    >
                                                                        Lampiran
                                                                    </Text>
                                                                    {tindakLanjutAttachmentInfo.type === 'image' ? (
                                                                        <TouchableOpacity onPress={() => handleOpenAttachment(fullTindakLanjutUrl)}>
                                                                            <Image
                                                                                source={{ uri: fullTindakLanjutUrl }}
                                                                                style={styles.attachmentImage}
                                                                                resizeMode="cover"
                                                                            />
                                                                        </TouchableOpacity>
                                                                    ) : (
                                                                        <Button
                                                                            icon={tindakLanjutAttachmentInfo.type === 'pdf' ? 'file-pdf-box' : 'file-document'}
                                                                            mode="outlined"
                                                                            onPress={() => handleOpenAttachment(fullTindakLanjutUrl)}
                                                                            style={styles.attachmentButton}
                                                                            compact
                                                                        >
                                                                            Lihat {tindakLanjutAttachmentInfo.extension.toUpperCase()}
                                                                        </Button>
                                                                    )}
                                                                </View>
                                                            )}
                                                        </Card.Content>
                                                    </Card>
                                                );
                                            })}
                                        </View>
                                    )}
                                </>
                            )}
                        </Dialog.Content>
                    </ScrollView>
                </Dialog.ScrollArea>

                <Dialog.Actions style={styles.dialogActions}>
                    <Button onPress={onDismiss} mode="outlined">
                        Tutup
                    </Button>
                    {laporan.status_laporan === 'diajukan' && (
                        <>
                            <Button onPress={() => onEdit(laporan)} icon="pencil" mode="outlined">
                                Edit
                            </Button>
                            <Button onPress={() => onDelete(laporan)} textColor={theme.colors.error} icon="delete" mode="outlined">
                                Hapus
                            </Button>
                        </>
                    )}
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
};

const getStyles = (theme: CustomTheme) => StyleSheet.create({
    dialog: {
        maxHeight: '80%',
        width: '92%',
        alignSelf: 'center',
        backgroundColor: theme.colors.surface,
    },
    dialogTitle: {
        fontFamily: 'RubikBold',
        fontSize: 18,
        lineHeight: 24,
        paddingBottom: 8,
        color: theme.colors.onSurface,
    },
    scrollArea: {
        maxHeight: '70%',
    },
    dialogContent: {
        paddingTop: 0,
        paddingHorizontal: 16,
    },
    dialogLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        justifyContent: 'center',
    },

    // Header Card
    headerCard: {
        marginBottom: 16,
        borderRadius: 12,
        backgroundColor: theme.colors.surface,
    },
    headerContent: {
        paddingVertical: 12,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusChip: {
        height: 28,
    },
    dateText: {
        color: theme.colors.onSurfaceVariant,
        fontSize: 12,
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryLabel: {
        color: theme.colors.onSurfaceVariant,
        marginRight: 8,
    },
    categoryText: {
        fontWeight: '600',
        color: theme.colors.onSurface,
    },

    // Section
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontFamily: 'RubikBold',
        marginBottom: 12,
        color: theme.colors.success,
    },

    // Content
    contentSurface: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: theme.colors.background,
    },
    contentText: {
        lineHeight: 20,
        textAlign: 'justify',
        color: theme.colors.onSurface,
    },
    expandButton: {
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    expandText: {
        color: theme.colors.secondary,
        fontSize: 14,
        fontWeight: '600',
    },

    // Attachment
    attachmentImage: {
        width: '100%',
        height: 180,
        borderRadius: 12,
        backgroundColor: theme.colors.outline,
    },
    attachmentButton: {
        alignSelf: 'flex-start',
        borderRadius: 8,
    },
    attachmentLabel: {
        marginBottom: 8,
        color: theme.colors.onSurfaceVariant,
        fontFamily: 'RubikBold'
    },

    // History
    historyCard: {
        marginBottom: 12,
        borderRadius: 10,
        elevation: 2,
        backgroundColor: theme.colors.surface,
    },
    historyContent: {
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    historyDate: {
        color: theme.colors.onSurfaceVariant,
        fontSize: 11,
        fontWeight: '500',
    },
    historyText: {
        marginBottom: 6,
        lineHeight: 18,
        color: theme.colors.onSurface,
    },
    boldText: {
        fontFamily: 'RubikBold',
        color: theme.colors.primary,
    },
    arrowText: {
        color: theme.colors.onSurfaceVariant,
        fontWeight: '300',
    },
    historyNote: {
        fontStyle: 'normal',
        lineHeight: 16,
        color: theme.colors.onSurfaceVariant,
        backgroundColor: theme.colors.background,
        padding: 8,
        borderRadius: 6,
        marginTop: 4,
    },

    // Dialog Actions
    dialogActions: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.outline,
    },
});