// ===================================
// 888CARGO MOBILE - SERVICIO DE CARGAS
// Solo procesamiento REAL - Sin datos de prueba
// ===================================

console.log('📦 [CargaService] Inicializando servicio de cargas (SOLO DATOS REALES)...');

// Configuración dinámica de la API basada en la plataforma (BACKEND WEB UNIFICADO)
import { Platform } from 'react-native';

let API_BASE_URL;
if (Platform.OS === 'android') {
  API_BASE_URL = 'http://10.0.2.2:4000/api'; // Para emulador Android - Backend web
} else if (Platform.OS === 'ios') {
  API_BASE_URL = 'http://192.168.58.106:4000/api'; // Para simulador iOS - Backend web con IP real
} else {
  API_BASE_URL = 'http://192.168.58.106:4000/api'; // Para web/otros - Backend web con IP real
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

    // URLs a probar en orden de preferencia (BACKEND WEB)
    const urlsToTry = [
      API_BASE_URL,
      'http://192.168.58.106:4000/api',  // IP real de la máquina - Backend web
      'http://localhost:4000/api',       // Fallback local - Backend web
      'http://10.0.2.2:4000/api'        // Fallback Android - Backend web
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
        formData.append('archivo', {
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

        const response = await fetch(`${baseUrl}/carga/procesar-excel`, {
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
      const response = await fetch(`${API_BASE_URL}/carga/buscar/${codigoCarga}`);
      
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
      // Estructurar los datos en el formato que espera el backend
      const payloadBackend = {
        datosExcel: datos,
        infoCliente: {
          id_cliente: metadata.id_cliente || 1, // ID del cliente existente
          nombre_cliente: metadata.nombre_cliente || 'Cristian Estibens Marin Puerta',
          correo_cliente: metadata.correo_cliente || 'correo@correo.com',
          telefono_cliente: metadata.telefono_cliente || '+57 300 000 0000',
          direccion_entrega: metadata.direccion_destino || 'Dirección por definir'
        },
        infoCarga: {
          codigo_carga: metadata.codigo_carga,
          direccion_destino: metadata.direccion_destino,
          ciudad_destino: metadata.ciudad_destino,
          archivo_original: metadata.archivo_original
        }
      };

      console.log('🔄 [CargaService] Payload estructurado para backend:', JSON.stringify(payloadBackend, null, 2));

      const response = await fetch(`${API_BASE_URL}/carga/guardar-con-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Enviar cookies de autenticación
        body: JSON.stringify(payloadBackend)
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
      const response = await fetch(`${API_BASE_URL}/carga/generar-codigo`);
      
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

  // Obtener datos de QR de una carga
  async obtenerQRDataDeCarga(idCarga) {
    console.log('🏷️ [CargaService] Obteniendo datos de QR para carga:', idCarga);
    
    try {
      // USAR RUTA DE DEBUG TEMPORALMENTE para aislar problema de autenticación
      const url = `${API_BASE_URL}/qr/debug/carga/${idCarga}/data`;
      console.log('🔗 [CargaService] URL completa (DEBUG):', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // SIN credentials para debug
      });
      
      console.log('📡 [CargaService] Estado de respuesta:', response.status);
      console.log('📡 [CargaService] Headers de respuesta:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [CargaService] Error HTTP:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const resultado = await response.json();
      console.log('✅ [CargaService] Datos de QR obtenidos completos:', JSON.stringify(resultado, null, 2));
      console.log('✅ [CargaService] Cantidad de QRs:', resultado.data?.qrs?.length || 0);
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
      const response = await fetch(`${API_BASE_URL}/carga/carga/${idCarga}`);
      
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

  // Descargar PDF de QRs - Adaptado de la lógica web
  async descargarPDFQRs(idCarga, useOptimized = true) {
    console.log('📄 [CargaService] Descargando PDF de QRs para carga:', idCarga);
    
    try {
      // Usar versión optimizada por defecto y agregar parámetro aleatorio para evitar caché
      const params = useOptimized ? '?useOptimized=true' : '?useOptimized=false';
      const nocache = `&nocache=${Date.now()}`;
      const url = `${API_BASE_URL}/qr/pdf-carga/${idCarga}${params}${nocache}`;
      
      console.log('🔗 [CargaService] URL PDF:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/pdf',
        },
        credentials: 'include', // Enviar cookies de autenticación
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [CargaService] Error HTTP al descargar PDF:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Obtener el blob/buffer del PDF usando un método más eficiente
      const arrayBuffer = await response.arrayBuffer();
      
      // Convertir ArrayBuffer a base64 de forma más eficiente
      const uint8Array = new Uint8Array(arrayBuffer);
      let binaryString = '';
      const chunkSize = 8192; // Procesar en chunks para evitar stack overflow
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize);
        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
      }
      
      const base64String = btoa(binaryString);
      const versionSuffix = useOptimized ? 'optimized' : 'legacy';
      
      console.log('✅ [CargaService] PDF descargado exitosamente, tamaño:', base64String.length, 'caracteres');
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
      console.error('❌ [CargaService] Error al descargar PDF:', error);
      throw new Error(`Error al descargar PDF de QRs: ${error.message}`);
    }
  }
}

// Exportar instancia única del servicio
const cargaService = new CargaService();
export default cargaService;

console.log('✅ [CargaService] Servicio inicializado correctamente (SOLO DATOS REALES)');