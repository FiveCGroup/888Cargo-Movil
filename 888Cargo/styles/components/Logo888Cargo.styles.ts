import { StyleSheet } from 'react-native';

/**
 * Estilos para el componente Logo888Cargo
 * Separados del componente para mejor organización y mantenibilidad
 */
export const logo888CargoStyles = StyleSheet.create({
    verticalContainer: {
        alignItems: 'center',
    },
    
    horizontalContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    
    logo: {
        borderRadius: 8,
    },
    
    logoText: {
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});