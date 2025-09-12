/**
 * Colores basados en la aplicación web 888Cargo
 * Mantiene consistencia visual entre web y móvil
 */

// Colores principales de la marca 888Cargo
const brandPrimary = '#037dbb';
const brandPrimaryHover = '#025a89';
const brandPrimaryLight = '#0494d6';
const brandBackground = '#17243f'; // Fondo de auth

// Colores de estado
const successColor = '#28a745';
const dangerColor = '#dc3545';
const warningColor = '#ffc107';
const infoColor = '#17a2b8';

// Colores neutros
const lightColor = '#f8f9fa';
const darkColor = '#343a40';
const whiteColor = '#ffffff';
const blackColor = '#000000';

// Colores de texto
const textPrimary = '#212529';
const textSecondary = '#495057';
const textMuted = '#6c757d';

// Colores de borde
const borderColor = '#dee2e6';
const borderColorLight = '#e9ecef';

export const Colors = {
  light: {
    // Colores principales
    text: textPrimary,
    background: whiteColor,
    tint: brandPrimary,
    
    // Colores de marca
    primary: brandPrimary,
    primaryHover: brandPrimaryHover,
    primaryLight: brandPrimaryLight,
    
    // Colores de estado
    success: successColor,
    danger: dangerColor,
    warning: warningColor,
    info: infoColor,
    
    // Colores secundarios
    secondary: textMuted,
    light: lightColor,
    dark: darkColor,
    
    // Colores de texto específicos
    textPrimary: textPrimary,
    textSecondary: textSecondary,
    textMuted: textMuted,
    textLight: whiteColor,
    
    // Colores de borde
    border: borderColor,
    borderLight: borderColorLight,
    
    // Iconos
    icon: textMuted,
    tabIconDefault: textMuted,
    tabIconSelected: brandPrimary,
    
    // Fondos especiales
    authBackground: brandBackground,
    cardBackground: whiteColor,
    inputBackground: lightColor,
    
    // Sombras
    shadowColor: blackColor,
  },
  dark: {
    // Colores principales (adaptados para modo oscuro)
    text: '#ECEDEE',
    background: '#151718',
    tint: brandPrimaryLight,
    
    // Colores de marca (ajustados para contraste)
    primary: brandPrimaryLight,
    primaryHover: brandPrimary,
    primaryLight: '#0bb4f0',
    
    // Colores de estado (ajustados)
    success: '#4caf50',
    danger: '#f44336',
    warning: '#ff9800',
    info: '#2196f3',
    
    // Colores secundarios
    secondary: '#9BA1A6',
    light: '#2c2c2c',
    dark: '#1a1a1a',
    
    // Colores de texto específicos
    textPrimary: '#ECEDEE',
    textSecondary: '#B0B3B8',
    textMuted: '#9BA1A6',
    textLight: whiteColor,
    
    // Colores de borde
    border: '#3a3a3c',
    borderLight: '#48484a',
    
    // Iconos
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: brandPrimaryLight,
    
    // Fondos especiales
    authBackground: '#0f1419',
    cardBackground: '#1c1c1e',
    inputBackground: '#2c2c2e',
    
    // Sombras
    shadowColor: blackColor,
  },
};

// Exportar colores específicos para fácil acceso
export const BrandColors = {
  primary: brandPrimary,
  primaryHover: brandPrimaryHover,
  primaryLight: brandPrimaryLight,
  authBackground: brandBackground,
};

// Espaciado consistente con la web
export const Spacing = {
  xs: 4,    // 0.25rem
  sm: 8,    // 0.5rem
  md: 16,   // 1rem
  lg: 24,   // 1.5rem
  xl: 32,   // 2rem
  xxl: 48,  // 3rem
};

// Tamaños de fuente consistentes
export const FontSizes = {
  xs: 12,   // 0.75rem
  sm: 14,   // 0.875rem
  base: 16, // 1rem
  lg: 18,   // 1.125rem
  xl: 20,   // 1.25rem
  xxl: 24,  // 1.5rem
  xxxl: 32, // 2rem
};

// Radios de borde
export const BorderRadius = {
  sm: 4,   // 0.25rem
  base: 6, // 0.375rem
  lg: 8,   // 0.5rem
  xl: 12,  // 0.75rem
  full: 999, // 50% equivalente
};
