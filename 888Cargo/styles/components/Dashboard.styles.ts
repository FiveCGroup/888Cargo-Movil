import { StyleSheet } from 'react-native';
import { BorderRadius, FontSizes, Spacing } from '../../constants/Colors';

/**
 * Estilos para el componente Dashboard
 * Separados del componente para mejor organización y mantenibilidad
 */
export const dashboardStyles = StyleSheet.create({
    header: {
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
        backgroundColor: '#17243f', // Fondo azul oscuro corporativo
        marginHorizontal: -Spacing.lg,
        marginTop: -Spacing.lg,
        paddingTop: 60, // Espacio para la status bar
    },
    
    welcomeText: {
        fontSize: FontSizes.base,
        fontWeight: '500',
    },
    
    userNameText: {
        fontSize: FontSizes.lg,
        fontWeight: '700',
        marginTop: Spacing.xs,
    },
    
    content: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
    },
    
    titleContainer: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
        paddingTop: Spacing.md,
    },
    
    subtitle: {
        fontSize: FontSizes.base,
        fontWeight: '400',
        marginTop: Spacing.sm,
        textAlign: 'center',
    },
    
    cardsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingBottom: Spacing.xl,
        paddingHorizontal: Spacing.md,
        justifyContent: 'space-between',
    },
    
    dashboardCard: {
        width: '47%', // Fijo para 2 columnas exactas
        minHeight: 130,
        marginBottom: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 2,
        padding: Spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    
    cardIcon: {
        width: 55,
        height: 55,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    
    cardTitle: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: Spacing.xs,
        lineHeight: FontSizes.sm * 1.2,
    },
});