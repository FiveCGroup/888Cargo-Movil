// ===================================
// 888CARGO MOBILE - SERVICIO DE CARGAS
// Solo procesamiento REAL - Sin datos de prueba
// ===================================

console.log('📦 [CargaService] Inicializando servicio de cargas (SOLO DATOS REALES)...');

// Configuración dinámica de la API basada en la plataforma (BACKEND WEB UNIFICADO)
import { Platform } from 'react-native';
import { API_CONFIG } from '../constants/API';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

// Usar la configuración centralizada (ya incluye /api al final)
const API_BASE_URL = API_CONFIG.BASE_URL;

// Convertir ArrayBuffer/Uint8Array a base64 sin depender de btoa (no existe en React Native)
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    result += BASE64[b1 >> 2];
    result += BASE64[((b1 & 3) << 4) | (b2 >> 4)];
    result += i + 1 < bytes.length ? BASE64[((b2 & 15) << 2) | (b3 >> 6)] : '=';
    result += i + 2 < bytes.length ? BASE64[b3 & 63] : '=';
  }
  return result;
}

// Función helper para obtener el token de autenticación
const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('@auth:token');
    return token;
  } catch (error) {
    console.error('[CargaService] Error obteniendo token:', error);
    return null;
  }
};

console.log('🔧 [CargaService] Plataforma detectada:', Platform.OS);
console.log('🔧 [CargaService] Configurando con URL:', API_BASE_URL);

