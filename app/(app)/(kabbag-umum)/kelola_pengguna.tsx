import { UNIT_KERJA_OPTIONS, ROLE_OPTIONS } from '@/constants/type';
import { useAppTheme } from '@/context/ThemeContext';
import { ApiError, createUser, deleteUser, getUsers, updateUser, User } from '@/utils/api';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, View, ScrollView } from 'react-native';
import {
    ActivityIndicator,
    Avatar,
    Button,
    Card,
    Chip,
    FAB,
    IconButton,
    Menu,
    Modal,
    Portal,
    Provider,
    Snackbar,
    Text,
    TextInput,
    HelperText,
} from 'react-native-paper';

const cleanUnitKerja = (unitKerja: string | undefined | null): string => {
    if (!unitKerja) return '';
    // Membersihkan format array postgresql seperti {"Nilai"} atau {Nilai}
    return unitKerja.replace(/^{"?(.*?)"?}$/, '$1');
};

const UserCard = ({ user, onEdit, onDelete }: { user: User; onEdit: (user: User) => void; onDelete: (user: User) => void }) => {
    const { theme } = useAppTheme();
    const styles = createStyles(theme);

    return (
        <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.nama}</Text>
                    <Text style={styles.userDetail}>NIP: {user.nip}</Text>
                    <Text style={styles.userJabatan}>{user.jabatan || 'Jabatan tidak diatur'}</Text>
                    <Text style={styles.userJabatan}>{cleanUnitKerja(user.unit_kerja) || 'Unit Kerja tidak diatur'}</Text>
                    {/* <Chip style={styles.roleChip} textStyle={styles.chipText}>
                        {ROLE_OPTIONS[user.role] || user.role}
                    </Chip> */}
                </View>
                <View style={styles.actions}>
                    <IconButton icon="pencil-outline" size={24} onPress={() => onEdit(user)} />
                    <IconButton icon="delete-outline" size={24} iconColor={theme.colors.error} onPress={() => onDelete(user)} />
                </View>
            </Card.Content>
        </Card>
    );
};

