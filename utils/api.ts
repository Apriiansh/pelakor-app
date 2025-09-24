import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Ambil base URL dari environment variables
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_BASE_URL) {
    console.error("API_BASE_URL tidak ditemukan di environment variables.");
    console.error("Pastikan file .env memiliki EXPO_PUBLIC_API_URL");
}

export class ApiError extends Error {
    constructor(message: string, public status: number) {
        super(message);
    }
}

// Enhanced token management with cross-platform support
const TokenManager = {
    async getToken(): Promise<string | null> {
        try {
            if (Platform.OS === 'web') {
                return localStorage.getItem('userToken');
            } else {
                return await AsyncStorage.getItem('userToken');
            }
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    },

    async setToken(token: string): Promise<void> {
        try {
            if (Platform.OS === 'web') {
                localStorage.setItem('userToken', token);
            } else {
                await AsyncStorage.setItem('userToken', token);
            }
        } catch (error) {
            console.error('Error setting token:', error);
            throw error;
        }
    },

    async removeToken(): Promise<void> {
        try {
            if (Platform.OS === 'web') {
                localStorage.removeItem('userToken');
            } else {
                await AsyncStorage.removeItem('userToken');
            }
        } catch (error) {
            console.error('Error removing token:', error);
            throw error;
        }
    }
};

// Enhanced fetch function with better error handling and timeout
async function apiFetch(endpoint: string, options: RequestInit = {}) {
    if (!API_BASE_URL) {
        throw new ApiError('API URL tidak dikonfigurasi', 500);
    }

    const token = await TokenManager.getToken();
    const headers = new Headers(options.headers || {});
    
    // Set content type only if not FormData (for file upload)
    if (!(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }
    
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    // Add timeout to requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
        console.log(`API Request: ${options.method || 'GET'} ${API_BASE_URL}${endpoint}`);

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log(`API Response: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (parseError) {
                errorData = { message: 'Terjadi kesalahan pada server' };
            }
            
            throw new ApiError(
                errorData.message || `HTTP ${response.status}: ${response.statusText}`, 
                response.status
            );
        }

        // Handle response tanpa konten (misal: 204 No Content)
        if (response.status === 204) {
            return null;
        }

        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof ApiError) {
            throw error;
        }

        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                throw new ApiError('Request timeout. Periksa koneksi internet.', 408);
            }
            
            if (error.message.includes('Network request failed')) {
                throw new ApiError('Tidak dapat terhubung ke server. Periksa koneksi internet.', 0);
            }
        }

        throw new ApiError('Terjadi kesalahan yang tidak terduga', 500);
    }
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
    nip_penanggung_jawab?: string;
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
    catatan_tindak_lanjut?: string;
    status?: string;
    lampiran?: File | null;
}) => {
    const formData = new FormData();
    if (data.catatan_tindak_lanjut) {
        formData.append('catatan_tindak_lanjut', data.catatan_tindak_lanjut);
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
 * PUT /api/tindaklanjut/:id_tindak_lanjut
 * Update catatan tindak lanjut
 */
export const updateTindakLanjut = (id_tindak_lanjut: string, data: {
    catatan_tindak_lanjut?: string;
    status?: string;
    lampiran?: File | null;
}) => {
    const formData = new FormData();
    if (data.catatan_tindak_lanjut !== undefined) {
        formData.append('catatan', data.catatan_tindak_lanjut);
    }
    if (data.status !== undefined) {
        formData.append('status', data.status);
    }
    if (data.lampiran) {
        formData.append('lampiran', data.lampiran);
    }

    return apiFetch(`/api/tindaklanjut/${id_tindak_lanjut}`, {
        method: 'PUT',
        body: formData,
    });
};

export const getLaporanSelesai = () => {
    return apiFetch('/api/laporan/selesai');
};

/**
 * DELETE /api/tindaklanjut/:id_tindak_lanjut
 * Hapus catatan tindak lanjut
 */
export const deleteTindakLanjut = (id_tindak_lanjut: string) => {
    return apiFetch(`/api/tindaklanjut/${id_tindak_lanjut}`, {
        method: 'DELETE',
    });
};

// Update the existing interface
export interface TindakLanjutHistory {
    id_tindak_lanjut: number;
    catatan_tindak_lanjut?: string;
    status_tindak_lanjut: string;
    lampiran?: string;
    created_at: string;
    updated_at?: string;
    penindak: string;
    jabatan: string;
}

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
    nip: string;
    email: string;
    role: string;
    jabatan?: string;
    unit_kerja?: string;
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
    nip_pelapor: string;
    pelapor: string;
    created_at: string;
    updated_at: string;
}

export interface DisposisiHistory {
    id: number;
    status_disposisi: string;
    catatan_disposisi: string;
    kabbag_umum: string;
    created_at: string;
    penanggung_jawab?: string;
}

// --- AUTH ENDPOINTS ---

/**
 * POST /api/auth/login
 * Login user dan dapatkan token - Enhanced version with timeout
 */
export const apiLogin = async (data: { identifier: string; password: string }): Promise<Response> => {
    if (!API_BASE_URL) {
        throw new Error('API URL tidak dikonfigurasi. Periksa file .env');
    }

    console.log('Login attempt to:', `${API_BASE_URL}/api/auth/login`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(data),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout. Periksa koneksi internet dan server.');
            }
            
            if (error.message.includes('Network request failed')) {
                throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet dan pastikan server aktif.');
            }
        }
        
        throw error;
    }
};

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
export const getKabbagUmum = () => {
    return apiFetch('/api/users/kabbag-umum');
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
 * GET /api/users/:nip
 * Ambil detail user berdasarkan NIP
 */
export const getUserDetail = (nip: string) => {
    return apiFetch(`/api/users/${nip}`);
};

/**
 * POST /api/users
 * Buat user baru
 */
export const createUser = (data: {
    nama: string;
    nip: string;
    email: string;
    role: string;
    jabatan?: string;
    unit_kerja?: string;
    password: string;
}) => {
    return apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

/**
 * PUT /api/users/:nip
 * Update user berdasarkan NIP
 */
export const updateUser = (nip: string, data: {
    nama: string;
    email: string;
    role: string;
    jabatan?: string;
    unit_kerja?: string;
    password?: string;
}) => {
    return apiFetch(`/api/users/${nip}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
};

/**
 * DELETE /api/users/:nip
 * Hapus user berdasarkan NIP
 */
export const deleteUser = (nip: string) => {
    return apiFetch(`/api/users/${nip}`, {
        method: 'DELETE',
    });
};

// --- UTILITY FUNCTIONS ---

/**
 * Helper untuk mengambil file URL lengkap
 */
export const getFileUrl = ( filePath: string | null | undefined): string | null => { 
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