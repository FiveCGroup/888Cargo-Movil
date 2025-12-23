// ==========================================
// 888CARGO MOBILE - SERVICIO DE COTIZACIONES
// ==========================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import { Platform } from 'react-native';
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
      console.log('📡 [CotizacionService] Respuesta del backend:', response);

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
      
      const { tipo, payload, resultado, detalleCalculo, user } = cotizacionData;
      const userName = (user && (user.name || user.username || user.email)) || 'Usuario';
      
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

      // HTML del PDF (mejorado para todas las plataformas)
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Cotización - ${userName}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            @page { margin: 12mm; }
            html, body {
              font-family: 'Helvetica', 'Arial', sans-serif;
              font-size: 14px;
              line-height: 1.6;
              color: #2c3e50;
              background-color: #ffffff;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
            }
            .page {
              box-sizing: border-box;
              padding: 18px 24px;
              max-width: 800px;
              margin: 0 auto;
            }
            
            .container {
              background: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            
            .header {
              background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
              color: white;
              padding: 22px 24px;
              text-align: left;
              position: relative;
              border-radius: 8px 8px 0 0;
            }
            
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="30" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="60" cy="70" r="1.5" fill="rgba(255,255,255,0.1)"/></svg>') repeat;
              opacity: 0.3;
            }
            
            .logo {
              font-size: 20px;
              font-weight: 800;
              margin-bottom: 4px;
              letter-spacing: 1px;
              display: inline-block;
            }

            .subtitle {
              font-size: 13px;
              opacity: 0.95;
              margin-top: 6px;
            }
            
            .badge {
              display: inline-block;
              padding: 10px 20px;
              background: rgba(255,255,255,0.2);
              border-radius: 25px;
              font-weight: 600;
              font-size: 14px;
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255,255,255,0.3);
            }
            
            .content {
              padding: 18px 0 0 0;
            }
            
            .section {
              margin-bottom: 18px;
              page-break-inside: avoid;
            }
            
            .section-title {
              font-size: 22px;
              font-weight: bold;
              color: #1e3a8a;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 3px solid #3b82f6;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            
            .section-title::before {
              content: '';
              width: 6px;
              height: 22px;
              background: #3b82f6;
              border-radius: 3px;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px 24px;
              margin-bottom: 12px;
            }

            .info-item {
              background: #fbfdff;
              padding: 10px 12px;
              border-radius: 8px;
              border: 1px solid #eef4fb;
            }

            .info-label { font-size: 12px; color: #64748b; font-weight: 600; }
            .info-value { font-size: 14px; color: #0f1724; font-weight: 700; margin-top: 6px; }
            
            .highlight-box {
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              border: 1px solid #f59e0b;
              border-radius: 12px;
              padding: 20px;
              margin: 25px 0;
              position: relative;
            }
            
            .highlight-box::before {
              content: '💡';
              position: absolute;
              top: -15px;
              left: 20px;
              background: white;
              border-radius: 50%;
              width: 30px;
              height: 30px;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid #f59e0b;
              font-size: 16px;
            }
            
            .highlight-title {
              font-weight: bold;
              color: #92400e;
              margin-bottom: 10px;
              font-size: 16px;
            }
            
            .calculation-table {
              background: #ffffff;
              border: 1px solid #e6eef8;
              border-radius: 8px;
              padding: 12px;
              margin: 12px 0;
            }
            
            .calc-title {
              font-size: 18px;
              font-weight: bold;
              color: #1e3a8a;
              margin-bottom: 15px;
              text-align: center;
            }
            
            .calc-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
            
            .calc-item {
              background: white;
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid #3b82f6;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            
            .calc-label {
              font-size: 12px;
              color: #64748b;
              margin-bottom: 5px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .calc-value {
              font-size: 16px;
              font-weight: bold;
              color: #1e293b;
            }
            
            .total-section {
              background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
              color: white;
              padding: 18px;
              text-align: center;
              margin-top: 12px;
              border-radius: 6px;
            }
            
            .total-section::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="0.5" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="0.3" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.4" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            }
            
            .total-label {
              font-size: 18px;
              opacity: 0.9;
              margin-bottom: 15px;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            
            .total-amount {
              font-size: 48px;
              font-weight: bold;
              margin-bottom: 10px;
              text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            
            .total-subtitle {
              font-size: 14px;
              opacity: 0.8;
              background: rgba(255,255,255,0.1);
              padding: 10px 20px;
              border-radius: 20px;
              display: inline-block;
              backdrop-filter: blur(10px);
            }
            
            .footer {
              background: #f8fafc;
              padding: 12px 14px;
              margin-top: 12px;
              text-align: center;
              border-top: 1px solid #e9eef6;
              border-radius: 0 0 8px 8px;
            }
            
            .footer-content {
              max-width: 600px;
              margin: 0 auto;
            }
            
            .footer-title {
              font-size: 16px;
              font-weight: bold;
              color: #1e3a8a;
              margin-bottom: 15px;
            }
            
            .footer-text {
              color: #64748b;
              margin-bottom: 10px;
              font-size: 13px;
            }
            
            .footer-contact {
              background: white;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              border: 1px solid #e2e8f0;
            }
            
            .footer-warning {
              background: #fef2f2;
              border: 1px solid #fecaca;
              border-radius: 8px;
              padding: 15px;
              margin-top: 20px;
              font-size: 12px;
              color: #dc2626;
              text-align: left;
            }
            
            .footer-warning::before {
              content: '⚠️';
              margin-right: 8px;
              font-size: 14px;
            }
            
            @media print {
              @page { margin: 12mm; }
              html, body { margin: 0; padding: 0; }
              .page { padding: 6mm; }
              .header, .footer { -webkit-print-color-adjust: exact; }
            }
              
              .container {
                box-shadow: none;
                border-radius: 0;
              }
              
              .header {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
                background: #1e3a8a !important;
              }
              
              .total-section {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
                background: #1e3a8a !important;
              }
              
              .highlight-box {
                break-inside: avoid;
              }
              
              .calculation-table {
                break-inside: avoid;
              }
              
              .section {
                break-inside: avoid;
              }
            }
            
            @media (max-width: 768px) {
              .header {
                padding: 25px 20px;
              }
              
              .content {
                padding: 25px 20px;
              }
              
              .logo {
                font-size: 32px;
              }
              
              .section-title {
                font-size: 20px;
              }
              
              .calc-grid {
                grid-template-columns: 1fr;
                gap: 12px;
              }
              
              .total-amount {
                font-size: 42px;
              }
              
              .info-cell {
                padding: 10px 12px;
              }
              
              .info-label {
                min-width: 130px;
                font-size: 13px;
              }
              
              .info-value {
                font-size: 13px;
              }
            }
            
            @media (max-width: 480px) {
              body {
                padding: 5px;
              }
              
              .header {
                padding: 20px 15px;
              }
              
              .content {
                padding: 20px 15px;
              }
              
              .logo {
                font-size: 28px;
                letter-spacing: 1px;
              }
              
              .subtitle {
                font-size: 14px;
              }
              
              .badge {
                padding: 8px 16px;
                font-size: 13px;
              }
              
              .section-title {
                font-size: 18px;
                margin-bottom: 15px;
              }
              
              .section-title::before {
                width: 4px;
                height: 18px;
              }
              
              .info-cell {
                padding: 8px 10px;
              }
              
              .info-label {
                min-width: 120px;
                font-size: 12px;
              }
              
              .info-value {
                font-size: 12px;
              }
              
              .calc-item {
                padding: 12px;
              }
              
              .calc-label {
                font-size: 11px;
              }
              
              .calc-value {
                font-size: 14px;
              }
              
              .total-section {
                padding: 30px 20px;
              }
              
              .total-amount {
                font-size: 36px;
              }
              
              .total-subtitle {
                font-size: 12px;
                padding: 8px 16px;
              }
              
              .footer {
                padding: 20px 15px;
                margin: 0 -15px -20px -15px;
              }
              
              .footer-contact {
                padding: 12px;
              }
              
              .footer-text {
                font-size: 12px;
              }
              
              .footer-warning {
                padding: 12px;
                font-size: 11px;
              }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <div>
                <div class="logo">888 CARGO</div>
                <div class="subtitle">Cotización para: ${userName}</div>
              </div>
              <div style="float:right; text-align:right; color: rgba(255,255,255,0.95); font-weight:700; font-size:12px;">${iconoTipo} ${tipoTexto}</div>
            </div>

            <div class="content">
              <div class="section">
                <div class="section-title">📍 Información del Envío</div>
                <div class="info-grid">
                  <div class="info-item"><div class="info-label">Modalidad</div><div class="info-value">${tipoTexto}</div></div>
                  <div class="info-item"><div class="info-label">Origen</div><div class="info-value">${resultado.destino || 'China'}</div></div>
                  <div class="info-item"><div class="info-label">Destino</div><div class="info-value">Buenaventura, Colombia</div></div>
                  <div class="info-item"><div class="info-label">TRM</div><div class="info-value">$${LOGISTICA_CONFIG.TRM_COP_USD.toLocaleString('es-CO')}</div></div>
                  <div class="info-item"><div class="info-label">Fecha</div><div class="info-value">${new Date().toLocaleDateString('es-CO')}</div></div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">📦 Dimensiones y Características</div>
                <div class="info-grid">
                  <div class="info-item"><div class="info-label">Largo</div><div class="info-value">${payload.largo_cm} cm</div></div>
                  <div class="info-item"><div class="info-label">Ancho</div><div class="info-value">${payload.ancho_cm} cm</div></div>
                  <div class="info-item"><div class="info-label">Alto</div><div class="info-value">${payload.alto_cm} cm</div></div>
                  <div class="info-item"><div class="info-label">Peso (kg)</div><div class="info-value">${payload.peso_kg} kg</div></div>
                  <div class="info-item"><div class="info-label">Volumen</div><div class="info-value">${resultado.volumen_m3} m³</div></div>
                </div>
              </div>

              ${detalleCalculo ? `
              <div class="calculation-table">
                <div class="calc-title">🔍 Cálculo Detallado del Costo</div>
                <div class="calc-grid">
                  ${esMaritimo ? `
                  <div class="calc-item">
                    <div class="calc-label">Volumen Real</div>
                    <div class="calc-value">${detalleCalculo.volumenReal} m³</div>
                  </div>
                  <div class="calc-item">
                    <div class="calc-label">Volumen Mínimo</div>
                    <div class="calc-value">${LOGISTICA_CONFIG.MINIMO_MARITIMO_M3} m³</div>
                  </div>
                  <div class="calc-item">
                    <div class="calc-label">Volumen Cobrable</div>
                    <div class="calc-value" style="color: #1e3a8a; font-size: 18px;">${detalleCalculo.volumenCobrable} m³</div>
                  </div>
                  <div class="calc-item">
                    <div class="calc-label">Peso Volumétrico</div>
                    <div class="calc-value">${detalleCalculo.pesoVolumetrico} kg</div>
                  </div>
                  ` : `
                  <div class="calc-item">
                    <div class="calc-label">Peso Real</div>
                    <div class="calc-value">${detalleCalculo.pesoReal} kg</div>
                  </div>
                  <div class="calc-item">
                    <div class="calc-label">Peso Volumétrico</div>
                    <div class="calc-value">${detalleCalculo.pesoVolumetrico} kg</div>
                  </div>
                  <div class="calc-item">
                    <div class="calc-label">Peso Mínimo</div>
                    <div class="calc-value">${LOGISTICA_CONFIG.MINIMO_AEREO_KG} kg</div>
                  </div>
                  <div class="calc-item">
                    <div class="calc-label">Peso Cobrable</div>
                    <div class="calc-value" style="color: #1e3a8a; font-size: 18px;">${detalleCalculo.pesoCobrable} kg</div>
                  </div>
                  `}
                  <div class="calc-item">
                    <div class="calc-label">Tarifa Aplicada</div>
                    <div class="calc-value">$${detalleCalculo.tarifaUSD} USD/${detalleCalculo.tipoCobro}</div>
                  </div>
                  <div class="calc-item">
                    <div class="calc-label">Factor Volumétrico</div>
                    <div class="calc-value">${detalleCalculo.factorUsado} kg/m³</div>
                  </div>
                </div>
                
                <div class="highlight-box">
                  <div class="highlight-title">💡 Método de Cobro Aplicado</div>
                  <p style="margin: 8px 0; color: #92400e;">
                    ${esMaritimo 
                      ? `En transporte marítimo LCL se cobra SIEMPRE por volumen (m³), independientemente del peso real.`
                      : `En transporte aéreo se cobra el mayor valor entre peso real y peso volumétrico. En este caso gana: <strong>${detalleCalculo.gana}</strong>`
                    }
                  </p>
                  <p style="margin: 8px 0; font-size: 13px; color: #92400e;">
                    ${esMaritimo 
                      ? `Factor volumétrico: ${detalleCalculo.factorUsado} kg/m³`
                      : `Fórmula: Peso cobrable = MAX(peso real, peso volumétrico, ${LOGISTICA_CONFIG.MINIMO_AEREO_KG}kg)`
                    }
                  </p>
                </div>
              </div>
              ` : ''}

              <div class="total-section">
                <div class="total-label">COSTO TOTAL ESTIMADO</div>
                <div class="total-amount">${formatearPrecio(resultado.valor_cop)}</div>
                <div class="total-subtitle">
                  Equivalente a USD $${resultado.valor_usd} × TRM $${LOGISTICA_CONFIG.TRM_COP_USD.toLocaleString('es-CO')}
                </div>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-content">
                <div class="footer-title">888 CARGO - Tu Socio en Logística Internacional</div>
                <div class="footer-contact">
                  <div class="footer-text">📧 contacto@888cargo.com</div>
                  <div class="footer-text">🌐 www.888cargo.com</div>
                  <div class="footer-text">📱 WhatsApp: +57 321 706 1517</div>
                  <div class="footer-text">📍 Colombia - Internacional</div>
                </div>
                <div class="footer-text" style="margin-top: 15px; font-style: italic;">
                  Documento generado el ${new Date().toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div class="footer-warning">
                  <strong>IMPORTANTE:</strong> Esta cotización es un estimado basado en la información proporcionada y está sujeta a verificación. 
                  Los precios pueden variar según temporada, peso exacto verificado, servicios adicionales requeridos y condiciones del mercado. 
                  Para cotización definitiva, contacte a nuestro equipo comercial.
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // Generar PDF usando expo-print con fallback
      let uri;
      try {
        // En web evitamos usar Print.printToFileAsync porque en muchos navegadores
        // abre el diálogo de impresión de la página actual (incluye navbar/localhost).
        // En su lugar creamos un Blob HTML y devolvemos su URL para descarga/visualización.
        if (Platform.OS === 'web') {
          try {
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const blobUrl = URL.createObjectURL(blob);
            console.log('📄 [CotizacionService] Generado HTML blob para web:', blobUrl);
            return { success: true, pdfUri: blobUrl, isHtml: true };
          } catch (webErr) {
            console.warn('⚠️ [CotizacionService] No se pudo generar blob en web:', webErr);
            // seguir al flujo nativo como fallback
          }
        }

        const printResult = await Print.printToFileAsync({
          html: htmlContent,
          base64: true // solicitar base64 para permitir descarga limpia en web/móviles compatibles
        });

        console.log('📄 [CotizacionService] Resultado de printToFileAsync:', printResult);

        // Preparar encoding seguros (expo-file-system puede no exponer EncodingType en web)
        const ENCODING = {
          Base64: FileSystem.EncodingType ? FileSystem.EncodingType.Base64 : 'base64',
          UTF8: FileSystem.EncodingType ? FileSystem.EncodingType.UTF8 : 'utf8'
        };

        // Si devuelve base64, crear data uri; también puede devolver uri en plataformas nativas
        if (printResult && printResult.base64) {
          uri = printResult.uri || null;
          const base64 = printResult.base64;
          console.log('📄 [CotizacionService] PDF generado (base64) longitud:', base64.length);

          // Guardar temporalmente el base64 en un archivo local cuando sea posible
          try {
            const tmpName = `Cotizacion_raw_${Date.now()}.pdf`;
            const tmpUri = FileSystem.documentDirectory + tmpName;
            await FileSystem.writeAsStringAsync(tmpUri, base64, { encoding: ENCODING.Base64 });
            uri = tmpUri;
          } catch (writeErr) {
            console.warn('⚠️ [CotizacionService] No se pudo escribir base64 a archivo temporal:', writeErr);
          }

          // Devolver tanto uri (si existe), como base64 para web
          return { success: true, pdfUri: uri, pdfBase64: base64, isBase64: true };
        }

        if (!printResult || !printResult.uri) {
          throw new Error('printToFileAsync no devolvió URI válida');
        }

        uri = printResult.uri;
      } catch (printError) {
        console.warn('⚠️ [CotizacionService] printToFileAsync falló, intentando método alternativo:', printError);
        
        // Método alternativo: crear archivo HTML y usar sharing
        try {
          const ENCODING = {
            Base64: FileSystem.EncodingType ? FileSystem.EncodingType.Base64 : 'base64',
            UTF8: FileSystem.EncodingType ? FileSystem.EncodingType.UTF8 : 'utf8'
          };

          // Si estamos en web, intentar crear blob/abrir en nueva pestaña
          if (Platform.OS === 'web') {
            try {
              const blob = new Blob([htmlContent], { type: 'text/html' });
              const blobUrl = URL.createObjectURL(blob);
              console.log('📄 [CotizacionService] Archivo HTML (blob) creado como alternativa en web:', blobUrl);
              return { success: true, pdfUri: blobUrl, isHtml: true };
            } catch (webFallbackErr) {
              console.warn('⚠️ [CotizacionService] No se pudo crear blob en fallback web:', webFallbackErr);
            }
          }

          const safeUser = userName.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '_');
          const fileName = `Cotizacion_${safeUser}_${Date.now()}.html`;
          const fileUri = FileSystem.documentDirectory + fileName;
          
          await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
            encoding: ENCODING.UTF8,
          });
          
          uri = fileUri;
          console.log('✅ [CotizacionService] Archivo HTML creado como alternativa:', uri);
        } catch (fallbackError) {
          console.error('❌ [CotizacionService] Método alternativo también falló:', fallbackError);
          throw new Error('No se pudo generar el archivo de cotización');
        }
      }

      // Intentar mover/renombrar el archivo a un nombre más amigable que incluya el usuario
      try {
        const extension = uri.split('.').pop();
        const safeUser = userName.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '_');
        const destName = `Cotizacion_${safeUser}.${extension}`;
        const destUri = FileSystem.documentDirectory + destName;

        // Si el destino ya existe, añadir timestamp
        let finalDest = destUri;
        try {
          const stat = await FileSystem.getInfoAsync(finalDest);
          if (stat.exists) {
            finalDest = FileSystem.documentDirectory + `Cotizacion_${safeUser}_${Date.now()}.${extension}`;
          }
        } catch (e) {
          // ignore
        }

        // Mover o copiar según disponibilidad
        try {
          await FileSystem.moveAsync({ from: uri, to: finalDest });
          uri = finalDest;
        } catch (moveErr) {
          // En algunos entornos no se permite mover: intentar copiar el contenido y escribir
          try {
            const content = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
            await FileSystem.writeAsStringAsync(finalDest, content, { encoding: FileSystem.EncodingType.Base64 });
            uri = finalDest;
          } catch (copyErr) {
            console.warn('⚠️ [CotizacionService] No se pudo renombrar archivo, se devolverá URI original', copyErr);
          }
        }
      } catch (renameErr) {
        console.warn('⚠️ [CotizacionService] Error al renombrar PDF:', renameErr);
      }

      console.log('✅ [CotizacionService] PDF/HTML generado:', uri);

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