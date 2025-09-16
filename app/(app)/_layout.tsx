import { useRouter, useSegments, Slot } from 'expo-router';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

export default function AppLayout() {
  const [status, setStatus] = useState('loading');
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();
  const segments = useSegments();

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
        console.error("Failed to load auth status.", e);
        setStatus('unauthenticated');
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (status === 'loading') return;

    const inAppGroup = segments[0] === '(app)';

    if (status === 'unauthenticated') {
      // Redirect to the login page if not authenticated.
      router.replace('/(auth)/login');
    } else if (status === 'authenticated' && !inAppGroup) {
      // If authenticated and not in the app group, redirect to the role-based home.
      let homeRoute = '/(app)/(pegawai)/home'; // Default route
      if (role === 'Kepala Bagian Umum') {
        homeRoute = '/(app)/(kabbag-umum)/home';
      } else if (role === 'Sub Bagian Umum') {
        homeRoute = '/(app)/(subbag-umum)/home';
      }
      router.replace(homeRoute as any);
    }
  }, [status, role, segments, router]);

  // Show a loading screen while checking auth status
  if (status === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Render the children routes if authenticated.
  return <Slot />;
}
