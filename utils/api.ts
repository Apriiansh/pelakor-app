import AsyncStorage from '@react-native-async-storage/async-storage';

// Ambil base URL dari environment variables
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_BASE_URL) {
    console.error("API_BASE_URL tidak ditemukan di environment variables.");
}

export class ApiError extends Error {
    constructor(message: string, public status: number) {
        super(message);
    }
}

// Fungsi helper utama untuk fetch
async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const token = await AsyncStorage.getItem('userToken');

    const headers = new Headers(options.headers || {});
    
    // Hanya set Content-Type jika bukan FormData (untuk file upload)
    if (!(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }
    
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Terjadi kesalahan pada server' }));
        throw new ApiError(errorData.message || 'Gagal memuat data', response.status);
    }

    // Handle response tanpa konten (misal: 204 No Content)
    if (response.status === 204) {
        return null;
    }

    return response.json();
}

// --- LAPORAN ENDPOINTS ---

/**
 * GET /api/laporan
 * Ambil daftar laporan sesuai role user
 */
export const getLaporan = () => {
    return apiFetch('/api/laporan');
};

/**
 * GET /api/laporan/:id_laporan
 * Ambil detail laporan berdasarkan ID
 */
export const getLaporanDetail = (id_laporan: string) => {
    return apiFetch(`/api/laporan/${id_laporan}`);
};

/**
 * POST /api/laporan
 * Buat laporan baru dengan lampiran opsional
 */
export const createLaporan = (data: {
    judul_laporan: string;
    isi_laporan: string;
    kategori?: string;
    lampiran?: File | null;
}) => {
    const formData = new FormData();
    formData.append('judul_laporan', data.judul_laporan);
    formData.append('isi_laporan', data.isi_laporan);
    if (data.kategori) {
        formData.append('kategori', data.kategori);
    }
    if (data.lampiran) {
        formData.append('lampiran', data.lampiran);
    }

    return apiFetch('/api/laporan', {
        method: 'POST',
        body: formData,
    });
};

/**
 * PUT /api/laporan/:id_laporan
 * Edit laporan (hanya jika status masih diajukan)
 */
export const updateLaporan = (id_laporan: string, data: {
    judul_laporan: string;
    isi_laporan: string;
    kategori?: string;
    lampiran?: File | null;
}) => {
    // Jika ada file lampiran, gunakan FormData
    if (data.lampiran) {
        const formData = new FormData();
        formData.append('judul_laporan', data.judul_laporan);
        formData.append('isi_laporan', data.isi_laporan);
        if (data.kategori) {
            formData.append('kategori', data.kategori);
        }
        formData.append('lampiran', data.lampiran);

        return apiFetch(`/api/laporan/${id_laporan}`, {
            method: 'PUT',
            body: formData,
        });
    } else {
        // Jika tidak ada file, gunakan JSON biasa
        return apiFetch(`/api/laporan/${id_laporan}`, {
            method: 'PUT',
            body: JSON.stringify({
                judul_laporan: data.judul_laporan,
                isi_laporan: data.isi_laporan,
                kategori: data.kategori || null,
            }),
        });
    }
};

/**
 * DELETE /api/laporan/:id_laporan
 * Hapus laporan (hanya jika status masih diajukan)
 */
export const deleteLaporan = (id_laporan: string) => {
    return apiFetch(`/api/laporan/${id_laporan}`, {
        method: 'DELETE',
    });
};

// --- DISPOSISI ENDPOINTS ---

/**
 * GET /api/disposisi
 * Ambil daftar laporan dengan status "diajukan" (hanya untuk Kabbag)
 */
export const getLaporanDiajukan = () => {
    return apiFetch('/api/disposisi');
};

/**
 * POST /api/disposisi/:laporan_id
 * Lakukan disposisi laporan ke Sub Bagian Umum
 */
