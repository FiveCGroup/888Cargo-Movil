// ==========================================
// 888CARGO MOBILE - SERVICIO DE COTIZACIONES
// ==========================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import { api } from './api';
import { API_CONFIG } from '../constants/API';

console.log('📦 [CotizacionService] Inicializando servicio de cotizaciones...');

const STORAGE_KEYS = {
  TEMP_COTIZACION: '@cotizacion_temp',
  AUTH_TOKEN: '@auth:token',
};

// Configuración de logística (igual que en CotizadorScreen)
const LOGISTICA_CONFIG = {
  FACTOR_VOLUMETRICO: {
    MARITIMO: 1000, // 1 m³ = 1000 kg
    AEREO: 167,     // 1 m³ = 167 kg
  },
  TARIFAS_USD: {
    MARITIMO_LCL: {
      China: { min: 38, max: 45, promedio: 41.5 },
      Miami: { min: 35, max: 42, promedio: 38.5 },
      Europa: { min: 55, max: 65, promedio: 60 }
    },
    AEREO_KG: {
      China: { min: 4.8, max: 5.5, promedio: 5.15 },
      Miami: { min: 2.8, max: 3.2, promedio: 3.0 },
      Europa: { min: 4.2, max: 4.8, promedio: 4.5 }
    }
  },
  TRM_COP_USD: 4250,
  MINIMO_MARITIMO_M3: 1,
  MINIMO_AEREO_KG: 10,
  CAPACIDAD_CONTENEDOR_M3: 68,
};

// Obtener token
async function getAuthToken() {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch {
    return null;
  }
}

// Cálculo local (fallback si backend falla)
function calcularCotizacionLocal(tipo, payload, destino = 'China') {
  const volumen = (payload.largo_cm * payload.ancho_cm * payload.alto_cm) / 1000000; // m³
  const peso = payload.peso_kg;
  
  let costoUSD = 0;
  let tipoCobro = '';
  let detalleCalculo = {};

  if (tipo === 'maritimo') {
    // MARÍTIMO: Se cobra POR VOLUMEN (m³)
    const volumenCobrable = Math.max(volumen, LOGISTICA_CONFIG.MINIMO_MARITIMO_M3);
    const pesoVolumetrico = volumen * LOGISTICA_CONFIG.FACTOR_VOLUMETRICO.MARITIMO;
    const tarifaDestino = LOGISTICA_CONFIG.TARIFAS_USD.MARITIMO_LCL[destino] || LOGISTICA_CONFIG.TARIFAS_USD.MARITIMO_LCL.China;
    const tarifaUSD = tarifaDestino.promedio;
    
    costoUSD = volumenCobrable * tarifaUSD;
    tipoCobro = 'USD/m³';
    
    detalleCalculo = {
      pesoReal: peso,
      pesoVolumetrico: pesoVolumetrico.toFixed(2),
      volumenReal: volumen.toFixed(3),
      volumenCobrable: volumenCobrable.toFixed(3),
      tarifaUSD,
      tipoCobro,
      factorUsado: LOGISTICA_CONFIG.FACTOR_VOLUMETRICO.MARITIMO,
      gana: 'volumen (m³)',
      explicacion: 'En marítimo LCL se cobra SIEMPRE por volumen'
    };
  } else {
    // AÉREO: Se cobra POR PESO COBRABLE
    const pesoVolumetrico = volumen * LOGISTICA_CONFIG.FACTOR_VOLUMETRICO.AEREO;
    const pesoCobrable = Math.max(peso, pesoVolumetrico, LOGISTICA_CONFIG.MINIMO_AEREO_KG);
    const tarifaDestino = LOGISTICA_CONFIG.TARIFAS_USD.AEREO_KG[destino] || LOGISTICA_CONFIG.TARIFAS_USD.AEREO_KG.China;
    const tarifaUSD = tarifaDestino.promedio;
    
    costoUSD = pesoCobrable * tarifaUSD;
    tipoCobro = 'USD/kg';
    
    const gana = peso > pesoVolumetrico ? 'peso real' : 'peso volumétrico';
    
    detalleCalculo = {
      pesoReal: peso,
      pesoVolumetrico: pesoVolumetrico.toFixed(2),
      pesoCobrable: pesoCobrable.toFixed(2),
      volumenReal: volumen.toFixed(3),
      tarifaUSD,
      tipoCobro,
      factorUsado: LOGISTICA_CONFIG.FACTOR_VOLUMETRICO.AEREO,
      gana,
      explicacion: `Se cobra el mayor entre peso real (${peso} kg) y volumétrico (${pesoVolumetrico.toFixed(2)} kg)`
    };
  }

  const costoCOP = Math.round(costoUSD * LOGISTICA_CONFIG.TRM_COP_USD);

  return {
    volumen_m3: volumen.toFixed(3),
    peso_kg: peso,
    valor_usd: costoUSD.toFixed(2),
    valor_cop: costoCOP,
    detalleCalculo,
    destino,
    trm: LOGISTICA_CONFIG.TRM_COP_USD
  };
}

