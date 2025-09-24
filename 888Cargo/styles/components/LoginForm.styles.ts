import { StyleSheet } from 'react-native';
import { FontSizes, Spacing } from '../../constants/Colors';

/**
 * Estilos para el componente LoginForm
 * Separados del componente para mejor organización y mantenibilidad
 */
export const loginFormStyles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    
    headerContainer: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    
    inputContainer: {
        marginBottom: Spacing.md,
    },
    
    passwordContainer: {
        position: 'relative',
    },
    
    passwordInput: {
        marginBottom: 0,
    },
    
    showPasswordButton: {
        position: 'absolute',
        right: Spacing.md,
        top: Spacing.md,
        bottom: Spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
        width: 32,
    },
    
    showPasswordText: {
        fontSize: FontSizes.base,
    },
    
    forgotPasswordButton: {
        alignItems: 'center',
        marginTop: Spacing.lg,
    },
    
    forgotPasswordText: {
        fontSize: FontSizes.sm,
        fontWeight: '500',
    },
    
    registerContainer: {
        alignItems: 'center',
        marginTop: Spacing.lg,
        paddingTop: Spacing.md,
    },
    
    registerLinkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        borderTopWidth: 1,
        paddingTop: Spacing.md,
    },
    
    registerText: {
        fontSize: FontSizes.sm,
    },
    
    registerLink: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
});