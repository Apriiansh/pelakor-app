import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Image, Linking, Alert, TouchableOpacity } from 'react-native';
import { Portal, Dialog, Text, Button, Card, Chip, Surface } from 'react-native-paper';
import { useAppTheme } from '@/context/ThemeContext';
import { Laporan, getFileUrl, formatDate } from '@/utils/api';
import { CustomTheme } from '@/constants/theme';

// Helper untuk memeriksa jenis lampiran dari URL
const getAttachmentInfo = (url: string): { type: 'image' | 'pdf' | 'document', extension: string } => {
  if (!url) return { type: 'document', extension: '' };

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

type DetailArsipDialogProps = {
  visible: boolean;
  laporan: Laporan | null;
  onClose: () => void;
  // Removed: formatDate: (date: string) => string; // Added for consistency
};

const DetailArsipDialog = ({ visible, laporan, onClose }: DetailArsipDialogProps) => {
  const { theme } = useAppTheme();
  const styles = getStyles(theme);
  const [expandedContent, setExpandedContent] = useState(false); // For consistency, though not used for truncation here

  if (!visible || !laporan) {
    return null;
  }

  const getStatusColor = (status: string) => {
    if (status === 'selesai') return theme.colors.success;
    return theme.colors.onSurface; // Default color if not 'selesai'
  };

  const fullAttachmentUrl = getFileUrl(laporan.lampiran);
  const attachmentInfo = fullAttachmentUrl ? getAttachmentInfo(fullAttachmentUrl) : null;

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={styles.dialog}>
        <Dialog.Title style={styles.dialogTitle}>Detail Arsip Laporan</Dialog.Title>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Dialog.Content style={styles.dialogContent}>
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
                      {laporan.status_laporan?.toUpperCase() || 'SELESAI'}
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
                  <View style={styles.categoryRow}>
                    <Text variant="bodySmall" style={styles.categoryLabel}>
                      Pelapor:
                    </Text>
                    <Text variant="bodySmall" style={styles.categoryText}>
                      {laporan.pelapor || '-'}
                    </Text>
                  </View>
                  <View style={styles.categoryRow}>
                    <Text variant="bodySmall" style={styles.categoryLabel}>
                      Tanggal Selesai:
                    </Text>
                    <Text variant="bodySmall" style={styles.categoryText}>
                      {laporan.updated_at ? formatDate(laporan.updated_at) : '-'}
                    </Text>
                  </View>
                </Card.Content>
              </Card>

              {/* Isi Laporan */}
              <View style={styles.section}>
                <Text variant="titleSmall" style={styles.sectionTitle}>
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
            </Dialog.Content>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions style={styles.dialogActions}>
          <Button onPress={onClose} mode="outlined">Tutup</Button>
          <Button onPress={() => { /* TODO: Implement Telaah Ulang logic */ Alert.alert('Info', 'Fungsi telaah ulang belum diimplementasikan.'); }} mode="outlined">
            Telaah Ulang
          </Button>
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
    marginBottom: 4,
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

  // Dialog Actions
  dialogActions: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
});

export default DetailArsipDialog;
