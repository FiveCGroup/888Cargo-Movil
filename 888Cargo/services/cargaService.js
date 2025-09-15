// ===================================
// 888CARGO MOBILE - SERVICIO DE CARGAS
// Solo procesamiento REAL - Sin datos de prueba
// ===================================

console.log('📦 [CargaService] Inicializando servicio de cargas (SOLO DATOS REALES)...');

// Configuración dinámica de la API basada en la plataforma
import { Platform } from 'react-native';

let API_BASE_URL;
if (Platform.OS === 'android') {
  API_BASE_URL = 'http://10.0.2.2:3102/api'; // Para emulador Android
} else if (Platform.OS === 'ios') {
  API_BASE_URL = 'http://localhost:3102/api'; // Para simulador iOS
} else {
  API_BASE_URL = 'http://localhost:3102/api'; // Para web/otros
}

console.log('🔧 [CargaService] Plataforma detectada:', Platform.OS);
console.log('🔧 [CargaService] Configurando con URL:', API_BASE_URL);

class CargaService {
  constructor() {
    console.log('🔧 [CargaService] Configurado para plataforma:', Platform.OS, 'con URL:', API_BASE_URL);
    console.log('⚠️ [CargaService] MODO: SOLO DATOS REALES - Sin fallbacks de prueba');
  }

