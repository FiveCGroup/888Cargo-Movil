import express from 'express';
import multer from 'multer';
import ExcelJS from 'exceljs';
import PackingList from '../models/PackingList.model.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/procesar-excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Archivo no enviado' });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const sheet = workbook.worksheets[0];
    if (!sheet) return res.status(400).json({ success: false, message: 'Hoja vacía' });

    const items = [];
    // Suponiendo que la primera fila son headers: adaptarlo según formato real
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // saltar headers
      const codigo = row.getCell(1).text?.trim();
      const sku = row.getCell(2).text?.trim();
      const descripcion = row.getCell(3).text?.trim();
      const cantidad = Number(row.getCell(4).value) || 0;
      const peso = Number(row.getCell(5).value) || 0;

      if (codigo) {
        items.push({ codigo, sku, descripcion, cantidad, peso });
      }
    });

    if (!items.length) {
      return res.status(400).json({ success: false, message: 'No se encontraron registros válidos' });
    }

    // Guardar packing list (ajustar campos si su esquema es distinto)
    const packing = new PackingList({
      codigoCarga: items[0].codigo || `PL-${Date.now()}`,
      items,
      origem: 'upload',
      createdAt: new Date()
    });

    await packing.save();

    return res.json({ success: true, message: 'Archivo procesado', savedId: packing._id, count: items.length });
  } catch (err) {
    console.error('❌ Error procesando archivo:', err);
    return res.status(500).json({ success: false, message: 'Error al procesar el archivo Excel' });
  }
});

export default router;