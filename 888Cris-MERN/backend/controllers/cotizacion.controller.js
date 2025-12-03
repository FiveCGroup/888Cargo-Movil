// Configuración de logística (misma que en el frontend)
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

// Calcular cotización marítima
export const cotizarMaritimo = async (req, res) => {
  try {
    const { largo_cm, ancho_cm, alto_cm, peso_kg, destino = 'Colombia' } = req.body;

    // Validaciones
    if (!largo_cm || !ancho_cm || !alto_cm || !peso_kg) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos: largo_cm, ancho_cm, alto_cm, peso_kg'
      });
    }

    // Calcular volumen en m³
    const volumen = (largo_cm * ancho_cm * alto_cm) / 1000000;

    // MARÍTIMO: Se cobra por volumen (mínimo 1 m³)
    const volumenCobrable = Math.max(volumen, LOGISTICA_CONFIG.MINIMO_MARITIMO_M3);
    const pesoVolumetrico = volumen * LOGISTICA_CONFIG.FACTOR_VOLUMETRICO.MARITIMO;

    // Obtener tarifa según destino
    const tarifaDestino = LOGISTICA_CONFIG.TARIFAS_USD.MARITIMO_LCL[destino] || 
                          LOGISTICA_CONFIG.TARIFAS_USD.MARITIMO_LCL.China;
    const tarifaUSD = tarifaDestino.promedio;

    // Calcular costo
    const costoUSD = volumenCobrable * tarifaUSD;
    const costoCOP = Math.round(costoUSD * LOGISTICA_CONFIG.TRM_COP_USD);

    const resultado = {
      tipo: 'maritimo',
      destino,
      volumen_m3: volumen.toFixed(3),
      volumen_cobrable: volumenCobrable.toFixed(3),
      peso_kg: peso_kg,
      peso_volumetrico: pesoVolumetrico.toFixed(2),
      tarifa_usd_m3: tarifaUSD,
      valor_usd: costoUSD.toFixed(2),
      valor_cop: costoCOP,
      trm: LOGISTICA_CONFIG.TRM_COP_USD,
      detalleCalculo: {
        pesoReal: peso_kg,
        pesoVolumetrico: pesoVolumetrico.toFixed(2),
        volumenReal: volumen.toFixed(3),
        volumenCobrable: volumenCobrable.toFixed(3),
        tarifaUSD,
        tipoCobro: 'USD/m³',
        factorUsado: LOGISTICA_CONFIG.FACTOR_VOLUMETRICO.MARITIMO,
        gana: 'volumen (m³)',
        explicacion: 'En marítimo LCL se cobra SIEMPRE por volumen'
      },
      timestamp: new Date().toISOString()
    };

    console.log('✅ Cotización marítima calculada:', resultado);

    res.json({
      success: true,
      data: resultado
    });

  } catch (error) {
    console.error('❌ Error en cotización marítima:', error);
    res.status(500).json({
      success: false,
      message: 'Error al calcular cotización marítima',
      error: error.message
    });
  }
};

// Calcular cotización aérea
export const cotizarAereo = async (req, res) => {
  try {
    const { largo_cm, ancho_cm, alto_cm, peso_kg, destino = 'Colombia' } = req.body;

    // Validaciones
    if (!largo_cm || !ancho_cm || !alto_cm || !peso_kg) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos: largo_cm, ancho_cm, alto_cm, peso_kg'
      });
    }

    // Calcular volumen en m³
    const volumen = (largo_cm * ancho_cm * alto_cm) / 1000000;

    // AÉREO: Se cobra por peso cobrable (mayor entre real y volumétrico)
    const pesoVolumetrico = volumen * LOGISTICA_CONFIG.FACTOR_VOLUMETRICO.AEREO;
    const pesoCobrable = Math.max(peso_kg, pesoVolumetrico, LOGISTICA_CONFIG.MINIMO_AEREO_KG);

    // Obtener tarifa según destino
    const tarifaDestino = LOGISTICA_CONFIG.TARIFAS_USD.AEREO_KG[destino] || 
                          LOGISTICA_CONFIG.TARIFAS_USD.AEREO_KG.China;
    const tarifaUSD = tarifaDestino.promedio;

    // Calcular costo
    const costoUSD = pesoCobrable * tarifaUSD;
    const costoCOP = Math.round(costoUSD * LOGISTICA_CONFIG.TRM_COP_USD);

    const gana = peso_kg > pesoVolumetrico ? 'peso real' : 'peso volumétrico';

    const resultado = {
      tipo: 'aereo',
      destino,
      volumen_m3: volumen.toFixed(3),
      peso_kg: peso_kg,
      peso_volumetrico: pesoVolumetrico.toFixed(2),
      peso_cobrable: pesoCobrable.toFixed(2),
      tarifa_usd_kg: tarifaUSD,
      valor_usd: costoUSD.toFixed(2),
      valor_cop: costoCOP,
      trm: LOGISTICA_CONFIG.TRM_COP_USD,
      detalleCalculo: {
        pesoReal: peso_kg,
        pesoVolumetrico: pesoVolumetrico.toFixed(2),
        pesoCobrable: pesoCobrable.toFixed(2),
        volumenReal: volumen.toFixed(3),
        tarifaUSD,
        tipoCobro: 'USD/kg',
        factorUsado: LOGISTICA_CONFIG.FACTOR_VOLUMETRICO.AEREO,
        gana,
        explicacion: `Se cobra el mayor entre peso real (${peso_kg} kg) y volumétrico (${pesoVolumetrico.toFixed(2)} kg)`
      },
      timestamp: new Date().toISOString()
    };

    console.log('✅ Cotización aérea calculada:', resultado);

    res.json({
      success: true,
      data: resultado
    });

  } catch (error) {
    console.error('❌ Error en cotización aérea:', error);
    res.status(500).json({
      success: false,
      message: 'Error al calcular cotización aérea',
      error: error.message
    });
  }
};