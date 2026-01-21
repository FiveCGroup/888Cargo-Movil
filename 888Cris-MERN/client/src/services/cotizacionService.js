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
  const cfg = LOGISTICA_CONFIG;
  const peso = Number(payload.peso_kg ?? payload.peso ?? 0);
  const volumen = Number(payload.volumen_m3 ?? 0) || (
    Number(payload.largo_cm || 0) *
    Number(payload.ancho_cm || 0) *
    Number(payload.alto_cm || 0)
  ) / 1000000;

  // variables compartidas para evitar eslint no-undef
  let costoUSD = 0;
  let detalleCalculo = {};

  if (tipo === 'maritimo') {
    const volumenReal = Number(volumen.toFixed(3));
    const volumenCobrable = Math.max(volumenReal, cfg.MINIMO_MARITIMO_M3);
    const pesoVolumetrico = Number((volumenReal * cfg.FACTOR_VOLUMETRICO.MARITIMO).toFixed(2));
    const tarifaObj = cfg.TARIFAS_USD.MARITIMO_LCL[destino] || cfg.TARIFAS_USD.MARITIMO_LCL.China;
    const tarifaUSD = tarifaObj.promedio;

    // Cargos adicionales (aplicados a ambas opciones)
    const porcentajeSeguro = 0.005;
    const cargoHandlingUSD = 20;
    const cargoDocsUSD = 10;

    // Opción A: solo volumen (considera FCL si aplica)
    let costoPorVolumenBaseUSD = volumenCobrable * tarifaUSD;
    let costoFclUSD = null;
    if (volumenReal >= cfg.CAPACIDAD_CONTENEDOR_M3) {
      const descuentoFcl = 0.30;
      costoFclUSD = (tarifaUSD * cfg.CAPACIDAD_CONTENEDOR_M3) * (1 - descuentoFcl);
      if (costoFclUSD < costoPorVolumenBaseUSD) costoPorVolumenBaseUSD = costoFclUSD;
    }
    
    // Calcular cargos para Opción A
    const seguroOpcionA = Number((costoPorVolumenBaseUSD * porcentajeSeguro).toFixed(2));
    const totalOpcionA = Number((costoPorVolumenBaseUSD + seguroOpcionA + cargoHandlingUSD + cargoDocsUSD).toFixed(2));

    // Opción B: volumen + peso (añade componente por peso)
    const factorPesoUSD = 0.10;
    const costoPorPesoUSD = Number((peso * factorPesoUSD).toFixed(2));
    const costoVolumenMasPesoBaseUSD = Number(((volumenCobrable * tarifaUSD) + costoPorPesoUSD).toFixed(2));
    
    // Calcular cargos para Opción B
    const seguroOpcionB = Number((costoVolumenMasPesoBaseUSD * porcentajeSeguro).toFixed(2));
    const totalOpcionB = Number((costoVolumenMasPesoBaseUSD + seguroOpcionB + cargoHandlingUSD + cargoDocsUSD).toFixed(2));

    // Selección: mayor de ambas opciones (comparando los totales con cargos)
    const totalUSD = Math.max(totalOpcionA, totalOpcionB);
    const elegido = totalOpcionA >= totalOpcionB ? 'volumen' : 'volumen+peso';
    const baseSeleccionadaUSD = elegido === 'volumen' ? costoPorVolumenBaseUSD : costoVolumenMasPesoBaseUSD;
    const seguroUSD = elegido === 'volumen' ? seguroOpcionA : seguroOpcionB;

    const totalCOP = Math.round(totalUSD * cfg.TRM_COP_USD);

    detalleCalculo = {
      volumenReal,
      volumenCobrable: Number(volumenCobrable.toFixed(3)),
      pesoReal: Number(peso.toFixed(2)),
      pesoVolumetrico,
      tarifaUSD,
      tipoCobro: 'USD/m³',
      factorUsado: cfg.FACTOR_VOLUMETRICO.MARITIMO,
      // Valores base (sin cargos)
      costoPorVolumenBaseUSD: Number(costoPorVolumenBaseUSD.toFixed(2)),
      costoPorVolumenMasPesoBaseUSD: Number(costoVolumenMasPesoBaseUSD.toFixed(2)),
      costoPorPesoUSD,
      // Valores totales (con cargos) - estos son los que se muestran en la comparativa
      costoPorVolumenUSD: totalOpcionA, // Total con cargos para Opción A
      costoPorVolumenMasPesoUSD: totalOpcionB, // Total con cargos para Opción B
      elegido,
      cargos: {
        seguroUSD,
        handlingUSD: cargoHandlingUSD,
        docsUSD: cargoDocsUSD,
        fclApplied: costoFclUSD != null && costoFclUSD < (volumenReal * tarifaUSD),
        seguroOpcionA,
        seguroOpcionB
      },
      explicacion: elegido === 'volumen'
        ? `Se eligió la opción por volumen (mayor o igual). Total: $${totalOpcionA.toFixed(2)} USD vs $${totalOpcionB.toFixed(2)} USD`
        : `Se eligió la opción volumen + peso (mayor). Total: $${totalOpcionB.toFixed(2)} USD vs $${totalOpcionA.toFixed(2)} USD`
    };

    costoUSD = totalUSD;

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
  } else {
    const pesoVolumetrico = volumen * LOGISTICA_CONFIG.FACTOR_VOLUMETRICO.AEREO;
    const pesoCobrable = Math.max(peso, pesoVolumetrico, LOGISTICA_CONFIG.MINIMO_AEREO_KG);
    const tarifaDestino = LOGISTICA_CONFIG.TARIFAS_USD.AEREO_KG[destino] || LOGISTICA_CONFIG.TARIFAS_USD.AEREO_KG.China;
    const tarifaUSD = tarifaDestino.promedio;

    costoUSD = pesoCobrable * tarifaUSD;
    const gana = peso > pesoVolumetrico ? 'peso real' : 'peso volumétrico';

    detalleCalculo = {
      pesoReal: Number(peso.toFixed(2)),
      pesoVolumetrico: Number(pesoVolumetrico.toFixed(2)),
      pesoCobrable: Number(pesoCobrable.toFixed(2)),
      volumenReal: Number(volumen.toFixed(3)),
      tarifaUSD,
      tipoCobro: 'USD/kg',
      factorUsado: LOGISTICA_CONFIG.FACTOR_VOLUMETRICO.AEREO,
      gana,
      explicacion: `Se cobra el mayor entre peso real (${peso} kg) y volumétrico (${pesoVolumetrico.toFixed(2)} kg)`
    };
  }

  const costoCOP = Math.round(costoUSD * LOGISTICA_CONFIG.TRM_COP_USD);

  return {
    volumen_m3: Number(volumen.toFixed(3)),
    peso_kg: Number(peso.toFixed(2)),
    valor_usd: Number(costoUSD.toFixed(2)),
    valor_cop: costoCOP,
    detalleCalculo,
    destino,
    trm: LOGISTICA_CONFIG.TRM_COP_USD,
    tiempo_estimado: tipo === 'maritimo' ? '25-35 días' : '3-7 días'
  };
}

