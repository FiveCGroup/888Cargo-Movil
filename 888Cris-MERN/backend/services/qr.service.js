import databaseRepository from '../repositories/index.js';
import { generateQRWithLogo } from '../utils/qrLogoGenerator.js';
import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.join(__dirname, '../assets/888cargo-logo.png');

const { qr, cajas, articulos, carga } = databaseRepository;

// 1. Validar escaneo QR
export const validarEscaneoQR = async (codigoQR, userId = null) => {
  const qrData = await qr.findByCode(codigoQR);
  if (!qrData) throw new Error('Código QR no encontrado');

  // Si ya fue escaneado
  if (qrData.estado === 'escaneado') {
    return {
      success: true,
      yaEscaneado: true,
      mensaje: 'Esta caja ya fue escaneada anteriormente',
      datos: JSON.parse(qrData.datos_qr)
    };
  }

  // Marcar como escaneado
  await qr.update(qrData.id_qr, {
    estado: 'escaneado',
    fecha_escaneado: new Date().toISOString(),
    escaneado_por: userId,
    contador_escaneos: 'contador_escaneos + 1'
  });

  return {
    success: true,
    yaEscaneado: false,
    mensaje: 'Caja escaneada correctamente',
    datos: JSON.parse(qrData.datos_qr)
  };
};

// 2. Generar PDF completo de una carga (el que necesitas para el botón "Descargar PDF")
export const generarPDFParaCarga = async (cargaId) => {
  // Obtener todos los QRs de la carga
  const qrs = await qr.executeQuery(`
    SELECT q.*, c.numero_caja, c.total_cajas, a.ref_art, a.descripcion_espanol, car.codigo_carga, car.nombre_cliente
    FROM qr q
    JOIN caja c ON q.id_caja = c.id_caja
    JOIN articulo_packing_list a ON c.id_articulo = a.id_articulo
    JOIN carga car ON a.id_carga = car.id_carga
    WHERE car.id_carga = ?
    ORDER BY c.numero_caja
  `, [cargaId]);

  if (qrs.length === 0) throw new Error('No hay QRs para esta carga');

  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Título
      doc.fontSize(24).text('888Cargo - Etiquetas QR', { align: 'center' });
      doc.moveDown();
      doc.fontSize(16).text(`Carga: ${qrs[0].codigo_carga}`, { align: 'center' });
      doc.moveDown(2);

      for (let i = 0; i < qrs.length; i++) {
        const item = qrs[i];
        const parsed = JSON.parse(item.datos_qr);

        // Generar QR con logo
        const qrBuffer = await generateQRWithLogo(item.datos_qr, logoPath, { width: 300 });

        // Cada QR en una página
        if (i > 0) doc.addPage();

        doc.fontSize(14).text(`Caja ${item.numero_caja} de ${item.total_cajas}`);
        doc.moveDown();

        doc.image(qrBuffer, {
          fit: [300, 300],
          align: 'center',
          valign: 'center'
        });

        doc.moveDown();
        doc.fontSize(12).text(`Ref: ${item.ref_art || 'N/A'}`);
        doc.text(`Desc: ${parsed.descripcion || 'Sin descripción'}`);
        doc.text(`Cliente: ${item.nombre_cliente || 'N/A'}`);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// 3. Generar QRs para una carga específica
export const generarQRParaCarga = async (cargaId, cantidad = 1) => {
  const { generateQRWithLogo } = await import('../utils/qrLogoGenerator.js');
  
  // Obtener información de la carga
  const cargaInfo = await carga.findById(cargaId);
  if (!cargaInfo) throw new Error('Carga no encontrada');

  // Obtener cajas de la carga que no tienen QR
  const cajasResult = await qr.executeQuery(`
    SELECT c.*, a.ref_art, a.descripcion_espanol 
    FROM caja c
    JOIN articulo_packing_list a ON c.id_articulo = a.id_articulo
    WHERE a.id_carga = ? AND c.id_caja NOT IN (SELECT id_caja FROM qr WHERE id_caja IS NOT NULL)
    LIMIT ?
  `, [cargaId, cantidad]);

  const qrCodes = [];

  for (const caja of cajasResult) {
    const datosQR = JSON.stringify({
      cargaId,
      cajaId: caja.id_caja,
      numeroCaja: caja.numero_caja,
      totalCajas: caja.total_cajas,
      referencia: caja.ref_art,
      descripcion: caja.descripcion_espanol,
      timestamp: Date.now()
    });

    // Generar imagen QR con logo
    const qrImage = await generateQRWithLogo(datosQR, logoPath, { width: 300 });

    // Guardar en BD
    const nuevoQR = await qr.create({
      id_caja: caja.id_caja,
      datos_qr: datosQR,
      estado: 'activo',
      fecha_generacion: new Date().toISOString()
    });

    qrCodes.push({
      id: nuevoQR.id,
      codigo: datosQR,
      qrImage: qrImage.toString('base64'),
      caja: {
        numero: caja.numero_caja,
        total: caja.total_cajas,
        referencia: caja.ref_art
      }
    });
  }

  return qrCodes;
};