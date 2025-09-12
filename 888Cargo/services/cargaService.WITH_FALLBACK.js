// ===================================
// 888CARGO MOBILE - SERVICIO DE CARGAS
// Versión simplificada y funcional
// ===================================

console.log('📦 [CargaService] Inicializando servicio de cargas...');

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
  }

  // Método para procesar archivo Excel
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

    for (const baseUrl of urlsToTry) {
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

        // Realizar petición al servidor real con timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

        const response = await fetch(`${baseUrl}/cargas/procesar-excel`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
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
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const resultado = await response.json();
        console.log('✅ [CargaService] Procesamiento REAL exitoso');
        console.log('📊 [CargaService] Datos recibidos:', resultado);

        return {
          success: true,
          data: resultado.data
        };

      } catch (error) {
        console.log(`❌ [CargaService] Error con URL ${baseUrl}:`, error.message);
        
        // Si es el último intento, propagar el error
        if (baseUrl === urlsToTry[urlsToTry.length - 1]) {
          throw new Error(`No se pudo conectar a ningún endpoint del servidor. Último error: ${error.message}`);
        }
      }
    }
  }
  }

  // Generar datos de prueba con estructura real de Excel
  generarDatosPrueba(totalItems = 15) {
    console.log('📊 [CargaService] Generando datos de prueba con estructura real...');
    
    // Headers reales basados en el procesamiento del backend
    const headers = [
      'Fecha', 'Marca Cliente', 'Tel Cliente', 'Ciudad Destino', 'PHTO', 'C/N',
      'Ref Art', 'Descripción ES', 'Descripción CN', 'Unit', 'Precio Unit', 'Precio Total',
      'Material', 'Unidades x Empaque', 'Marca Producto', 'Cajas', 'Cant por Caja', 'Cant Total',
      'Largo', 'Ancho', 'Alto', 'CBM', 'CBM TT', 'G.W', 'G.W TT', 'Serial'
    ];

    // Datos de ejemplo reales
    const filasDePrueba = [];
    for (let i = 1; i <= totalItems; i++) {
      filasDePrueba.push([
        '2025-03-02T21:00:05.000Z',  // Fecha
        'Cliente Demo',               // Marca Cliente
        '+57 300 123 4567',          // Tel Cliente
        'Bogotá - Colombia',         // Ciudad Destino
        '',                          // PHTO
        `C${i.toString().padStart(3, '0')}`, // C/N
        `REF-${i}`,                  // Ref Art
        `Producto Demo ${i}`,        // Descripción ES
        `产品示例 ${i}`,               // Descripción CN
        'pcs',                       // Unit
        '10.50',                     // Precio Unit
        (10.50 * (i + 5)).toFixed(2), // Precio Total
        'Plástico',                  // Material
        '12',                        // Unidades x Empaque
        'Marca Demo',                // Marca Producto
        '5',                         // Cajas
        '60',                        // Cant por Caja
        (300 + (i * 10)).toString(), // Cant Total
        '30',                        // Largo
        '25',                        // Ancho
        '15',                        // Alto
        '0.011',                     // CBM
        (0.011 * 5).toFixed(3),      // CBM TT
        '0.5',                       // G.W
        (0.5 * 300).toFixed(1),      // G.W TT
        `SN${i.toString().padStart(6, '0')}` // Serial
      ]);
    }

    return [headers, ...filasDePrueba];
  }

  // Usar datos de prueba como fallback
  usarDatosPrueba(archivo) {
    console.log('🔄 [CargaService] Usando datos de prueba con estructura real para archivo:', archivo.name);
    
    const datosExcel = this.generarDatosPrueba(5);
    
    return {
      success: true,
      data: {
        filename: archivo.name,
        size: archivo.size,
        mimetype: archivo.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        codigoCarga: 'DEMO-' + Date.now(),
        cliente: 'Cliente Demo',
        totalItems: 5,
        datosExcel: datosExcel,
        estadisticas: {
          totalFilas: datosExcel.length,
          filasEncabezado: 1,
          filasValidas: datosExcel.length - 1,
          filasConError: 0,
          columnas: datosExcel[0]?.length || 0
        }
      }
    };
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
        return {
          success: false,
          error: 'Packing list no encontrado'
        };
      }
    } catch (error) {
      console.error('❌ [CargaService] Error al buscar:', error);
      return {
        success: false,
        error: 'Error de conexión'
      };
    }
  }

  // Guardar packing list completo con QR
  async guardarPackingListConQR(datosCompletos) {
    console.log('💾 [CargaService] Guardando packing list completo...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/cargas/guardar-completo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosCompletos)
      });

      if (response.ok) {
        const resultado = await response.json();
        console.log('✅ [CargaService] Packing list guardado exitosamente');
        return resultado;
      } else {
        throw new Error('Error al guardar en el servidor');
      }
    } catch (error) {
      console.error('❌ [CargaService] Error al guardar:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Test de conectividad
  async testConectividad() {
    console.log('🔗 [CargaService] Probando conectividad...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [CargaService] Conectividad OK:', data);
        return { success: true, data };
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ [CargaService] Conectividad FAILED:', error);
      return { success: false, error: error.message };
    }
  }
}

// Exportar instancia única del servicio
const cargaService = new CargaService();
export default cargaService;

console.log('✅ [CargaService] Servicio inicializado correctamente');