function normalizeForLocal(datos) {
  return {
    peso_kg: Number(datos.peso_kg ?? datos.peso ?? datos.pesoKg ?? 0),
    largo_cm: Number(datos.largo_cm ?? datos.largo ?? datos.largoCm ?? 0),
    ancho_cm: Number(datos.ancho_cm ?? datos.ancho ?? datos.anchoCm ?? 0),
    alto_cm: Number(datos.alto_cm ?? datos.alto ?? datos.altoCm ?? 0),
    destino: datos.destino ?? 'China',
  };
}

class CotizacionService {

  async cotizarMaritimo(datos) {
    try {
      // enviar payload ya normalizado al backend (no prefijar '/api' aquí)
      const payload = normalizeForLocal(datos);
      // opcional: si cliente calculó volumen manual, incluirlo
      if (datos.volumen_m3) payload.volumen_m3 = Number(datos.volumen_m3);

      const response = await API.post('/cotizaciones/maritimo', payload);

      if (response.data && response.data.success) {
        return response.data;
      }

      throw new Error('Respuesta inválida');
    } catch (err) {
      console.warn('⚠️ Usando cálculo local para marítimo', err?.message ?? err);
      const normalized = normalizeForLocal(datos);
      const resultado = calcularCotizacionLocal('maritimo', normalized, datos.destino);
      return { success: true, data: resultado, isLocal: true };
    }
  }

  async cotizarAereo(datos) {
    try {
      const payload = normalizeForLocal(datos);
      if (datos.volumen_m3) payload.volumen_m3 = Number(datos.volumen_m3);

      const response = await API.post('/cotizaciones/aereo', payload);

      if (response.data && response.data.success) {
        return response.data;
      }

      throw new Error('Respuesta inválida');
    } catch (err) {
      console.warn('⚠️ Usando cálculo local para aéreo', err?.message ?? err);
      const normalized = normalizeForLocal(datos);
      const resultado = calcularCotizacionLocal('aereo', normalized, datos.destino);
      return { success: true, data: resultado, isLocal: true };
    }
  }

  getConfig() {
    return LOGISTICA_CONFIG;
  }
}

export async function descargarPdfCotizacion(id) {
  const resp = await fetch(`/cotizaciones/${id}/pdf`, { credentials: 'include' });
  if (!resp.ok) throw new Error('Error descargando PDF');
  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cotizacion_${id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function enviarCotizacionWhatsapp(id, phone) {
  const resp = await fetch(`/cotizaciones/${id}/send-whatsapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ phone })
  });
  return resp.json();
}

export default new CotizacionService();