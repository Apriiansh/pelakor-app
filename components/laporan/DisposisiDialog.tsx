import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Alert, Platform, ViewStyle, TextStyle } from 'react-native';
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
import { Notification } from '@/components/Notification';
import { useNotification } from '@/hooks/use-notification';

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
    const { notification, showSuccess, showError, hideNotification } = useNotification();

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
            showError('Pilih penanggung jawab terlebih dahulu');
            return;
        }

        if (!catatan.trim()) {
            showError('Catatan disposisi wajib diisi');
            return;
        }

        setDisposisiLoading(true);
        try {
            const disposisiData = {
                nip_penanggung_jawab: isApproved ? selectedSubbag : undefined,
                catatan_disposisi: catatan.trim(),
                valid: isApproved
            };
            console.log('Sending disposisiData:', disposisiData);

            await postDisposisi(String(laporan.id_laporan), disposisiData);

            if (isApproved) {
                const userName = subbagUsers.find(u => u.nip === selectedSubbag)?.nama;
                showSuccess(`Laporan berhasil didisposisikan kepada ${userName}`);
            } else {
                showSuccess('Laporan berhasil ditolak');
            }

            setTimeout(() => {
                onDismiss();
                onSuccess();
            }, 1500);

        } catch (error: any) {
            console.error('Error disposisi:', error);
            const errorMessage = error instanceof ApiError ? error.message : 'Terjadi kesalahan saat menyimpan disposisi';
            showError(errorMessage); 
        } finally {
            setDisposisiLoading(false);
        }
    };

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={styles.modalContent as ViewStyle}
            >
                <View>
                    <Text style={styles.modalTitle as TextStyle}>Disposisi Laporan</Text>

                    {laporan && (
                        <>
                            {/* Laporan Summary */}
                            <Card style={styles.summaryCard as ViewStyle} elevation={1}>
                                <Card.Content style={styles.summaryContent as ViewStyle}>
                                    <Text style={styles.summaryTitle as TextStyle} numberOfLines={2}>
                                        {laporan.judul_laporan}
                                    </Text>
                                    <Text style={styles.summaryPelapor as TextStyle}>
                                        Oleh: {laporan.pelapor}
                                    </Text>
                                    <Text style={styles.summaryDate as TextStyle}>
                                        {formatDate(laporan.created_at)}
                                    </Text>
                                </Card.Content>
                            </Card>

                            {/* Pilihan Subbag */}
                            <View style={styles.inputGroup as ViewStyle}>
                                <Text style={styles.inputLabel as TextStyle}>Pilih Penanggung Jawab *</Text>
                                <Text style={styles.inputHint as TextStyle}>
                                    Pilih Sub Bagian yang akan menangani laporan ini
                                </Text>
                                <ScrollView style={styles.subbagList as ViewStyle}>
                                    {subbagUsers.map((user) => (
                                        <TouchableOpacity
                                            key={user.nip}
                                            style={[
                                                styles.subbagItem as ViewStyle,
                                                selectedSubbag === user.nip && (styles.subbagItemSelected as ViewStyle)
                                            ]}
                                            onPress={() => setSelectedSubbag(user.nip)}
                                        >
                                            <View style={styles.subbagItemContent as ViewStyle}>
                                                <Avatar.Text
                                                    size={36}
                                                    label={getInitials(user.nama)}
                                                    style={styles.subbagAvatar as ViewStyle}
                                                    labelStyle={styles.subbagAvatarLabel as TextStyle}
                                                />
                                                <View style={styles.subbagDetails as ViewStyle}>
                                                    <Text style={[
                                                        styles.subbagNama as TextStyle,
                                                        selectedSubbag === user.nip && (styles.subbagNamaSelected as TextStyle)
                                                    ]}>
                                                        {user.nama}
                                                    </Text>
                                                    <Text style={styles.subbagNip as TextStyle}>NIP: {user.nip}</Text>
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
                            <View style={styles.inputGroup as ViewStyle}>
                                <Text style={styles.inputLabel as TextStyle}>Catatan Disposisi *</Text>
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
                                <Text style={styles.charCount as TextStyle}>{catatan.length}/300</Text>
                            </View>

                            {/* Action Buttons */}
                            <View style={styles.modalActions as ViewStyle}>
                                <Button
                                    mode="outlined"
                                    onPress={() => handleDisposisi(false)}
                                    loading={disposisiLoading}
                                    disabled={disposisiLoading || !catatan.trim()}
                                    style={[styles.actionButton as ViewStyle, styles.rejectButton as ViewStyle]}
                                    contentStyle={styles.buttonContent as ViewStyle}
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
                                    style={[styles.actionButton as ViewStyle, styles.approveButton as ViewStyle]}
                                    contentStyle={styles.buttonContent as ViewStyle}
                                    buttonColor={theme.colors.primary}
                                >
                                    Disposisi
                                </Button>
                            </View>
                        </>
                    )}
                </View>
            </Modal>
            <Notification
                visible={notification.visible}
                message={notification.message}
                type={notification.type}
                onDismiss={hideNotification}
                duration={4000}
            />
        </Portal>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    modalContent: {
        backgroundColor: theme.colors.surface,
        margin: 16,
        borderRadius: 16,
        maxHeight: '90%',
    } as ViewStyle,
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.onSurface,
        textAlign: 'center',
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outline,
    } as TextStyle,
    summaryCard: {
        backgroundColor: theme.colors.primaryContainer,
        borderRadius: 12,
        margin: 20,
        marginBottom: 16,
    } as ViewStyle,
    summaryContent: {
        padding: 16,
    } as ViewStyle,
    summaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.onSurface,
        marginBottom: 8,
        lineHeight: 22,
    } as TextStyle,
    summaryPelapor: {
        fontSize: 14,
        color: theme.colors.onSurfaceVariant,
        marginBottom: 4,
    } as TextStyle,
    summaryDate: {
        fontSize: 12,
        color: theme.colors.onSurfaceVariant,
    } as TextStyle,
    inputGroup: {
        marginBottom: 24,
        paddingHorizontal: 20,
    } as ViewStyle,
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.onSurface,
        marginBottom: 8,
    } as TextStyle,
    inputHint: {
        fontSize: 12,
        color: theme.colors.onSurfaceVariant,
        marginBottom: 12,
    } as TextStyle,
    textInput: {
        backgroundColor: theme.colors.surface,
        fontSize: 16,
    } as TextStyle,
    textArea: {
        minHeight: 100,
    } as TextStyle,
    charCount: {
        fontSize: 12,
        color: theme.colors.onSurfaceVariant,
        textAlign: 'right',
        marginTop: 4,
    } as TextStyle,
    subbagList: {
        maxHeight: 200,
        borderWidth: 1,
        borderColor: theme.colors.outline,
        borderRadius: 8,
        backgroundColor: theme.colors.surface,
    } as ViewStyle,
    subbagItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.surfaceVariant,
    } as ViewStyle,
    subbagItemSelected: {
        backgroundColor: theme.colors.primaryContainer,
    } as ViewStyle,
    subbagItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    } as ViewStyle,
    subbagAvatar: {
        backgroundColor: theme.colors.secondary,
    } as ViewStyle,
    subbagAvatarLabel: {
        fontSize: 12,
        fontWeight: 'bold',
    } as TextStyle,
    subbagDetails: {
        flex: 1,
    } as ViewStyle,
    subbagNama: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.onSurface,
    } as TextStyle,
    subbagNamaSelected: {
        fontWeight: '600',
        color: theme.colors.primary,
    } as TextStyle,
    subbagNip: {
        fontSize: 12,
        color: theme.colors.onSurfaceVariant,
    } as TextStyle,
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: theme.colors.outline,
    } as ViewStyle,
    actionButton: {
        flex: 1,
        borderRadius: 12,
    } as ViewStyle,
    rejectButton: {
        borderColor: theme.colors.error,
    } as ViewStyle,
    approveButton: {} as ViewStyle,
    buttonContent: {
        paddingVertical: 6,
    } as ViewStyle,
});