// controllers/qr.controller.js
import { validarEscaneoQR, generarPDFParaCarga, generarQRParaCarga } from '../services/qr.service.js';
import databaseRepository from '../repositories/index.js';
import xlsx from 'xlsx';

const { carga, articulos, cajas } = databaseRepository;

// Procesar archivo Excel
export const procesarExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se ha subido ningún archivo' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return res.status(400).json({ success: false, message: 'El archivo Excel está vacío' });
    }

    // Crear carga
    const nuevaCarga = await carga.create({
      codigo_carga: `CARGA-${Date.now()}`,
      fecha_creacion: new Date().toISOString(),
      estado: 'pendiente',
      creado_por: req.user?.id
    });

    // Procesar cada fila del Excel
    for (const row of data) {
      const articulo = await articulos.create({
        id_carga: nuevaCarga.id_carga,
        ref_art: row['Referencia'] || row['REF'] || '',
        descripcion_espanol: row['Descripcion'] || row['DESC'] || '',
        cantidad: row['Cantidad'] || row['QTY'] || 1
      });

      // Crear cajas para el artículo
      const numCajas = parseInt(row['Cajas'] || row['BOXES'] || 1);
      for (let i = 1; i <= numCajas; i++) {
        await cajas.create({
          id_articulo: articulo.id_articulo,
          numero_caja: i,
          total_cajas: numCajas
        });
      }
    }

    res.json({
      success: true,
      message: 'Excel procesado correctamente',
      data: {
        cargaId: nuevaCarga.id_carga,
        codigo: nuevaCarga.codigo_carga,
        totalArticulos: data.length
      }
    });
  } catch (error) {
    console.error('Error procesando Excel:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Obtener cargas del usuario
export const getMisCargas = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    const cargas = await carga.executeQuery(`
      SELECT * FROM carga 
      WHERE creado_por = ? 
      ORDER BY fecha_creacion DESC
    `, [userId]);

    res.json({
      success: true,
      data: cargas
    });
  } catch (error) {
    console.error('Error obteniendo cargas:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generar QRs para una carga
export const generarQRs = async (req, res) => {
  try {
    const { cargaId } = req.params;
    const { cantidad } = req.body;
    
    const qrCodes = await generarQRParaCarga(cargaId, cantidad || 1);
    
    res.json({ 
      success: true, 
      message: 'QRs generados correctamente',
      data: qrCodes 
    });
  } catch (error) {
    console.error('Error generando QRs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Validar escaneo QR
export const validarEscaneo = async (req, res) => {
  try {
    const { codigoQR } = req.body;
    const result = await validarEscaneoQR(codigoQR, req.user?.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Generar PDF de carga
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