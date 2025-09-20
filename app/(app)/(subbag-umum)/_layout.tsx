import { Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { HapticTab } from '@/components/haptic-tab';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';

export default function PegawaiLayout() {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();

  // Memoize styles to prevent unnecessary re-renders
  const styles = useMemo(() => StyleSheet.create({
    tabBar: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 20,
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingTop: 8,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 15,
      borderTopWidth: 0,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
    },
    tabBarLabel: {
      fontSize: 11,
      fontWeight: '600',
      marginTop: 4,
      fontFamily: 'Rubik', // Use custom font
    },
    centerTabLabel: {
      fontWeight: 'bold',
      fontFamily: 'RubikBold', // Use bold font for center tab
    },
    tabBarItem: {
      paddingVertical: 4,
    },
  }), [theme]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          ...styles.tabBar,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 12,
          height: Platform.OS === 'ios' ? 85 + insets.bottom : 75,
        },
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tindak-lanjut"
        options={{
          title: 'Tindak Lanjut',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'checkmark-done-circle' : 'checkmark-done-circle-outline'} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
              name="riwayat_tindak_lanjut"
              options={{
                href: null,
              }}
            />
    </Tabs>
  );
}
