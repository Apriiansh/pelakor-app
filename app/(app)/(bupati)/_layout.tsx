import { Tabs } from "expo-router";
import React, { useMemo } from "react";
import { StyleSheet, Platform, useWindowDimensions, View, Pressable, Text } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { HapticTab } from "@/components/haptic-tab";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/context/ThemeContext";
import { usePathname, useRouter } from "expo-router";

export default function BupatiLayout() {
    const insets = useSafeAreaInsets();
    const { theme } = useAppTheme();
    const { width } = useWindowDimensions();
    const pathname = usePathname();
    const router = useRouter();

    // Deteksi apakah web dan layar besar (>= 768px)
    const isWeb = Platform.OS === "web";
    const isLargeScreen = width >= 768;
    const showTopBar = isWeb && isLargeScreen;

    const navigationItems = useMemo(
        () => [
            {
                name: "home",
                title: "Dashboard",
                route: "/(app)/(bupati)/home",
                iconFocused: "home",
                iconOutline: "home-outline",
            },
            {
                name: "laporan",
                title: "Laporan",
                route: "/(app)/(bupati)/laporan",
                iconFocused: "document",
                iconOutline: "document-outline",
            },
            {
                name: "profil",
                title: "Profil",
                route: "/(app)/(bupati)/profil",
                iconFocused: "person-circle",
                iconOutline: "person-circle-outline",
            },
        ],
        []
    );

    const styles = useMemo(
        () =>
            StyleSheet.create({
                tabBarLabel: {
                    fontSize: 11,
                    fontWeight: "600",
                    marginTop: 4,
                    fontFamily: "Rubik",
                },
                tabBarItem: {
                    paddingVertical: 4,
                },
                topBarContainer: {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 64,
                    backgroundColor: theme.colors.surface,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.outline,
                    shadowColor: theme.colors.shadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 4,
                    zIndex: 1000,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 24,
                },
                topBarNav: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                },
                topBarItem: {
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderRadius: 12,
                    gap: 8,
                    minWidth: 120,
                    justifyContent: "center",
                },
                topBarItemActive: {
                    backgroundColor: theme.colors.primaryContainer,
                },
                topBarItemText: {
                    fontSize: 14,
                    fontWeight: "600",
                    fontFamily: "Rubik",
                },
                webContent: {
                    paddingTop: 64,
                },
            }),
        [theme]
    );

    const isRouteActive = (route: string) => {
        return pathname.includes(route);
    };

    const handleNavigation = (route: string) => {
        router.push(route as never);
    };

    if (showTopBar) {
        return (
            <>
                <View style={styles.topBarContainer}>
                    <View style={styles.topBarNav}>
                        {navigationItems.map((item) => {
                            const isActive = isRouteActive(item.name);
                            return (
                                <Pressable
                                    key={item.name}
                                    style={[
                                        styles.topBarItem,
                                        isActive && styles.topBarItemActive,
                                    ]}
                                    onPress={() => handleNavigation(item.route)}
                                >
                                    <Ionicons
                                        name={
                                            isActive
                                                ? (item.iconFocused as never)
                                                : (item.iconOutline as never)
                                        }
                                        size={22}
                                        color={
                                            isActive
                                                ? theme.colors.primary
                                                : theme.colors.onSurfaceVariant
                                        }
                                    />
                                    <Text
                                        style={[
                                            styles.topBarItemText,
                                            {
                                                color: isActive
                                                    ? theme.colors.primary
                                                    : theme.colors.onSurfaceVariant,
                                            },
                                        ]}
                                    >
                                        {item.title}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>
                <Tabs
                    screenOptions={{
                        headerShown: false,
                        tabBarStyle: { display: "none" },
                    }}
                >
                    <Tabs.Screen name="laporan" />
                    <Tabs.Screen name="home" />
                    <Tabs.Screen name="profil" />
                </Tabs>
            </>
        );
    }

    // Mode mobile - menggunakan bottom tabs seperti biasa
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarStyle: {
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
                    title: "Dashboard",
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
                name="laporan"
                options={{
                    title: "Laporan",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? "document" : "document-outline"}
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