  // Método para procesar archivo Excel - SOLO DATOS REALES
  async procesarExcel(archivo) {
    console.log('📤 [CargaService] Iniciando procesamiento de Excel REAL...');
    console.log('📤 [CargaService] Archivo recibido:', {
      name: archivo.name,
      size: archivo.size,
      type: archivo.mimeType || archivo.type,
      uri: archivo.uri
    });

    // URLs a probar en orden de preferencia
    const urlsToTry = [
      API_BASE_URL,
      'http://localhost:3102/api',  // Fallback para todas las plataformas
      'http://10.0.2.2:3102/api'   // Fallback Android
    ];

    let ultimoError = null;

    for (const baseUrl of urlsToTry) {
      let timeoutId = null; // Declarar timeoutId en el scope del loop

      // Timeout EXTREMADAMENTE ALTO para pruebas (20 minutos)
      let timeoutMs = 20 * 60 * 1000; // 20 minutos

      try {
        console.log('🔗 [CargaService] Intentando conectar a:', baseUrl);

        // Crear FormData
        const formData = new FormData();

        // Agregar archivo al FormData
        formData.append('excelFile', {
          uri: archivo.uri,
          type: archivo.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          name: archivo.name || 'archivo.xlsx'
        });

        console.log('📤 [CargaService] FormData creado, enviando al servidor...');
        console.log('📂 [CargaService] Tamaño del archivo:', archivo.size, 'bytes');

        // Timeout fijo muy alto para pruebas
        console.log('⏱️ [CargaService] Timeout configurado:', timeoutMs / 1000, 'segundos');

        // Realizar petición al servidor real con timeout alto
        const controller = new AbortController();
        timeoutId = setTimeout(() => {
          console.log('⏰ [CargaService] Timeout alcanzado, cancelando petición...');
          controller.abort();
        }, timeoutMs);

        const response = await fetch(`${baseUrl}/cargas/procesar-excel`, {
          method: 'POST',
          body: formData,
          // NO especificar Content-Type para FormData - se establece automáticamente
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('📥 [CargaService] Respuesta del servidor:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          url: response.url
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error HTTP ${response.status}: ${errorText}`);
        }

        const resultado = await response.json();

        // Verificar que el resultado sea exitoso
        if (!resultado.success) {
          throw new Error(resultado.message || 'Error en el procesamiento del archivo');
        }

        console.log('✅ [CargaService] Procesamiento REAL exitoso');
        console.log('📊 [CargaService] Datos recibidos:', resultado);

        return {
          success: true,
          data: resultado.data
        };

      } catch (error) {
        clearTimeout(timeoutId); // Asegurar que se limpia el timeout

        let errorMessage = error.message;

        // Manejo específico de errores
        if (error.name === 'AbortError' || errorMessage.includes('Aborted')) {
          errorMessage = `Timeout: El servidor tardó más de ${timeoutMs / 1000} segundos en procesar el archivo. Esto puede indicar que el archivo está corrupto o es demasiado grande.`;
        } else if (errorMessage.includes('Network request failed')) {
          errorMessage = `Error de conexión: No se pudo conectar al servidor en ${baseUrl}`;
        } else if (errorMessage.includes('Failed to fetch')) {
          errorMessage = `Error de red: Verifique su conexión a internet y que el servidor esté ejecutándose`;
        }

        console.log(`❌ [CargaService] Error con URL ${baseUrl}:`, errorMessage);
        ultimoError = new Error(errorMessage);

        // Si es el último intento, propagar el error
        if (baseUrl === urlsToTry[urlsToTry.length - 1]) {
          break;
        }
      }
    }

    // Si llegamos aquí, todos los endpoints fallaron
    console.error('❌ [CargaService] No se pudo procesar el archivo en ningún endpoint');
    throw new Error(`Error al procesar archivo: ${ultimoError?.message || 'Conexión fallida'}`);
  }

  // Buscar packing list por código
  async buscarPackingList(codigoCarga) {
    console.log('🔍 [CargaService] Buscando packing list:', codigoCarga);
    
    try {
      const response = await fetch(`${API_BASE_URL}/cargas/buscar/${codigoCarga}`);
      
      if (response.ok) {
        const resultado = await response.json();
        return resultado;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ [CargaService] Error al buscar:', error);
      throw new Error(`Error al buscar packing list: ${error.message}`);
    }
  }

  // Guardar packing list completo con QR
  async guardarPackingListConQR(datos, metadata) {
    console.log('💾 [CargaService] Guardando packing list completo con QRs...');
    console.log('📦 [CargaService] Datos:', datos ? datos.length : 0, 'filas');
    console.log('📋 [CargaService] Metadata:', metadata);
    
    try {
      const response = await fetch(`${API_BASE_URL}/cargas/guardar-packing-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          datos,
          metadata
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const resultado = await response.json();
      console.log('✅ [CargaService] Packing list guardado exitosamente');
      console.log('📊 [CargaService] Resultados:', resultado.data);
      return resultado;
    } catch (error) {
      console.error('❌ [CargaService] Error al guardar:', error);
      throw new Error(`Error al guardar: ${error.message}`);
    }
  }

  // Generar código único para carga
  async generarCodigoCarga() {
    console.log('🔢 [CargaService] Generando código único de carga...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/cargas/generar-codigo`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const resultado = await response.json();
      console.log('✅ [CargaService] Código generado:', resultado.codigo_carga);
      return resultado;
    } catch (error) {
      console.error('❌ [CargaService] Error al generar código:', error);
      throw new Error(`Error al generar código: ${error.message}`);
    }
  }

  // Test de conectividad
  async testConectividad() {
    console.log('🔗 [CargaService] Probando conectividad...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [CargaService] Conectividad OK:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ [CargaService] Conectividad FAILED:', error);
      throw new Error(`Error de conectividad: ${error.message}`);
    }
  }

  // Obtener datos de QR de una carga
  async obtenerQRDataDeCarga(idCarga) {
    console.log('🏷️ [CargaService] Obteniendo datos de QR para carga:', idCarga);
    
    try {
      const response = await fetch(`${API_BASE_URL}/cargas/${idCarga}/qrs`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const resultado = await response.json();
      console.log('✅ [CargaService] Datos de QR obtenidos:', resultado.data?.length || 0, 'QRs');
      return resultado;
    } catch (error) {
      console.error('❌ [CargaService] Error al obtener QRs:', error);
      throw new Error(`Error al obtener códigos QR: ${error.message}`);
    }
  }

  // Obtener información meta de una carga
  async obtenerCargaMeta(idCarga) {
    console.log('📋 [CargaService] Obteniendo información de carga:', idCarga);
    
    try {
      const response = await fetch(`${API_BASE_URL}/cargas/${idCarga}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const resultado = await response.json();
      console.log('✅ [CargaService] Información de carga obtenida');
      return resultado;
    } catch (error) {
      console.error('❌ [CargaService] Error al obtener info de carga:', error);
      throw new Error(`Error al obtener información de carga: ${error.message}`);
    }
  }
}

// Exportar instancia única del servicio
const cargaService = new CargaService();
export default cargaService;

console.log('✅ [CargaService] Servicio inicializado correctamente (SOLO DATOS REALES)');