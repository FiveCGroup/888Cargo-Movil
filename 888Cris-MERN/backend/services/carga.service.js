// services/carga.service.js
import databaseRepository from '../repositories/index.js';
import { v4 as uuidv4 } from 'uuid';
import ExcelJS from 'exceljs';

const { cargas, articulos, cajas, qr, clientes, audit, transaction } = databaseRepository;

export const procesarExcelPackingList = async (fileBuffer, userId, clienteId) => {
  return await transaction.executeInTransaction(async () => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);
    const worksheet = workbook.worksheets[0];

    const codigoCarga = `888CGS-${Date.now().toString().slice(-6)}`;
    
    const { id: cargaId } = await cargas.create({
      codigo_carga: codigoCarga,
      id_cliente: clienteId,
      estado: 'En bodega China',
      destino: 'Medellín' // se puede parametrizar
    });

    const articulosProcesados = [];

    worksheet.eachRow({ includeEmpty: false }, async (row, rowNumber) => {
      if (rowNumber < 2) return; // saltar header

      const articuloData = {
        id_carga: cargaId,
        ref_art: row.getCell(1).value,
        descripcion_espanol: row.getCell(2).value,
        unidad: row.getCell(3).value?.result || row.getCell(3).value,
        precio_unidad: row.getCell(4).value,
        cantidad: row.getCell(5).value,
        gw: row.getCell(6).value,
        cbm: row.getCell(7).value
      };

      const { id: articuloId } = await articulos.create(articuloData);

      // Crear cajas automáticamente
      for (let i = 1; i <= articuloData.cantidad; i++) {
        await cajas.create({
          id_articulo: articuloId,
          numero_caja: i,
          total_cajas: articuloData.cantidad,
          cantidad_en_caja: 1,
          gw: articuloData.gw / articuloData.cantidad,
          cbm: articuloData.cbm / articuloData.cantidad
        });
      }

      articulosProcesados.push({ articuloId, codigoCarga });
    });

    await audit.log(userId, 'carga_from_excel', 'carga', cargaId, { archivo: 'excel-upload' });

    return { success: true, cargaId, codigo_carga: codigoCarga, articulos: articulosProcesados.length };
  });
};

export const generarQRsParaCarga = async (cargaId, userId) => {
  const cajas = await cajas.findAll({ id_articulo: { $in: await articulos.executeQuery('SELECT id_articulo FROM articulo_packing_list WHERE id_carga = ?', [cargaId]) } });

  const qrsGenerados = [];

  for (const caja of cajas) {
    const codigo = `QR-${uuidv4().slice(0, 8).toUpperCase()}`;
    const datosQR = {
      caja_id: caja.id_caja,
      carga_codigo: (await cargas.findById(cargaId)).codigo_carga,
      cliente: 'nombre desde cliente',
      destino: 'Medellín'
    };

    await qr.create({
      id_caja: caja.id_caja,
      codigo_qr: codigo,
      datos_qr: JSON.stringify(datosQR),
      estado: 'generado'
    });

    qrsGenerados.push(codigo);
  }

  await audit.log(userId, 'qr_batch_generated', 'carga', cargaId, { cantidad: qrsGenerados.length });

  return { success: true, qrs: qrsGenerados };
};