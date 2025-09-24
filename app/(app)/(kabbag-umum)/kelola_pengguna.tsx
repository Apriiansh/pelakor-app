import { UNIT_KERJA_OPTIONS, ROLE_OPTIONS } from '@/constants/type';
import { useAppTheme } from '@/context/ThemeContext';
import { ApiError, createUser, deleteUser, getUsers, updateUser, User } from '@/utils/api';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
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
} from 'react-native-paper';



const cleanUnitKerja = (unitKerja: string | undefined | null): string => {
    if (!unitKerja) return '';
    // Membersihkan format array postgresql seperti {"Nilai"} atau {Nilai}
    return unitKerja.replace(/^{"?(.*?)"?}$/, '$1');
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

                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.nama}</Text>
                    <Text style={styles.userJabatan}>{user.jabatan || 'Jabatan tidak diatur'}</Text>
                    <Text style={styles.userJabatan}>{cleanUnitKerja(user.unit_kerja) || 'Unit Kerja tidak diatur'}</Text>
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
    const [menuVisible, setMenuVisible] = useState(false);
    const [unitKerjaModalVisible, setUnitKerjaModalVisible] = useState(false);
    const [unitKerjaSearch, setUnitKerjaSearch] = useState('');

    // Form state
    const [nama, setNama] = useState('');
    const [nip, setNip] = useState('');
    const [email, setEmail] = useState('');
    const [jabatan, setJabatan] = useState('');
    const [unit_kerja, setUnitKerja] = useState('');
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
        setNip('');
        setEmail('');
        setJabatan('');
        setUnitKerja('');
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
        setNip(user.nip);
        setEmail(user.email);
        setJabatan(user.jabatan || '');
        setUnitKerja(cleanUnitKerja(user.unit_kerja));
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
                            await deleteUser(user.nip);
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
        if (!nama || !nip || !email || !role || !jabatan || !unit_kerja || (!isEditMode && !password)) {
            setSnackbar({ visible: true, message: 'Harap isi semua field yang wajib diisi' });
            return;
        }

        const userData = {
            nama,
            nip,
            email,
            jabatan,
            unit_kerja,
            role,
            password: password || undefined,
        };

        setSaving(true);
        try {
            if (isEditMode && selectedUser) {
                const { nip: _nip, ...updateData } = userData;
                await updateUser(selectedUser.nip, updateData);
                setSnackbar({ visible: true, message: 'Pengguna berhasil diperbarui' });
            } else {
                await createUser(userData as any);
                setSnackbar({ visible: true, message: 'Pengguna berhasil ditambahkan' });
            }
            hideModal();
            fetchUsers();
        } catch (error) {
            const message = error instanceof ApiError ? error.message : `Gagal menyimpan pengguna`;
            setSnackbar({ visible: true, message });
        } finally {
            setSaving(false);
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
                    <Modal visible={modalVisible} onDismiss={hideModal} contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
                        <Text style={styles.modalTitle}>{isEditMode ? 'Edit Pengguna' : 'Tambah Pengguna'}</Text>
                        <TextInput mode="outlined" label="Nama Lengkap" value={nama} onChangeText={setNama} style={styles.input} />
                        <TextInput mode="outlined" label="NIP" value={nip} onChangeText={setNip} keyboardType="numeric" style={styles.input} disabled={isEditMode} />
                        <TextInput mode="outlined" label="Jabatan" value={jabatan} onChangeText={setJabatan} style={styles.input} />
                        <Button
                            mode="outlined"
                            onPress={() => {
                                setUnitKerjaSearch(unit_kerja);
                                setUnitKerjaModalVisible(true);
                            }}
                            style={styles.input}
                            contentStyle={styles.menuAnchor}
                            icon="chevron-down"
                        >
                            {unit_kerja || 'Pilih Unit Kerja'}
                        </Button>
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
                                    {ROLE_OPTIONS[role] || 'Pilih Role'}
                                </Button>
                            }>
                            <Menu.Item onPress={() => { setRole('bupati'); setMenuVisible(false); }} title="Bupati" />
                            <Menu.Item onPress={() => { setRole('wakil_bupati'); setMenuVisible(false); }} title="Wakil Bupati" />
                            <Menu.Item onPress={() => { setRole('sekda'); setMenuVisible(false); }} title="Sekretariat Daerah" />
                            <Menu.Item onPress={() => { setRole('asisten'); setMenuVisible(false); }} title="Asisten" />
                            <Menu.Item onPress={() => { setRole('staf_ahli'); setMenuVisible(false); }} title="Staf Ahli" />


                            {/* <Menu.Item onPress={() => { setRole('subbag_umum'); setMenuVisible(false); }} title="Sub Bagian Umum" />
                            <Menu.Item onPress={() => { setRole('kabbag_umum'); setMenuVisible(false); }} title="Kepala Bagian Umum" /> */}

                            <Menu.Item onPress={() => { setRole('pegawai'); setMenuVisible(false); }} title="Pegawai" />

                            <Menu.Item onPress={() => { setRole('opd'); setMenuVisible(false); }} title="Pegawai Organisasi Perangkat Daerah" />
                        </Menu>

                        <TextInput mode="outlined" label={isEditMode ? "Password Baru (Opsional)" : "Password"} secureTextEntry onChangeText={setPassword} style={styles.input} />
                        <Button mode="contained" onPress={handleSave} style={styles.saveButton} loading={saving} disabled={saving}>
                            Simpan
                        </Button>
                        <Button onPress={hideModal} disabled={saving}>
                            Batal
                        </Button>
                    </Modal>
                    <Modal visible={unitKerjaModalVisible} onDismiss={() => setUnitKerjaModalVisible(false)} contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
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
                                <Menu.Item
                                    onPress={() => {
                                        setUnitKerja(item);
                                        setUnitKerjaModalVisible(false);
                                    }}
                                    title={item}
                                    style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: 8, marginVertical: 2 }}
                                />
                            )}
                            style={{ maxHeight: 300, marginBottom: 12 }}
                            nestedScrollEnabled
                        />
                        <Button
                            mode="contained"
                            onPress={() => {
                                setUnitKerja(unitKerjaSearch);
                                setUnitKerjaModalVisible(false);
                            }}
                            style={styles.saveButton}
                        >
                            Pilih
                        </Button>
                        <Button onPress={() => setUnitKerjaModalVisible(false)}>
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
        padding: 20,
    },
    userInfo: {
        flex: 1,
        marginLeft: 16,

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
        color: theme.colors.onSurface,
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        marginBottom: 12,
        backgroundColor: theme.colors.surface,
        color: theme.colors.onSurface,
        borderRadius: 12,
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

