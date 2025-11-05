// ===================================
// 888CARGO MOBILE - SERVICIO API
// ===================================

import { API_CONFIG, getFullURL, DEBUG_MODE } from '../constants/API';

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
    throw new Error(`HTTP ${response.status}: ${errorText}`);
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
 * Métodos específicos para cada tipo de petición
 */
export const api = {
  // Petición GET
  get: (endpoint: string, headers?: Record<string, string>) => 
    apiRequest(endpoint, 'GET', undefined, headers),
  
  // Petición POST  
  post: (endpoint: string, data?: any, headers?: Record<string, string>) =>
    apiRequest(endpoint, 'POST', data, headers),
  
  // Petición PUT
  put: (endpoint: string, data?: any, headers?: Record<string, string>) =>
    apiRequest(endpoint, 'PUT', data, headers),
  
  // Petición DELETE
  delete: (endpoint: string, headers?: Record<string, string>) =>
    apiRequest(endpoint, 'DELETE', undefined, headers),
  
  // Petición PATCH
  patch: (endpoint: string, data?: any, headers?: Record<string, string>) =>
    apiRequest(endpoint, 'PATCH', data, headers)
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
export { API_CONFIG, getFullURL, DEBUG_MODE };
