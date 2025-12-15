import API from './api';

// Configuración de logística (igual que móvil)
const LOGISTICA_CONFIG = {
  FACTOR_VOLUMETRICO: {
    MARITIMO: 1000,
    AEREO: 167,
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

// Cálculo local (fallback)
function calcularCotizacionLocal(tipo, payload, destino = 'China') {
  const volumen = (payload.largo_cm * payload.ancho_cm * payload.alto_cm) / 1000000;
  const peso = payload.peso_kg;
  
  let costoUSD = 0;
  let detalleCalculo = {};

  if (tipo === 'maritimo') {
    const volumenCobrable = Math.max(volumen, LOGISTICA_CONFIG.MINIMO_MARITIMO_M3);
    const pesoVolumetrico = volumen * LOGISTICA_CONFIG.FACTOR_VOLUMETRICO.MARITIMO;
    const tarifaDestino = LOGISTICA_CONFIG.TARIFAS_USD.MARITIMO_LCL[destino] || LOGISTICA_CONFIG.TARIFAS_USD.MARITIMO_LCL.China;
    const tarifaUSD = tarifaDestino.promedio;
    
    costoUSD = volumenCobrable * tarifaUSD;
    
    detalleCalculo = {
      pesoReal: peso,
      pesoVolumetrico: pesoVolumetrico.toFixed(2),
      volumenReal: volumen.toFixed(3),
      volumenCobrable: volumenCobrable.toFixed(3),
      tarifaUSD,
      tipoCobro: 'USD/m³',
      factorUsado: LOGISTICA_CONFIG.FACTOR_VOLUMETRICO.MARITIMO,
      gana: 'volumen (m³)',
      explicacion: 'En marítimo LCL se cobra SIEMPRE por volumen'
    };
  } else {
    const pesoVolumetrico = volumen * LOGISTICA_CONFIG.FACTOR_VOLUMETRICO.AEREO;
    const pesoCobrable = Math.max(peso, pesoVolumetrico, LOGISTICA_CONFIG.MINIMO_AEREO_KG);
    const tarifaDestino = LOGISTICA_CONFIG.TARIFAS_USD.AEREO_KG[destino] || LOGISTICA_CONFIG.TARIFAS_USD.AEREO_KG.China;
    const tarifaUSD = tarifaDestino.promedio;
    
    costoUSD = pesoCobrable * tarifaUSD;
    const gana = peso > pesoVolumetrico ? 'peso real' : 'peso volumétrico';
    
    detalleCalculo = {
      pesoReal: peso,
      pesoVolumetrico: pesoVolumetrico.toFixed(2),
      pesoCobrable: pesoCobrable.toFixed(2),
      volumenReal: volumen.toFixed(3),
      tarifaUSD,
      tipoCobro: 'USD/kg',
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
    trm: LOGISTICA_CONFIG.TRM_COP_USD,
    tiempo_estimado: tipo === 'maritimo' ? '25-35 días' : '3-7 días'
  };
}

class CotizacionService {
  
  async cotizarMaritimo(datos) {
    try {
      const payload = {
        peso_kg: datos.peso,
        largo_cm: datos.largo,
        ancho_cm: datos.ancho,
        alto_cm: datos.alto,
        destino: datos.destino
      };

      const response = await API.post('/api/cotizaciones/maritimo', payload);
      
      if (response.data && response.data.success) {
        return response.data;
      }
      
      throw new Error('Respuesta inválida');
    } catch {
      console.warn('⚠️ Usando cálculo local para marítimo');
      const resultado = calcularCotizacionLocal('maritimo', {
        peso_kg: datos.peso,
        largo_cm: datos.largo,
        ancho_cm: datos.ancho,
        alto_cm: datos.alto
      }, datos.destino);
      
      return { success: true, data: resultado, isLocal: true };
    }
  }

  async cotizarAereo(datos) {
    try {
      const payload = {
        peso_kg: datos.peso,
        largo_cm: datos.largo,
        ancho_cm: datos.ancho,
        alto_cm: datos.alto,
        destino: datos.destino
      };

      const response = await API.post('/api/cotizaciones/aereo', payload);
      
      if (response.data && response.data.success) {
        return response.data;
      }
      
      throw new Error('Respuesta inválida');
    } catch {
      console.warn('⚠️ Usando cálculo local para aéreo');
      const resultado = calcularCotizacionLocal('aereo', {
        peso_kg: datos.peso,
        largo_cm: datos.largo,
        ancho_cm: datos.ancho,
        alto_cm: datos.alto
      }, datos.destino);
      
      return { success: true, data: resultado, isLocal: true };
    }
  }

  getConfig() {
    return LOGISTICA_CONFIG;
  }
}

export default new CotizacionService();