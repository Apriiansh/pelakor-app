import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import {
    Button,
    Card,
    Text,
    Avatar,
    IconButton,
    FAB,
    Portal,
    Modal,
    TextInput,
    Provider,
    ActivityIndicator,
    Snackbar,
    Menu,
    Chip,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/context/ThemeContext';
import { getUsers, createUser, updateUser, deleteUser, ApiError, User } from '@/utils/api';

// Map role keys to display-friendly names
const ROLE_DISPLAY_NAMES: { [key: string]: string } = {
    pegawai: 'Pegawai',
    subbag_umum: 'Sub Bagian Umum',
    kabbag_umum: 'Kepala Bagian Umum',
};

const UserCard = ({ user, onEdit, onDelete }: { user: User; onEdit: (user: User) => void; onDelete: (user: User) => void }) => {
    const { theme } = useAppTheme();
    const styles = createStyles(theme);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();
    };

    return (
        <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
                <Avatar.Text
                    size={48}
                    label={getInitials(user.nama)}
                    style={styles.avatar}
                />
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.nama}</Text>
                    <Text style={styles.userJabatan}>{user.jabatan || 'Jabatan tidak diatur'}</Text>
                    <View style={styles.chipContainer}>
                        <Chip
                            icon="account-tie"
                            style={[styles.chip, { backgroundColor: theme.colors.primaryContainer }]}
                            textStyle={[styles.chipText, { color: theme.colors.onPrimaryContainer }]}
                        >
                            {ROLE_DISPLAY_NAMES[user.role] || user.role}
                        </Chip>
                    </View>
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
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
    const [menuVisible, setMenuVisible] = useState(false);

    // Form state
    const [nama, setNama] = useState('');
    const [nik, setNik] = useState('');
    const [email, setEmail] = useState('');
    const [jabatan, setJabatan] = useState('');
    const [role, setRole] = useState('');
    const [password, setPassword] = useState('');

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
        setNama('');
        setNik('');
        setEmail('');
        setJabatan('');
        setRole('');
        setPassword('');
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
        setNama(user.nama);
        setNik(user.nik);
        setEmail(user.email);
        setJabatan(user.jabatan || '');
        setRole(user.role);
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
                            await deleteUser(user.nik);
                            setSnackbar({ visible: true, message: 'Pengguna berhasil dihapus' });
                            fetchUsers(); // Refresh list
                        } catch (error) {
                            const message = error instanceof ApiError ? error.message : 'Gagal menghapus pengguna';
                            setSnackbar({ visible: true, message });
                        }
                    }
                }
            ]
        );
    };

    const handleSave = async () => {
        if (!nama || !nik || !email || !role || !jabatan || (!isEditMode && !password)) {
            setSnackbar({ visible: true, message: 'Harap isi semua field yang wajib diisi' });
            return;
        }

        const userData = {
            nama,
            nik,
            email,
            jabatan,
            role,
            password: password || undefined,
        };

        try {
            if (isEditMode && selectedUser) {
                // For edit, we don't send NIK in the body and password is optional
                const { nik: _nik, ...updateData } = userData;
                await updateUser(selectedUser.nik, updateData);
                setSnackbar({ visible: true, message: 'Pengguna berhasil diperbarui' });
            } else {
                await createUser(userData as any); // 'as any' because password is not optional in createUser
                setSnackbar({ visible: true, message: 'Pengguna berhasil ditambahkan' });
            }
            hideModal();
            fetchUsers(); // Refresh list
        } catch (error) {
            const message = error instanceof ApiError ? error.message : `Gagal menyimpan pengguna`;
            setSnackbar({ visible: true, message });
        }
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
                    data={users}
                    keyExtractor={(item) => item.nik}
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
                    <Modal visible={modalVisible} onDismiss={hideModal} contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
                        <Text style={styles.modalTitle}>{isEditMode ? 'Edit Pengguna' : 'Tambah Pengguna'}</Text>
                        <TextInput mode="outlined" label="Nama Lengkap" value={nama} onChangeText={setNama} style={styles.input} />
                        <TextInput mode="outlined" label="NIK" value={nik} onChangeText={setNik} keyboardType="numeric" style={styles.input} disabled={isEditMode} />
                        <TextInput mode="outlined" label="Jabatan" value={jabatan} onChangeText={setJabatan} style={styles.input} />
                        <TextInput mode="outlined" label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={styles.input} />

                        <Menu
                            visible={menuVisible}
                            onDismiss={() => setMenuVisible(false)}
                            anchor={
                                <Button
                                    mode="outlined"
                                    onPress={() => setMenuVisible(true)}
                                    style={styles.input}
                                    contentStyle={styles.menuAnchor}
                                    icon="chevron-down"
                                >
                                    {ROLE_DISPLAY_NAMES[role] || 'Pilih Role'}
                                </Button>
                            }>
                            <Menu.Item onPress={() => { setRole('pegawai'); setMenuVisible(false); }} title="Pegawai" />
                            <Menu.Item onPress={() => { setRole('subbag_umum'); setMenuVisible(false); }} title="Sub Bagian Umum" />
                            <Menu.Item onPress={() => { setRole('kabbag_umum'); setMenuVisible(false); }} title="Kepala Bagian Umum" />
                        </Menu>

                        <TextInput mode="outlined" label={isEditMode ? "Password Baru (Opsional)" : "Password"} secureTextEntry onChangeText={setPassword} style={styles.input} />
                        <Button mode="contained" onPress={handleSave} style={styles.saveButton} loading={loading} disabled={loading}>
                            Simpan
                        </Button>
                        <Button onPress={hideModal} disabled={loading}>
                            Batal
                        </Button>
                    </Modal>
                </Portal>
                <Snackbar
                    visible={snackbar.visible}
                    onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
                    duration={3000}>
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
        padding: 16,
    },
    avatar: {
        marginRight: 16,
        backgroundColor: theme.colors.primary,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.onSurface,
    },
    userJabatan: {
        fontSize: 14,
        color: theme.colors.onSurfaceVariant,
        marginTop: 2,
    },
    chipContainer: {
        flexDirection: 'row',
        marginTop: 8,
    },
    chip: {
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
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
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        marginBottom: 12,
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
});