const CargaService = {
  // Método para procesar archivo Excel - SOLO DATOS REALES
  async procesarExcel(archivo) {
    console.log('📤 [CargaService] Iniciando procesamiento de Excel REAL...');
    console.log('📤 [CargaService] Archivo recibido:', {
      name: archivo.name,
      size: archivo.size,
      type: archivo.mimeType || archivo.type,
      uri: archivo.uri ? `${archivo.uri.substring(0, 50)}...` : null
    });

    const baseUrl = API_BASE_URL;
    const timeoutMs = 20 * 60 * 1000; // 20 minutos para archivos grandes

    try {
      if (!archivo.uri) {
        throw new Error('El archivo no tiene una URI válida. Por favor, selecciona el archivo nuevamente.');
      }

      // En Android, content:// no funciona bien con FormData. Copiar a file:// en caché.
      let uriParaSubir = archivo.uri;
      if (Platform.OS === 'android' && archivo.uri.startsWith('content://')) {
        const ext = (archivo.name && archivo.name.includes('.')) ? archivo.name.split('.').pop() : 'xlsx';
        const destUri = `${FileSystem.cacheDirectory}upload_${Date.now()}.${ext}`;
        try {
          await FileSystem.copyAsync({ from: archivo.uri, to: destUri });
          uriParaSubir = destUri;
          console.log('[CargaService] Archivo copiado a file:// para subida:', destUri);
        } catch (copyErr) {
          console.warn('[CargaService] No se pudo copiar content:// a cache, intentando URI original:', copyErr.message);
        }
      }

      const mimeType = archivo.mimeType || archivo.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const fileName = archivo.name || 'archivo.xlsx';

      const formData = new FormData();
      formData.append('file', {
        uri: uriParaSubir,
        type: mimeType,
        name: fileName
      });

      const token = await getAuthToken();
      if (!token) {
        throw new Error('No se encontró token de autenticación. Por favor, inicia sesión nuevamente.');
      }

      // Usar fetch en lugar de axios: en Expo Go/Android suele ser más fiable con FormData y file://
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${baseUrl}/carga/procesar-excel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
          // NO establecer Content-Type: fetch asigna multipart/form-data con boundary
        },
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📥 [CargaService] Respuesta:', response.status, response.statusText);

      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.message || `Error HTTP ${response.status}: ${response.statusText}`);
      }
      if (!body.success) {
        throw new Error(body.message || 'Error en el procesamiento del archivo');
      }

      console.log('[CargaService] File processing completed successfully');

      return {
        success: true,
        data: body.data || [],
        filasConError: body.filasConError || [],
        estadisticas: body.estadisticas || null
      };
    } catch (error) {
      let errorMessage = error.message || 'Error desconocido';
      if (error.name === 'AbortError') {
        errorMessage = `Tiempo de espera agotado (${timeoutMs / 1000}s). Comprueba la conexión y el tamaño del archivo.`;
      } else if (errorMessage.includes('Network request failed') || errorMessage.includes('Failed to fetch')) {
        errorMessage = `No se pudo conectar al servidor (${baseUrl}). Comprueba que el backend esté en marcha y que el celular use la misma red WiFi, y que EXPO_PUBLIC_API_URL_LOCAL tenga la IP correcta de tu PC.`;
      }
      console.error('[CargaService] procesarExcel failed:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Buscar packing list por código
  async buscarPackingList(codigoCarga) {
    console.log(`[CargaService] Searching packing list for code: ${codigoCarga}`);
    
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No se encontró token de autenticación. Por favor, inicia sesión nuevamente.');
      }

      const response = await fetch(`${API_BASE_URL}/carga/buscar/${encodeURIComponent(codigoCarga)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const resultado = await response.json();
        return resultado;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('[CargaService] Search operation failed:', error);
      throw new Error(`Error al buscar packing list: ${error.message}`);
    }
  },

  // Guardar packing list completo con QR
  async guardarPackingListConQR(datos, metadata) {
    console.log('💾 [CargaService] Guardando packing list completo con QRs...');
    console.log('📦 [CargaService] Datos:', datos ? datos.length : 0, 'filas');
    console.log('[INFO] [CargaService] Metadata:', metadata);
    
    try {
      // Estructurar los datos en el formato que espera el backend
      const payloadBackend = {
        datosExcel: datos,
        infoCliente: {
          id_cliente: metadata.id_cliente || null, // El backend lo resolverá o creará uno nuevo
          nombre_cliente: metadata.nombre_cliente || null,
          correo_cliente: metadata.correo_cliente || null,
          telefono_cliente: metadata.telefono_cliente || null,
          direccion_entrega: metadata.direccion_entrega || metadata.direccion_destino || null
        },
        infoCarga: {
          codigo_carga: metadata.codigo_carga,
          direccion_destino: metadata.direccion_destino || null,
          ciudad_destino: metadata.ciudad_destino || metadata.direccion_destino || null,
          archivo_original: metadata.archivo_original || null,
          destino: metadata.destino || null,
          shipping_mark: metadata.shipping_mark || null,
          estado: metadata.estado || null,
          ubicacion_actual: metadata.ubicacion_actual || null,
          fecha_recepcion: metadata.fecha_recepcion || null,
          fecha_envio: metadata.fecha_envio || null,
          fecha_arribo: metadata.fecha_arribo || null,
          contenedor_asociado: metadata.contenedor_asociado || null,
          observaciones: metadata.observaciones || null
        }
      };

      console.log('[SYNC] [CargaService] Payload estructurado para backend:', JSON.stringify(payloadBackend, null, 2));

      // Obtener token de autenticación
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No se encontró token de autenticación. Por favor, inicia sesión nuevamente.');
      }

      const response = await fetch(`${API_BASE_URL}/carga/guardar-con-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payloadBackend)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const resultado = await response.json();
      console.log('[CargaService] Packing list saved successfully');
      console.log('📊 [CargaService] Resultados:', resultado.data);
      return resultado;
    } catch (error) {
      console.error('[CargaService] Save operation failed:', error);
      throw new Error(`Error al guardar: ${error.message}`);
    }
  },

  // Generar código único para carga
  async generarCodigoCarga() {
    console.log('🔢 [CargaService] Generando código único de carga...');
    
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No se encontró token de autenticación. Por favor, inicia sesión nuevamente.');
      }

      const response = await fetch(`${API_BASE_URL}/carga/generar-codigo`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const resultado = await response.json();
      console.log(`[CargaService] Code generated successfully: ${resultado.codigo_carga}`);
      return resultado;
    } catch (error) {
      console.error('[CargaService] Code generation failed:', error);
      throw new Error(`Error al generar código: ${error.message}`);
    }
  },

  // Obtener datos de QR de una carga
  async obtenerQRDataDeCarga(idCarga) {
    console.log(`[CargaService] Fetching QR data for cargo ID: ${idCarga}`);
    
    try {
      // USAR RUTA DE DEBUG TEMPORALMENTE para aislar problema de autenticación
      const url = `${API_BASE_URL}/qr/debug/carga/${idCarga}/data`;
      if (process.env.NODE_ENV === 'development') {
        console.log(`[CargaService] Request URL: ${url}`);
      }
      
      const token = await getAuthToken();
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });
      
      console.log('📡 [CargaService] Estado de respuesta:', response.status);
      console.log('📡 [CargaService] Headers de respuesta:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[CargaService] HTTP error ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const resultado = await response.json();
      console.log(`[CargaService] QR data retrieved successfully - Count: ${resultado.data?.qrs?.length || 0}`);
      return resultado;
    } catch (error) {
      console.error('[CargaService] Failed to fetch QR data:', error);
      throw new Error(`Error al obtener códigos QR: ${error.message}`);
    }
  },

  // Obtener información meta de una carga
  async obtenerCargaMeta(idCarga) {
    console.log('[INFO] [CargaService] Obteniendo información de carga:', idCarga);
    
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No se encontró token de autenticación. Por favor, inicia sesión nuevamente.');
      }

      const response = await fetch(`${API_BASE_URL}/carga/carga/${idCarga}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const resultado = await response.json();
      console.log('[CargaService] Cargo information retrieved successfully');
      return resultado;
    } catch (error) {
      console.error('[CargaService] Failed to fetch cargo information:', error);
      throw new Error(`Error al obtener información de carga: ${error.message}`);
    }
  },

  // Descargar PDF de QRs - Adaptado de la lógica web
  async descargarPDFQRs(idCarga, useOptimized = true) {
    console.log(`[CargaService] Downloading QR PDF for cargo: ${idCarga}`);
    
    try {
      // Usar versión optimizada por defecto y agregar parámetro aleatorio para evitar caché
      const params = useOptimized ? '?useOptimized=true' : '?useOptimized=false';
      const nocache = `&nocache=${Date.now()}`;
      const url = `${API_BASE_URL}/qr/pdf-carga/${idCarga}${params}${nocache}`;
      
      console.log('🔗 [CargaService] URL PDF:', url);
      
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No se encontró token de autenticación. Por favor, inicia sesión nuevamente.');
      }

      const downloadTimeout = API_CONFIG.TIMEOUTS?.DOWNLOAD ?? 60000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), downloadTimeout);
      let response;
      try {
        response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/pdf',
            'Authorization': `Bearer ${token}`
          },
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ERROR] [CargaService] Error HTTP al descargar PDF:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Obtener el buffer del PDF
      const arrayBuffer = await response.arrayBuffer();

      // Convertir ArrayBuffer a base64 (compatible con React Native; btoa no está disponible)
      const base64String = arrayBufferToBase64(arrayBuffer);
      const versionSuffix = useOptimized ? 'optimized' : 'legacy';
      
      console.log('[SUCCESS] [CargaService] PDF descargado exitosamente, tamaño:', base64String.length, 'caracteres');
      return { 
        success: true, 
        data: {
          base64: base64String,
          filename: `QR-Codes-Carga-${idCarga}-${versionSuffix}-${Date.now()}.pdf`,
          mimeType: 'application/pdf'
        },
        message: `PDF ${useOptimized ? 'optimizado' : 'legacy'} descargado exitosamente` 
      };
    } catch (error) {
      console.error('[ERROR] [CargaService] Error al descargar PDF:', error);
      throw new Error(`Error al descargar PDF de QRs: ${error.message}`);
    }
  },

  // Alias: guardar packing list desde archivo (usa mismo endpoint que procesarExcel)
  async uploadPackingList(file) {
    return this.procesarExcel(file);
  },
};

export default CargaService;

console.log('[CargaService] Service module loaded successfully');