export const postDisposisi = (laporan_id: string, data: {
    nik_penanggung_jawab?: string;
    catatan_disposisi?: string; 
    valid: boolean;
}) => {
    return apiFetch(`/api/disposisi/${laporan_id}`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

/**
 * GET /api/disposisi/:laporan_id
 * Ambil histori disposisi untuk laporan tertentu
 */
export const getDisposisiHistory = (laporan_id: string) => {
    return apiFetch(`/api/disposisi/${laporan_id}`);
};

// --- TINDAK LANJUT ENDPOINTS ---

/**
 * GET /api/tindaklanjut
 * Ambil daftar laporan yang menjadi tanggung jawab user (role Subbag Umum)
 */
export const getTindakLanjut = () => {
    return apiFetch('/api/tindaklanjut');
};

/**
 * POST /api/tindaklanjut/:laporan_id
 * Tambahkan catatan tindak lanjut dengan lampiran opsional
 */
export const postTindakLanjut = (laporan_id: string, data: {
    catatan?: string;
    status?: string;
    lampiran?: File | null;
}) => {
    const formData = new FormData();
    if (data.catatan) {
        formData.append('catatan', data.catatan);
    }
    if (data.status) {
        formData.append('status', data.status);
    }
    if (data.lampiran) {
        formData.append('lampiran', data.lampiran);
    }

    return apiFetch(`/api/tindaklanjut/${laporan_id}`, {
        method: 'POST',
        body: formData,
    });
};

/**
 * GET /api/tindaklanjut/:laporan_id
 * Ambil semua catatan tindak lanjut untuk laporan tertentu
 */
export const getTindakLanjutHistory = (laporan_id: string) => {
    return apiFetch(`/api/tindaklanjut/${laporan_id}`);
};

// --- TYPE DEFINITIONS ---

export interface User {
    nama: string;
    nik: string;
    email: string;
    role: 'kabbag_umum' | 'subbag_umum' | 'pegawai';
    jabatan?: string;
}

export interface Bagian {
    id: number;
    name: string;
    code: string;
}

export interface Laporan {
    id_laporan: number;
    judul_laporan: string;
    isi_laporan: string;
    kategori?: string;
    lampiran?: string;
    status_laporan: 'diajukan' | 'diproses' | 'ditolak' | 'ditindaklanjuti' | 'selesai';
    nik_pelapor: string;
    pelapor: string;
    created_at: string;
    updated_at?: string;
}

export interface DisposisiHistory {
    id: number;
    status_disposisi: string;
    catatan_disposisi: string;
    kabbag: string;
    created_at: string;
    penanggung_jawab?: string;
}

export interface TindakLanjutHistory {
    id: number;
    catatan?: string;
    lampiran?: string;
    status_tindaklanjut: string;
    created_at: string;
    penindak: string;
}

// --- USER ENDPOINTS ---

/**
 * GET /api/users
 * Ambil semua user dengan optional filtering berdasarkan role atau jabatan
 */
export const getUsers = (filters?: { role?: string; jabatan?: string }) => {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.jabatan) params.append('jabatan', filters.jabatan);
    
    const queryString = params.toString();
    return apiFetch(`/api/users${queryString ? `?${queryString}` : ''}`);
};

/**
 * GET /api/users/by-role/:role
 * Ambil user berdasarkan role tertentu
 */
export const getUsersByRole = (role: string) => {
    return apiFetch(`/api/users/by-role/${role}`);
};

/**
 * GET /api/users/subbag
 * Ambil daftar subbag untuk dropdown disposisi
 */
export const getSubbagUmum = () => {
    return apiFetch('/api/users/subbag-umum');
};

/**
 * GET /api/users/kabbag
 * Ambil daftar kabbag
 */
export const getKabbagUsers = () => {
    return apiFetch('/api/users/kabbag');
};

/**
 * GET /api/users/pegawai
 * Ambil daftar pegawai
 */
export const getPegawaiUsers = () => {
    return apiFetch('/api/users/pegawai');
};

/**
 * GET /api/users/bagian
 * Ambil daftar bagian yang tersedia
 */
export const getBagianList = () => {
    return apiFetch('/api/users/bagian');
};

/**
 * GET /api/users/by-bagian/:bagian
 * Ambil user berdasarkan bagian/jabatan
 */
export const getUsersByBagian = (bagian: string) => {
    return apiFetch(`/api/users/by-bagian/${bagian}`);
};

/**
 * GET /api/users/me
 * Ambil profil user yang sedang login
 */
export const getCurrentUser = () => {
    return apiFetch('/api/users/me');
};

/**
 * GET /api/users/:nik
 * Ambil detail user berdasarkan NIK
 */
export const getUserDetail = (nik: string) => {
    return apiFetch(`/api/users/${nik}`);
};

/**
 * POST /api/users
 * Buat user baru
 */
export const createUser = (data: {
    nama: string;
    nik: string;
    email: string;
    role: string;
    jabatan?: string;
    password: string;
}) => {
    return apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

/**
 * PUT /api/users/:nik
 * Update user berdasarkan NIK
 */
export const updateUser = (nik: string, data: {
    nama: string;
    email: string;
    role: string;
    jabatan?: string;
    password?: string;
}) => {
    return apiFetch(`/api/users/${nik}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
};

/**
 * DELETE /api/users/:nik
 * Hapus user berdasarkan NIK
 */
export const deleteUser = (nik: string) => {
    return apiFetch(`/api/users/${nik}`, {
        method: 'DELETE',
    });
};

// --- UTILITY FUNCTIONS ---

/**
 * Helper untuk mengambil file URL lengkap
 */
export const getFileUrl = (filePath: string | null | undefined): string | null => {
    if (!filePath || !API_BASE_URL) return null;
    return `${API_BASE_URL}${filePath}`;
};

/**
 * Helper untuk format tanggal
 */
export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};