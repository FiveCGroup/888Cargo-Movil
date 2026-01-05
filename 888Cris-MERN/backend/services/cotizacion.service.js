const LOGISTICA_CONFIG = {
  FACTOR_VOLUMETRICO: { MARITIMO: 1000, AEREO: 167 },
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

function normalizeInput(payload) {
  return {
    largo_cm: payload.largo_cm ?? payload.largo ?? 0,
    ancho_cm: payload.ancho_cm ?? payload.ancho ?? 0,
    alto_cm: payload.alto_cm ?? payload.alto ?? 0,
    peso_kg: payload.peso_kg ?? payload.peso ?? 0,
    destino: payload.destino ?? 'China'
  };
}

export const calcularMaritimo = (payload) => {
  const peso = Number(payload.peso_kg ?? payload.peso ?? 0);
  const volumen = Number(payload.volumen_m3 ?? 0) || (
    Number(payload.largo_cm || 0) *
    Number(payload.ancho_cm || 0) *
    Number(payload.alto_cm || 0)
  ) / 1000000;

  const destino = payload.destino || 'China';
  const cfg = LOGISTICA_CONFIG;

  const volumenReal = Number(volumen.toFixed(3));
  const volumenCobrable = Math.max(volumenReal, cfg.MINIMO_MARITIMO_M3);
  const pesoVolumetrico = Number((volumenReal * cfg.FACTOR_VOLUMETRICO.MARITIMO).toFixed(2));
  const tarifaObj = cfg.TARIFAS_USD.MARITIMO_LCL[destino] || cfg.TARIFAS_USD.MARITIMO_LCL.China;
  const tarifaUSD = tarifaObj.promedio;

  // Opción A: solo volumen (considera FCL si aplica)
  let costoPorVolumenUSD = volumenCobrable * tarifaUSD;
  let costoFclUSD = null;
  if (volumenReal >= cfg.CAPACIDAD_CONTENEDOR_M3) {
    const descuentoFcl = 0.30;
    costoFclUSD = (tarifaUSD * cfg.CAPACIDAD_CONTENEDOR_M3) * (1 - descuentoFcl);
    if (costoFclUSD < costoPorVolumenUSD) costoPorVolumenUSD = costoFclUSD;
  }

  // Opción B: volumen + peso (añade componente por peso)
  const factorPesoUSD = 0.10; // configurable
  const costoPorPesoUSD = Number((peso * factorPesoUSD).toFixed(2));
  const costoVolumenMasPesoUSD = Number(((volumenCobrable * tarifaUSD) + costoPorPesoUSD).toFixed(2));

  // Selección: mayor de ambas opciones
  const baseSeleccionadaUSD = Math.max(costoPorVolumenUSD, costoVolumenMasPesoUSD);
  const elegido = costoPorVolumenUSD >= costoVolumenMasPesoUSD ? 'volumen' : 'volumen+peso';

  // Cargos adicionales
  const porcentajeSeguro = 0.005;
  const cargoHandlingUSD = 20;
  const cargoDocsUSD = 10;
  const seguroUSD = Number((baseSeleccionadaUSD * porcentajeSeguro).toFixed(2));
  const totalUSD = Number((baseSeleccionadaUSD + seguroUSD + cargoHandlingUSD + cargoDocsUSD).toFixed(2));
  const totalCOP = Math.round(totalUSD * cfg.TRM_COP_USD);

  const detalleCalculo = {
    volumenReal,
    volumenCobrable: Number(volumenCobrable.toFixed(3)),
    pesoReal: Number(peso.toFixed(2)),
    pesoVolumetrico,
    tarifaUSD,
    tipoCobro: 'USD/m³',
    factorUsado: cfg.FACTOR_VOLUMETRICO.MARITIMO,
    costoPorVolumenUSD: Number(costoPorVolumenUSD.toFixed(2)),
    costoPorVolumenMasPesoUSD: Number(costoVolumenMasPesoUSD.toFixed(2)),
    costoPorPesoUSD,
    elegido,
    cargos: {
      seguroUSD,
      handlingUSD: cargoHandlingUSD,
      docsUSD: cargoDocsUSD,
      fclApplied: costoFclUSD != null && costoFclUSD < (volumenReal * tarifaUSD)
    },
    explicacion: elegido === 'volumen'
      ? 'Se eligió la opción por volumen (mayor o igual).'
      : 'Se eligió la opción volumen + peso (mayor).'
  };

  return {
    volumen_m3: Number(volumenReal.toFixed(3)),
    peso_kg: Number(peso.toFixed(2)),
    valor_usd: totalUSD,
    valor_cop: totalCOP,
    detalleCalculo,
    destino,
    tipo: 'maritimo',
    trm: cfg.TRM_COP_USD,
    tiempo_estimado: '25-35 días'
  };
};

export const calcularAereo = (payload) => {
  const { largo_cm, ancho_cm, alto_cm, peso_kg, destino } = normalizeInput(payload);
  const volumen = (largo_cm * ancho_cm * alto_cm) / 1000000;
  const pesoVolumetrico = volumen * LOGISTICA_CONFIG.FACTOR_VOLUMETRICO.AEREO;
  const pesoCobrable = Math.max(peso_kg, pesoVolumetrico, LOGISTICA_CONFIG.MINIMO_AEREO_KG);
  const tarifaDestino = LOGISTICA_CONFIG.TARIFAS_USD.AEREO_KG[destino] || LOGISTICA_CONFIG.TARIFAS_USD.AEREO_KG.China;
  const tarifaUSD = tarifaDestino.promedio;
  const costoUSD = pesoCobrable * tarifaUSD;
  const costoCOP = Math.round(costoUSD * LOGISTICA_CONFIG.TRM_COP_USD);
  const gana = peso_kg > pesoVolumetrico ? 'peso real' : 'peso volumétrico';

  const detalleCalculo = {
    pesoReal: peso_kg,
    pesoVolumetrico: Number(pesoVolumetrico.toFixed(2)),
    pesoCobrable: Number(pesoCobrable.toFixed(2)),
    volumenReal: Number(volumen.toFixed(3)),
    tarifaUSD,
    tipoCobro: 'USD/kg',
    factorUsado: LOGISTICA_CONFIG.FACTOR_VOLUMETRICO.AEREO,
    gana,
    explicacion: `Se cobra el mayor entre peso real (${peso_kg} kg) y volumétrico (${pesoVolumetrico.toFixed(2)} kg)`
  };

  return {
    volumen_m3: Number(volumen.toFixed(3)),
    peso_kg,
    valor_usd: Number(costoUSD.toFixed(2)),
    valor_cop: costoCOP,
    detalleCalculo,
    destino,
    trm: LOGISTICA_CONFIG.TRM_COP_USD,
    tiempo_estimado: '3-7 días'
  };
};

// Persistencia: intenta usar un modelo si existe, pero no rompe si no
const tryGetModel = () => {
  try {
    const mod = require('../models/Cotizacion.js'); // may throw
    return mod && (mod.default || mod);
  } catch (e) {
    return null;
  }
};

export const guardarCotizacion = async (userId, resultado) => {
  const Model = tryGetModel();
  if (!Model) {
    // no hay modelo; solo devuelve null para mantener compatibilidad
    return null;
  }
  // adaptar según la API de tu modelo/ORM
  if (typeof Model.create === 'function') {
    return Model.create({
      user_id: userId,
      detalle_calculo: JSON.stringify(resultado.detalleCalculo || {}),
      valor_usd: resultado.valor_usd,
      valor_cop: resultado.valor_cop,
      origen: resultado.origen || null,
      destino: resultado.destino || null,
      tiempo_estimado: resultado.tiempo_estimado || null
    });
  }
  // si el modelo usa métodos distintos, intenta usar métodos por nombre
  if (typeof Model.insert === 'function') {
    return Model.insert({
      user_id: userId,
      detalle_calculo: JSON.stringify(resultado.detalleCalculo || {}),
      valor_usd: resultado.valor_usd,
      valor_cop: resultado.valor_cop
    });
  }
  // fallback
  return null;
};

export const obtenerHistorial = async (userId, limit = 10) => {
  const Model = tryGetModel();
  if (!Model) return [];
  if (typeof Model.obtenerPorUsuario === 'function') {
    return Model.obtenerPorUsuario(userId, limit);
  }
  if (typeof Model.findAll === 'function') {
    const rows = await Model.findAll({ where: { user_id: userId }, limit, order: [['createdAt', 'DESC']] });
    return rows;
  }
  return [];
};

export const obtenerPorId = async (id) => {
  const Model = tryGetModel();
  if (!Model) return null;
  if (typeof Model.obtenerPorId === 'function') return Model.obtenerPorId(id);
  if (typeof Model.findByPk === 'function') return Model.findByPk(id);
  return null;
};

export const eliminar = async (id) => {
  const Model = tryGetModel();
  if (!Model) return false;
  if (typeof Model.eliminar === 'function') {
    return Model.eliminar(id);
  }
  if (typeof Model.destroy === 'function') {
    const r = await Model.destroy({ where: { id } });
    return !!r;
  }
  return false;
};

