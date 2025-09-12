import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/Colors';
import { createThemeStyles } from '../../constants/Theme';
import { useColorScheme } from '../../hooks/useColorScheme';
import Logo888Cargo from '../../components/Logo888Cargo';

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const colorScheme = useColorScheme();
    const themeStyles = createThemeStyles(colorScheme ?? 'light');
    const colors = Colors[colorScheme ?? 'light'];

    const handleLogout = () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro que deseas cerrar sesión?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: 'Cerrar Sesión',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await logout();
                        if (!result.success) {
                            Alert.alert('Error', 'Error al cerrar sesión');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={[themeStyles.container, styles.container]}>
            <View style={styles.headerContainer}>
                <Logo888Cargo size="small" layout="horizontal" showText={true} />
            </View>
            
            <View style={[themeStyles.card, styles.profileContainer]}>
                <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.avatarText, { color: colors.textLight }]}>
                        {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </Text>
                </View>
                
                <Text style={[styles.userName, { color: colors.primary }]}>
                    {user?.name || 'Usuario'}
                </Text>
                
                <Text style={[styles.userEmail, { color: colors.textMuted }]}>
                    {user?.email}
                </Text>

                {user?.role && (
                    <View style={[styles.roleContainer, { backgroundColor: colors.light }]}>
                        <Text style={[styles.roleText, { color: colors.success }]}>
                            {user.role}
                        </Text>
                    </View>
                )}
            </View>

            <View style={[themeStyles.card, styles.menuContainer]}>
                <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}>
                    <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>
                        ⚙️ Configuración
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}>
                    <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>
                        📊 Estadísticas
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}>
                    <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>
                        ❓ Ayuda
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]}>
                    <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>
                        ℹ️ Acerca de
                    </Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity 
                style={[themeStyles.button, themeStyles.buttonDanger, styles.logoutButton]}
                onPress={handleLogout}
            >
                <Text style={themeStyles.buttonText}>🚪 Cerrar Sesión</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: Spacing.lg,
        paddingTop: Spacing.xxl,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    profileContainer: {
        alignItems: 'center',
        padding: Spacing.xl,
        marginBottom: Spacing.xl,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: BorderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    avatarText: {
        fontSize: FontSizes.xxxl,
        fontWeight: '700',
    },
    userName: {
        fontSize: FontSizes.xl,
        fontWeight: '700',
        marginBottom: Spacing.xs,
    },
    userEmail: {
        fontSize: FontSizes.base,
        marginBottom: Spacing.md,
    },
    roleContainer: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.lg,
    },
    roleText: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    menuContainer: {
        marginBottom: Spacing.xl,
    },
    menuItem: {
        padding: Spacing.lg,
        borderBottomWidth: 1,
    },
    menuItemText: {
        fontSize: FontSizes.base,
        fontWeight: '500',
    },
    logoutButton: {
        padding: Spacing.lg,
        alignItems: 'center',
    },
});
