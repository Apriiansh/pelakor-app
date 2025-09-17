import { Tabs } from "expo-router";
import React, { useMemo } from "react";
import { StyleSheet, Platform } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { HapticTab } from "@/components/haptic-tab";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/context/ThemeContext";

export default function KabbagUmumLayout() {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        tabBar: {
          position: "absolute",
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
          fontWeight: "600",
          marginTop: 4,
          fontFamily: "Rubik", // Use custom font
        },
        centerTabLabel: {
          fontWeight: "bold",
          fontFamily: "RubikBold", // Use bold font for center tab
        },
        tabBarItem: {
          paddingVertical: 4,
        },
      }),
    [theme]
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          ...styles.tabBar,
          paddingBottom: Platform.OS === "ios" ? insets.bottom : 12,
          height: Platform.OS === "ios" ? 85 + insets.bottom : 75,
        },
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="disposisi_laporan"
        options={{
          title: "Disposisi",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "send" : "send-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="kelola_pengguna"
        options={{
          title: "Pengguna",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "people" : "people-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="arsip"
        options={{
          title: "Arsip",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "archive" : "archive-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person-circle" : "person-circle-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: 70,
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  tabBarLabel: {
    fontSize: 12,
  },
});
