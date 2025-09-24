
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
} from 'react-native-paper';
import { Laporan, User, ApiError, postDisposisi } from '@/utils/api';
import { useAppTheme } from '@/context/ThemeContext';

interface DisposisiDialogProps {
    visible: boolean;
    onDismiss: () => void;
    laporan: Laporan | null;
    subbagUsers: User[];
    onSuccess: () => void;
}

export function DisposisiDialog({ visible, onDismiss, laporan, subbagUsers, onSuccess }: DisposisiDialogProps) {
    const { theme } = useAppTheme();
    const styles = createStyles(theme);

    const [selectedSubbag, setSelectedSubbag] = useState('');
    const [catatan, setCatatan] = useState('');
    const [disposisiLoading, setDisposisiLoading] = useState(false);

    useEffect(() => {
        if (!visible) {
            // Reset state when modal is closed
            setSelectedSubbag('');
            setCatatan('');
            setDisposisiLoading(false);
        }
    }, [visible]);

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

    const handleDisposisi = async (isApproved: boolean) => {
        if (!laporan) return;

        if (isApproved && !selectedSubbag) {
            Alert.alert('Validasi Error', 'Pilih penanggung jawab terlebih dahulu');
            return;
        }

        if (!catatan.trim()) {
            Alert.alert('Validasi Error', 'Catatan disposisi wajib diisi');
            return;
        }

        setDisposisiLoading(true);
        try {
            const disposisiData = {
                nip_penanggung_jawab: isApproved ? selectedSubbag : undefined,
                catatan_disposisi: catatan.trim(), 
                valid: isApproved
            };
            console.log('Sending disposisiData:', disposisiData); // Added log

            await postDisposisi(String(laporan.id_laporan), disposisiData);

            Alert.alert(
                isApproved ? 'Laporan Didisposisikan! ✅' : 'Laporan Ditolak! ❌',
                isApproved
                    ? `Laporan berhasil didisposisikan kepada ${subbagUsers.find(u => u.nip === selectedSubbag)?.jabatan}`
                    : 'Laporan telah ditolak dengan alasan yang diberikan',
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
        } catch (error: any) {
            console.error('Error disposisi:', error);
            const errorMessage = error instanceof ApiError ? error.message : 'Terjadi kesalahan saat menyimpan disposisi';
            Alert.alert('Error', errorMessage);
        } finally {
            setDisposisiLoading(false);
        }
    };

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={styles.modalContent}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={styles.modalTitle}>Disposisi Laporan</Text>

                    {laporan && (
                        <>
                            {/* Laporan Summary */}
                            <Card style={styles.summaryCard} elevation={1}>
                                <Card.Content style={styles.summaryContent}>
                                    <Text style={styles.summaryTitle} numberOfLines={2}>
                                        {laporan.judul_laporan}
                                    </Text>
                                    <Text style={styles.summaryPelapor}>
                                        Oleh: {laporan.pelapor}
                                    </Text>
                                    <Text style={styles.summaryDate}>
                                        {formatDate(laporan.created_at)}
                                    </Text>
                                </Card.Content>
                            </Card>

                            {/* Pilihan Subbag */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Pilih Penanggung Jawab *</Text>
                                <Text style={styles.inputHint}>
                                    Pilih Sub Bagian yang akan menangani laporan ini
                                </Text>
                                <ScrollView style={styles.subbagList} nestedScrollEnabled>
                                    {subbagUsers.map((user) => (
                                        <TouchableOpacity
                                            key={user.nip}
                                            style={[
                                                styles.subbagItem,
                                                selectedSubbag === user.nip && styles.subbagItemSelected
                                            ]}
                                            onPress={() => setSelectedSubbag(user.nip)}
                                        >
                                            <View style={styles.subbagItemContent}>
                                                <Avatar.Text
                                                    size={36}
                                                    label={getInitials(user.nama)}
                                                    style={styles.subbagAvatar}
                                                    labelStyle={styles.subbagAvatarLabel}
                                                />
                                                <View style={styles.subbagDetails}>
                                                    <Text style={[
                                                        styles.subbagNama,
                                                        selectedSubbag === user.nip && styles.subbagNamaSelected
                                                    ]}>
                                                        {user.nama}
                                                    </Text>
                                                    <Text style={styles.nip}>NIP: {user.nip}</Text>
                                                </View>
                                            </View>
                                            {selectedSubbag === user.nip && (
                                                <IconButton
                                                    icon="check-circle"
                                                    size={20}
                                                    iconColor={theme.colors.primary}
                                                />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Catatan */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Catatan Disposisi *</Text>
                                <TextInput
                                    value={catatan}
                                    onChangeText={setCatatan}
                                    mode="outlined"
                                    multiline
                                    numberOfLines={4}
                                    placeholder="Berikan catatan atau instruksi khusus untuk penanganan laporan ini..."
                                    style={[styles.textInput, styles.textArea]}
                                    outlineColor={theme.colors.outline}
                                    activeOutlineColor={theme.colors.primary}
                                    maxLength={300}
                                />
                                <Text style={styles.charCount}>{catatan.length}/300</Text>
                            </View>

                            {/* Action Buttons */}
                            <View style={styles.modalActions}>
                                <Button
                                    mode="outlined"
                                    onPress={() => handleDisposisi(false)}
                                    loading={disposisiLoading}
                                    disabled={disposisiLoading || !catatan.trim()}
                                    style={[styles.actionButton, styles.rejectButton]}
                                    contentStyle={styles.buttonContent}
                                    buttonColor="transparent"
                                    textColor={theme.colors.error}
                                >
                                    Tolak
                                </Button>
                                <Button
                                    mode="contained"
                                    onPress={() => handleDisposisi(true)}
                                    loading={disposisiLoading}
                                    disabled={disposisiLoading || !selectedSubbag || !catatan.trim()}
                                    style={[styles.actionButton, styles.approveButton]}
                                    contentStyle={styles.buttonContent}
                                    buttonColor={theme.colors.primary}
                                >
                                    Disposisi
                                </Button>
                            </View>
                        </>
                    )}
                </ScrollView>
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
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.onSurface,
        textAlign: 'center',
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outline,
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
    inputGroup: {
        marginBottom: 24,
        paddingHorizontal: 20,
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
    subbagList: {
        maxHeight: 200,
        borderWidth: 1,
        borderColor: theme.colors.outline,
        borderRadius: 8,
        backgroundColor: theme.colors.surface,
    },
    subbagItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.surfaceVariant,
    },
    subbagItemSelected: {
        backgroundColor: theme.colors.primaryContainer,
    },
    subbagItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    subbagAvatar: {
        backgroundColor: theme.colors.secondary,
    },
    subbagAvatarLabel: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    subbagDetails: {
        flex: 1,
    },
    subbagNama: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.onSurface,
    },
    subbagNamaSelected: {
        fontWeight: '600',
        color: theme.colors.primary,
    },
    subbagNip: {
        fontSize: 12,
        color: theme.colors.onSurfaceVariant,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: theme.colors.outline,
    },
    actionButton: {
        flex: 1,
        borderRadius: 12,
    },
    rejectButton: {
        borderColor: theme.colors.error,
    },
    approveButton: {},
    buttonContent: {
        paddingVertical: 6,
    },
});