export default function KelolaPenggunaScreen() {
    const router = useRouter();
    const { theme } = useAppTheme();
    const styles = createStyles(theme);

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
    const [unitKerjaModalVisible, setUnitKerjaModalVisible] = useState(false);
    const [roleModalVisible, setRoleModalVisible] = useState(false);
    const [unitKerjaSearch, setUnitKerjaSearch] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // Form state - Fixed with proper initialization
    const [formData, setFormData] = useState({
        nama: '',
        nip: '',
        email: '',
        jabatan: '',
        unit_kerja: '',
        role: '',
        password: ''
    });

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            const message = error instanceof ApiError ? error.message : 'Gagal memuat pengguna';
            setSnackbar({ visible: true, message });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchUsers();
        setRefreshing(false);
    }, [fetchUsers]);

    const clearForm = () => {
        setSelectedUser(null);
        setIsEditMode(false);
        setFormData({
            nama: '',
            nip: '',
            email: '',
            jabatan: '',
            unit_kerja: '',
            role: '',
            password: ''
        });
        setUnitKerjaSearch('');
    };

    const hideModal = () => {
        setModalVisible(false);
        clearForm();
    };

    const handleAdd = () => {
        clearForm();
        setIsEditMode(false);
        setModalVisible(true);
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setFormData({
            nama: user.nama,
            nip: user.nip,
            email: user.email,
            jabatan: user.jabatan || '',
            unit_kerja: cleanUnitKerja(user.unit_kerja),
            role: user.role,
            password: ''
        });
        setIsEditMode(true);
        setModalVisible(true);
    };

    const handleDelete = (user: User) => {
        Alert.alert(
            "Hapus Pengguna",
            `Apakah Anda yakin ingin menghapus ${user.nama}? Tindakan ini tidak dapat dibatalkan.`,
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Hapus", style: "destructive", onPress: async () => {
                        try {
                            await deleteUser(user.nip);
                            setSnackbar({ visible: true, message: 'Pengguna berhasil dihapus' });
                            fetchUsers();
                        } catch (error) {
                            const message = error instanceof ApiError ? error.message : 'Gagal menghapus pengguna';
                            setSnackbar({ visible: true, message });
                        }
                    }
                }
            ]
        );
    };

    const validateForm = () => {
        const { nama, nip, email, jabatan, unit_kerja, role, password } = formData;

        if (!nama.trim()) return 'Nama wajib diisi';
        if (!nip.trim()) return 'NIP wajib diisi';
        if (!email.trim()) return 'Email wajib diisi';
        if (!jabatan.trim()) return 'Jabatan wajib diisi';
        if (!unit_kerja.trim()) return 'Unit kerja wajib diisi';
        if (!role) return 'Role wajib dipilih';
        if (!isEditMode && !password.trim()) return 'Password wajib diisi';

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return 'Format email tidak valid';

        // Validate NIP (should be numeric and reasonable length)
        if (!/^\d+$/.test(nip)) return 'NIP harus berupa angka';
        if (nip.length < 8) return 'NIP minimal 8 digit';

        return null;
    };

    const handleSave = async () => {
        const validationError = validateForm();
        if (validationError) {
            setSnackbar({ visible: true, message: validationError });
            return;
        }

        const userData = {
            nama: formData.nama.trim(),
            nip: formData.nip.trim(), // Backend expects 'nip'
            email: formData.email.trim().toLowerCase(),
            jabatan: formData.jabatan.trim(),
            unit_kerja: formData.unit_kerja.trim(),
            role: formData.role,
            ...(formData.password.trim() && { password: formData.password.trim() })
        };

        // Debug log
        console.log('Sending user data:', { ...userData, password: userData.password ? '[HIDDEN]' : 'undefined' });

        setSaving(true);
        try {
            if (isEditMode && selectedUser) {
                const { nip, ...updateData } = userData;
                await updateUser(selectedUser.nip, updateData);
                setSnackbar({ visible: true, message: 'Pengguna berhasil diperbarui' });
            } else {
                await createUser(userData as any);
                setSnackbar({ visible: true, message: 'Pengguna berhasil ditambahkan' });
            }
            hideModal();
            fetchUsers();
        } catch (error) {
            console.error('Save user error:', error);
            let message = 'Gagal menyimpan pengguna';

            if (error instanceof ApiError) {
                if (error.status === 400) {
                    message = error.message || 'Data tidak valid. Periksa kembali input Anda.';
                } else if (error.status === 409) {
                    message = 'NIP atau email sudah terdaftar';
                } else {
                    message = error.message;
                }
            }

            setSnackbar({ visible: true, message });
        } finally {
            setSaving(false);
        }
    };

    const updateFormData = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Get filtered role options (exclude kabbag_umum and subbag_umum)
    const getFilteredRoleOptions = () => {
        return Object.entries(ROLE_OPTIONS).filter(([key]) =>
            key !== 'kabbag_umum' && key !== 'subbag_umum'
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Memuat data pengguna...</Text>
            </View>
        );
    }

    return (
        <Provider>
            <View style={styles.container}>
                <LinearGradient
                    colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
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
                            <Text style={styles.headerTitle}>Kelola Pengguna</Text>
                            <View style={styles.placeholder} />
                        </View>
                        <Text style={styles.headerSubtitle}>
                            Tambah, edit, atau hapus data pengguna sistem
                        </Text>
                    </View>
                </LinearGradient>

                <FlatList
                    data={users.filter(
                        (u) => u.role !== 'kabbag_umum'
                    )}
                    keyExtractor={(item) => item.nip}
                    renderItem={({ item }) => (
                        <UserCard user={item} onEdit={handleEdit} onDelete={handleDelete} />
                    )}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                    }
                    ListEmptyComponent={
                        !loading ? (
                            <Card style={styles.emptyCard} elevation={2}>
                                <Card.Content style={styles.emptyContent}>
                                    <IconButton icon="account-multiple-outline" size={64} iconColor={theme.colors.onSurfaceVariant} />
                                    <Text style={styles.emptyTitle}>Belum Ada Pengguna</Text>
                                    <Text style={styles.emptyText}>Data pengguna akan muncul di sini setelah ditambahkan.</Text>
                                </Card.Content>
                            </Card>
                        ) : null
                    }
                />

                <FAB
                    style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                    icon="plus"
                    color="white"
                    onPress={handleAdd}
                />

                <Portal>
                    {/* Main Form Modal */}
                    <Modal visible={modalVisible} onDismiss={hideModal} contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>{isEditMode ? 'Edit Pengguna' : 'Tambah Pengguna'}</Text>

                            <TextInput
                                mode="outlined"
                                label="Nama Lengkap"
                                value={formData.nama}
                                onChangeText={(value) => updateFormData('nama', value)}
                                style={styles.input}
                                error={!formData.nama.trim() && formData.nama !== ''}
                            />

                            <View>
                                <TextInput
                                    mode="outlined"
                                    label="NIP"
                                    value={formData.nip}
                                    onChangeText={(value) => updateFormData('nip', value)}
                                    keyboardType="numeric"
                                    style={styles.input}
                                    disabled={isEditMode}
                                    error={!formData.nip.trim() && formData.nip !== ''}
                                />
                            </View>

                            <TextInput
                                mode="outlined"
                                label="Jabatan"
                                value={formData.jabatan}
                                onChangeText={(value) => updateFormData('jabatan', value)}
                                style={styles.input}
                                error={!formData.jabatan.trim() && formData.jabatan !== ''}
                            />

                            {/* Unit Kerja Picker */}
                            <Button
                                mode="outlined"
                                onPress={() => {
                                    setUnitKerjaSearch(formData.unit_kerja);
                                    setUnitKerjaModalVisible(true);
                                }}
                                style={styles.input}
                                contentStyle={styles.menuAnchor}
                                icon="chevron-down"
                            >
                                {formData.unit_kerja || 'Pilih Unit Kerja'}
                            </Button>

                            <TextInput
                                mode="outlined"
                                label="Email"
                                value={formData.email}
                                onChangeText={(value) => updateFormData('email', value)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                style={styles.input}
                                error={!formData.email.trim() && formData.email !== ''}
                            />

                            {/* Role Picker */}
                            <Button
                                mode="outlined"
                                onPress={() => setRoleModalVisible(true)}
                                style={styles.input}
                                contentStyle={styles.menuAnchor}
                                icon="chevron-down"
                            >
                                {ROLE_OPTIONS[formData.role] || 'Pilih Role'}
                            </Button>

                            <TextInput
                                mode="outlined"
                                label={isEditMode ? "Password Baru (Opsional)" : "Password"}
                                secureTextEntry={!isPasswordVisible}
                                value={formData.password}
                                onChangeText={(value) => updateFormData('password', value)}
                                style={styles.input}
                                error={!isEditMode && !formData.password.trim() && formData.password !== ''}
                                right={<TextInput.Icon icon={isPasswordVisible ? "eye-off" : "eye"} onPress={() => setIsPasswordVisible(!isPasswordVisible)} />}
                            />

                            <Button
                                mode="contained"
                                onPress={handleSave}
                                style={styles.saveButton}
                                loading={saving}
                                disabled={saving}
                            >
                                {saving ? 'Menyimpan...' : 'Simpan'}
                            </Button>

                            <Button onPress={hideModal} disabled={saving}>
                                Batal
                            </Button>
                        </ScrollView>
                    </Modal>

                    {/* Unit Kerja Selection Modal */}
                    <Modal
                        visible={unitKerjaModalVisible}
                        onDismiss={() => setUnitKerjaModalVisible(false)}
                        contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
                    >
                        <Text style={styles.modalTitle}>Pilih atau Masukkan Unit Kerja</Text>

                        <TextInput
                            mode="outlined"
                            label="Cari atau buat baru"
                            value={unitKerjaSearch}
                            onChangeText={setUnitKerjaSearch}
                            style={styles.input}
                        />

                        <FlatList
                            data={
                                unitKerjaSearch
                                    ? UNIT_KERJA_OPTIONS.filter(opt => opt.toLowerCase().includes(unitKerjaSearch.toLowerCase()))
                                    : UNIT_KERJA_OPTIONS
                            }
                            keyExtractor={item => item}
                            renderItem={({ item }) => (
                                <Button
                                    mode="text"
                                    onPress={() => {
                                        updateFormData('unit_kerja', item);
                                        setUnitKerjaModalVisible(false);
                                    }}
                                    style={styles.listItem}
                                    contentStyle={styles.listItemContent}
                                >
                                    {item}
                                </Button>
                            )}
                            style={styles.selectionList}
                            nestedScrollEnabled
                        />

                        <Button
                            mode="contained"
                            onPress={() => {
                                updateFormData('unit_kerja', unitKerjaSearch);
                                setUnitKerjaModalVisible(false);
                            }}
                            style={styles.saveButton}
                            disabled={!unitKerjaSearch.trim()}
                        >
                            Pilih "{unitKerjaSearch}"
                        </Button>

                        <Button onPress={() => setUnitKerjaModalVisible(false)}>
                            Batal
                        </Button>
                    </Modal>

                    {/* Role Selection Modal */}
                    <Modal
                        visible={roleModalVisible}
                        onDismiss={() => setRoleModalVisible(false)}
                        contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
                    >
                        <Text style={styles.modalTitle}>Pilih Role</Text>

                        <FlatList
                            data={getFilteredRoleOptions()}
                            keyExtractor={([key]) => key}
                            renderItem={({ item: [key, value] }) => (
                                <Button
                                    mode={formData.role === key ? "contained" : "text"}
                                    onPress={() => {
                                        updateFormData('role', key);
                                        setRoleModalVisible(false);
                                    }}
                                    style={[
                                        styles.listItem,
                                        formData.role === key && { backgroundColor: theme.colors.primary }
                                    ]}
                                    contentStyle={styles.listItemContent}
                                    labelStyle={formData.role === key ? { color: 'white' } : undefined}
                                >
                                    {value}
                                </Button>
                            )}
                            style={styles.selectionList}
                        />

                        <Button onPress={() => setRoleModalVisible(false)}>
                            Batal
                        </Button>
                    </Modal>
                </Portal>

                <Snackbar
                    visible={snackbar.visible}
                    onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
                    duration={4000}
                >
                    {snackbar.message}
                </Snackbar>
            </View>
        </Provider>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: theme.colors.onSurfaceVariant,
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
    listContent: {
        padding: 16,
        paddingBottom: 120,
    },
    card: {
        marginBottom: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.onSurface,
        marginBottom: 4,
    },
    userDetail: {
        fontSize: 13,
        color: theme.colors.onSurfaceVariant,
        marginBottom: 2,
    },
    userJabatan: {
        fontSize: 14,
        color: theme.colors.onSurfaceVariant,
        marginBottom: 2,
    },
    roleChip: {
        alignSelf: 'flex-start',
        marginTop: 8,
        height: 28,
    },
    chipText: {
        fontSize: 12,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fab: {
        position: 'absolute',
        marginRight: 16,
        marginBottom: 120,
        right: 2,
        bottom: 0,
        borderRadius: 28,
    },
    modalContainer: {
        padding: 20,
        margin: 20,
        borderRadius: 12,
        maxHeight: '85%',
    },
    modalTitle: {
        color: theme.colors.onSurface,
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        marginBottom: 12,
        backgroundColor: theme.colors.surface,
    },
    menuAnchor: {
        justifyContent: 'flex-start',
        height: 56,
    },
    saveButton: {
        marginTop: 8,
        marginBottom: 8,
        paddingVertical: 4,
    },
    emptyCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        marginTop: 40,
    },
    emptyContent: {
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.onSurface,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: theme.colors.onSurfaceVariant,
        textAlign: 'center',
        lineHeight: 20,
    },
    selectionList: {
        maxHeight: 300,
        marginBottom: 12,
    },
    listItem: {
        marginVertical: 2,
        borderRadius: 8,
        backgroundColor: theme.colors.surfaceVariant,
    },
    listItemContent: {
        justifyContent: 'flex-start',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
});