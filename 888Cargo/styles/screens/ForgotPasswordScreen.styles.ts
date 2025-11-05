import { StyleSheet } from 'react-native';
import { FontSizes, Spacing } from '../../constants/Colors';

/**
 * Estilos para la pantalla ForgotPasswordScreen
 * Separados del componente para mejor organización y mantenibilidad
 */
export const forgotPasswordScreenStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    
    headerContainer: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    
    instructionText: {
        fontSize: FontSizes.sm,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        lineHeight: 20,
    },
    
    inputContainer: {
        marginBottom: Spacing.lg,
    },
    
    inputLabel: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        marginBottom: Spacing.xs,
    },
    
    helperText: {
        fontSize: FontSizes.xs,
        marginTop: Spacing.xs,
        fontStyle: 'italic',
    },
    
    backContainer: {
        alignItems: 'center',
        marginTop: Spacing.lg,
        paddingTop: Spacing.md,
    },
    
    backLinkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        borderTopWidth: 1,
        paddingTop: Spacing.md,
    },
    
    backText: {
        fontSize: FontSizes.sm,
    },
    
    backLink: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
});