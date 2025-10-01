// components/Notification.tsx
import React, { useEffect } from 'react';
import { Platform, StyleSheet, View, Animated } from 'react-native';
import { Text, Portal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationProps {
    visible: boolean;
    message: string;
    type: NotificationType;
    onDismiss: () => void;
    duration?: number;
}

export const Notification: React.FC<NotificationProps> = ({
    visible,
    message,
    type,
    onDismiss,
    duration = 4000,
}) => {
    const insets = useSafeAreaInsets();
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const slideAnim = React.useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (visible) {
            // Animate in
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto dismiss
            const timer = setTimeout(() => {
                handleDismiss();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    const handleDismiss = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: -100,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onDismiss();
        });
    };

    const getConfig = () => {
        switch (type) {
            case 'success':
                return {
                    icon: 'check-circle',
                    backgroundColor: '#4CAF50',
                    color: '#FFFFFF',
                };
            case 'error':
                return {
                    icon: 'alert-circle',
                    backgroundColor: '#F44336',
                    color: '#FFFFFF',
                };
            case 'warning':
                return {
                    icon: 'alert',
                    backgroundColor: '#FF9800',
                    color: '#FFFFFF',
                };
            case 'info':
                return {
                    icon: 'information',
                    backgroundColor: '#2196F3',
                    color: '#FFFFFF',
                };
        }
    };

    const config = getConfig();

    if (!visible) return null;

    const topPosition = Platform.OS === 'web' ? 20 : insets.top + 10;

    return (
        <Portal>
            <Animated.View
                style={[
                    Platform.OS === 'web' ? styles.webContainer : styles.mobileContainer,
                    {
                        backgroundColor: config.backgroundColor,
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                        top: topPosition,
                    },
                ]}
            >
                <View style={styles.content}>
                    <MaterialCommunityIcons
                        name={config.icon as any}
                        size={24}
                        color={config.color}
                        style={styles.icon}
                    />
                    <Text style={[styles.text, { color: config.color }]} numberOfLines={3}>
                        {message}
                    </Text>
                    <MaterialCommunityIcons
                        name="close"
                        size={20}
                        color={config.color}
                        style={styles.closeIcon}
                        onPress={handleDismiss}
                    />
                </View>
            </Animated.View>
        </Portal>
    );
};

const styles = StyleSheet.create({
    webContainer: {
        position: 'fixed' as any,
        right: 20,
        minWidth: 300,
        maxWidth: 500,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 9999,
    },
    mobileContainer: {
        position: 'absolute',
        left: 16,
        right: 16,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 9999,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: 12,
    },
    text: {
        fontSize: 15,
        fontWeight: '500',
        flex: 1,
        lineHeight: 20,
    },
    closeIcon: {
        marginLeft: 12,
        padding: 4,
    },
});