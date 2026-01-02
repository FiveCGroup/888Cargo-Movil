// controllers/qr.controller.js
import {
  validarEscaneoQR,
  generarPDFParaCarga
} from '../services/qr.service.js';
import databaseRepository from '../repositories/index.js';
import { generateQRWithLogo } from '../utils/qrLogoGenerator.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.join(__dirname, '../assets/888cargo-logo.png');

export const validarEscaneo = async (req, res) => {
  try {
    const { codigoQR } = req.body;
    const result = await validarEscaneoQR(codigoQR, req.user?.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const generarPDFCarga = async (req, res) => {
  try {
    const { cargaId } = req.params;
    const pdfBuffer = await generarPDFParaCarga(cargaId);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="QR_Carga_${cargaId}.pdf"`
    });
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Debug: Obtener QRs de una carga (formato esperado por cliente móvil)
export const obtenerQRsParaCargaDebug = async (req, res) => {
  try {
    const { id } = req.params;
    const cargaId = Number(id);
    if (!cargaId) return res.status(400).json({ success: false, message: 'ID inválido' });

    const qrs = await databaseRepository.qr.executeQuery(`
      SELECT q.*, c.numero_caja, c.total_cajas, a.ref_art, a.descripcion_espanol, a.id_articulo
      FROM qr q
      JOIN caja c ON q.id_caja = c.id_caja
      JOIN articulo_packing_list a ON c.id_articulo = a.id_articulo
      WHERE a.id_carga = ?
      ORDER BY c.numero_caja
    `, [cargaId]);

    return res.json({ success: true, data: { qrs } });
  } catch (error) {
    console.error('Error obteniendo QRs debug:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Obtener imagen PNG del QR por id_qr (genera on-the-fly)
export const obtenerImagenQR = async (req, res) => {
  try {
    const { id } = req.params;
    const width = parseInt(req.query.width, 10) || 300;
    if (!id) return res.status(400).send('ID inválido');

    const rows = await databaseRepository.qr.executeQuery('SELECT * FROM qr WHERE id_qr = ?', [id]);
    const qrRow = rows && rows.length ? rows[0] : null;
    if (!qrRow) return res.status(404).send('QR no encontrado');

    const datosQR = qrRow.datos_qr || qrRow.codigo_qr || JSON.stringify({ id: qrRow.id_qr });

    const buffer = await generateQRWithLogo(datosQR, logoPath, { width });
    res.setHeader('Content-Type', 'image/png');
    return res.send(buffer);
  } catch (error) {
    console.error('Error generando imagen QR:', error);
    return res.status(500).send('Error generando imagen QR');
  }
};