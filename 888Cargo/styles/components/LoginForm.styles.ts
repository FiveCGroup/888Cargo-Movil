import { StyleSheet } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/Colors';

export const loginFormStyles = StyleSheet.create({
  // Contenedor principal que ocupa toda la pantalla
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Fondo blanco
    // Prevenir que el contenedor se redimensione con el teclado
    minHeight: '100%',
  },
  
  // Parte superior - tarjeta azul que ocupa la mitad superior
  upperCard: {
    height: '50%', // Exactamente 50% de la pantalla
    backgroundColor: '#17243f', // Azul oscuro
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
    // Quitamos justifyContent para permitir posicionamiento manual
    paddingHorizontal: Spacing.lg,
    paddingTop: 10, // Un poco menos para ganar altura útil
    paddingBottom: 0,
  },
  
  // Parte inferior - fondo blanco
  lowerSection: {
    height: '50%', // Exactamente 50% de la pantalla
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  
  // Contenedor del logo
  logoContainer: {
    alignItems: 'center',
    // Eliminamos marginBottom grande para acercar inputs
    marginBottom: 4,
    // Un ajuste ligero, mantener logo alto sin desplazarlo visualmente
    marginTop: 0,
  },
  
  // Contenedor de inputs
  inputsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 20, // separación mínima
    marginTop: -90,
    paddingBottom: 0,
  },
  
  // Contenedor individual de cada input
  inputContainer: {
    width: '100%',
    alignItems: 'center', // Centra los inputs dentro del contenedor
    marginBottom: 4,
  },
  
  // Input personalizado para la tarjeta azul
  input: {
    width: '85%',
    height: 48,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    fontSize: FontSizes.base,
    color: '#FFFFFF',
    // El texto (placeholder y contenido) alineado a la izquierda horizontalmente
    // pero centrado verticalmente
    textAlignVertical: 'center',
  },
  
  inputFocused: {
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  
  // Contenedor para el input de contraseña con botón
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    width: '85%',
  },
  
  passwordInput: {
    flex: 1,
    paddingRight: 50, // Espacio para el botón
  },
  
  showPasswordButton: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  
  showPasswordText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  
  // Botones y enlaces en la parte inferior
  loginButton: {
    width: '80%',
    height: 48,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, // Mismo padding vertical que los inputs
    backgroundColor: '#037dbb',
    borderRadius: 30,
    // Eliminamos fontSize duplicado (va en loginButtonText)
    // Eliminamos textAlignVertical duplicado (va en loginButtonText)
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4, // Reducido aún más para ganar espacio
    shadowColor: '#1e3a8a',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    // Asegurar que no hay bordes que causen artefactos visuales
    borderWidth: 0,
    borderColor: 'transparent',
  },
  
  loginButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0.1,
  },
  
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.base, // Mismo tamaño que los inputs
    fontWeight: '600',
    // Centrado vertical del texto del botón como en los inputs
    textAlignVertical: 'center',
    textAlign: 'center', // Centrado horizontal (aunque ya está centrado por el contenedor)
    // Asegurar que el texto no se corte
    includeFontPadding: false,
  },
  
  forgotPasswordButton: {
    padding: Spacing.xs, // Reducido para menos espacio
    marginBottom: 4, // Reducido aún más para ganar espacio
  },
  
  forgotPasswordText: {
    fontSize: FontSizes.sm,
    color: '#1e3a8a',
    textAlign: 'center',
  },
  
  // Botón de registro
  registerButton: {
    width: '80%',
    height: 48,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#037dbb', // Mismo azul que el botón de login
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4, // Reducido aún más para ganar espacio
    shadowColor: '#1e3a8a', // Mismo color de sombra
    shadowOffset: {
      width: 0,
      height: 4, // Misma elevación
    },
    shadowOpacity: 0.3, // Misma opacidad
    shadowRadius: 8, // Mismo radio de difuminado
    elevation: 8, // Misma elevación para Android
    // Eliminar cualquier borde o outline que pueda causar las puntas blancas
    borderWidth: 0,
    borderColor: 'transparent',
  },
  
  registerButtonDisabled: {
    backgroundColor: '#9ca3af', // Mismo gris que el botón de login deshabilitado
    shadowOpacity: 0.1, // Sombra reducida cuando está deshabilitado
  },
  
  registerButtonText: {
    color: '#FFF', // Texto blanco sobre fondo azul
    fontSize: FontSizes.base, // Mismo tamaño que el botón de login
    fontWeight: '600',
    textAlignVertical: 'center',
    textAlign: 'center',
    includeFontPadding: false,
  },
  
  // Módulo de cotización (estilo cuadrado con fondo azul oscuro - reducido 20%)
  quotationModule: {
    width: 125, // 156 * 0.8 = 20% más pequeña
    height: 125, // Misma altura que el ancho para que sea cuadrada
    marginVertical: Spacing.md, // Margen igual arriba y abajo
    borderRadius: 20,
    borderWidth: 0, // Sin borde
    backgroundColor: '#17243f', // Mismo azul oscuro que upperCard
    padding: Spacing.sm, // Reducido para mejor proporción
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
  
  quotationIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
    // Sin fondo, sin bordes, solo el contenedor para centrar el ícono
  },
  
  quotationTitle: {
    fontSize: FontSizes.xs, // Reducido para la tarjeta más pequeña
    fontWeight: '600',
    color: '#FFFFFF', // Texto blanco sobre fondo azul oscuro
    textAlign: 'center',
    lineHeight: FontSizes.xs * 1.3,
  },
  
  // Contenedor para el grupo de contacto (ícono + botón)
  contactContainer: {
    width: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  
  // Ícono de contacto (20% del ancho)
  contactIcon: {
    width: '20%',
    height: 48,
    backgroundColor: '#128C7E', // Verde WhatsApp más oscuro
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#128C7E',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  // Espacio entre ícono y botón (reducido a 5%)
  contactSpacer: {
    width: '5%',
  },
  
  // Botón de contacto (75% del ancho - compensando reducción de spacer)
  contactButton: {
    width: '75%',
    height: 48,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#128C7E', // Verde WhatsApp
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#128C7E',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  
  contactButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0.1,
  },
  
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.base,
    fontWeight: '600',
    textAlignVertical: 'center',
    textAlign: 'center',
    includeFontPadding: false,
  },
  
  // Error text
  errorText: {
    color: '#dc2626',
    fontSize: FontSizes.sm,
    textAlign: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    padding: Spacing.sm,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
    marginBottom: Spacing.md,
  },
});