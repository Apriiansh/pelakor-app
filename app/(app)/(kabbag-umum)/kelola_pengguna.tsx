import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Appbar, Button, Card, Text, Avatar, IconButton, FAB, Portal, Modal, TextInput, Provider, ActivityIndicator, Snackbar, Menu } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Define the User type for better type safety
interface User {
  nik: string;
  nama: string;
  email: string;
  role: string;
}

const UserCard = ({ user, onEdit, onDelete }: { user: User; onEdit: (user: User) => void; onDelete: (user: User) => void }) => (
  <Card style={styles.card}>
    <Card.Title
      title={user.nama}
      subtitle={user.role}
      left={(props) => <Avatar.Icon {...props} icon="account-circle" />}
      right={(props) => (
        <View style={{ flexDirection: 'row' }}>
          <IconButton {...props} icon="pencil" onPress={() => onEdit(user)} />
          <IconButton {...props} icon="delete" onPress={() => onDelete(user)} />
        </View>
      )}
    />
  </Card>
);

export default function KelolaPenggunaScreen() {
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const [menuVisible, setMenuVisible] = useState(false);

  // Form state
  const [nama, setNama] = useState('');
  const [nik, setNik] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');

  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/users`);
      const data = await response.json();
      if (response.ok) {
        setUsers(data);
      } else {
        throw new Error(data.message || 'Gagal memuat pengguna');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan';
      setSnackbar({ visible: true, message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const clearForm = () => {
    setSelectedUser(null);
    setIsEditMode(false);
    setNama('');
    setNik('');
    setEmail('');
    setRole('');
    setPassword('');
  };

  const hideModal = () => {
    setModalVisible(false);
    clearForm();
  };

  const handleAdd = () => {
    setIsEditMode(false);
    setModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setNama(user.nama);
    setNik(user.nik);
    setEmail(user.email);
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
        { text: "Hapus", style: "destructive", onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/users/${user.nik}`, { method: 'DELETE' });
              if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Gagal menghapus pengguna');
              }
              setSnackbar({ visible: true, message: 'Pengguna berhasil dihapus' });
              fetchUsers();
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Terjadi kesalahan';
              setSnackbar({ visible: true, message });
            }
        }}
      ]
    );
  };
  
  const handleSave = async () => {
    const userData = isEditMode 
      ? { nama, email, role, password: password || undefined } 
      : { nama, nik, email, role, password: password || undefined };

    const url = isEditMode && selectedUser ? `${API_URL}/users/${selectedUser.nik}` : `${API_URL}/users`;
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Gagal ${isEditMode ? 'memperbarui' : 'menyimpan'} pengguna`);
      }
      setSnackbar({ visible: true, message: `Pengguna berhasil ${isEditMode ? 'diperbarui' : 'disimpan'}` });
      hideModal();
      fetchUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan';
      setSnackbar({ visible: true, message });
    }
  }

  return (
    <Provider>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Appbar.Header>
          <Appbar.Content title="Kelola Pengguna" />
        </Appbar.Header>

        {loading ? (
          <ActivityIndicator animating={true} size="large" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.nik}
            renderItem={({ item }) => (
              <UserCard user={item} onEdit={handleEdit} onDelete={handleDelete} />
            )}
            contentContainerStyle={styles.listContent}
            onRefresh={fetchUsers}
            refreshing={loading}
          />
        )}

        <FAB
          style={styles.fab}
          icon="plus"
          onPress={handleAdd}
        />

        <Portal>
          <Modal visible={modalVisible} onDismiss={hideModal} contentContainerStyle={styles.modalContainer}>
            <Text style={styles.modalTitle}>{isEditMode ? 'Edit Pengguna' : 'Tambah Pengguna'}</Text>
            <TextInput mode="outlined" label="Nama" value={nama} onChangeText={setNama} style={styles.input} />
            <TextInput mode="outlined" label="NIK" value={nik} onChangeText={setNik} keyboardType="numeric" style={styles.input} disabled={isEditMode} />
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
                  {role || 'Pilih Role'}
                </Button>
              }>
              <Menu.Item onPress={() => { setRole('pegawai'); setMenuVisible(false); }} title="Pegawai" />
              <Menu.Item onPress={() => { setRole('subbag_mum'); setMenuVisible(false); }} title="Sub Bagian Umum" />
              <Menu.Item onPress={() => { setRole('kabbag_umum'); setMenuVisible(false); }} title="Kepala Bagian Umum" />
            </Menu>

            <TextInput mode="outlined" label={isEditMode ? "Password Baru (Opsional)" : "Password"} secureTextEntry onChangeText={setPassword} style={styles.input} />
            <Button mode="contained" onPress={handleSave} style={styles.saveButton}>
              Simpan
            </Button>
            <Button onPress={hideModal}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
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
    height: 50, // Match TextInput height
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 8,
  }
});
