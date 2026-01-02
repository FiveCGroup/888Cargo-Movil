// controllers/qr.controller.js
import { validarEscaneoQR, generarPDFParaCarga, generarQRParaCarga } from '../services/qr.service.js';
import databaseRepository from '../repositories/index.js';
import ExcelJS from 'exceljs';
import xlsx from 'xlsx';

// El repositorio exporta la clave `cargas` (plural). Alias a `carga` para compatibilidad
const { cargas: carga, articulos, cajas } = databaseRepository;

// Procesar archivo Excel
export const parseExcelBuffer = async (buffer) => {
  // Retorna array normalizado (puede lanzar)
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  // Preferir hoja llamada "LOADING REPORT" (case-insensitive), sino la primera
  let sheet = wb.getWorksheet('LOADING REPORT');
  if (!sheet) sheet = wb.worksheets.find(s => /loading report/i.test(s.name)) || wb.worksheets[0];
  if (!sheet) throw new Error('El archivo Excel no contiene hojas');

  // Detectar fila de cabeceras (primera fila con >1 celda no vacía)
  let headerRowNumber = 1;
  for (let r = 1; r <= Math.min(8, sheet.rowCount); r++) {
    const row = sheet.getRow(r);
    const nonEmpty = row.values.filter(v => v !== null && v !== undefined && String(v).trim() !== '').length;
    if (nonEmpty >= 2) { headerRowNumber = r; break; }
  }

  const headerRow = sheet.getRow(headerRowNumber);

  const mappings = [
    [/item\s*no|^item$|sku|item code/i, 'ref_art'],
    [/bl\s*description|description of goods|\bdescription\b|descri?p?cion/i, 'descripcion_espanol'],
    [/material/i, 'material'],
    [/size|measurement|medida/i, 'size'],
    [/brand|marca/i, 'marca_producto'],
    [/color/i, 'color'],
    [/ctns|\bctn\b|carton|cartons?/i, 'total_cajas'],
    [/qty\s*\/\s*ctn|qty per ctn|qty\/?ctn|qtyp?ctn|qtyctn/i, 'qty_per_ctn'],
    [/unit|unidad/i, 'unidad'],
    [/ttl\s*qty|total\s*qty|ttl\s*quantity|total\s*quantity|ttl qty/i, 'cantidad'],
    [/ttl\s*g\.v|g\.v|gv|gw|gross weight/i, 'gw'],
    [/ttl\s*c\.b\.m|c\.b\.m|cbm|volume/i, 'cbm'],
    [/ref|ref_art|^item$/i, 'ref_art']
  ];

  const mapKey = (key) => {
    if (!key) return null;
    for (const [re, name] of mappings) if (re.test(key)) return name;
    return null;
  };

  const parseNumber = (v) => {
    if (v === null || v === undefined || v === '') return null;
    const s = String(v).replace(/[^0-9,\.\-]/g, '').replace(/,/g, '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const parseSize = (val) => {
    if (!val) return {};
    const s = String(val).replace(/\s+/g, '').replace(/cm/ig, '').replace(/cm\./ig, '');
    const parts = s.split(/x|X|×|\*|\//).map(p => p.replace(/[^0-9\.\,\-]/g, '').replace(/,/g, '.')).filter(Boolean);
    const nums = parts.map(p => Number(p)).filter(Number.isFinite);
    return { medida_largo: nums[0] || null, medida_ancho: nums[1] || null, medida_alto: nums[2] || null };
  };

  // Construir mapa de columnas
  const colMap = {};
  headerRow.eachCell((cell, colNumber) => {
    const key = String(cell.value || '').trim();
    const mapped = mapKey(key);
    if (mapped) colMap[colNumber] = mapped;
  });

  // Extraer imágenes por fila (intento seguro)
  const imagesByRow = {};
  try {
    const sheetImages = sheet.getImages();
    for (const img of sheetImages) {
      const { imageId, range } = img;
      let rowIndex = null;
      if (range && range.tl && (typeof range.tl.row === 'number')) rowIndex = range.tl.row;
      else if (range && range.tl && (typeof range.tl.nativeRow === 'number')) rowIndex = range.tl.nativeRow;
      else if (range && range.nativeRow) rowIndex = range.nativeRow;
      if (!rowIndex) continue;
      const media = (wb.model && wb.model.media && (wb.model.media[imageId - 1] || wb.model.media.find(m => m.index === imageId)));
      if (media && media.buffer) imagesByRow[rowIndex] = media.buffer.toString('base64');
    }
  } catch (e) {
    console.warn('[Carga] extracción de imágenes falló:', e.message || e);
  }

  const normalized = [];
  // Recorrer filas después de headerRowNumber
  for (let r = headerRowNumber + 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    if (!row) continue;
    const out = {};
    row.eachCell((cell, colNumber) => {
      const mapped = colMap[colNumber];
      if (!mapped) return;
      const value = (cell && cell.value && cell.value.text) ? cell.value.text : cell.value;
      if (mapped === 'size') {
        const dims = parseSize(value);
        out.medida_largo = dims.medida_largo;
        out.medida_ancho = dims.medida_ancho;
        out.medida_alto = dims.medida_alto;
      } else if (mapped === 'qty_per_ctn') {
        out.unidades_empaque = parseNumber(value) || null;
      } else if (mapped === 'total_cajas') {
        out.total_cajas = parseNumber(value) || null;
      } else if (mapped === 'cantidad') {
        out.cantidad = parseNumber(value) || null;
      } else if (mapped === 'gw' || mapped === 'cbm') {
        out[mapped] = parseNumber(value);
      } else {
        out[mapped] = (value === undefined || value === null) ? '' : String(value).trim();
      }
    });
    if (imagesByRow[r]) out.imagen_embedded = imagesByRow[r];
    if (!out.cantidad && out.unidades_empaque && out.total_cajas) out.cantidad = out.unidades_empaque * out.total_cajas;
    if (out.cantidad) out.cantidad = parseNumber(out.cantidad) || null;
    if (out.total_cajas) out.total_cajas = parseNumber(out.total_cajas) || null;
    if (out.unidades_empaque) out.unidades_empaque = parseNumber(out.unidades_empaque) || null;
    const hasContent = Object.keys(out).length > 0 && Object.values(out).some(v => v !== null && v !== '');
    if (hasContent) normalized.push(out);
  }

  // Si no hay filas, intentar fallback con xlsx
  if (normalized.length === 0) {
    try {
      const workbook2 = xlsx.read(buffer, { type: 'buffer' });
      const sheetName2 = workbook2.SheetNames.find(n => /loading report/i.test(n)) || workbook2.SheetNames[0];
      const sheet2 = workbook2.Sheets[sheetName2];
      const data2 = xlsx.utils.sheet_to_json(sheet2, { defval: '' });
      return data2.map(r => ({ ...r }));
    } catch (e) {
      // devolver lo ya parseado (vacío)
    }
  }

  return normalized;
};

export const procesarExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No se ha subido ningún archivo' });
    console.log('[Carga] procesarExcel - file received:', { originalname: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype });
    const normalized = await parseExcelBuffer(req.file.buffer);
    if (!normalized || normalized.length === 0) return res.status(400).json({ success: false, message: 'El archivo Excel está vacío o no contiene filas válidas' });
    const filasConError = [];
    const estadisticas = { filasExitosas: normalized.length - filasConError.length, filasConError: filasConError.length, filasVacias: 0, totalFilas: normalized.length };
    return res.json({ success: true, message: 'Excel parseado y normalizado correctamente', data: normalized, filasConError, estadisticas });
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

// Guardar packing list con estructura JSON y generar cajas/artículos (compatibilidad cliente)
export const guardarConQR = async (req, res) => {
  try {
    const payload = req.body || {};
    const cargaMeta = payload.infoCarga || payload.carga || payload.meta || {};
    const infoClientePayload = payload.infoCliente || payload.cliente || payload.customer || {};
    const items = payload.datosExcel || payload.articulos || payload.items || payload.articulos_lista || [];

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No hay artículos para guardar' });
    }

    // Resolver o crear cliente: preferir id en cargaMeta, luego buscar por correo en payload o req.user
    let id_cliente_payload = cargaMeta.id_cliente || cargaMeta.cliente_id || null;

    if (!id_cliente_payload) {
      const correoToCheck = infoClientePayload.correo_cliente || infoClientePayload.email || req.user?.email;
      if (correoToCheck) {
        const clienteByEmail = await databaseRepository.clientes.findOne({ correo_cliente: correoToCheck });
        if (clienteByEmail) id_cliente_payload = clienteByEmail.id_cliente;
      }
    }

    // Si aún no hay cliente, crear uno a partir del payload infoCliente
    if (!id_cliente_payload && infoClientePayload && (infoClientePayload.nombre_cliente || infoClientePayload.correo_cliente)) {
      const newClienteData = {
        nombre_cliente: infoClientePayload.nombre_cliente || (infoClientePayload.name || infoClientePayload.correo_cliente),
        correo_cliente: infoClientePayload.correo_cliente || infoClientePayload.email || null,
        telefono_cliente: infoClientePayload.telefono_cliente || infoClientePayload.phone || null,
        pais_cliente: infoClientePayload.pais_cliente || null,
        ciudad_cliente: infoClientePayload.ciudad_cliente || null,
        direccion_entrega: infoClientePayload.direccion_entrega || null
      };
      try {
        const created = await databaseRepository.clientes.create(newClienteData);
        id_cliente_payload = created.id_cliente || created.id || created.lastID;
      } catch (createErr) {
        console.warn('[Carga] No se pudo crear cliente automáticamente:', createErr.message);
      }
    }

    if (!id_cliente_payload) {
      return res.status(400).json({ success: false, message: 'Falta id_cliente en el payload y no se pudo determinar o crear automáticamente.' });
    }

    const destino_payload = cargaMeta.destino || cargaMeta.dest || null;
    let clientePayloadInfo = null;
    if (!destino_payload && req.user?.email) {
      clientePayloadInfo = await databaseRepository.clientes.findOne({ correo_cliente: req.user.email });
    }

    const destino_final = destino_payload || clientePayloadInfo?.ciudad_cliente || clientePayloadInfo?.pais_cliente || 'Destino no especificado';

    const nuevaCargaRes = await carga.create({
      codigo_carga: cargaMeta.codigo_carga || `CARGA-${Date.now()}`,
      estado: cargaMeta.estado || 'pendiente',
      id_cliente: id_cliente_payload,
      destino: destino_final
    });
    const cargaId = nuevaCargaRes.id_carga || nuevaCargaRes.id || nuevaCargaRes.lastID;

    // Normalizar y mapear campos esperados por la BD
    const filasConError = [];
    for (const it of items) {
      try {
        // Campos normalizados (intentar detectar variantes comunes de columnas Excel)
        const ref_art = it.ref_art || it.ref || it.REF || it.referencia || it.REFERENCIA || it.REF_ART || null;
        const descripcion_espanol = it.descripcion_espanol || it.descripcion || it.DESCRIPCION || it.Descripcion || it.description || null;
        const descripcion_chino = it.descripcion_chino || it.DESCRIPCION_CHINO || it.descripcion_china || null;
        const cn = it.cn || it.CN || null;
        const fecha = it.fecha || it.Fecha || null;
        const unidad = it.unidad || it.UNIDAD || null;
        const precio_unidad = (it.precio_unidad ?? it.PRECIO_UNITARIO ?? it.precio) ? Number(it.precio_unidad ?? it.PRECIO_UNITARIO ?? it.precio) : null;
        const precio_total = (it.precio_total ?? it.PRECIO_TOTAL) ? Number(it.precio_total ?? it.PRECIO_TOTAL) : null;
        const material = it.material || null;
        const unidades_empaque = it.unidades_empaque ?? it.unidades ?? it.units ?? null;
        const marca_producto = it.marca_producto || it.marca || null;
        const serial = it.serial || null;
        const medida_largo = it.medida_largo ?? it.largo ?? it.length ?? null;
        const medida_ancho = it.medida_ancho ?? it.ancho ?? it.width ?? null;
        const medida_alto = it.medida_alto ?? it.alto ?? it.height ?? null;
        const cbm_art = it.cbm ?? it.CBM ?? null;
        const gw_art = it.gw ?? it.GW ?? null;
        const imagen_url = it.imagen_url || it.imagen || it.imagenUrl || null;
        const imagen_nombre = it.imagen_nombre || it.imagenName || null;
        const imagen_tipo = it.imagen_tipo || it.imagenTipo || null;

        const cantidad = Number(it.cantidad ?? it.Cantidad ?? it.QTY ?? it.qty ?? it.unidades ?? 1) || 1;
        const numCajas = Math.max(1, Number(it.cajas ?? it.total_cajas ?? it.Cajas ?? it.Total ?? it.total ?? 1) || 1);
        const cantidad_en_caja = (it.cantidad_en_caja ?? Math.ceil(cantidad / numCajas)) || null;

        const articuloData = {
          id_carga: cargaId,
          ref_art: ref_art,
          descripcion_espanol: descripcion_espanol || ref_art || `Artículo ${Date.now()}`,
          descripcion_chino,
          cn,
          fecha,
          unidad,
          precio_unidad,
          precio_total,
          material,
          unidades_empaque: unidades_empaque ? Number(unidades_empaque) : null,
          marca_producto,
          serial,
          medida_largo: medida_largo ? Number(medida_largo) : null,
          medida_ancho: medida_ancho ? Number(medida_ancho) : null,
          medida_alto: medida_alto ? Number(medida_alto) : null,
          cbm: cbm_art ? Number(cbm_art) : null,
          gw: gw_art ? Number(gw_art) : null,
          imagen_url,
          imagen_nombre,
          imagen_tipo,
          cantidad: cantidad
        };

        const articuloRes = await articulos.create(articuloData);
        const articuloId = articuloRes.id_articulo || articuloRes.id || articuloRes.lastID;
        if (!articuloId) throw new Error('No se pudo obtener id del artículo creado');

        // Crear cajas asociadas con datos relevantes
        for (let i = 1; i <= numCajas; i++) {
          await cajas.create({
            id_articulo: articuloId,
            numero_caja: i,
            total_cajas: numCajas,
            cantidad_en_caja: cantidad_en_caja,
            descripcion_contenido: descripcion_espanol || ref_art || null,
            cbm: cbm_art ? Number(cbm_art) : null,
            gw: gw_art ? Number(gw_art) : null,
            observaciones: it.observaciones || it.obs || null
          });
        }
      } catch (err) {
        console.error('[Carga] Error creando artículo/cajas para fila:', it, err.message || err);
        filasConError.push({ row: it, error: err.message || String(err) });
        continue;
      }
    }

    if (filasConError.length > 0) {
      console.warn('[Carga] Algunas filas no se pudieron guardar:', filasConError.length);
    }

    res.json({ success: true, data: { carga: { id: cargaId, codigo: cargaMeta.codigo_carga || `CARGA-${Date.now()}` } } });
  } catch (error) {
    console.error('Error en guardarConQR:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Obtener packing list (artículos + cajas) por id de carga
export const obtenerPackingList = async (req, res) => {
  try {
    const cargaId = req.params.id || req.query.id;
    if (!cargaId) return res.status(400).json({ success: false, message: 'Falta id de carga' });

    // Obtener la carga
    const cargaRow = await carga.findOne({ id_carga: Number(cargaId) }) || await carga.findOne({ id: Number(cargaId) });
    if (!cargaRow) return res.status(404).json({ success: false, message: 'Carga no encontrada' });

    // Obtener artículos asociados
    const articulosRows = await articulos.findAll({ id_carga: cargaRow.id_carga || cargaRow.id });

    // Para cada artículo, obtener sus cajas
    const articulosConCajas = [];
    for (const art of articulosRows) {
      const cajasRows = await cajas.findAll({ id_articulo: art.id_articulo || art.id });
      articulosConCajas.push({ ...art, cajas: cajasRows });
    }

    res.json({ success: true, data: { carga: cargaRow, articulos: articulosConCajas } });
  } catch (error) {
    console.error('Error obteniendo packing list:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Obtener metadata de carga por id (compatibilidad móvil/alias)
export const obtenerCargaPorId = async (req, res) => {
  try {
    const cargaId = req.params.id || req.query.id;
    if (!cargaId) return res.status(400).json({ success: false, message: 'Falta id de carga' });

    const cargaRow = await carga.findOne({ id_carga: Number(cargaId) }) || await carga.findOne({ id: Number(cargaId) });
    if (!cargaRow) return res.status(404).json({ success: false, message: 'Carga no encontrada' });

    let cliente = null;
    if (cargaRow.id_cliente) {
      cliente = await databaseRepository.clientes.findOne({ id_cliente: cargaRow.id_cliente }) || await databaseRepository.clientes.findOne({ id: cargaRow.id_cliente });
    }

    res.json({ success: true, data: { carga: cargaRow, cliente } });
  } catch (error) {
    console.error('Error obteniendo carga por id:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Transformar el Excel subido a un formato estandarizado y devolverlo para descarga
export const transformarExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No se ha subido ningún archivo' });
    const normalized = await parseExcelBuffer(req.file.buffer);

    // Crear workbook estandarizado
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('PACKING_LIST_STANDARD');

    const headers = [
      'ref_art', 'descripcion_espanol', 'material', 'medida_largo', 'medida_ancho', 'medida_alto',
      'unidades_empaque', 'total_cajas', 'cantidad', 'gw', 'cbm'
    ];
    ws.addRow(headers);

    for (const row of normalized) {
      const r = [
        row.ref_art || row.REF || row.Item || '',
        row.descripcion_espanol || row.descripcion || row.DESCRIPCION || '',
        row.material || '',
        row.medida_largo || row.length || '',
        row.medida_ancho || row.width || '',
        row.medida_alto || row.height || '',
        row.unidades_empaque || row.qty_per_ctn || '',
        row.total_cajas || row.ctns || '',
        row.cantidad || row.total_qty || '',
        row.gw || '',
        row.cbm || ''
      ];
      ws.addRow(r);
    }

    const buffer = await wb.xlsx.writeBuffer();
    res.setHeader('Content-Disposition', 'attachment; filename=packinglist_transformado.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Error transformando Excel:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};