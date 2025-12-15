import { Cotizacion } from '../models/Cotizacion.js';

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
    console.log('📦 [Cotización Marítima] Solicitud recibida:', req.body);
    
    const { largo_cm, ancho_cm, alto_cm, peso_kg, destino = 'China' } = req.body;

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

    const detalleCalculo = {
      pesoReal: peso_kg,
      pesoVolumetrico: pesoVolumetrico.toFixed(2),
      volumenReal: volumen.toFixed(3),
      volumenCobrable: volumenCobrable.toFixed(3),
      tarifaUSD,
      tipoCobro: 'USD/m³',
      factorUsado: LOGISTICA_CONFIG.FACTOR_VOLUMETRICO.MARITIMO,
      gana: 'volumen (m³)',
      explicacion: 'En marítimo LCL se cobra SIEMPRE por volumen'
    };

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
      detalleCalculo,
      timestamp: new Date().toISOString()
    };

    // **NUEVO: Guardar en la base de datos si el usuario está autenticado**
    if (req.userId) {
      try {
        const cotizacionId = await Cotizacion.crear({
          user_id: req.userId,
          tipo: 'maritimo',
          destino,
          largo_cm,
          ancho_cm,
          alto_cm,
          peso_kg,
          volumen_m3: parseFloat(volumen.toFixed(3)),
          peso_volumetrico: parseFloat(pesoVolumetrico.toFixed(2)),
          volumen_cobrable: parseFloat(volumenCobrable.toFixed(3)),
          tarifa_usd: tarifaUSD,
          valor_usd: parseFloat(costoUSD.toFixed(2)),
          valor_cop: costoCOP,
          trm: LOGISTICA_CONFIG.TRM_COP_USD,
          detalle_calculo: detalleCalculo
        });
        resultado.id = cotizacionId;
        console.log(`✅ Cotización guardada con ID: ${cotizacionId}`);
      } catch (dbError) {
        console.error('⚠️ Error guardando cotización en BD:', dbError);
        // No fallar la respuesta, solo loguear
      }
    }

    console.log('✅ [Cotización Marítima] Calculada:', resultado);

    res.json({
      success: true,
      data: resultado
    });

  } catch (error) {
    console.error('❌ [Cotización Marítima] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al calcular cotización marítima',
      error: error.message
    });
  }
};

// Calcular cotización aérea (similar actualización)
export const cotizarAereo = async (req, res) => {
  try {
    console.log('✈️ [Cotización Aérea] Solicitud recibida:', req.body);
    
    const { largo_cm, ancho_cm, alto_cm, peso_kg, destino = 'China' } = req.body;

    if (!largo_cm || !ancho_cm || !alto_cm || !peso_kg) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos'
      });
    }

    const volumen = (largo_cm * ancho_cm * alto_cm) / 1000000;
    const pesoVolumetrico = volumen * LOGISTICA_CONFIG.FACTOR_VOLUMETRICO.AEREO;
    const pesoCobrable = Math.max(peso_kg, pesoVolumetrico, LOGISTICA_CONFIG.MINIMO_AEREO_KG);

    const tarifaDestino = LOGISTICA_CONFIG.TARIFAS_USD.AEREO_KG[destino] || 
                          LOGISTICA_CONFIG.TARIFAS_USD.AEREO_KG.China;
    const tarifaUSD = tarifaDestino.promedio;

    const costoUSD = pesoCobrable * tarifaUSD;
    const costoCOP = Math.round(costoUSD * LOGISTICA_CONFIG.TRM_COP_USD);

    const gana = peso_kg > pesoVolumetrico ? 'peso real' : 'peso volumétrico';

    const detalleCalculo = {
      pesoReal: peso_kg,
      pesoVolumetrico: pesoVolumetrico.toFixed(2),
      pesoCobrable: pesoCobrable.toFixed(2),
      volumenReal: volumen.toFixed(3),
      tarifaUSD,
      tipoCobro: 'USD/kg',
      factorUsado: LOGISTICA_CONFIG.FACTOR_VOLUMETRICO.AEREO,
      gana,
      explicacion: `Se cobra el mayor entre peso real (${peso_kg} kg) y volumétrico (${pesoVolumetrico.toFixed(2)} kg)`
    };

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
      detalleCalculo,
      timestamp: new Date().toISOString()
    };

    // **NUEVO: Guardar en BD**
    if (req.userId) {
      try {
        const cotizacionId = await Cotizacion.crear({
          user_id: req.userId,
          tipo: 'aereo',
          destino,
          largo_cm,
          ancho_cm,
          alto_cm,
          peso_kg,
          volumen_m3: parseFloat(volumen.toFixed(3)),
          peso_volumetrico: parseFloat(pesoVolumetrico.toFixed(2)),
          peso_cobrable: parseFloat(pesoCobrable.toFixed(2)),
          tarifa_usd: tarifaUSD,
          valor_usd: parseFloat(costoUSD.toFixed(2)),
          valor_cop: costoCOP,
          trm: LOGISTICA_CONFIG.TRM_COP_USD,
          detalle_calculo: detalleCalculo
        });
        resultado.id = cotizacionId;
        console.log(`✅ Cotización guardada con ID: ${cotizacionId}`);
      } catch (dbError) {
        console.error('⚠️ Error guardando cotización en BD:', dbError);
      }
    }

    console.log('✅ [Cotización Aérea] Calculada:', resultado);

    res.json({
      success: true,
      data: resultado
    });

  } catch (error) {
    console.error('❌ [Cotización Aérea] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al calcular cotización aérea',
      error: error.message
    });
  }
};

// **NUEVO: Obtener historial de cotizaciones del usuario**
export const obtenerHistorial = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const limit = parseInt(req.query.limit) || 10;
    const cotizaciones = await Cotizacion.obtenerPorUsuario(req.userId, limit);

    // Parsear detalle_calculo de JSON string a objeto
    const cotizacionesFormateadas = cotizaciones.map(c => ({
      ...c,
      detalleCalculo: JSON.parse(c.detalle_calculo || '{}')
    }));

    res.json({
      success: true,
      data: cotizacionesFormateadas
    });

  } catch (error) {
    console.error('❌ Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de cotizaciones',
      error: error.message
    });
  }
};

// **NUEVO: Eliminar cotización**
export const eliminarCotizacion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const cotizacion = await Cotizacion.obtenerPorId(id);
    
    if (!cotizacion) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }

    if (cotizacion.user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta cotización'
      });
    }

    await Cotizacion.eliminar(id);

    res.json({
      success: true,
      message: 'Cotización eliminada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando cotización:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar cotización',
      error: error.message
    });
  }
};