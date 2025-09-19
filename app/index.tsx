import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';

export default function StartPage() {
  const [status, setStatus] = useState('loading');
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();
  const { theme } = useAppTheme();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userRole = await AsyncStorage.getItem('userRole');

        if (token && userRole) {
          setRole(userRole);
          setStatus('authenticated');
        } else {
          setStatus('unauthenticated');
        }
      } catch (e) {
        console.error("Failed to load auth status from AsyncStorage.", e);
        setStatus('unauthenticated');
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (status === 'loading') {
      return; 
    }

    if (status === 'unauthenticated') {
      router.replace('/(auth)/login');
    } else if (status === 'authenticated') {
      let homeRoute: any = '/(app)/(pegawai)/home';
      
      if (role === 'kabbag_umum') {
        homeRoute = '/(app)/(kabbag-umum)/home';
      } else if (role === 'subbag_umum') {
        homeRoute = '/(app)/(subbag-umum)/home';
      }
      
      router.replace(homeRoute);
    }
  }, [status, role, router]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