class CotizacionService {
  // Guardar datos temporales
  async guardarDatosTemporales(tipo, payload, resultado) {
    try {
      const data = {
        tipo,
        payload,
        resultado,
        timestamp: new Date().toISOString()
      };
      await AsyncStorage.setItem(STORAGE_KEYS.TEMP_COTIZACION, JSON.stringify(data));
      console.log('💾 [CotizacionService] Datos temporales guardados');
    } catch (err) {
      console.error('❌ [CotizacionService] Error guardando datos:', err);
    }
  }

  // Cotizar envío (actualizado con destino)
  async cotizarEnvio(tipo, payload, isAuthenticated, destino = 'China') {
    try {
      console.log(`[CotizacionService] Cotizando ${tipo} hacia ${destino}`);
      
      // Agregar destino al payload
      const payloadConDestino = {
        ...payload,
        destino: destino
      };

      const endpoint = tipo === 'maritimo' 
        ? '/cotizaciones/maritimo' 
        : '/cotizaciones/aereo';

      const response = await api.post(endpoint, payloadConDestino);

      if (response.success && response.data) {
        console.log('✅ [CotizacionService] Cotización exitosa:', response.data);
        
        // Guardar temporalmente si está autenticado
        if (isAuthenticated) {
          await this.guardarDatosTemporales(tipo, payloadConDestino, response.data);
        }

        return {
          success: true,
          data: response.data,
          isStub: false,
        };
      }

      throw new Error('Respuesta inválida del servidor');

    } catch (error) {
      console.error('❌ [CotizacionService] Error cotizando:', error);

      // Si no está autenticado, requerir registro
      if (!isAuthenticated) {
        return {
          success: false,
          requiereRegistro: true,
          error: 'Debes registrarte para obtener cotizaciones',
        };
      }

      // Fallback: usar cálculo local
      console.log('⚠️ [CotizacionService] Usando cálculo local (fallback)');
      const resultadoLocal = calcularCotizacionLocal(tipo, payload, destino);
      
      return {
        success: true,
        data: resultadoLocal,
        isStub: true,
      };
    }
  }

  // Cargar draft
  async obtenerDatosTemporales() {
    try {
      const draftStr = await AsyncStorage.getItem(STORAGE_KEYS.TEMP_COTIZACION);
      return draftStr ? JSON.parse(draftStr) : null;
    } catch {
      return null;
    }
  }

