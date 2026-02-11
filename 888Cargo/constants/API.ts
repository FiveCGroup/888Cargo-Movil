// ===================================
// 888CARGO MOBILE - CONFIGURACIÓN API
// ===================================
// Para Expo Go en celular: el dispositivo debe poder alcanzar el backend.
// Configura en .env (carpeta 888Cargo): EXPO_PUBLIC_API_URL_LOCAL=http://TU_IP_PC:4000/api
// Ejemplo: EXPO_PUBLIC_API_URL_LOCAL=http://192.168.1.10:4000/api
// Obtén la IP de tu PC (ipconfig en Windows, ifconfig en Mac/Linux). Celular y PC en la misma WiFi.

// Configuración dinámica basada en variables de entorno
export const getApiUrl = () => {
  const environment = process.env.EXPO_PUBLIC_ENVIRONMENT || 'development';
  
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  switch (environment) {
    case 'production':
      return process.env.EXPO_PUBLIC_API_URL_PROD || 'https://api.888cargo.com/api';
    case 'development':
    default:
      return process.env.EXPO_PUBLIC_API_URL_LOCAL || 'http://192.168.58.109:4000/api';
  }
};

// Configuración de la API para el proyecto móvil 888Cargo
export const API_CONFIG = {
  // URL base del backend - configuración dinámica
  BASE_URL: getApiUrl(),
  
  // Endpoints del backend (coinciden con las rutas web)
  ENDPOINTS: {
    // Autenticación - CORREGIDO para coincidir con el backend
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register', 
      RESET_PASSWORD: '/auth/reset-password',
      VERIFY_TOKEN: '/auth/verify-token',
      REFRESH_TOKEN: '/auth/refresh-token',
      PROFILE: '/auth/profile',
      LOGOUT: '/auth/logout'
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

// Función auxiliar para construir URLs con parámetros
export const buildURL = (baseEndpoint: string, params: Record<string, any> = {}) => {
  let url = getFullURL(baseEndpoint);
  const queryParams = new URLSearchParams(params).toString();
  return queryParams ? `${url}?${queryParams}` : url;
};

// Configuración de depuración
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
