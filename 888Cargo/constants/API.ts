// ===================================
// 888CARGO MOBILE - CONFIGURACIÓN API
// ===================================

// Configuración dinámica basada en variables de entorno
const getApiUrl = () => {
  const environment = process.env.EXPO_PUBLIC_ENVIRONMENT || 'development';
  
  // Si hay una URL específica configurada, usarla
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Fallback según el entorno
  switch (environment) {
    case 'production':
      return process.env.EXPO_PUBLIC_API_URL_PROD || 'https://api.888cargo.com/api';
    case 'development':
    default:
      return process.env.EXPO_PUBLIC_API_URL_LOCAL || 'http://192.168.58.100:4000/api';
  }
};

// Configuración de la API para el proyecto móvil 888Cargo
export const API_CONFIG = {
  // URL base del backend - configuración dinámica
  BASE_URL: getApiUrl(),
  
  // Endpoints del backend (coinciden con las rutas web)
  ENDPOINTS: {
    // Autenticación
    AUTH: {
      LOGIN: '/login',
      REGISTER: '/register', 
      RESET_PASSWORD: '/reset-password',
      VERIFY_TOKEN: '/verify-token',
      REFRESH_TOKEN: '/refresh-token',
      PROFILE: '/profile',
      LOGOUT: '/logout'
    },
    
    // Cargas
    CARGAS: {
      BASE: '/carga',
      CREATE: '/carga/crear',
      LIST: '/carga/listar',
      UPDATE: '/carga/actualizar',
      DELETE: '/carga/eliminar',
      SEARCH: '/carga/buscar'
    },
    
    // QR Codes
    QR: {
      BASE: '/qr',
      GENERATE: '/qr/generar',
      SCAN: '/qr/escanear',
      VALIDATE: '/qr/validar'
    },
    
    // Recuperación WhatsApp
    RECUPERACION: {
      BASE: '/recuperacion',
      SEND: '/recuperacion/enviar',
      VALIDATE: '/recuperacion/validar'
    },
    
    // Tareas/Tasks
    TASKS: {
      BASE: '/task',
      CREATE: '/task/crear',
      LIST: '/task/listar',
      UPDATE: '/task/actualizar'
    }
  },
  
  // Configuración de timeouts
  TIMEOUTS: {
    DEFAULT: 10000,     // 10 segundos
    UPLOAD: 30000,      // 30 segundos para uploads
    DOWNLOAD: 60000     // 60 segundos para downloads
  },
  
  // Headers por defecto
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// URLs completas para facilitar el uso
export const getFullURL = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper para construir URLs con parámetros
export const buildURL = (baseEndpoint: string, params: Record<string, any> = {}) => {
  let url = getFullURL(baseEndpoint);
  const queryParams = new URLSearchParams(params).toString();
  return queryParams ? `${url}?${queryParams}` : url;
};

// Configuración de debugging
export const DEBUG_MODE = process.env.EXPO_PUBLIC_DEBUG_MODE === 'true';
export const CONSOLE_LOGS = process.env.EXPO_PUBLIC_CONSOLE_LOGS === 'true';

// Log de configuración (solo en desarrollo)
if (DEBUG_MODE) {
  console.log('🔧 API Configuration:', {
    environment: process.env.EXPO_PUBLIC_ENVIRONMENT,
    baseUrl: API_CONFIG.BASE_URL,
    debugMode: DEBUG_MODE
  });
}
