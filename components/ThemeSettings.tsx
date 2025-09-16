import React from 'react';
import { View, StyleSheet } from 'react-native';import { List, RadioButton, Divider } from 'react-native-paper';
import { useAppTheme, ThemePreference } from '@/context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';

interface ThemeSettingsProps {
    onThemeSelected: (newTheme: ThemePreference) => void;
}

export const ThemeSettings = ({ onThemeSelected }: ThemeSettingsProps) => {
    const { themePreference, theme } = useAppTheme();

    const themeOptions = [
        { value: 'system', label: 'Ikuti Sistem', icon: 'phone-portrait-outline', description: 'Mengikuti pengaturan tema sistem' },
        { value: 'light', label: 'Tema Terang', icon: 'sunny-outline', description: 'Tampilan terang untuk siang hari' },
        { value: 'dark', label: 'Tema Gelap', icon: 'moon-outline', description: 'Tampilan gelap untuk mata yang nyaman' },
    ];

    return (
        <View>
            <RadioButton.Group
                onValueChange={onThemeSelected}
                value={themePreference}
            >
                {themeOptions.map((option, index) => (
                    <View key={option.value}>
                        <List.Item
                            title={option.label}
                            description={option.description}
                            left={() => (
                                <View style={styles.iconContainer}>
                                    <Ionicons
                                        name={option.icon as any}
                                        size={24}
                                        color={
                                            themePreference === option.value
                                                ? theme.colors.primary
                                                : theme.colors.onSurfaceVariant
                                        }
                                    />
                                </View>
                            )}
                            right={() => (
                                <RadioButton
                                    value={option.value}
                                    color={theme.colors.primary}
                                />
                            )}
                            onPress={() => onThemeSelected(option.value as ThemePreference)}
                            titleStyle={[
                                styles.listItemTitle,
                                {
                                    color: themePreference === option.value
                                        ? theme.colors.primary
                                        : theme.colors.onSurface
                                }
                            ]}
                            descriptionStyle={[
                                styles.listItemDescription,
                                { color: theme.colors.onSurfaceVariant }
                            ]}
                            style={styles.listItem}
                        />
                        {index < themeOptions.length - 1 && (
                            <Divider style={{
                                backgroundColor: theme.colors.outlineVariant,
                                marginLeft: 56
                            }} />
                        )}
                    </View>
                ))}
            </RadioButton.Group>
        </View>
    );
};

const styles = StyleSheet.create({
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 40,
        height: 40,
    },
    listItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    listItemTitle: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'RubikBold',
    },
    listItemDescription: {
        fontSize: 13,
        fontFamily: 'Rubik',
    justifyContent: 'center',
        alignItems: 'center',
        width: 40,
    },
});