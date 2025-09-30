import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Improved Storage abstraction with error handling
export const Storage = {
    async setItem(key: string, value: string): Promise<void> {
        try {
            if (Platform.OS === 'web') {
                localStorage.setItem(key, value);
            } else {
                await AsyncStorage.setItem(key, value);
            }
        } catch (error) {
            console.error('Storage setItem error:', error);
            throw error;
        }
    },

    async getItem(key: string): Promise<string | null> {
        try {
            if (Platform.OS === 'web') {
                return localStorage.getItem(key);
            } else {
                return await AsyncStorage.getItem(key);
            }
        } catch (error) {
            console.error('Storage getItem error:', error);
            return null;
        }
    },

    async removeItem(key: string): Promise<void> {
        try {
            if (Platform.OS === 'web') {
                localStorage.removeItem(key);
            } else {
                await AsyncStorage.removeItem(key);
            }
        } catch (error) {
            console.error('Storage removeItem error:', error);
            throw error;
        }
    }
};

// Enhanced API login function with timeout and better error handling
export const apiLogin = async (data: { identifier: string; password:string }): Promise<Response> => {
    const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

    if (!API_BASE_URL) {
        throw new Error('API URL tidak dikonfigurasi. Periksa file .env');
    }

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
            throw error;
        }
        throw new Error('Network error occurred');
    }
};