  // Limpiar draft
  async limpiarDatosTemporales() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.TEMP_COTIZACION);
      console.log('🗑️ [CotizacionService] Draft eliminado');
    } catch (err) {
      console.error('❌ [CotizacionService] Error limpiando draft:', err);
    }
  }

  // Generar PDF de cotización (actualizado con nueva lógica)
  async generarPDF(cotizacionData) {
    try {
      console.log('📄 [CotizacionService] Generando PDF...');
      
      const { tipo, payload, resultado, detalleCalculo } = cotizacionData;
      
      // Formatear precio
      const formatearPrecio = (precio) => {
        return new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0,
        }).format(precio);
      };

      const esMaritimo = tipo === 'maritimo';
      const tipoTexto = esMaritimo ? 'Marítimo LCL' : 'Aéreo';
      const iconoTipo = esMaritimo ? '🚢' : '✈️';

      // HTML del PDF (actualizado)
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #0b2032;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 3px solid #0f77c5;
              padding-bottom: 20px;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              color: #0f77c5;
            }
            .subtitle {
              color: #666;
              margin-top: 10px;
            }
            .badge {
              display: inline-block;
              padding: 8px 16px;
              background-color: #f0f8ff;
              border-radius: 20px;
              color: #0f77c5;
              font-weight: bold;
              margin-top: 10px;
            }
            .section {
              margin: 30px 0;
            }
            .section-title {
              font-size: 20px;
              font-weight: bold;
              color: #0f77c5;
              margin-bottom: 15px;
              border-left: 4px solid #0f77c5;
              padding-left: 10px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 10px;
              border-bottom: 1px solid #e9ebef;
            }
            .info-label {
              font-weight: bold;
              color: #666;
            }
            .info-value {
              color: #0b2032;
            }
            .highlight {
              background-color: #fff3cd;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #ffc107;
            }
            .highlight-title {
              font-weight: bold;
              color: #0b2032;
              margin-bottom: 10px;
            }
            .calculation-box {
              background-color: #e3f2fd;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #2196f3;
            }
            .total {
              background-color: #f0f8ff;
              padding: 20px;
              margin-top: 30px;
              border-radius: 8px;
              text-align: center;
            }
            .total-label {
              font-size: 18px;
              color: #666;
              margin-bottom: 10px;
            }
            .total-value {
              font-size: 36px;
              font-weight: bold;
              color: #0f77c5;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              color: #999;
              font-size: 12px;
              border-top: 1px solid #e9ebef;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">888 CARGO</div>
            <div class="subtitle">Cotización de Envío Internacional</div>
            <div class="badge">${iconoTipo} ${tipoTexto} - ${resultado.destino || 'China'} → Colombia 🇨🇴</div>
          </div>

          <div class="section">
            <div class="section-title">Información del Envío</div>
            <div class="info-row">
              <span class="info-label">Modalidad:</span>
              <span class="info-value">${tipoTexto}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Puerto Destino:</span>
              <span class="info-value">Buenaventura, Colombia</span>
            </div>
            <div class="info-row">
              <span class="info-label">TRM Usado:</span>
              <span class="info-value">$${LOGISTICA_CONFIG.TRM_COP_USD.toLocaleString('es-CO')} COP/USD</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Dimensiones y Peso del Paquete</div>
            <div class="info-row">
              <span class="info-label">Largo:</span>
              <span class="info-value">${payload.largo_cm} cm</span>
            </div>
            <div class="info-row">
              <span class="info-label">Ancho:</span>
              <span class="info-value">${payload.ancho_cm} cm</span>
            </div>
            <div class="info-row">
              <span class="info-label">Alto:</span>
              <span class="info-value">${payload.alto_cm} cm</span>
            </div>
            <div class="info-row">
              <span class="info-label">Peso Real:</span>
              <span class="info-value">${payload.peso_kg} kg</span>
            </div>
            <div class="info-row">
              <span class="info-label">Volumen:</span>
              <span class="info-value">${resultado.volumen_m3} m³</span>
            </div>
          </div>

          ${detalleCalculo ? `
          <div class="calculation-box">
            <div class="section-title">Cálculo Detallado</div>
            ${esMaritimo ? `
            <div class="info-row">
              <span class="info-label">📦 Volumen Real:</span>
              <span class="info-value">${detalleCalculo.volumenReal} m³</span>
            </div>
            <div class="info-row">
              <span class="info-label">📦 Volumen Cobrable:</span>
              <span class="info-value" style="color: #0f77c5; font-weight: bold;">${detalleCalculo.volumenCobrable} m³</span>
            </div>
            <div class="info-row">
              <span class="info-label">⚖️ Peso Real (referencia):</span>
              <span class="info-value">${detalleCalculo.pesoReal} kg</span>
            </div>
            <div class="info-row">
              <span class="info-label">⚖️ Peso Volumétrico (referencia):</span>
              <span class="info-value">${detalleCalculo.pesoVolumetrico} kg</span>
            </div>
            <div class="highlight">
              <div class="highlight-title">💡 Método de Cobro</div>
              <p style="margin: 5px 0;">En marítimo LCL se cobra SIEMPRE por volumen (m³), no por peso. Mínimo: ${LOGISTICA_CONFIG.MINIMO_MARITIMO_M3} m³</p>
            </div>
            ` : `
            <div class="info-row">
              <span class="info-label">📦 Volumen:</span>
              <span class="info-value">${detalleCalculo.volumenReal} m³</span>
            </div>
            <div class="info-row">
              <span class="info-label">⚖️ Peso Real:</span>
              <span class="info-value">${detalleCalculo.pesoReal} kg</span>
            </div>
            <div class="info-row">
              <span class="info-label">📊 Peso Volumétrico:</span>
              <span class="info-value">${detalleCalculo.pesoVolumetrico} kg</span>
            </div>
            <div class="info-row">
              <span class="info-label">💰 Peso Cobrable:</span>
              <span class="info-value" style="color: #0f77c5; font-weight: bold;">${detalleCalculo.pesoCobrable} kg</span>
            </div>
            <div class="highlight">
              <div class="highlight-title">💡 Método de Cobro</div>
              <p style="margin: 5px 0;">Se cobra el mayor entre peso real y volumétrico. Ganador: <strong>${detalleCalculo.gana}</strong></p>
              <p style="margin: 5px 0;">Factor volumétrico: ${detalleCalculo.factorUsado} kg/m³</p>
            </div>
            `}
            <div class="info-row">
              <span class="info-label">Tarifa Base:</span>
              <span class="info-value">$${detalleCalculo.tarifaUSD} ${detalleCalculo.tipoCobro}</span>
            </div>
          </div>
          ` : ''}

          <div class="total">
            <div class="total-label">Costo Total Estimado</div>
            <div class="total-value">${formatearPrecio(resultado.valor_cop)}</div>
            <p style="color: #666; margin-top: 10px; font-size: 14px;">
              (USD $${resultado.valor_usd} × TRM $${LOGISTICA_CONFIG.TRM_COP_USD.toLocaleString('es-CO')})
            </p>
          </div>

          <div class="footer">
            <p>Documento generado el ${new Date().toLocaleDateString('es-CO', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
            <p><strong>888 Cargo</strong> - Soluciones de Transporte Internacional</p>
            <p>www.888cargo.com | contacto@888cargo.com</p>
            <p style="margin-top: 10px; font-size: 10px;">
              ⚠️ Esta cotización es un estimado sujeto a confirmación. Tarifas pueden variar según temporada, peso exacto y servicios adicionales.
            </p>
          </div>
        </body>
        </html>
      `;

      // Generar PDF usando expo-print
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      console.log('✅ [CotizacionService] PDF generado:', uri);

      return {
        success: true,
        pdfUri: uri
      };

    } catch (error) {
      console.error('❌ [CotizacionService] Error generando PDF:', error);
      return {
        success: false,
        error: error.message || 'Error al generar PDF'
      };
    }
  }
}

export default new CotizacionService();