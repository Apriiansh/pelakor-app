import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, StyleSheet, Image, Text } from 'react-native';
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
      let homeRoute: any = '/(app)/(pelapor)/home';
      
      if (role === 'kabbag_umum') {
        homeRoute = '/(app)/(kabbag-umum)/home';
      } else if (role === 'subbag_umum') {
        homeRoute = '/(app)/(subbag-umum)/home';
      } else if (role === 'kabbag') {
        homeRoute = '/(app)/(kabbag)/home';
      } else if (role === 'bupati') {
        homeRoute = '/(app)/(bupati)/home';
      }
      
      router.replace(homeRoute);
    }
  }, [status, role, router]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Image 
        source={require('../assets/images/logo-kabupaten-ogan-ilir.png')}
        style={styles.logo}
      />
      <Text style={[styles.title, { color: theme.colors.onBackground }]}>PELAKOR</Text>
      <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        Pelaporan Aset dan Alat Kerja Kabupaten Ogan Ilir
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant, marginBottom: 40 }]}>ASN Kabupaten Ogan Ilir</Text>
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
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: 'RubikBold',
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Rubik',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
