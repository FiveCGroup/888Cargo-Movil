import { StyleSheet } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from './Colors';

/**
 * Tema global para la aplicación móvil 888Cargo
 * Basado en los estilos de la aplicación web para mantener consistencia
 */

export const createThemeStyles = (colorScheme: 'light' | 'dark' = 'light') => {
  const colors = Colors[colorScheme];

  return StyleSheet.create({
    // CONTENEDORES PRINCIPALES
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    
    safeContainer: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: Spacing.md,
    },
    
    centeredContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: Spacing.lg,
    },
    
    // CONTENEDORES DE AUTENTICACIÓN (como la web)
    authContainer: {
      flex: 1,
      backgroundColor: colors.authBackground,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
    },
    
    authContent: {
      width: '100%',
      maxWidth: 400,
      alignItems: 'center',
    },
    
    authCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xxl,
      width: '100%',
      shadowColor: colors.shadowColor,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
    },
    
    // TEXTOS Y TÍTULOS
    title: {
      fontSize: FontSizes.xxxl,
      fontWeight: 'bold',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: Spacing.xl,
    },
    
    subtitle: {
      fontSize: FontSizes.lg,
      fontWeight: '500',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Spacing.lg,
    },
    
    authTitle: {
      fontSize: FontSizes.xl,
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: Spacing.lg,
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
      paddingBottom: Spacing.sm,
    },
    
    authSubtitle: {
      fontSize: FontSizes.lg,
      fontWeight: '500',
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: Spacing.xl,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    
    // TEXTOS GENERALES
    textPrimary: {
      fontSize: FontSizes.base,
      color: colors.textPrimary,
    },
    
    textSecondary: {
      fontSize: FontSizes.sm,
      color: colors.textSecondary,
    },
    
    textMuted: {
      fontSize: FontSizes.sm,
      color: colors.textMuted,
    },
    
    textLight: {
      fontSize: FontSizes.base,
      color: colors.textLight,
    },
    
    // INPUTS (estilo web)
    input: {
      width: '100%',
      padding: Spacing.md,
      marginBottom: Spacing.md,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputBackground,
      fontSize: FontSizes.sm,
      color: colors.textSecondary,
    },
    
    inputFocused: {
      borderColor: colors.primary,
      backgroundColor: colors.background,
      shadowColor: colors.primary,
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    
    inputError: {
      borderColor: colors.danger,
      backgroundColor: colors.background,
    },
    
    inputValid: {
      borderColor: colors.success,
      backgroundColor: colors.background,
    },
    
    // BOTONES (estilo web)
    button: {
      width: '100%',
      padding: Spacing.md,
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.xl,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.sm,
      shadowColor: colors.shadowColor,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    
    buttonText: {
      color: colors.textLight,
      fontSize: FontSizes.sm,
      fontWeight: '600',
    },
    
    buttonSecondary: {
      backgroundColor: colors.secondary,
    },
    
    buttonSuccess: {
      backgroundColor: colors.success,
    },
    
    buttonDanger: {
      backgroundColor: colors.danger,
    },
    
    buttonWarning: {
      backgroundColor: colors.warning,
    },
    
    buttonDisabled: {
      backgroundColor: colors.textMuted,
      opacity: 0.6,
    },
    
    // CARDS (estilo dashboard web)
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      shadowColor: colors.shadowColor,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 1,
      borderColor: colors.border,
    },
    
    dashboardCard: {
      backgroundColor: colors.cardBackground,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 140,
      flex: 1,
      marginHorizontal: Spacing.xs,
    },
    
    dashboardCardActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    
    cardIcon: {
      width: 64,
      height: 64,
      color: colors.textMuted,
      marginBottom: Spacing.sm,
    },
    
    cardIconActive: {
      color: colors.textLight,
    },
    
    cardTitle: {
      fontSize: FontSizes.sm,
      fontWeight: '500',
      textAlign: 'center',
      color: colors.textPrimary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    
    cardTitleActive: {
      color: colors.textLight,
    },
    
    // NAVEGACIÓN Y HEADER
    header: {
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      shadowColor: colors.shadowColor,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    
    navBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: colors.background,
    },
    
    // ESTADOS Y NOTIFICACIONES
    errorText: {
      color: colors.danger,
      fontSize: FontSizes.xs,
      textAlign: 'center',
      backgroundColor: `${colors.danger}10`,
      padding: Spacing.sm,
      borderRadius: BorderRadius.base,
      borderWidth: 1,
      borderColor: `${colors.danger}20`,
      marginTop: Spacing.sm,
    },
    
    successText: {
      color: colors.success,
      fontSize: FontSizes.xs,
      textAlign: 'center',
      backgroundColor: `${colors.success}10`,
      padding: Spacing.sm,
      borderRadius: BorderRadius.base,
      borderWidth: 1,
      borderColor: `${colors.success}20`,
      marginTop: Spacing.sm,
    },
    
    // LOADING Y SPINNERS
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    
    loadingText: {
      fontSize: FontSizes.lg,
      color: colors.textMuted,
      marginTop: Spacing.md,
    },
    
    // ESPACIADO UTILITIES
    mt_xs: { marginTop: Spacing.xs },
    mt_sm: { marginTop: Spacing.sm },
    mt_md: { marginTop: Spacing.md },
    mt_lg: { marginTop: Spacing.lg },
    mt_xl: { marginTop: Spacing.xl },
    mt_xxl: { marginTop: Spacing.xxl },
    
    mb_xs: { marginBottom: Spacing.xs },
    mb_sm: { marginBottom: Spacing.sm },
    mb_md: { marginBottom: Spacing.md },
    mb_lg: { marginBottom: Spacing.lg },
    mb_xl: { marginBottom: Spacing.xl },
    mb_xxl: { marginBottom: Spacing.xxl },
    
    mx_xs: { marginHorizontal: Spacing.xs },
    mx_sm: { marginHorizontal: Spacing.sm },
    mx_md: { marginHorizontal: Spacing.md },
    mx_lg: { marginHorizontal: Spacing.lg },
    mx_xl: { marginHorizontal: Spacing.xl },
    
    p_xs: { padding: Spacing.xs },
    p_sm: { padding: Spacing.sm },
    p_md: { padding: Spacing.md },
    p_lg: { padding: Spacing.lg },
    p_xl: { padding: Spacing.xl },
    p_xxl: { padding: Spacing.xxl },
    
    // FLEXBOX UTILITIES
    row: {
      flexDirection: 'row',
    },
    
    column: {
      flexDirection: 'column',
    },
    
    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    spaceBetween: {
      justifyContent: 'space-between',
    },
    
    spaceAround: {
      justifyContent: 'space-around',
    },
    
    alignCenter: {
      alignItems: 'center',
    },
    
    justifyCenter: {
      justifyContent: 'center',
    },
    
    flex1: {
      flex: 1,
    },
  });
};

// Exportar estilos por defecto (modo claro)
export const ThemeStyles = createThemeStyles('light');