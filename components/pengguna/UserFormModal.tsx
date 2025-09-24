import { CustomTheme } from '@/constants/theme';
import { UNIT_KERJA_OPTIONS, ROLE_OPTIONS } from '@/constants/type';
import { useAppTheme } from '@/context/ThemeContext';
import { User } from '@/utils/api';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import {
  Button,
  Menu,
  Modal,
  Portal,
  Snackbar,
  Text,
  TextInput
} from 'react-native-paper';

interface UserFormModalProps {
    visible: boolean;
    onDismiss: () => void;
    onSave: (userData: Partial<User> & { password?: string }, isEditMode: boolean, originalNip?: string) => Promise<void>;
    initialUser: User | null;
    loading: boolean; // For save operation
    snackbar: { visible: boolean; message: string };
    setSnackbar: React.Dispatch<React.SetStateAction<{ visible: boolean; message: string }>>;
    ROLE_DISPLAY_NAMES: { [key: string]: string };
}

const UserFormModal: React.FC<UserFormModalProps> = ({
    visible,
    onDismiss,
    onSave,
    initialUser,
    loading,
    snackbar,
    setSnackbar,
    ROLE_DISPLAY_NAMES,
}) => {
    const { theme } = useAppTheme();
    const styles = getStyles(theme);

    const [isEditMode, setIsEditMode] = useState(false);
    const [originalNip, setOriginalNip] = useState<string | undefined>(undefined);

    // Form state
    const [nama, setNama] = useState('');
    const [nip, setNip] = useState('');
    const [email, setEmail] = useState('');
    const [jabatan, setJabatan] = useState('');
    const [role, setRole] = useState('');
    const [password, setPassword] = useState('');

    const [roleMenuVisible, setRoleMenuVisible] = useState(false);
    const [jabatanMenuVisible, setJabatanMenuVisible] = useState(false);
    const [filteredJabatanOptions, setFilteredJabatanOptions] = useState<string[]>(UNIT_KERJA_OPTIONS);

    useEffect(() => {
        if (visible) {
            if (initialUser) {
                setIsEditMode(true);
                setOriginalNip(initialUser.nip);
                setNama(initialUser.nama);
                setNip(initialUser.nip);
                setEmail(initialUser.email);
                setJabatan(initialUser.jabatan || '');
                setRole(initialUser.role);
                setPassword(''); // Password should not be pre-filled for security
            } else {
                setIsEditMode(false);
                setOriginalNip(undefined);
                setNama('');
                setNip('');
                setEmail('');
                setJabatan('');
                setRole('');
                setPassword('');
            }
            setFilteredJabatanOptions(UNIT_KERJA_OPTIONS); // Reset filter when modal opens
        }
    }, [visible, initialUser]);

    const handleJabatanChange = (text: string) => {
        setJabatan(text);
        if (text) {
            setFilteredJabatanOptions(
                UNIT_KERJA_OPTIONS.filter(option =>
                    option.toLowerCase().includes(text.toLowerCase())
                )
            );
        } else {
            setFilteredJabatanOptions(UNIT_KERJA_OPTIONS);
        }
        setJabatanMenuVisible(true); // Show menu when typing
    };

    const handleSavePress = async () => {
        if (!nama || !nip || !email || !role || !jabatan || (!isEditMode && !password)) {
            setSnackbar({ visible: true, message: 'Harap isi semua field yang wajib diisi' });
            return;
        }

        const userData: Partial<User> & { password?: string } = {
            nama,
            nip,
            email,
            jabatan,
            role,
        };

        if (password) {
            userData.password = password;
        }

        await onSave(userData, isEditMode, originalNip);
    };

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={styles.modalTitle}>{isEditMode ? 'Edit Pengguna' : 'Tambah Pengguna'}</Text>
                    <TextInput mode="outlined" label="Nama Lengkap" value={nama} onChangeText={setNama} style={styles.input} />
                    <TextInput mode="outlined" label="NIP" value={nip} onChangeText={setNip} keyboardType="numeric" style={styles.input} disabled={isEditMode} />
                    <TextInput mode="outlined" label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={styles.input} />

                    {/* Jabatan Input with Search and Select */}
                    <Menu
                        visible={jabatanMenuVisible && filteredJabatanOptions.length > 0}
                        onDismiss={() => setJabatanMenuVisible(false)}
                        anchor={
                            <TextInput
                                mode="outlined"
                                label="Jabatan"
                                value={jabatan}
                                onChangeText={handleJabatanChange}
                                style={styles.input}
                                onFocus={() => setJabatanMenuVisible(true)}
                                onBlur={() => setTimeout(() => setJabatanMenuVisible(false), 100)} // Delay to allow menu item click
                            />
                        }
                        style={styles.menu}
                    >
                        {filteredJabatanOptions.map((option, index) => (
                            <Menu.Item
                                key={index}
                                onPress={() => {
                                    setJabatan(option);
                                    setJabatanMenuVisible(false);
                                }}
                                title={option}
                            />
                        ))}
                    </Menu>

                    {/* Role Selection */}
                    <Menu
                        visible={roleMenuVisible}
                        onDismiss={() => setRoleMenuVisible(false)}
                        anchor={
                            <Button
                                mode="outlined"
                                onPress={() => setRoleMenuVisible(true)}
                                style={styles.input}
                                contentStyle={styles.menuAnchor}
                                icon="chevron-down"
                            >
                                {ROLE_DISPLAY_NAMES[role] || 'Pilih Role'}
                            </Button>
                        }>
                        {Object.entries(ROLE_DISPLAY_NAMES).map(([key, value]) => (
                            <Menu.Item
                                key={key}
                                onPress={() => {
                                    setRole(key);
                                    setRoleMenuVisible(false);
                                }}
                                title={value}
                            />
                        ))}
                    </Menu>

                    <TextInput mode="outlined" label={isEditMode ? "Password Baru (Opsional)" : "Password"} secureTextEntry onChangeText={setPassword} style={styles.input} />
                    <Button mode="contained" onPress={handleSavePress} style={styles.saveButton} loading={loading} disabled={loading}>
                        Simpan
                    </Button>
                    <Button onPress={onDismiss} disabled={loading}>
                        Batal
                    </Button>
                </ScrollView>
            </Modal>
            <Snackbar
                visible={snackbar.visible}
                onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
                duration={3000}>
                {snackbar.message}
            </Snackbar>
        </Portal>
    );
};

const getStyles = (theme: CustomTheme) => StyleSheet.create({
    modalContainer: {
        padding: 20,
        margin: 20,
        borderRadius: 12,
        maxHeight: '80%', // Limit height for scrollability
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: theme.colors.onSurface,
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
    menu: {
        width: '80%', // Adjust width to match TextInput
        marginTop: 56, // Position below TextInput
    }
});

export default UserFormModal;
