// controllers/qr.controller.js
import {
  validarEscaneoQR,
  generarPDFParaCarga
} from '../services/qr.service.js';

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