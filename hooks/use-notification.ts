// hooks/useNotification.ts
import { useState, useCallback } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationState {
    visible: boolean;
    message: string;
    type: NotificationType;
}

export const useNotification = () => {
    const [notification, setNotification] = useState<NotificationState>({
        visible: false,
        message: '',
        type: 'info',
    });

    const showNotification = useCallback(
        (message: string, type: NotificationType = 'info') => {
            setNotification({
                visible: true,
                message,
                type,
            });
        },
        []
    );

    const showSuccess = useCallback((message: string) => {
        showNotification(message, 'success');
    }, [showNotification]);

    const showError = useCallback((message: string) => {
        showNotification(message, 'error');
    }, [showNotification]);

    const showWarning = useCallback((message: string) => {
        showNotification(message, 'warning');
    }, [showNotification]);

    const showInfo = useCallback((message: string) => {
        showNotification(message, 'info');
    }, [showNotification]);

    const hideNotification = useCallback(() => {
        setNotification((prev) => ({
            ...prev,
            visible: false,
        }));
    }, []);

    return {
        notification,
        showNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        hideNotification,
    };
};