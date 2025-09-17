import React, { useState, useEffect, useCallback, JSX } from 'react';
import { StyleSheet, View, FlatList, RefreshControl, Alert } from 'react-native';
import {
    ActivityIndicator,
    Button,
    Card,
    Dialog,
    Portal,
    Text,
    TextInput,
    Appbar,
    Menu,
    Divider,
    Snackbar,
    HelperText,
    Chip,
} from 'react-native-paper';
import { useAppTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

// Import API functions dan types
import * as api from '@/utils/api';
import type { Laporan, User } from '@/utils/api';

// Extended types untuk screen ini
interface SnackbarState {
    visible: boolean;
    message: string;
    type?: 'success' | 'error' | 'info';
}

export default function DisposisiLaporanScreen(): JSX.Element {
    const theme = useAppTheme().theme;
    const router = useRouter();

    // State management
    const [laporanList, setLaporanList] = useState<Laporan[]>([]);
    const [subbagList, setSubbagList] = useState<User[]>([]);
    const [selectedLaporan, setSelectedLaporan] = useState<Laporan | null>(null);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isDialogVisible, setDialogVisible] = useState(false);
    const [isSubmitting, setSubmitting] = useState(false);

    // Form state
    const [catatan, setCatatan] = useState('');
    const [selectedSubbag, setSelectedSubbag] = useState<User | null>(null);
    const [menuVisible, setMenuVisible] = useState(false);
    const [formError, setFormError] = useState('');

    // Snackbar state
    const [snackbar, setSnackbar] = useState<SnackbarState>({
        visible: false,
        message: '',
        type: 'info'
    });

    // Fetch data function dengan proper error handling
    const fetchData = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);

            // Fetch laporan yang diajukan dan daftar subbag secara bersamaan
            const [laporanData, subbagData] = await Promise.all([
                api.getLaporanDiajukan(),
                api.getSubbagUsers()
            ]);

            setLaporanList(laporanData);
            setSubbagList(subbagData);

        } catch (error) {
            const errorMessage = error instanceof api.ApiError
                ? error.message
                : 'Gagal memuat data. Periksa koneksi internet Anda.';

            setSnackbar({
                visible: true,
                message: errorMessage,
                type: 'error'
            });

            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Initial data fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Refresh handler
    const onRefresh = useCallback((): void => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    // Dialog handlers
    const openDialog = useCallback((laporan: Laporan): void => {
        setSelectedLaporan(laporan);
        setCatatan('');
        setSelectedSubbag(null);
        setFormError('');
        setDialogVisible(true);
    }, []);

    const closeDialog = useCallback((): void => {
        setDialogVisible(false);
        setSelectedLaporan(null);
        setCatatan('');
        setSelectedSubbag(null);
        setFormError('');
    }, []);

    // Form validation
    const validateForm = useCallback((valid: boolean): string => {
        if (valid && !selectedSubbag) {
            return 'Penanggung jawab wajib dipilih untuk menyetujui laporan.';
        }
        if (!valid && !catatan.trim()) {
            return 'Catatan wajib diisi saat menolak laporan.';
        }
        return '';
    }, [selectedSubbag, catatan]);

    // Handle disposisi with confirmation
    const handleDisposisi = useCallback(async (valid: boolean): Promise<void> => {
        const validationError = validateForm(valid);
        if (validationError) {
            setFormError(validationError);
            return;
        }

        // Show confirmation dialog
        Alert.alert(
            'Konfirmasi Disposisi',
            `Apakah Anda yakin ingin ${valid ? 'menyetujui' : 'menolak'} laporan ini?`,
            [
                {
                    text: 'Batal',
                    style: 'cancel',
                },
                {
                    text: 'Ya, Lanjutkan',
                    style: valid ? 'default' : 'destructive',
                    onPress: () => submitDisposisi(valid),
                },
            ]
        );
    }, [validateForm]);

    // Submit disposisi
    const submitDisposisi = useCallback(async (valid: boolean): Promise<void> => {
        if (!selectedLaporan) return;

        setFormError('');
        setSubmitting(true);

        try {
            const result = await api.postDisposisi(selectedLaporan.id_laporan.toString(), {
                valid,
                catatan: catatan.trim() || undefined,
                nik_penanggung_jawab: selectedSubbag?.nik,
            });

            setSnackbar({
                visible: true,
                message: result.message || `Laporan berhasil ${valid ? 'disetujui' : 'ditolak'}`,
                type: 'success'
            });

            closeDialog();
            onRefresh(); // Refresh the list

        } catch (error) {
            const errorMessage = error instanceof api.ApiError
                ? error.message
                : 'Terjadi kesalahan saat memproses disposisi.';

            setSnackbar({
                visible: true,
                message: errorMessage,
                type: 'error'
            });
        } finally {
            setSubmitting(false);
        }
    }, [selectedLaporan, catatan, selectedSubbag, closeDialog, onRefresh]);

    // Format date utility
    const formatDate = useCallback((dateString: string): string => {
        try {
            return format(parseISO(dateString), 'd MMMM yyyy, HH:mm', { locale: id });
        } catch {
            return dateString;
        }
    }, []);

    // Render laporan item
    const renderLaporanItem = useCallback(({ item }: { item: Laporan }): JSX.Element => (
        <Card style={styles.card} onPress={() => openDialog(item)}>
            <Card.Title
                title={item.judul_laporan}
                subtitle={`Oleh: ${item.pelapor}`}
                titleStyle={styles.cardTitle}
                right={(props) => (
                    <Chip
                        {...props}
                        mode="outlined"
                        compact
                        style={[styles.statusChip, { borderColor: theme.colors.primary }]}
                        textStyle={{ color: theme.colors.primary }}
                    >
                        {item.status_laporan.toUpperCase()}
                    </Chip>
                )}
            />
            <Card.Content>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {item.isi_laporan.length > 100
                        ? `${item.isi_laporan.substring(0, 100)}...`
                        : item.isi_laporan
                    }
                </Text>
                <Text variant="bodySmall" style={[styles.dateText, { color: theme.colors.onSurfaceVariant }]}>
                    Diajukan pada: {formatDate(item.created_at)}
                </Text>
                {item.kategori && (
                    <Chip
                        mode="outlined"
                        compact
                        style={styles.categoryChip}
                        textStyle={{ fontSize: 12 }}
                    >
                        {item.kategori}
                    </Chip>
                )}
            </Card.Content>
        </Card>
    ), [theme.colors, openDialog, formatDate]);

    // Render empty state
    const renderEmptyState = useCallback((): JSX.Element => (
        <View style={styles.centered}>
            <Text variant="headlineSmall" style={[styles.emptyTitle, { color: theme.colors.onSurfaceVariant }]}>
                Tidak ada laporan
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
                Semua laporan sudah diproses.
            </Text>
            <Button
                mode="outlined"
                onPress={onRefresh}
                style={styles.refreshButton}
                icon="refresh"
            >
                Muat Ulang
            </Button>
        </View>
    ), [theme.colors, onRefresh]);

    // Loading state
    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <Appbar.Header>
                    <Appbar.BackAction onPress={() => router.back()} />
                    <Appbar.Content title="Disposisi Laporan" titleStyle={styles.appbarTitle} />
                </Appbar.Header>
                <View style={styles.centered}>
                    <ActivityIndicator animating size="large" />
                    <Text style={{ marginTop: 16, color: theme.colors.onSurfaceVariant }}>
                        Memuat data...
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title="Disposisi Laporan" titleStyle={styles.appbarTitle} />
                <Appbar.Action icon="refresh" onPress={onRefresh} />
            </Appbar.Header>

            <FlatList
                data={laporanList}
                keyExtractor={(item) => item.id_laporan.toString()}
                renderItem={renderLaporanItem}
                contentContainerStyle={[
                    styles.listContent,
                    laporanList.length === 0 && styles.emptyListContent
                ]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[theme.colors.primary]}
                    />
                }
                ListEmptyComponent={renderEmptyState}
                showsVerticalScrollIndicator={false}
            />

            {/* Disposisi Dialog */}
            <Portal>
                <Dialog
                    visible={isDialogVisible}
                    onDismiss={closeDialog}
                    style={styles.dialog}
                >
                    <Dialog.Title style={styles.dialogTitle}>
                        {selectedLaporan?.judul_laporan}
                    </Dialog.Title>
                    <Dialog.ScrollArea>
                        <Dialog.Content>
                            <Text variant="bodyMedium" style={styles.dialogText}>
                                <Text style={styles.boldText}>Pelapor:</Text> {selectedLaporan?.pelapor}
                            </Text>
                            <Text variant="bodyMedium" style={styles.dialogText}>
                                <Text style={styles.boldText}>Waktu:</Text>{' '}
                                {selectedLaporan ? formatDate(selectedLaporan.created_at) : ''}
                            </Text>
                            {selectedLaporan?.kategori && (
                                <Text variant="bodyMedium" style={styles.dialogText}>
                                    <Text style={styles.boldText}>Kategori:</Text> {selectedLaporan.kategori}
                                </Text>
                            )}

                            <Text variant="bodyMedium" style={[styles.dialogText, styles.isiLaporanText]}>
                                <Text style={styles.boldText}>Isi Laporan:</Text>
                            </Text>
                            <Text variant="bodyMedium" style={styles.isiLaporanContent}>
                                {selectedLaporan?.isi_laporan}
                            </Text>

                            <Divider style={styles.divider} />

                            {/* Dropdown Penanggung Jawab */}
                            <Text variant="titleSmall" style={[styles.boldText, styles.sectionTitle]}>
                                Pilih Penanggung Jawab
                            </Text>
                            <Menu
                                visible={menuVisible}
                                onDismiss={() => setMenuVisible(false)}
                                anchor={
                                    <Button
                                        mode="outlined"
                                        onPress={() => setMenuVisible(true)}
                                        icon="account-arrow-down"
                                        style={styles.menuButton}
                                        contentStyle={styles.menuButtonContent}
                                    >
                                        {selectedSubbag ? selectedSubbag.nama : 'Pilih Penanggung Jawab'}
                                    </Button>
                                }
                                contentStyle={styles.menuContent}
                            >
                                {subbagList.map((subbag) => (
                                    <Menu.Item
                                        key={subbag.nik}
                                        onPress={() => {
                                            setSelectedSubbag(subbag);
                                            setMenuVisible(false);
                                            setFormError('');
                                        }}
                                        title={subbag.nama}
                                        titleStyle={styles.menuItemTitle}
                                    />
                                ))}
                            </Menu>

                            {/* Catatan Input */}
                            <TextInput
                                label="Catatan Disposisi (Opsional)"
                                value={catatan}
                                onChangeText={(text) => {
                                    setCatatan(text);
                                    setFormError('');
                                }}
                                mode="outlined"
                                multiline
                                numberOfLines={3}
                                style={styles.catatanInput}
                                maxLength={500}
                                right={<TextInput.Affix text={`${catatan.length}/500`} />}
                            />

                            {formError ? (
                                <HelperText type="error" visible={!!formError}>
                                    {formError}
                                </HelperText>
                            ) : null}
                        </Dialog.Content>
                    </Dialog.ScrollArea>

                    <Dialog.Actions style={styles.dialogActions}>
                        <Button
                            onPress={() => handleDisposisi(false)}
                            textColor={theme.colors.error}
                            disabled={isSubmitting}
                            style={styles.rejectButton}
                        >
                            Tolak
                        </Button>
                        <Button
                            onPress={() => handleDisposisi(true)}
                            disabled={isSubmitting}
                            loading={isSubmitting}
                            mode="contained"
                            style={styles.approveButton}
                        >
                            Setujui
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            {/* Snackbar */}
            <Snackbar
                visible={snackbar.visible}
                onDismiss={() => setSnackbar(prev => ({ ...prev, visible: false }))}
                duration={4000}
                style={[
                    styles.snackbar,
                    snackbar.type === 'error' && { backgroundColor: theme.colors.errorContainer },
                    snackbar.type === 'success' && { backgroundColor: theme.colors.primaryContainer },
                ]}
            >
                {snackbar.message}
            </Snackbar>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    emptyListContent: {
        flexGrow: 1,
    },
    card: {
        marginBottom: 12,
        elevation: 2,
    },
    cardTitle: {
        fontFamily: 'RubikBold',
    },
    statusChip: {
        marginRight: 8,
        marginTop: 8,
    },
    categoryChip: {
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    dateText: {
        marginTop: 4,
    },
    appbarTitle: {
        fontFamily: 'RubikBold',
    },
    emptyTitle: {
        fontFamily: 'RubikBold',
        textAlign: 'center',
    },
    emptySubtitle: {
        textAlign: 'center',
        marginTop: 8,
    },
    refreshButton: {
        marginTop: 16,
    },
    dialog: {
        maxHeight: '80%',
    },
    dialogTitle: {
        fontFamily: 'RubikBold',
        fontSize: 18,
    },
    dialogText: {
        marginBottom: 6,
        lineHeight: 20,
    },
    boldText: {
        fontFamily: 'RubikBold',
    },
    isiLaporanText: {
        marginTop: 12,
    },
    isiLaporanContent: {
        marginTop: 4,
        marginBottom: 8,
        lineHeight: 22,
        backgroundColor: 'rgba(0,0,0,0.05)',
        padding: 12,
        borderRadius: 8,
    },
    sectionTitle: {
        marginBottom: 8,
    },
    divider: {
        marginVertical: 16,
    },
    menuButton: {
        marginBottom: 16,
    },
    menuButtonContent: {
        height: 48,
    },
    menuContent: {
        minWidth: 200,
    },
    menuItemTitle: {
        fontSize: 16,
    },
    catatanInput: {
        marginBottom: 8,
    },
    dialogActions: {
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    rejectButton: {
        marginRight: 8,
    },
    approveButton: {
        minWidth: 100,
    },
    snackbar: {
        marginBottom: 16,
        marginHorizontal: 16,
    },
});