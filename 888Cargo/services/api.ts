// ===================================
// 888CARGO MOBILE - SERVICIO API
// ===================================
import { API_CONFIG, getFullURL, DEBUG_MODE } from '../constants/API';

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tipos para respuestas comunes (ajusta según tu backend)
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  user?: T;
  token?: string;
  userId?: number;
}

// Datos que envías al register (ajusta según tu form)
interface RegisterData {
  name: string;
  lastname: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  country?: string;
}

// Extiende la interfaz de AxiosInstance para agregar métodos custom
declare module 'axios' {
  interface AxiosInstance {
    register: (data: RegisterData) => Promise<ApiResponse>;
    // Si tienes más métodos custom, agrégalos aquí
    // login: (credentials: LoginData) => Promise<ApiResponse<{ token: string; user: User }>>;
    // recoverPassword: (email: string) => Promise<ApiResponse>;
  }
}

// Crea la instancia
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para extraer data automáticamente
api.interceptors.response.use(
  (response) => {
    console.log('📡 [API] Response success:', response.status, response.data);
    return response.data;
  },
  (error) => {
    console.error('📡 [API] Response error:', error.response?.status, error.response?.data);
    return Promise.reject(error.response?.data || error);
  }
);

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@auth:token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error obteniendo token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Implementa el método register
api.register = async (data: RegisterData) => {
  const response = await api.post('/auth/register', data);
  return response.data as ApiResponse;
};

/**
 * Configuración base para todas las peticiones HTTP
 */
const createRequestConfig = (method: string, body?: any, additionalHeaders?: Record<string, string>) => {
  const config: any = {
    method,
    headers: {
      ...API_CONFIG.HEADERS,
      ...additionalHeaders
    },
    timeout: API_CONFIG.TIMEOUTS.DEFAULT
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  return config;
};

/**
 * Manejo centralizado de respuestas HTTP
 */
const handleResponse = async (response: Response) => {
  if (DEBUG_MODE) {
    console.log(`📡 [API] Response status: ${response.status} - ${response.statusText}`);
  }

  // Verificar si la respuesta es exitosa
  if (!response.ok) {
    const errorText = await response.text();
    try {
      // Intentar parsear el error como JSON
      const errorJson = JSON.parse(errorText);
      throw new Error(errorJson.message || errorJson.error || errorText);
    } catch (parseError) {
      // Si no es JSON, lanzar el texto plano
      throw new Error(errorText || `HTTP ${response.status}`);
    }
  }

  // Intentar parsear JSON
  try {
    const data = await response.json();
    return data;
  } catch (error) {
    // Si no es JSON válido, retornar el texto plano
    return await response.text();
  }
};

/**
 * Función principal para realizar peticiones HTTP
 */
export const apiRequest = async (endpoint: string, method: string = 'GET', body?: any, additionalHeaders?: Record<string, string>) => {
  const url = getFullURL(endpoint);
  
  if (DEBUG_MODE) {
    console.log(`📡 [API] ${method} ${url}`);
    if (body) {
      console.log('📤 [API] Request body:', body);
    }
  }

  try {
    const config = createRequestConfig(method, body, additionalHeaders);
    const response = await fetch(url, config);
    const data = await handleResponse(response);
    
    if (DEBUG_MODE) {
      console.log('📥 [API] Response data:', data);
    }
    
    return data;
  } catch (error) {
    console.error(`💥 [API] Error en ${method} ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Función de prueba de conectividad
 */
export const testConnection = async () => {
  try {
    console.log('🔄 [API] Probando conectividad...');
    const health = await api.get('/health');
    console.log('✅ [API] Conectividad exitosa:', health);
    return true;
  } catch (error) {
    console.error('❌ [API] Error de conectividad:', error);
    return false;
  }
};

/**
 * Helper para incluir token de autenticación en headers
 */
export const withAuth = (token: string) => ({
  'Authorization': `Bearer ${token}`
});

// Exportar configuración para depuración
export { api };
