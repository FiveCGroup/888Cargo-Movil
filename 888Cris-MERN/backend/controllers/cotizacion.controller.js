import * as CotizacionService from '../services/cotizacion.service.js';
import { generarPDFBuffer } from '../services/pdf.service.js';
import * as WhatsappService from '../services/whatsapp.service.js';
import databaseRepository from '../repositories/index.js';
const { users } = databaseRepository;

export const cotizarMaritimo = async (req, res) => {
  try {
    // validar input (puedes ampliar validaciones)
    const resultado = CotizacionService.calcularMaritimo(req.body);

    if (req.userId) {
      // guardar (si el modelo existe, la función lo hará)
      const saved = await CotizacionService.guardarCotizacion(req.userId, resultado);
      // generar PDF y enviar WhatsApp usando buffer
      try {
        const pdfBuffer = await generarPDFBuffer(resultado);
        if (pdfBuffer && req.userPhone) {
          await WhatsappService.sendDocument(req.userPhone, pdfBuffer, 'cotizacion.pdf');
        }
      } catch (errPdf) {
        console.error('❌ Error generando/enviando PDF:', errPdf);
        // no abortar la respuesta principal por fallo en PDF/WhatsApp
      }
    }

    res.json({ success: true, data: resultado });
  } catch (err) {
    console.error('❌ [Cotización Marítima] Error:', err);
    res.status(500).json({
      success: false,
      message: 'Error al calcular cotización marítima',
      error: err.message
    });
  }
};

export const cotizarAereo = async (req, res) => {
  try {
    const resultado = CotizacionService.calcularAereo(req.body);

    if (req.userId) {
      const saved = await CotizacionService.guardarCotizacion(req.userId, resultado);
      try {
        const pdfBuffer = await generarPDFBuffer(resultado);
        if (pdfBuffer && req.userPhone) {
          await WhatsappService.sendDocument(req.userPhone, pdfBuffer, 'cotizacion.pdf');
        }
      } catch (errPdf) {
        console.error('❌ Error generando/enviando PDF:', errPdf);
      }
    }

    res.json({ success: true, data: resultado });
  } catch (err) {
    console.error('❌ [Cotización Aérea] Error:', err);
    res.status(500).json({
      success: false,
      message: 'Error al calcular cotización aérea',
      error: err.message
    });
  }
};

export const obtenerHistorial = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const limit = parseInt(req.query.limit) || 10;
    const cotizaciones = await CotizacionService.obtenerHistorial(req.userId, limit);

    // si los registros vienen con detalle_calculo string, parsear; si no, intentar respetar formato
    const cotizacionesFormateadas = (cotizaciones || []).map(c => {
      if (c && typeof c.detalle_calculo === 'string') {
        try {
          return { ...c, detalleCalculo: JSON.parse(c.detalle_calculo || '{}') };
        } catch (e) {
          return { ...c, detalleCalculo: {} };
        }
      }
      // si ya viene con detalleCalculo
      return { ...c, detalleCalculo: c.detalleCalculo || c.detalle_calculo || {} };
    });

    res.json({ success: true, data: cotizacionesFormateadas });
  } catch (error) {
    console.error('❌ Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de cotizaciones',
      error: error.message
    });
  }
};

export const eliminarCotizacion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const cotizacion = await CotizacionService.obtenerPorId(id);

    if (!cotizacion) {
      return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
    }

    // el campo user_id puede variar según tu modelo; intentamos leer user_id o userId
    const ownerId = cotizacion.user_id ?? cotizacion.userId ?? cotizacion.userId;

    if (ownerId && ownerId !== req.userId) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para eliminar esta cotización' });
    }

    const removed = await CotizacionService.eliminar(id);

    res.json({ success: true, message: 'Cotización eliminada exitosamente', removed });
  } catch (error) {
    console.error('❌ Error eliminando cotización:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar cotización',
      error: error.message
    });
  }
};

export const obtenerPdfCotizacion = async (req, res) => {
  try {
    const { id } = req.params;
    const cot = await CotizacionService.obtenerPorId(id);
    if (!cot) return res.status(404).json({ success: false, message: 'No encontrada' });

    const resultado = {
      destino: cot.destino ?? 'China',
      valor_usd: cot.valor_usd,
      valor_cop: cot.valor_cop,
      detalleCalculo: typeof cot.detalle_calculo === 'string' ? JSON.parse(cot.detalle_calculo || '{}') : (cot.detalleCalculo || {})
    };

    const pdfBuffer = await generarPDFBuffer(resultado);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="cotizacion_${id}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error generando PDF', error: err.message });
  }
};

export const enviarCotizacionWhatsapp = async (req, res) => {
  try {
    const { id } = req.params;
    let phone = req.body.phone || req.userPhone;
    // si no viene el teléfono, intentar obtenerlo desde la base de datos usando req.userId
    if (!phone && req.userId) {
      try {
        if (typeof users.findById === 'function') {
          const u = await users.findById(req.userId);
          phone = u?.phone || u?.phone_number || phone;
        } else if (typeof users.findOne === 'function') {
          const u = await users.findOne({ id: req.userId });
          phone = u?.phone || u?.phone_number || phone;
        } else if (typeof users.executeQuery === 'function') {
          const rows = await users.executeQuery('SELECT phone FROM users WHERE id = ?', [req.userId]);
          phone = rows?.[0]?.phone || phone;
        }
      } catch (e) {
        console.error('Error obteniendo teléfono de usuario:', e);
      }
    }
    if (!phone) return res.status(400).json({ success: false, message: 'Teléfono requerido' });

    const cot = await CotizacionService.obtenerPorId(id);
    if (!cot) return res.status(404).json({ success: false, message: 'No encontrada' });

    const resultado = {
      destino: cot.destino ?? 'China',
      valor_usd: cot.valor_usd,
      valor_cop: cot.valor_cop,
      detalleCalculo: typeof cot.detalle_calculo === 'string' ? JSON.parse(cot.detalle_calculo || '{}') : (cot.detalleCalculo || {})
    };

    const pdfBuffer = await generarPDFBuffer(resultado);
    await WhatsappService.sendDocument(phone, pdfBuffer, `cotizacion_${id}.pdf`);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error enviando por WhatsApp', error: err.message });
  }
};