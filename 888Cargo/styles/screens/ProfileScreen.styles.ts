import { StyleSheet } from 'react-native';
import { BorderRadius, FontSizes, Spacing } from '../../constants/Colors';

/**
 * Estilos para la pantalla ProfileScreen
 * Separados del componente para mejor organización y mantenibilidad
 */
export const profileScreenStyles = StyleSheet.create({
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
    
    menuItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    
    menuItemText: {
        fontSize: FontSizes.base,
        fontWeight: '500',
    },
});