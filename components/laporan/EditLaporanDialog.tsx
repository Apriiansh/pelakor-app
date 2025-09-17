
import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import {
    Button,
    Dialog,
    Portal,
    TextInput,
    HelperText,
} from 'react-native-paper';

interface EditLaporanDialogProps {
    visible: boolean;
    initialData: { judul_laporan: string; isi_laporan: string; kategori: string } | null;
    isSubmitting: boolean;
    onDismiss: () => void;
    onSubmit: (formData: { judul_laporan: string; isi_laporan: string; kategori: string }) => void;
}

export const EditLaporanDialog = ({
    visible,
    initialData,
    isSubmitting,
    onDismiss,
    onSubmit,
}: EditLaporanDialogProps) => {
    const [editForm, setEditForm] = useState({
        judul_laporan: '',
        isi_laporan: '',
        kategori: '',
    });

    useEffect(() => {
        if (initialData) {
            setEditForm(initialData);
        }
    }, [initialData]);

    const handleTextChange = (field: keyof typeof editForm, text: string) => {
        setEditForm(prev => ({ ...prev, [field]: text }));
    };

    const canSubmit = editForm.judul_laporan.trim() && editForm.isi_laporan.trim();

    return (
        <Portal>
            <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
                <Dialog.Title style={styles.dialogTitle}>Edit Laporan</Dialog.Title>
                <Dialog.ScrollArea>
                    <Dialog.Content>
                        <TextInput
                            label="Judul Laporan"
                            value={editForm.judul_laporan}
                            onChangeText={(text) => handleTextChange('judul_laporan', text)}
                            mode="outlined"
                            style={styles.editInput}
                            maxLength={200}
                            right={<TextInput.Affix text={`${editForm.judul_laporan.length}/200`} />}
                        />
                        <TextInput
                            label="Kategori (Opsional)"
                            value={editForm.kategori}
                            onChangeText={(text) => handleTextChange('kategori', text)}
                            mode="outlined"
                            style={styles.editInput}
                            maxLength={100}
                            right={<TextInput.Affix text={`${editForm.kategori.length}/100`} />}
                        />
                        <TextInput
                            label="Isi Laporan"
                            value={editForm.isi_laporan}
                            onChangeText={(text) => handleTextChange('isi_laporan', text)}
                            mode="outlined"
                            multiline
                            numberOfLines={6}
                            style={styles.editInput}
                            maxLength={2000}
                            right={<TextInput.Affix text={`${editForm.isi_laporan.length}/2000`} />}
                        />
                        <HelperText type="info" visible={true}>
                            Hanya laporan dengan status "Diajukan" yang dapat diedit
                        </HelperText>
                    </Dialog.Content>
                </Dialog.ScrollArea>
                <Dialog.Actions style={styles.dialogActions}>
                    <Button onPress={onDismiss} disabled={isSubmitting}>
                        Batal
                    </Button>
                    <Button
                        onPress={() => onSubmit(editForm)}
                        disabled={isSubmitting || !canSubmit}
                        loading={isSubmitting}
                        mode="contained"
                    >
                        Simpan
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
};

const styles = StyleSheet.create({
    dialog: { maxHeight: '85%' },
    dialogTitle: { fontFamily: 'RubikBold', fontSize: 18, lineHeight: 24 },
    editInput: { marginBottom: 16 },
    dialogActions: { paddingHorizontal: 24, paddingVertical: 16 },
});
