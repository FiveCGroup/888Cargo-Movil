import { StyleSheet } from 'react-native';
import { FontSizes, Spacing } from '../../constants/Colors';

/**
 * Estilos para el componente RegisterForm
 * Separados del componente para mejor organización y mantenibilidad
 */
export const registerFormStyles = StyleSheet.create({
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
    
    inputWrapper: {
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
    
    fieldError: {
        marginTop: Spacing.xs,
        marginLeft: Spacing.sm,
    },
    
    registerButton: {
        marginTop: Spacing.lg,
    },
    
    loginContainer: {
        alignItems: 'center',
        marginTop: Spacing.lg,
        paddingTop: Spacing.md,
    },
    
    loginLinkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        borderTopWidth: 1,
        paddingTop: Spacing.md,
    },
    
    loginText: {
        fontSize: FontSizes.sm,
    },
    
    loginLink: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
});