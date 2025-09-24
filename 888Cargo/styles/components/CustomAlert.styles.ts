import { StyleSheet } from 'react-native';

/**
 * Estilos para el componente CustomAlert
 * Separados del componente para mejor organización y mantenibilidad
 */
export const customAlertStyles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 24,
        marginHorizontal: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    
    iconContainer: {
        marginBottom: 16,
    },
    
    iconBackground: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    
    title: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 24,
    },
    
    message: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    
    button: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44,
    },
    
    defaultButton: {
        backgroundColor: '#007bff',
    },
    
    cancelButton: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    
    destructiveButton: {
        backgroundColor: '#dc3545',
    },
    
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});