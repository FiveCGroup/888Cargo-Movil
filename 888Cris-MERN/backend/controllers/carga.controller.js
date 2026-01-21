// controllers/qr.controller.js
import {
  validarEscaneoQR,
  generarPDFParaCarga,
  generarQRParaCarga,
} from "../services/qr.service.js";
import databaseRepository from "../repositories/index.js";
import fs from 'fs';
import path from 'path';
import { UPLOAD_PATHS } from '../config.js';
import ExcelJS from "exceljs";
import xlsx from "xlsx";

// El repositorio exporta la clave `cargas` (plural). Alias a `carga` para compatibilidad
const { cargas: carga, articulos, cajas } = databaseRepository;

// Procesar archivo Excel
export const parseExcelBuffer = async (buffer) => {
  // Retorna objeto { normalized, filasConError } (puede lanzar)
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const filasConError = [];
  let filasVacias = 0;

  // Preferir hoja llamada "LOADING REPORT" (case-insensitive), sino la primera
  let sheet = wb.getWorksheet("LOADING REPORT");
  if (!sheet)
    sheet =
      wb.worksheets.find((s) => /loading report/i.test(s.name)) ||
      wb.worksheets[0];
  if (!sheet) throw new Error("El archivo Excel no contiene hojas");

  // Detectar fila de cabeceras (primera fila con >1 celda no vacía)
  let headerRowNumber = 1;

  for (let r = 1; r <= Math.min(10, sheet.rowCount); r++) {
    const row = sheet.getRow(r);
    // Revisamos si alguna celda de esta fila coincide con nuestra regla de 'ref_art'
    const esLaCabecera = row.values.some((valor) =>
      /REF.ART|item\s*no|^item$|sku/i.test(String(valor))
    );
    if (esLaCabecera) {
      headerRowNumber = r;
      break;
    }
  }

  const headerRow = sheet.getRow(headerRowNumber);
  console.log('[Carga] parseExcelBuffer - headerRowNumber detected:', headerRowNumber);

  // Mappings normalizados: regex para variantes de cabeceras -> claves canónicas
  // NOTA: las reglas más específicas deben ir antes que las genéricas
  const mappings = [
    [/REF.ART|item\s*no|^item$|sku|item code|ref|ref_art/i, "ref_art"],

    [/DESCRIPCION CHINO|description\s*chino|descripcion\s*china|chinese description/i, "descripcion_chino"],

    [/DESCRIPCION ESPAÑOL|bl\s*description|description of goods|\bdescription\b|descri?p?cion/i, "descripcion_espanol"],

    [/Fecha|fecha|date|ship date|shipment date|fecha de carga|delivery date/i, "fecha"],

    [/MATERIAL|material/i, "material"],

    [/MEDIDA DE CAJA|size|measurement|medida/i, "size"],

    [/MARCA DEL PRODUCTO|brand|marca/i, "marca_producto"],

    [/CANT. TOTAL|ctns|\bctn\b|carton|cartons?/i, "total_cajas"],

    [/CANT POR CAJA|qty\s*\/\s*ctn|qty per ctn|qty\/?ctn|qtyp?ctn|qtyctn/i, "cant_por_caja"],

    [/PRECIO\. UNIT|PRECIO\.\s*UNIT|PRECIO\s*UNIT|precio\s*unitario|unit\s*price|price\s*per\s*unit|precio_unidad|precio\s*unit/i, "precio_unidad"],

    [/UNIT|unit|unidad/i, "unidad"],

    [/CANT POR CAJA|cantidad.*caja|qty.*caja|quantity.*box/i, "cantidad_en_caja"],

    [/CANT\. TOTAL|ttl\s*qty|total\s*qty|ttl\s*quantity|total\s*quantity|ttl qty/i, "cantidad"],

    [/G.W.|ttl\s*g\.v|g\.v|gv|gw|gross weight/i, "gw"],
    [/G\.W\.TT|GW\.TT|g\.w\.tt|gw\.tt|gross weight total|total\s*gw|ttl\s*gw/i, "gw_total"],

    [/CBM|ttl\s*c\.b\.m|c\.b\.m|cbm|volume/i, "cbm"],
    [/CBM\.TT|cbm\.tt|c\.b\.m\.tt|C\.B\.M\.TT|total\s*cbm|ttl\s*cbm|volume total/i, "cbm_total"],

    [/serial|s\/?n|serial number|no\.\s*serie/i, "serial"],

    [/C\/N|cn\b|china name|chinese name/i, "cn"],

    [/PRECIO\. TOTAL|precio\s*total|total price|precio_total/i, "precio_total"],

    [/PHTO|^phto$|^pht0$|^phto$|^photo$/i, "imagen_embedded"],

    [/imagen_url|image url|image|imagen|foto|photo|img url/i, "imagen_url"],

    [/imagen_nombre|image name|nombre imagen|filename|file name/i, "imagen_nombre"],

    [/imagen_tipo|image type|tipo imagen|mime type|mimetype/i, "imagen_tipo"],

    [/CAJAS|cajas/i, "cajas"],
  ];

  const mapKey = (key) => {
    if (!key) return null;
    for (const [re, name] of mappings) if (re.test(key)) return name;
    return null;
  };

  const parseNumber = (v) => {
    if (v === null || v === undefined || v === "") return null;
    const s = String(v)
      .replace(/[^0-9,\.\-]/g, "")
      .replace(/,/g, ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const parseSize = (val) => {
    if (!val) return {};
    const s = String(val)
      .replace(/\s+/g, "")
      .replace(/cm/gi, "")
      .replace(/cm\./gi, "");
    const parts = s
      .split(/x|X|×|\*|\//)
      .map((p) => p.replace(/[^0-9\.\,\-]/g, "").replace(/,/g, "."))
      .filter(Boolean);
    const nums = parts.map((p) => Number(p)).filter(Number.isFinite);
    return {
      medida_largo: nums[0] || null,
      medida_ancho: nums[1] || null,
      medida_alto: nums[2] || null,
    };
  };

  // Construir mapa de columnas (evitar asignar la misma clave varias veces)
  const colMap = {};
  const mappedUsed = new Set();
  const sizeColumns = []; // Almacenar todas las columnas que mapean a "size"
  const sizeCellInfo = []; // Información sobre celdas con "MEDIDA DE CAJA" (pueden ser celdas combinadas)
  console.log(`[Carga] Data de sizeColumns y sizeCellInfo column at ${sizeColumns} (header: ${sizeCellInfo})`);
  
  headerRow.eachCell((cell, colNumber) => {
    const key = String(cell.value || "").trim();
    const mapped = mapKey(key);
    if (mapped) {
      if (mappedUsed.has(mapped)) {
        // Caso especial: múltiples columnas con el mismo nombre "MEDIDA DE CAJA" o "size"
        if (mapped === "size") {
          sizeColumns.push(colNumber);
          console.log(`[Carga] parseExcelBuffer - found duplicate 'size' column at ${colNumber} (header: ${key})`);
        } else {
          console.log(`[Carga] parseExcelBuffer - found duplicate mapping for '${mapped}' at column ${colNumber} (header: ${key})`);
        }
      } else {
        colMap[colNumber] = mapped;
        mappedUsed.add(mapped);
        // Si es la primera columna "size", también agregarla a sizeColumns
        if (mapped === "size") {
          sizeColumns.push(colNumber);
          // Detectar si es una celda combinada
          try {
            const isMerged = cell.isMerged;
            const masterCell = isMerged ? cell.master : cell;
            sizeCellInfo.push({
              startCol: colNumber,
              isMerged: isMerged,
              masterCell: masterCell
            });
            if (isMerged) {
              console.log(`[Carga] parseExcelBuffer - 'MEDIDA DE CAJA' encontrada en celda combinada en columna ${colNumber}`);
            }
          } catch (e) {
            // Si no se puede detectar celda combinada, continuar
            sizeCellInfo.push({ startCol: colNumber, isMerged: false });
          }
        }
      }
    }
  });
  
  // ORGANIZACIÓN DE MEDIDAS: Detectar y mapear columnas "MEDIDA DE CAJA"
  // Caso 1: Si hay 3 o más columnas "MEDIDA DE CAJA", mapearlas directamente como medida_largo, medida_ancho, medida_alto
  if (sizeColumns.length >= 3) {
    console.log(`[Carga] parseExcelBuffer - ✅ Detectadas ${sizeColumns.length} columnas 'MEDIDA DE CAJA', mapeando como medida_largo/medida_ancho/medida_alto`);
    // Remover el mapeo genérico "size" de estas columnas
    sizeColumns.forEach(colNum => {
      delete colMap[colNum];
    });
    // Mapear las 3 primeras como L, W, H (en orden)
    colMap[sizeColumns[0]] = "medida_largo";
    colMap[sizeColumns[1]] = "medida_ancho";
    colMap[sizeColumns[2]] = "medida_alto";
    console.log(`[Carga] parseExcelBuffer - Columnas mapeadas: ${sizeColumns[0]}=medida_largo, ${sizeColumns[1]}=medida_ancho, ${sizeColumns[2]}=medida_alto`);
    if (sizeColumns.length > 3) {
      console.log(`[Carga] parseExcelBuffer - ⚠️ Advertencia: Se encontraron ${sizeColumns.length} columnas 'MEDIDA DE CAJA', solo se usarán las primeras 3`);
    }
  } else if (sizeColumns.length === 2) {
    // Caso 2: Si hay 2 columnas, mapear como largo y ancho
    console.log(`[Carga] parseExcelBuffer - ✅ Detectadas 2 columnas 'MEDIDA DE CAJA', mapeando como medida_largo/medida_ancho`);
    sizeColumns.forEach(colNum => {
      delete colMap[colNum];
    });
    colMap[sizeColumns[0]] = "medida_largo";
    colMap[sizeColumns[1]] = "medida_ancho";
    console.log(`[Carga] parseExcelBuffer - Columnas mapeadas: ${sizeColumns[0]}=medida_largo, ${sizeColumns[1]}=medida_ancho`);
  } else if (sizeColumns.length === 1) {
    // Caso 3: Si solo hay 1 columna "MEDIDA DE CAJA", mantener el mapeo como "size" para parsearlo después
    console.log(`[Carga] parseExcelBuffer - ⚠️ Solo se detectó 1 columna 'MEDIDA DE CAJA' (columna ${sizeColumns[0]}), se intentará parsear como formato LxWxH`);
  }

  // Si detectamos 'size' mapeado, comprobar columnas adyacentes para L/W/H
  const looksNumericInColumn = (col, startRow, rowsToCheck = 24) => {
    let foundCount = 0;
    for (let rr = startRow; rr <= Math.min(sheet.rowCount, startRow + rowsToCheck - 1); rr++) {
      try {
        const v = sheet.getRow(rr).getCell(col).value;
        if (v === undefined || v === null) continue;
        const n = parseNumber(v);
        if (n !== null && n >= 0) { // Incluir 0 como válido
          foundCount++;
          if (foundCount >= 2) return true; // Si encontramos al menos 2 valores numéricos, considerarlo válido
        }
      } catch (e) {
        continue;
      }
    }
    return false;
  };

  // Función para obtener el valor numérico de una celda específica
  const getNumericValueFromCell = (row, col) => {
    try {
      const cell = row.getCell(col);
      if (!cell) return null;
      const value = cell.value !== undefined && cell.value !== null ? cell.value : null;
      return parseNumber(value);
    } catch (e) {
      return null;
    }
  };

  // Si aún hay columnas mapeadas como "size" (caso de 1 sola columna), buscar columnas adyacentes con valores numéricos
  // Esto es un fallback para cuando hay solo 1 columna "MEDIDA DE CAJA" pero las medidas están en columnas separadas
  for (const colStr of Object.keys(colMap)) {
    const colNum = Number(colStr);
    if (colMap[colNum] === "size") {
      // Buscar las 3 columnas siguientes que contengan valores numéricos
      const next1 = colNum + 1;
      const next2 = colNum + 2;
      const next3 = colNum + 3;
      
      // Verificar si estas columnas ya están mapeadas y si contienen valores numéricos
      if (
        !colMap[next1] &&
        !colMap[next2] &&
        !colMap[next3] &&
        looksNumericInColumn(next1, headerRowNumber + 1) &&
        looksNumericInColumn(next2, headerRowNumber + 1) &&
        looksNumericInColumn(next3, headerRowNumber + 1)
      ) {
        // Reasignar: las 3 columnas se interpretan como L, W, H
        colMap[next1] = "medida_largo";
        colMap[next2] = "medida_ancho";
        colMap[next3] = "medida_alto";
        // Eliminar el mapeo genérico "size"
        delete colMap[colNum];
        console.log(`[Carga] parseExcelBuffer - ✅ Columnas adyacentes detectadas: ${next1},${next2},${next3} -> medida_largo/medida_ancho/medida_alto`);
      } else {
        // Si no se encontraron columnas adyacentes, mantener "size" para parsearlo como formato LxWxH
        console.log(`[Carga] parseExcelBuffer - ⚠️ Columna 'MEDIDA DE CAJA' (${colNum}) sin columnas adyacentes numéricas. Se intentará parsear como formato LxWxH`);
      }
    }
  }
  console.log('[Carga] parseExcelBuffer - colMap built:', colMap);

  // Extraer imágenes por fila y por celda (fila:col) — intento seguro
  const imagesByRow = {};
  const imagesByCell = {}; // key = `${row}:${col}` -> array of base64
  try {
    const sheetImages = sheet.getImages();
    console.log(`[Carga] parseExcelBuffer - Total imágenes encontradas en Excel: ${sheetImages.length}`);
    
    for (const img of sheetImages) {
      const { imageId, range } = img;
      let rowIndex = null;
      let colIndex = null;
      
      // Intentar múltiples formas de obtener el índice de fila
      if (range && range.tl && typeof range.tl.row === "number")
        rowIndex = range.tl.row;
      else if (range && range.tl && typeof range.tl.nativeRow === "number")
        rowIndex = range.tl.nativeRow;
      else if (range && range.nativeRow) rowIndex = range.nativeRow;
      else if (range && typeof range.top === "number") rowIndex = range.top;
      
      // Intentar múltiples formas de obtener el índice de columna
      if (range && range.tl && typeof range.tl.col === "number")
        colIndex = range.tl.col;
      else if (range && range.tl && typeof range.tl.nativeCol === "number")
        colIndex = range.tl.nativeCol;
      else if (range && range.nativeCol) colIndex = range.nativeCol;
      else if (range && typeof range.left === "number") colIndex = range.left;

      // Obtener el buffer de la imagen
      const media =
        wb.model &&
        wb.model.media &&
        (wb.model.media[imageId - 1] ||
          wb.model.media.find((m) => m.index === imageId));
      
      if (!media || !media.buffer) {
        console.warn(`[Carga] parseExcelBuffer - Imagen ${imageId} sin buffer`);
        continue;
      }
      
      const b64 = media.buffer.toString("base64");
      console.log(`[Carga] parseExcelBuffer - Imagen ${imageId} extraída, tamaño base64: ${b64.length}, rowIndex: ${rowIndex}, colIndex: ${colIndex}`);

      // Normalizar índices: redondear decimales y convertir a enteros 1-based
      if (typeof rowIndex === 'number') {
        // Redondear índices decimales (ExcelJS puede devolver posiciones exactas con decimales)
        rowIndex = Math.round(rowIndex);
        // Asegurar que sea 1-based (si viene como 0-based, sumar 1)
        if (rowIndex === 0) rowIndex = 1;
        // Si el índice redondeado es menor que headerRowNumber, probablemente necesita ajuste
        if (rowIndex < headerRowNumber && rowIndex > 0) {
          rowIndex = rowIndex + 1;
        }
      }
      if (typeof colIndex === 'number') {
        // Redondear índices decimales
        colIndex = Math.round(colIndex);
        // Asegurar que sea 1-based
        if (colIndex === 0) colIndex = 1;
        else if (colIndex < 1) colIndex = 1;
      }

      if (rowIndex && rowIndex > 0) {
        // store by row (fallback) - usar índice redondeado
        const roundedRow = Math.round(rowIndex);
        imagesByRow[roundedRow] = imagesByRow[roundedRow] || [];
        imagesByRow[roundedRow].push(b64);
        console.log(`[Carga] parseExcelBuffer - Imagen asignada a fila ${roundedRow} (fallback, original: ${rowIndex})`);
        
        // También almacenar en filas adyacentes por si hay desajuste
        if (roundedRow > 1) {
          imagesByRow[roundedRow - 1] = imagesByRow[roundedRow - 1] || [];
          imagesByRow[roundedRow - 1].push(b64);
        }
        imagesByRow[roundedRow + 1] = imagesByRow[roundedRow + 1] || [];
        imagesByRow[roundedRow + 1].push(b64);
      }

      if (rowIndex && colIndex && rowIndex > 0 && colIndex > 0) {
        const roundedRow = Math.round(rowIndex);
        const roundedCol = Math.round(colIndex);
        const key = `${roundedRow}:${roundedCol}`;
        imagesByCell[key] = imagesByCell[key] || [];
        imagesByCell[key].push(b64);
        console.log(`[Carga] parseExcelBuffer - Imagen asignada a celda ${key} (row:col, original: ${rowIndex}:${colIndex})`);
      }
    }
    
    console.log(`[Carga] parseExcelBuffer - Resumen imágenes: ${Object.keys(imagesByRow).length} filas con imágenes, ${Object.keys(imagesByCell).length} celdas con imágenes`);
  } catch (e) {
    console.error("[Carga] extracción de imágenes falló:", e.message || e);
    console.error("[Carga] Stack:", e.stack);
  }

  // Extraer totales del Excel (G.W.TT y CBM.TT) - buscar en filas de totales o en el header
  let gw_total_excel = null;
  let cbm_total_excel = null;
  let total_cajas_excel = null;
  
  // Buscar columnas de totales en el header (mapeadas como gw_total y cbm_total)
  let gwTotalCol = null;
  let cbmTotalCol = null;
  
  // Buscar en el colMap las columnas mapeadas como gw_total y cbm_total
  for (const colStr of Object.keys(colMap)) {
    const colNum = Number(colStr);
    const mapped = colMap[colNum];
    if (mapped === 'gw_total') {
      gwTotalCol = colNum;
      console.log(`[Carga] parseExcelBuffer - Columna gw_total encontrada en columna ${colNum}`);
    }
    if (mapped === 'cbm_total') {
      cbmTotalCol = colNum;
      console.log(`[Carga] parseExcelBuffer - Columna cbm_total encontrada en columna ${colNum}`);
    }
  }
  
  // Si no se encontraron mapeadas, buscar por nombre de header
  if (!gwTotalCol || !cbmTotalCol) {
    headerRow.eachCell((cell, colNumber) => {
      const headerText = String(cell.value || '').trim().toUpperCase();
      if (/G\.W\.TT|GW\.TT|G\.W\.\s*TT|GROSS\s*WEIGHT\s*TOTAL|TOTAL\s*GW|TTL\s*GW/i.test(headerText)) {
        gwTotalCol = colNumber;
        console.log(`[Carga] parseExcelBuffer - Columna G.W.TT encontrada por nombre en columna ${colNumber}`);
      }
      if (/CBM\.TT|C\.B\.M\.TT|CBM\.\s*TT|TOTAL\s*CBM|TTL\s*CBM|VOLUME\s*TOTAL/i.test(headerText)) {
        cbmTotalCol = colNumber;
        console.log(`[Carga] parseExcelBuffer - Columna CBM.TT encontrada por nombre en columna ${colNumber}`);
      }
    });
  }
  
  // Buscar en las últimas filas del Excel (donde suelen estar los totales)
  const lastRows = Math.min(10, sheet.rowCount - headerRowNumber);
  for (let r = sheet.rowCount; r >= sheet.rowCount - lastRows && r > headerRowNumber; r--) {
    const row = sheet.getRow(r);
    if (!row) continue;
    
    // Buscar fila que contenga "TOTAL" o "TOTALES" o valores grandes que parezcan totales
    const rowText = row.values.filter(v => v !== null && v !== undefined).join(' ').toUpperCase();
    const isTotalRow = /TOTAL|TOTALES|SUM|SUMA|合计|总计/i.test(rowText);
    
    if (isTotalRow || r === sheet.rowCount) { // También revisar la última fila aunque no diga "TOTAL"
      if (gwTotalCol) {
        const cell = row.getCell(gwTotalCol);
        if (cell && cell.value !== null && cell.value !== undefined) {
          const val = parseNumber(cell.value);
          // Aceptar valores >= 0 (incluyendo 0, que es un valor válido del Excel)
          if (val !== null && val >= 0) {
            gw_total_excel = val;
            console.log(`[Carga] parseExcelBuffer - ✅ gw_total encontrado en fila ${r}, columna ${gwTotalCol}: ${gw_total_excel}`);
          }
        }
      }
      if (cbmTotalCol) {
        const cell = row.getCell(cbmTotalCol);
        if (cell && cell.value !== null && cell.value !== undefined) {
          const val = parseNumber(cell.value);
          // Aceptar valores >= 0 (incluyendo 0, que es un valor válido del Excel)
          if (val !== null && val >= 0) {
            cbm_total_excel = val;
            console.log(`[Carga] parseExcelBuffer - ✅ cbm_total encontrado en fila ${r}, columna ${cbmTotalCol}: ${cbm_total_excel}`);
          }
        }
      }
      
      // También buscar total_cajas en la misma fila
      const totalCajasCol = Object.keys(colMap).find(col => {
        const mapped = colMap[col];
        return mapped === 'total_cajas' || /TOTAL.*CAJAS|TOTAL.*CTNS/i.test(String(mapped));
      });
      if (totalCajasCol) {
        const cell = row.getCell(Number(totalCajasCol));
        if (cell && cell.value) {
          const val = parseNumber(cell.value);
          if (val !== null && val > 0) {
            total_cajas_excel = val;
            console.log(`[Carga] parseExcelBuffer - ✅ total_cajas encontrado en fila ${r}, columna ${totalCajasCol}: ${total_cajas_excel}`);
          }
        }
      }
      
      // Si encontramos al menos un total, continuar buscando en otras filas por si están separados
      if (gw_total_excel && cbm_total_excel) {
        break; // Ya tenemos ambos, no necesitamos seguir
      }
    }
  }
  
  console.log(`[Carga] parseExcelBuffer - Resumen de totales extraídos:`, {
    gw_total: gw_total_excel,
    cbm_total: cbm_total_excel,
    total_cajas: total_cajas_excel,
    gwTotalCol,
    cbmTotalCol
  });

  const normalized = [];
  // Recorrer filas después de headerRowNumber
  for (let r = headerRowNumber + 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    if (!row) {
      filasVacias++;
      continue;
    }
    const out = {};
    // Primero procesar todas las columnas mapeadas, excepto "size"
    // para tener disponibles medida_largo, medida_ancho, medida_alto si ya están mapeadas
    row.eachCell((cell, colNumber) => {
      const mapped = colMap[colNumber];
      if (!mapped || mapped === "size") return; // Saltar "size" por ahora
      const value =
        cell && cell.value && cell.value.text ? cell.value.text : cell.value;
      if (
        mapped === "medida_largo" ||
        mapped === "medida_ancho" ||
        mapped === "medida_alto"
      ) {
        const parsed = parseNumber(value);
        out[mapped] = parsed !== null ? parsed : null;
      } else if (mapped === "qty_per_ctn") {
        const parsed = parseNumber(value);
        out.cant_por_caja = parsed !== null ? parsed : null;
      } else if (mapped === "total_cajas") {
        const parsed = parseNumber(value);
        out.total_cajas = parsed !== null ? parsed : null;
      } else if (mapped === "cantidad") {
        const parsed = parseNumber(value);
        out.cantidad = parsed !== null ? parsed : null;
      } else if (mapped === "gw" || mapped === "cbm") {
        const parsed = parseNumber(value);
        out[mapped] = parsed !== null ? parsed : null;
      } else if (mapped === "precio_unidad" || mapped === "precio_total") {
        // Procesar precio_unidad y precio_total como números
        const parsed = parseNumber(value);
        out[mapped] = parsed !== null ? parsed : null;
        if (mapped === "precio_unidad") {
          console.log(`[Carga] parseExcelBuffer - Fila ${r}, Col ${colNumber}: precio_unidad parseado:`, {
            'valor_original': value,
            'valor_parseado': parsed,
            'tipo_original': typeof value
          });
        }
      } else {
        out[mapped] =
          value === undefined || value === null ? "" : String(value).trim();
      }
    });
    
    // Ahora procesar el campo "size" que puede usar las medidas ya mapeadas
    // IMPORTANTE: Si ya tenemos medidas desde columnas separadas (medida_largo, medida_ancho, medida_alto),
    // NO procesar el campo "size" para evitar sobrescribirlas
    const tieneMedidasSeparadas = (out.medida_largo !== null && out.medida_largo !== undefined) ||
                                   (out.medida_ancho !== null && out.medida_ancho !== undefined) ||
                                   (out.medida_alto !== null && out.medida_alto !== undefined);
    
    if (!tieneMedidasSeparadas) {
      // Solo procesar "size" si NO tenemos medidas desde columnas separadas
      row.eachCell((cell, colNumber) => {
        const mapped = colMap[colNumber];
        if (mapped !== "size") return; // Solo procesar "size" ahora
        const value =
          cell && cell.value && cell.value.text ? cell.value.text : cell.value;
        if (mapped === "size") {
          const raw = value === undefined || value === null ? "" : String(value);
          // Normalizar caracteres comunes y variantes de separador
          let cleaned = raw.replace(/\u00A0/g, " ").trim();
          cleaned = cleaned.replace(/\s+/g, "");
          cleaned = cleaned.replace(/[×✕✖＊*]/g, "x");
          cleaned = cleaned.replace(/\s*x\s*/gi, "x");
          const dims = parseSize(cleaned);
          
          // Guardar las medidas obtenidas del campo size
          let medida_largo = dims.medida_largo;
          let medida_ancho = dims.medida_ancho;
          let medida_alto = dims.medida_alto;
        
        // Si no obtuvo las tres medidas, intentar buscar en columnas adyacentes
        const nums = [
          medida_largo,
          medida_ancho,
          medida_alto,
        ].filter((v) => v !== null && v !== undefined);
        
        if (nums.length < 3) {
          // Buscar medidas faltantes en columnas adyacentes
          const sizeColNum = colNumber;
          const next1 = sizeColNum + 1;
          const next2 = sizeColNum + 2;
          const next3 = sizeColNum + 3;
          
          // Si las columnas adyacentes no están mapeadas, intentar obtener valores directamente
          if (!medida_largo && !colMap[next1]) {
            const val1 = getNumericValueFromCell(row, next1);
            if (val1 !== null && val1 >= 0) medida_largo = val1; // Permitir 0
          }
          if (!medida_ancho && !colMap[next2]) {
            const val2 = getNumericValueFromCell(row, next2);
            if (val2 !== null && val2 >= 0) medida_ancho = val2; // Permitir 0
          }
          if (!medida_alto && !colMap[next3]) {
            const val3 = getNumericValueFromCell(row, next3);
            if (val3 !== null && val3 >= 0) medida_alto = val3; // Permitir 0
          }
          
          // También intentar buscar en columnas anteriores (por si el orden es diferente)
          if (!medida_largo || !medida_ancho || !medida_alto) {
            const prev1 = sizeColNum - 1;
            const prev2 = sizeColNum - 2;
            const prev3 = sizeColNum - 3;
            
            if (!medida_largo && !colMap[prev1]) {
              const val1 = getNumericValueFromCell(row, prev1);
              if (val1 !== null && val1 >= 0) medida_largo = val1; // Permitir 0
            }
            if (!medida_ancho && !colMap[prev2]) {
              const val2 = getNumericValueFromCell(row, prev2);
              if (val2 !== null && val2 >= 0) medida_ancho = val2; // Permitir 0
            }
            if (!medida_alto && !colMap[prev3]) {
              const val3 = getNumericValueFromCell(row, prev3);
              if (val3 !== null && val3 >= 0) medida_alto = val3; // Permitir 0
            }
          }
        }
        
        // Asignar las medidas (pueden venir del parseSize o de columnas adyacentes)
        out.medida_largo = medida_largo;
        out.medida_ancho = medida_ancho;
        out.medida_alto = medida_alto;
        
        // Verificar si aún faltan medidas
        const finalNums = [
          medida_largo,
          medida_ancho,
          medida_alto,
        ].filter((v) => v !== null && v !== undefined);
        
        if (finalNums.length < 3) {
          console.log(`[Carga] parseExcelBuffer - Fila ${r}: size incompleto. Valor original: "${raw}", medidas encontradas: L=${medida_largo}, W=${medida_ancho}, H=${medida_alto}`);
          filasConError.push({
            row: r,
            field: "size",
            value: raw,
            message: "Se esperaban 3 medidas (LxWxH).",
          });
          out.size_original = raw;
          out.size_incomplete = true;
        } else {
          // Si ahora tenemos las 3 medidas, limpiar el flag de incompleto
          out.size_incomplete = false;
          console.log(`[Carga] parseExcelBuffer - Fila ${r}: size completo. L=${medida_largo}, W=${medida_ancho}, H=${medida_alto}`);
        }
        }
      });
    } else {
      // Si ya tenemos medidas desde columnas separadas, solo loguear
      console.log(`[Carga] parseExcelBuffer - Fila ${r}: Medidas ya asignadas desde columnas separadas. L=${out.medida_largo}, W=${out.medida_ancho}, H=${out.medida_alto}`);
    }
    
    // Procesar otros campos que puedan estar mapeados como "qty_per_ctn" u otros
    row.eachCell((cell, colNumber) => {
      const mapped = colMap[colNumber];
      if (mapped === "size" || mapped === "medida_largo" || mapped === "medida_ancho" || mapped === "medida_alto") return; // Ya procesados
      const value = cell && cell.value && cell.value.text ? cell.value.text : cell.value;
      if (mapped === "qty_per_ctn") {
        const parsed = parseNumber(value);
        out.cant_por_caja = parsed !== null ? parsed : null;
      } else if (mapped === "total_cajas") {
        const parsed = parseNumber(value);
        out.total_cajas = parsed !== null ? parsed : null;
      } else if (mapped === "cantidad_en_caja") {
        const parsed = parseNumber(value);
        out.cantidad_en_caja = parsed !== null ? parsed : null;
      } else if (mapped === "cantidad") {
        const parsed = parseNumber(value);
        out.cantidad = parsed !== null ? parsed : null;
      } else if (mapped === "gw" || mapped === "cbm") {
        const parsed = parseNumber(value);
        out[mapped] = parsed !== null ? parsed : null;
      } else if (mapped === "precio_unidad" || mapped === "precio_total") {
        // Procesar precio_unidad y precio_total como números
        const parsed = parseNumber(value);
        out[mapped] = parsed !== null ? parsed : null;
      } else {
        out[mapped] =
          value === undefined || value === null ? "" : String(value).trim();
      }
    });
    // Asignar imágenes por celda/columna según el mapeo de columnas
    for (const colStr of Object.keys(colMap)) {
      const colNum = Number(colStr);
      const mappedKey = colMap[colNum];
      if (!mappedKey) continue;
      
      // Buscar imagen en la celda exacta y también en celdas cercanas (por tolerancia a redondeo)
      const cellKeysToTry = [
        `${r}:${colNum}`,           // Celda exacta
        `${r}:${colNum - 1}`,      // Columna anterior
        `${r}:${colNum + 1}`,      // Columna siguiente
        `${r - 1}:${colNum}`,      // Fila anterior, misma columna
        `${r + 1}:${colNum}`,      // Fila siguiente, misma columna
      ];
      
      for (const cellKey of cellKeysToTry) {
        if (imagesByCell[cellKey] && imagesByCell[cellKey].length > 0) {
          // si la columna está mapeada a una clave de imagen, asignar todas las imágenes
          if (mappedKey === "imagen_embedded") {
            out.imagen_embedded = imagesByCell[cellKey][0];
            out.imagen_embedded_all = imagesByCell[cellKey];
            console.log(`[Carga] parseExcelBuffer - Fila ${r}: Imagen asignada desde celda ${cellKey} (columna mapeada como imagen_embedded)`);
            break; // Ya encontramos la imagen, no buscar más
          } else if (mappedKey === "imagen_url") {
            // no hay URL, pero podemos guardar primera imagen en imagen_data y nombre/tipo después
            out.imagen_data = imagesByCell[cellKey][0];
            out.imagen_data_all = imagesByCell[cellKey];
            console.log(`[Carga] parseExcelBuffer - Fila ${r}: Imagen asignada desde celda ${cellKey} (columna mapeada como imagen_url)`);
            break;
          } else {
            // asignar al campo mapeado si es genérico
            out[mappedKey] = imagesByCell[cellKey][0];
            out[`${mappedKey}_all`] = imagesByCell[cellKey];
            break;
          }
        }
      }
    }
    
    // Si no hay imagen en la celda, fallback por fila (buscar en fila actual y adyacentes)
    if (!out.imagen_embedded) {
      const rowsToCheck = [r, r - 1, r + 1, r - 2, r + 2]; // Fila actual y adyacentes
      for (const checkRow of rowsToCheck) {
        if (imagesByRow[checkRow] && imagesByRow[checkRow].length > 0) {
          out.imagen_embedded = imagesByRow[checkRow][0];
          out.imagen_embedded_all = imagesByRow[checkRow];
          console.log(`[Carga] parseExcelBuffer - Fila ${r}: Imagen asignada desde fila ${checkRow} (fallback), ${imagesByRow[checkRow].length} imagen(es) encontrada(s)`);
          break;
        }
      }
    }
    
    // Log si hay imagen o no
    if (out.imagen_embedded) {
      console.log(`[Carga] parseExcelBuffer - Fila ${r}: ✅ Imagen encontrada (tamaño base64: ${out.imagen_embedded.length})`);
    } else {
      console.log(`[Carga] parseExcelBuffer - Fila ${r}: ⚠️ No se encontró imagen`);
    }
    // Calcular cantidad aunque los valores sean 0 (usar comprobación explícita de null)
    if ((out.cantidad === null || out.cantidad === undefined) && out.cant_por_caja !== null && out.total_cajas !== null)
      out.cantidad = Number(out.cant_por_caja) * Number(out.total_cajas);
    const parsedCantidad = parseNumber(out.cantidad);
    out.cantidad = parsedCantidad !== null ? parsedCantidad : null;
    const parsedTotalCajas = parseNumber(out.total_cajas);
    out.total_cajas = parsedTotalCajas !== null ? parsedTotalCajas : null;
    const parsedUnidades = parseNumber(out.cant_por_caja);
    out.cant_por_caja = parsedUnidades !== null ? parsedUnidades : null;
    const hasContent =
      Object.keys(out).length > 0 &&
      Object.values(out).some((v) => v !== null && v !== "");
    if (hasContent) normalized.push(out);
    else filasVacias++;
  }

  // Si no hay filas, intentar fallback con xlsx
  if (normalized.length === 0) {
    try {
      const workbook2 = xlsx.read(buffer, { type: "buffer" });
      const sheetName2 =
        workbook2.SheetNames.find((n) => /loading report/i.test(n)) ||
        workbook2.SheetNames[0];
      const sheet2 = workbook2.Sheets[sheetName2];
      const data2 = xlsx.utils.sheet_to_json(sheet2, { defval: "" });


      // Log resumen para depuración
      try {
        console.log('[Carga] parseExcelBuffer - filas normalizadas:', normalized.length);
        if (normalized.length > 0) console.log('[Carga] parseExcelBuffer - ejemplo fila[0]:', normalized[0]);
      } catch (e) {
        // ignore
      }
      // Normalizar filas del fallback de xlsx usando las mismas reglas
      const normalized2 = [];
      for (const row of data2) {
        const out = {};
        for (const rawKey of Object.keys(row)) {
          const mapped = mapKey(String(rawKey).trim());
          if (!mapped) continue;
          const value = row[rawKey];
          if (mapped === "size") {
            const raw =
              value === undefined || value === null ? "" : String(value);
            let cleaned = raw.replace(/\u00A0/g, " ").trim();
            cleaned = cleaned.replace(/\s+/g, "");
            cleaned = cleaned.replace(/[×✕✖＊*]/g, "x");
            cleaned = cleaned.replace(/\s*x\s*/gi, "x");
            const dims = parseSize(cleaned);
            
            // Guardar las medidas obtenidas del campo size
            let medida_largo = dims.medida_largo;
            let medida_ancho = dims.medida_ancho;
            let medida_alto = dims.medida_alto;
            
            // Verificar si ya tenemos medidas desde otras columnas mapeadas
            if (!medida_largo && out.medida_largo) medida_largo = out.medida_largo;
            if (!medida_ancho && out.medida_ancho) medida_ancho = out.medida_ancho;
            if (!medida_alto && out.medida_alto) medida_alto = out.medida_alto;
            
            // Asignar las medidas
            out.medida_largo = medida_largo;
            out.medida_ancho = medida_ancho;
            out.medida_alto = medida_alto;
            
            const nums = [
              medida_largo,
              medida_ancho,
              medida_alto,
            ].filter((v) => v !== null && v !== undefined);
            if (nums.length < 3) {
              filasConError.push({
                row: row,
                field: "size",
                value: raw,
                message: "Se esperaban 3 medidas (LxWxH).",
              });
              out.size_original = raw;
              out.size_incomplete = true;
            } else {
              out.size_incomplete = false;
            }
          } else if (mapped === "qty_per_ctn") {
            const parsed = parseNumber(value);
            out.cant_por_caja = parsed !== null ? parsed : null;
          } else if (mapped === "total_cajas") {
            const parsed = parseNumber(value);
            out.total_cajas = parsed !== null ? parsed : null;
          } else if (mapped === "cantidad_en_caja") {
            const parsed = parseNumber(value);
            out.cantidad_en_caja = parsed !== null ? parsed : null;
          } else if (mapped === "cantidad") {
            const parsed = parseNumber(value);
            out.cantidad = parsed !== null ? parsed : null;
          } else if (mapped === "gw" || mapped === "cbm") {
            const parsed = parseNumber(value);
            out[mapped] = parsed !== null ? parsed : null;
          } else {
            out[mapped] =
              value === undefined || value === null ? "" : String(value).trim();
          }
        }

        if ((out.cantidad === null || out.cantidad === undefined) && out.cant_por_caja !== null && out.total_cajas !== null)
          out.cantidad = Number(out.cant_por_caja) * Number(out.total_cajas);
        const parsedCantidad2 = parseNumber(out.cantidad);
        out.cantidad = parsedCantidad2 !== null ? parsedCantidad2 : null;
        const parsedTotalCajas2 = parseNumber(out.total_cajas);
        out.total_cajas = parsedTotalCajas2 !== null ? parsedTotalCajas2 : null;
        const parsedUnidades2 = parseNumber(out.cant_por_caja);
        out.cant_por_caja = parsedUnidades2 !== null ? parsedUnidades2 : null;

        const hasContent =
          Object.keys(out).length > 0 &&
          Object.values(out).some((v) => v !== null && v !== "");
        if (hasContent) normalized2.push(out);
        else filasVacias++;
      }

      return { normalized: normalized2, filasConError, filasVacias };
    } catch (e) {
      // devolver lo ya parseado (vacío)
    }
  }

  return { 
    normalized, 
    filasConError, 
    filasVacias,
    totales: {
      gw_total: gw_total_excel,
      cbm_total: cbm_total_excel,
      total_cajas: total_cajas_excel
    }
  };
};

export const procesarExcel = async (req, res) => {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "No se ha subido ningún archivo" });
    console.log("[Carga] procesarExcel - file received:", {
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
    const { normalized, filasConError, filasVacias, totales } = await parseExcelBuffer(
      req.file.buffer
    );
    if (!normalized || normalized.length === 0)
      return res
        .status(400)
        .json({
          success: false,
          message: "El archivo Excel está vacío o no contiene filas válidas",
        });
    // Calcular número único de filas con error (evitar contar múltiples errores de la misma fila)
    const uniqueErrorRows = new Set();
    for (const e of filasConError) {
      if (!e) continue;
      if (typeof e.row === 'number') uniqueErrorRows.add(e.row);
      else if (e.row && typeof e.row === 'string') uniqueErrorRows.add(e.row);
      else {
        // fallback: usar representación corta del objeto de error
        try {
          uniqueErrorRows.add(JSON.stringify(e).slice(0, 200));
        } catch (ex) {
          uniqueErrorRows.add(String(e));
        }
      }
    }

    const filasConErrorCount = uniqueErrorRows.size || filasConError.length || 0;
    const filasExitosasCalc = Math.max(0, normalized.length - filasConErrorCount);

    const estadisticas = {
      filasExitosas: filasExitosasCalc,
      filasConError: filasConErrorCount,
      filasVacias: filasVacias || 0,
      totalFilas: normalized.length,
    };
    return res.json({
      success: true,
      message: "Excel parseado y normalizado correctamente",
      data: normalized,
      filasConError,
      estadisticas,
      totales: totales || null, // Incluir totales extraídos del Excel
    });
  } catch (error) {
    console.error("Error procesando Excel:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Obtener cargas del usuario
export const getMisCargas = async (req, res) => {
  try {
    const userId = req.user?.id;

    const cargas = await carga.executeQuery(
      `
      SELECT * FROM carga 
      WHERE creado_por = ? 
      ORDER BY fecha_creacion DESC
    `,
      [userId]
    );

    res.json({
      success: true,
      data: cargas,
    });
  } catch (error) {
    console.error("Error obteniendo cargas:", error);
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
      message: "QRs generados correctamente",
      data: qrCodes,
    });
  } catch (error) {
    console.error("Error generando QRs:", error);
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
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="QR_Carga_${cargaId}.pdf"`,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generando PDF:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Guardar packing list con estructura JSON y generar cajas/artículos (compatibilidad cliente)
export const guardarConQR = async (req, res) => {
  try {
    const payload = req.body || {};
    console.log('[Carga] guardarConQR - payload keys:', Object.keys(payload));
    console.log('[Carga] guardarConQR - payload sample:', {
      cargaMeta: payload.infoCarga || payload.carga || payload.meta || null,
      firstItem: (payload.datosExcel || payload.articulos || payload.items || payload.articulos_lista || [])[0] || null
    });
    const cargaMeta = payload.infoCarga || payload.carga || payload.meta || {};
    const infoClientePayload =
      payload.infoCliente || payload.cliente || payload.customer || {};
    const items =
      payload.datosExcel ||
      payload.articulos ||
      payload.items ||
      payload.articulos_lista ||
      [];

    // Detectar si `items` viene como array de arrays (primer elemento = cabeceras)
    // y convertir a array de objetos usando cabeceras como claves.
    const isArrayOfArrays =
      Array.isArray(items) && items.length > 0 && Array.isArray(items[0]);
    if (isArrayOfArrays) {
      console.log('[Carga] guardarConQR - items recibido como array de arrays. Realizando mapeo.');
      const headers = items[0].map(h => (h === null || h === undefined ? '' : String(h).trim()));

      // Función para mapear variantes de header a claves canónicas (pequeña versión)
      const normalizeHeader = (h) => {
        if (!h) return null;
        const s = h.toString().toLowerCase();
        if (/ref\.art|item\s*no|^item$|sku|item code|ref\b/.test(s)) return 'ref_art';
        if (/descripcion chino|description chino|descripcion china|chinese description|descripcion_chino/.test(s)) return 'descripcion_chino';
        if (/descripcion espa|bdescription\b|descri?p?cion/.test(s)) return 'descripcion_espanol';
        if (/fecha|ship date|delivery date/.test(s)) return 'fecha';
        if (/material/.test(s)) return 'material';
        if (/MEDIDA DE CAJA|medida|size|measurement/.test(s)) return 'size';
        if (/marca|brand/.test(s)) return 'marca_producto';
        if (/ctns|carton|total\s*cajas|cant\. total/.test(s)) return 'total_cajas';
        if (/qty\s*per|unidades x empaque|qty\/?ctn/.test(s)) return 'cant_por_caja';
        if (/unit|unidad/.test(s)) return 'unidad';
        if (/cantidad.*caja|qty.*caja|quantity.*box/.test(s)) return 'cantidad_en_caja';
        if (/cantidad|total\s*qty|ttl\s*qty/.test(s)) return 'cantidad';
        if (/g\.w|gw|gross weight/.test(s)) return 'gw';
        if (/cbm|volume/.test(s)) return 'cbm';
        if (/serial|s\/?n|serial number/.test(s)) return 'serial';
        if (/cn|china name|chinese name/.test(s)) return 'cn';
        if (/precio.*unit|unit price|precio unitario/.test(s)) return 'precio_unidad';
        if (/precio.*total|total price/.test(s)) return 'precio_total';
        if (/imagen|photo|img/.test(s)) return 'imagen_url';
        return s.replace(/\s+/g, '_');
      };

      const mapped = [];
      for (let r = 1; r < items.length; r++) {
        const row = items[r];
        const obj = {};
        for (let c = 0; c < headers.length; c++) {
          const rawKey = headers[c] || `col_${c}`;
          const key = normalizeHeader(rawKey) || rawKey;
          const value = row[c];
          obj[key] = value;
        }
        mapped.push(obj);
      }
      console.log('[Carga] guardarConQR - mapeo completado, filas mapeadas:', mapped.length);
      // reemplazar items por los objetos mapeados
      items.length = 0;
      mapped.forEach(o => items.push(o));
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No hay artículos para guardar" });
    }

    // Resolver o crear cliente: preferir id en cargaMeta, luego buscar por correo en payload o req.user
    let id_cliente_payload =
      cargaMeta.id_cliente || cargaMeta.cliente_id || null;

    if (!id_cliente_payload) {
      const correoToCheck =
        infoClientePayload.correo_cliente ||
        infoClientePayload.email ||
        req.user?.email;
      if (correoToCheck) {
        const clienteByEmail = await databaseRepository.clientes.findOne({
          correo_cliente: correoToCheck,
        });
        if (clienteByEmail) id_cliente_payload = clienteByEmail.id_cliente;
      }
    }

    // Si aún no hay cliente, crear uno a partir del payload infoCliente
    if (
      !id_cliente_payload &&
      infoClientePayload &&
      (infoClientePayload.nombre_cliente || infoClientePayload.correo_cliente)
    ) {
      // El campo pais_cliente debe tomar el NOMBRE del país (ej: "Colombia"), no el código numérico
      // El código numérico con "+" se mantiene para WhatsApp
      const paisCliente = infoClientePayload.pais_cliente || infoClientePayload.country || null;

      const newClienteData = {
        nombre_cliente:
          infoClientePayload.nombre_cliente ||
          infoClientePayload.name ||
          infoClientePayload.correo_cliente,
        correo_cliente:
          infoClientePayload.correo_cliente || infoClientePayload.email || null,
        telefono_cliente:
          infoClientePayload.telefono_cliente ||
          infoClientePayload.phone ||
          null,
        pais_cliente: paisCliente,
        ciudad_cliente: infoClientePayload.ciudad_cliente || infoClientePayload.city || null,
        direccion_entrega: infoClientePayload.direccion_entrega || null,
        cliente_shippingMark: infoClientePayload.cliente_shippingMark || infoClientePayload.shippingMark || infoClientePayload.shipping_mark || null,
      };
      try {
        const created = await databaseRepository.clientes.create(
          newClienteData
        );
        id_cliente_payload = created.id_cliente || created.id || created.lastID;
      } catch (createErr) {
        console.warn(
          "[Carga] No se pudo crear cliente automáticamente:",
          createErr.message
        );
      }
    }

    if (!id_cliente_payload) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Falta id_cliente en el payload y no se pudo determinar o crear automáticamente.",
        });
    }

    const destino_payload = cargaMeta.destino || cargaMeta.dest || null;
    let clientePayloadInfo = null;
    if (!destino_payload && req.user?.email) {
      clientePayloadInfo = await databaseRepository.clientes.findOne({
        correo_cliente: req.user.email,
      });
    }

    // Determinar destino: priorizar cargaMeta, luego cliente de BD, finalmente null
    const destino_final =
      destino_payload ||
      cargaMeta.ciudad_destino ||
      cargaMeta.direccion_destino ||
      clientePayloadInfo?.ciudad_cliente ||
      clientePayloadInfo?.pais_cliente ||
      null; // NULL en lugar de "Destino no especificado" para permitir que se actualice después

    // Usar transacción para evitar SQLITE_BUSY
    const { transaction } = databaseRepository;
    
    // Ejecutar todo el proceso de guardado dentro de una transacción
    const resultado = await transaction.executeInTransaction(async () => {
      // Idempotencia: si nos llega un codigo_carga ya existente con articulos, devolverlo
      if (cargaMeta.codigo_carga) {
        const existente = await carga.findOne({ codigo_carga: cargaMeta.codigo_carga });
        if (existente) {
          const existingArticles = await articulos.findAll({ id_carga: existente.id_carga || existente.id });
          if (existingArticles && existingArticles.length > 0) {
            console.log('[Carga] guardarConQR - carga ya existe, devolviendo existente:', cargaMeta.codigo_carga);
            return {
              success: true,
              data: { carga: { id: existente.id_carga || existente.id, codigo: existente.codigo_carga } },
              isExisting: true
            };
          }
        }
      }

      // Helper para convertir fecha de datetime-local a formato SQLite
      const convertirFecha = (fecha) => {
        if (!fecha || fecha.trim() === '') return null;
        // Si ya está en formato ISO o SQLite, retornarlo
        if (fecha.includes('T') && fecha.length > 10) {
          // Formato datetime-local: "YYYY-MM-DDTHH:mm" -> convertir a "YYYY-MM-DD HH:mm:ss"
          return fecha.replace('T', ' ') + ':00';
        }
        return fecha;
      };

      // Preparar datos de la carga con todos los campos
      const cargaData = {
        codigo_carga: cargaMeta.codigo_carga || `CARGA-${Date.now()}`,
        estado: cargaMeta.estado || "En bodega China",
        id_cliente: id_cliente_payload,
        destino: destino_final || cargaMeta.destino || cargaMeta.ciudad_destino || cargaMeta.direccion_destino || null,
        shipping_mark: cargaMeta.shipping_mark || cargaMeta.shippingMark || null,
        ubicacion_actual: cargaMeta.ubicacion_actual || "China",
        fecha_recepcion: convertirFecha(cargaMeta.fecha_recepcion),
        fecha_envio: convertirFecha(cargaMeta.fecha_envio),
        fecha_arribo: convertirFecha(cargaMeta.fecha_arribo),
        contenedor_asociado: cargaMeta.contenedor_asociado || cargaMeta.contenedor || null,
        observaciones: cargaMeta.observaciones || cargaMeta.notes || null
      };

      const nuevaCargaRes = await carga.create(cargaData);
      const cargaId =
        nuevaCargaRes.id_carga || nuevaCargaRes.id || nuevaCargaRes.lastID;

      // Helper para convertir números permitiendo 0 y comas decimales
      const parseNullableNumber = (v) => {
        // Si ya es un número válido, retornarlo directamente (incluyendo 0)
        if (typeof v === 'number' && Number.isFinite(v)) {
          return v;
        }
        // Si es null, undefined o string vacío, retornar null
        if (v === null || v === undefined || v === '') return null;
        // Si es string, limpiar y convertir
        const s = String(v).trim();
        if (s === '' || s === 'null' || s === 'undefined') return null;
        // Limpiar caracteres no numéricos (similar a parseNumber)
        const cleaned = s.replace(/[^0-9,\.\-]/g, "").replace(/,/g, ".");
        const n = Number(cleaned);
        return Number.isFinite(n) ? n : null;
      };

      // Normalizar y mapear campos esperados por la BD
      const filasConError = [];
      //Este es el for por cada artículo (fila) del archivo de Excel
      for (const it of items) {
      try {
        // Log del objeto completo para depuración (solo las claves relacionadas con precio y medidas)
        const precioKeys = Object.keys(it).filter(k => /precio/i.test(k));
        const medidaKeys = Object.keys(it).filter(k => /medida|ancho|largo|alto|width|height|length/i.test(k));
        
        console.log('[Carga] DEBUG - Claves relacionadas con precio en it:', precioKeys);
        console.log('[Carga] DEBUG - Claves relacionadas con medidas en it:', medidaKeys);
        console.log('[Carga] DEBUG - Valores de precio encontrados:', precioKeys.reduce((acc, k) => {
          acc[k] = it[k];
          return acc;
        }, {}));
        console.log('[Carga] DEBUG - Valores de medidas encontrados:', medidaKeys.reduce((acc, k) => {
          acc[k] = it[k];
          return acc;
        }, {}));
        
        // Campos normalizados (intentar detectar variantes comunes de columnas Excel)
        const ref_art =
          it.ref_art ||
          it.ref ||
          it.REF ||
          it.referencia ||
          it.REFERENCIA ||
          it.REF_ART ||
          null;
        const descripcion_espanol =
          it.descripcion_espanol ||
          it.descripcion ||
          it.DESCRIPCION ||
          it.Descripcion ||
          it.description ||
          null;
        const descripcion_chino =
          it.descripcion_chino ||
          it.DESCRIPCION_CHINO ||
          it.descripcion_china ||
          null;
        const cn = it.cn || it.CN || null;
        const fecha = it.fecha || it.Fecha || null;
        // Detectar unidad preferida (ej. 'psc', 'pcs', 'pc'). Si viene como '0' o vacío,
        // buscar en el resto de campos una cadena que coincida con unidades comunes.
        const detectUnitFromObj = (obj) => {
          if (!obj) return null;
          const unitRe = /\b(pcs?|psc|pc)\b/i;
          for (const k of Object.keys(obj)) {
            const v = obj[k];
            if (!v) continue;
            try {
              const s = String(v).trim();
              if (unitRe.test(s)) return s.match(unitRe)[0].toLowerCase();
            } catch (e) {
              continue;
            }
          }
          return null;
        };

        let unidad = it.unidad || it.UNIDAD || null;
        let unidadDetectada = false;
        if (!unidad || unidad === '0' || String(unidad).trim() === '') {
          const detected = detectUnitFromObj(it);
          if (detected) {
            unidad = detected;
            unidadDetectada = true;
          }
        }
        // Normalizar variantes a 'psc' SOLO si la unidad fue detectada por heurística.
        const normalizeUnit = (u) => {
          if (!u) return u;
          const s = String(u).toLowerCase();
          if (/^pcs?$/.test(s)) return 'psc';
          if (s === 'psc') return 'psc';
          return s;
        };
        if (unidadDetectada) unidad = normalizeUnit(unidad);
        
        // Buscar precio_unidad en múltiples variantes de claves (mayúsculas, minúsculas, etc.)
        // IMPORTANTE: Verificar primero las claves más probables desde parseExcelBuffer
        let precio_unidad_raw = it.precio_unidad ?? 
          it.PRECIO_UNIDAD ?? 
          it.PRECIO_UNITARIO ?? 
          it.precio_unitar ?? 
          it.precio_unit ?? 
          it.precio ??
          it.PRECIO ??
          null;
        
        console.log(`[Carga] DEBUG precio_unidad para ref_art: ${ref_art || 'N/A'}:`, {
          'precio_unidad_raw': precio_unidad_raw,
          'tipo': typeof precio_unidad_raw,
          'todas_las_claves': Object.keys(it).filter(k => /precio/i.test(k))
        });
        
        const precio_unidad = parseNullableNumber(precio_unidad_raw);
        
        console.log(`[Carga] DEBUG precio_unidad parseado para ref_art: ${ref_art || 'N/A'}:`, precio_unidad);
        
        // Buscar precio_total en múltiples variantes
        const precio_total = parseNullableNumber(
          it.precio_total ?? 
          it.PRECIO_TOTAL ?? 
          it.total_price ?? 
          it.total ??
          null
        );
        const material = it.material || null;
        const cant_por_caja = parseNullableNumber(
          it.cant_por_caja ?? it.unidades ?? it.units ?? null
        );
        const marca_producto = it.marca_producto || it.marca || null;
        const serial = it.serial || null;
        
        // Buscar medida_largo en múltiples variantes
        const medida_largo = parseNullableNumber(
          it.medida_largo ?? 
          it.MEDIDA_LARGO ?? 
          it.largo ?? 
          it.LARGO ?? 
          it.length ?? 
          it.LENGTH ??
          null
        );
        
        // Buscar medida_ancho en múltiples variantes
        const medida_ancho = parseNullableNumber(
          it.medida_ancho ?? 
          it.MEDIDA_ANCHO ?? 
          it.ancho ?? 
          it.ANCHO ?? 
          it.width ?? 
          it.WIDTH ??
          null
        );
        
        // Buscar medida_alto en múltiples variantes
        const medida_alto = parseNullableNumber(
          it.medida_alto ?? 
          it.MEDIDA_ALTO ?? 
          it.alto ?? 
          it.ALTO ?? 
          it.height ?? 
          it.HEIGHT ??
          null
        );
        const cbm_art = parseNullableNumber(it.cbm ?? it.CBM ?? null);
        const gw_art = parseNullableNumber(it.gw ?? it.GW ?? null);
        const imagen_url = it.imagen_url || it.imagen || it.imagenUrl || null;
        let imagen_nombre = it.imagen_nombre || it.imagenName || null;
        let imagen_tipo = it.imagen_tipo || it.imagenTipo || null;
        // Obtener imagen_embedded, pero filtrar strings vacíos
        let imagen_embedded = it.imagen_embedded || it.imagen_embedded_all?.[0] || null;
        // Si es string vacío, tratarlo como null
        if (imagen_embedded === '' || (typeof imagen_embedded === 'string' && imagen_embedded.trim().length === 0)) {
          imagen_embedded = null;
        }

        console.log(`[Carga] guardarConQR - Procesando imagen para ref_art: ${ref_art}`);
        console.log(`[Carga] guardarConQR - imagen_embedded presente: ${!!imagen_embedded}, tipo: ${typeof imagen_embedded}, tamaño: ${imagen_embedded ? imagen_embedded.length : 0}`);
        if (imagen_embedded) {
          console.log(`[Carga] guardarConQR - Primeros 50 chars de imagen_embedded: ${String(imagen_embedded).substring(0, 50)}...`);
        }

        // Detect mime-type from base64 signature when embedded image is present
        let imagen_data = null;
        if (imagen_embedded) {
          imagen_data = imagen_embedded; // keep base64 string
          try {
            const buf = Buffer.from(imagen_embedded, "base64");
            const sig = buf.slice(0, 4).toString("hex").toUpperCase();
            let detected = null;
            if (sig.startsWith("89504E47")) detected = "image/png";
            else if (sig.startsWith("FFD8FF")) detected = "image/jpeg";
            else if (sig.startsWith("47494638")) detected = "image/gif";
            else detected = "application/octet-stream";
            
            if (!imagen_tipo) imagen_tipo = detected;
            if (!imagen_nombre) {
              const ext =
                imagen_tipo === "image/png"
                  ? "png"
                  : imagen_tipo === "image/jpeg"
                    ? "jpg"
                    : imagen_tipo === "image/gif"
                      ? "gif"
                      : "bin";
              imagen_nombre = `${(ref_art || "imagen")
                .toString()
                .replace(/\s+/g, "_")}_${Date.now()}.${ext}`;
            }
            
            console.log(`[Carga] guardarConQR - Imagen detectada: tipo=${imagen_tipo}, nombre=${imagen_nombre}, tamaño buffer=${buf.length}`);
          } catch (e) {
            console.error(`[Carga] guardarConQR - Error procesando imagen embebida:`, e.message);
            // ignore detection errors, keep original fields if any
            if (!imagen_nombre)
              imagen_nombre = `${(ref_art || "imagen")
                .toString()
                .replace(/\s+/g, "_")}_${Date.now()}.bin`;
            if (!imagen_tipo) imagen_tipo = "application/octet-stream";
          }
        } else {
          console.log(`[Carga] guardarConQR - No hay imagen embebida para ref_art: ${ref_art}`);
        }
        const mis_cajas =
          Number(
            it.cajas ?? it.CAJAS ?? 1
          ) || 1;
        // CANT POR CAJA ahora se mapea correctamente a cantidad_en_caja
        const cantidad_en_caja = parseNullableNumber(
          it.cantidad_en_caja ?? it.cantidad_por_caja ?? null
        );
        
        // CANT. TOTAL es la cantidad total
        const cantidad = parseNullableNumber(
          it.cantidad ?? it.Cantidad ?? it.QTY ?? it.qty ?? it.unidades ?? null
        );
        
        const numCajas = Math.max(
          1,
          Number(
            it.cajas ?? it.total_cajas ?? it.Cajas ?? it.Total ?? it.total ?? 1
          ) || 1
        );
        
        // Si no hay cantidad_en_caja pero hay cantidad y cajas, calcular
        const cantidad_en_caja_final = cantidad_en_caja !== null && cantidad_en_caja !== undefined
          ? cantidad_en_caja
          : (cantidad !== null && cantidad !== undefined && numCajas > 0
              ? Math.ceil(cantidad / numCajas)
              : null);

        // Log de valores parseados antes de crear articuloData
        console.log(`[Carga] Valores parseados para ref_art: ${ref_art}:`, {
          precio_unidad,
          precio_total,
          medida_largo,
          medida_ancho,
          medida_alto,
          cant_por_caja,
          cbm_art,
          gw_art
        });

        const articuloData = {
          id_carga: cargaId,
          ref_art: ref_art,
          descripcion_espanol:
            descripcion_espanol || ref_art || `Artículo ${Date.now()}`,
          descripcion_chino,
          cn,
          fecha,
          unidad,
          precio_unidad: precio_unidad !== null && precio_unidad !== undefined ? Number(precio_unidad) : null,
          precio_total: precio_total !== null && precio_total !== undefined ? Number(precio_total) : null,
          material,
          cant_por_caja:
            cant_por_caja !== null && cant_por_caja !== undefined ? Number(cant_por_caja) : null,
          marca_producto,
          serial,
          medida_largo:
            medida_largo !== null && medida_largo !== undefined ? Number(medida_largo) : null,
          medida_ancho:
            medida_ancho !== null && medida_ancho !== undefined ? Number(medida_ancho) : null,
          medida_alto:
            medida_alto !== null && medida_alto !== undefined ? Number(medida_alto) : null,
          cbm: cbm_art !== null && cbm_art !== undefined ? Number(cbm_art) : null,
          gw: gw_art !== null && gw_art !== undefined ? Number(gw_art) : null,
          imagen_url: imagen_url || null,
          imagen_nombre: imagen_nombre || null,
          imagen_tipo: imagen_tipo || null,
          imagen_data: imagen_data || null, // Base64 string - SQLite puede guardarlo como TEXT o BLOB
          cantidad: mis_cajas,
        };
        
        // Log detallado de campos de imagen
        console.log('[Carga][DBG] Campos de imagen antes de CREATE:', {
          imagen_nombre: articuloData.imagen_nombre || 'NULL',
          imagen_tipo: articuloData.imagen_tipo || 'NULL',
          imagen_data: articuloData.imagen_data ? `PRESENTE (${articuloData.imagen_data.length} chars)` : 'NULL',
          imagen_url: articuloData.imagen_url ? `PRESENTE (${articuloData.imagen_url.length} chars)` : 'NULL'
        });

        // Normalizar campos numéricos - mantener null si no hay valor, convertir a número si hay valor válido
        // IMPORTANTE: No forzar a 0 valores null, ya que la BD permite NULL para estos campos
        const numericFields = [
          'precio_unidad',
          'precio_total',
          'cant_por_caja',
          'medida_largo',
          'medida_ancho',
          'medida_alto',
          'cbm',
          'gw',
          'cantidad'
        ];
        for (const k of numericFields) {
          const currentValue = articuloData[k];
          console.log(`[Carga] Campo ${k}:`, currentValue, typeof currentValue);
          
          // Si es null o undefined, mantener null (NO convertir a 0)
          if (currentValue === undefined || currentValue === null) {
            articuloData[k] = null;
          } else {
            // Convertir a número, pero mantener el valor incluso si es 0
            const numValue = Number(currentValue);
            if (Number.isFinite(numValue)) {
              // Valor numérico válido (incluyendo 0)
              articuloData[k] = numValue;
            } else {
              // Si no es un número válido, mantener null en lugar de 0
              console.warn(`[Carga] Campo ${k} no es un número válido: ${currentValue}, estableciendo a null`);
              articuloData[k] = null;
            }
          }
        }
        
        // Log de valores finales después de normalización
        console.log(`[Carga] Valores finales después de normalización para ref_art: ${ref_art}:`, {
          precio_unidad: articuloData.precio_unidad,
          precio_total: articuloData.precio_total,
          medida_largo: articuloData.medida_largo,
          medida_ancho: articuloData.medida_ancho,
          medida_alto: articuloData.medida_alto,
          cant_por_caja: articuloData.cant_por_caja,
          cbm: articuloData.cbm,
          gw: articuloData.gw
        });

        // Log de imagen antes de crear
        console.log('[Carga][DBG] Imagen antes de CREATE:', {
          tiene_imagen_data: !!articuloData.imagen_data,
          tiene_imagen_url: !!articuloData.imagen_url,
          imagen_nombre: articuloData.imagen_nombre,
          imagen_tipo: articuloData.imagen_tipo,
          tamaño_imagen_data: articuloData.imagen_data ? articuloData.imagen_data.length : 0,
          tamaño_imagen_url: articuloData.imagen_url ? articuloData.imagen_url.length : 0
        });
        
        console.log('[Carga][DBG] articuloData normalizado (antes de CREATE):', JSON.stringify({
          ...articuloData,
          imagen_data: articuloData.imagen_data ? `[BASE64: ${articuloData.imagen_data.length} chars]` : null,
          imagen_url: articuloData.imagen_url ? `[URL: ${articuloData.imagen_url.length} chars]` : null
        }));
        
        //CREATE articulo packinglist
        const articuloRes = await articulos.create(articuloData);
        console.log('[Carga][DBG] articuloRes retornado:', articuloRes);
        const articuloId =
          articuloRes.id_articulo || articuloRes.id || articuloRes.lastID;
        if (!articuloId)
          throw new Error("No se pudo obtener id del artículo creado");

        // Si hay imagen embebida, persistirla en disco y actualizar imagen_url
        try {
          if (articuloData.imagen_data) {
            const imagesDir = path.resolve(process.cwd(), UPLOAD_PATHS.images || 'uploads/images');
            if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
            // Asegurar nombre
            let imgName = articuloData.imagen_nombre;
            if (!imgName) {
              const ext = articuloData.imagen_tipo && articuloData.imagen_tipo.includes('png') ? 'png' : (articuloData.imagen_tipo && articuloData.imagen_tipo.includes('jpeg') ? 'jpg' : 'bin');
              imgName = `${articuloId}_${Date.now()}.${ext}`;
            }
            const filePath = path.join(imagesDir, imgName);
            const buffer = Buffer.from(articuloData.imagen_data, 'base64');
            fs.writeFileSync(filePath, buffer);
            const publicUrl = `/uploads/${UPLOAD_PATHS.images}/${imgName}`.replace(/\\/g, '/');
            try {
              await articulos.update(articuloId, { imagen_url: publicUrl });
              console.log(`[Carga] imagen guardada para articulo ${articuloId}, URL: ${publicUrl.length} chars`);
            } catch (uerr) {
              console.warn('[Carga] fallo actualizando imagen_url en BD:', uerr.message || uerr);
            }
          }
        } catch (imgErr) {
          console.warn('[Carga] error guardando imagen embebida:', imgErr.message || imgErr);
        }

        // Crear cajas asociadas con datos relevantes
        // for (let i = 1; i <= numCajas; i++) {
        for (let i = 1; i <= mis_cajas; i++) {
          console.log('[Carga][DBG] creando caja para articuloId=', articuloId, 'numero=', i, 'total=', mis_cajas, 'cantidad_en_caja=', cantidad_en_caja_final);
          await cajas.create({
            id_articulo: articuloId,
            numero_caja: i,
            total_cajas: mis_cajas,
            cantidad_en_caja: cantidad_en_caja_final, // Usar la cantidad_en_caja calculada correctamente
            descripcion_contenido: descripcion_espanol || ref_art || null,
            cbm: cbm_art ? Number(cbm_art) : null,
            gw: gw_art ? Number(gw_art) : null,
            observaciones: it.observaciones || it.obs || null,
          });
        }
      } catch (err) {
        console.error(
          "[Carga] Error creando artículo/cajas para fila:",
          it,
          err.message || err
        );
        filasConError.push({ row: it, error: err.message || String(err) });
        continue;
      }
      }

      if (filasConError.length > 0) {
        console.warn(
          "[Carga] Algunas filas no se pudieron guardar:",
          filasConError.length
        );
      }

      // Obtener totales del Excel o calcular desde las cajas
      let gw_total_final = null;
      let cbm_total_final = null;
      let total_cajas_final = 0;
      let qrsGenerados = 0;
      let qrsErrores = 0;
      
      try {
        console.log(`[Carga] Procesando totales para carga ${cargaId}...`);
      
        // Buscar totales en el payload (vienen del Excel parseado)
        const totalesExcel = payload.totales || payload.estadisticas?.totales || null;
      
        // Verificar si los totales del Excel están presentes (incluso si son 0)
        const gw_total_excel_presente = totalesExcel && (totalesExcel.gw_total !== null && totalesExcel.gw_total !== undefined);
        const cbm_total_excel_presente = totalesExcel && (totalesExcel.cbm_total !== null && totalesExcel.cbm_total !== undefined);
        
        if (totalesExcel) {
          // Si los totales están presentes en el Excel (incluso si son 0), usarlos
          if (gw_total_excel_presente) {
            gw_total_final = totalesExcel.gw_total;
          }
          if (cbm_total_excel_presente) {
            cbm_total_final = totalesExcel.cbm_total;
          }
          if (totalesExcel.total_cajas !== null && totalesExcel.total_cajas !== undefined) {
            total_cajas_final = totalesExcel.total_cajas;
          }
          console.log(`[Carga] Totales extraídos del Excel:`, { 
            gw_total_final, 
            cbm_total_final, 
            total_cajas_final,
            gw_excel_presente: gw_total_excel_presente,
            cbm_excel_presente: cbm_total_excel_presente
          });
        }
        
        // Si no hay totales del Excel (null/undefined), calcular desde las cajas
        if (!gw_total_excel_presente || !cbm_total_excel_presente) {
          console.log(`[Carga] Calculando totales desde las cajas (Excel no tiene totales o están incompletos)...`);
          const { query } = await import('../db.js');
          const cajasQuery = `
            SELECT 
              COUNT(*) as total_cajas,
              COALESCE(SUM(c.gw), 0) as gw_total,
              COALESCE(SUM(c.cbm), 0) as cbm_total
            FROM caja c
            INNER JOIN articulo_packing_list a ON c.id_articulo = a.id_articulo
            WHERE a.id_carga = ?
          `;
          
          const totalesCalculados = await query(cajasQuery, [cargaId]);
          const totalesData = totalesCalculados && totalesCalculados.length > 0 ? totalesCalculados[0] : { total_cajas: 0, gw_total: 0, cbm_total: 0 };
          
          // Usar totales calculados solo si no están presentes en el Excel
          if (!gw_total_excel_presente) {
            gw_total_final = totalesData.gw_total > 0 ? totalesData.gw_total : null;
          }
          if (!cbm_total_excel_presente) {
            cbm_total_final = totalesData.cbm_total > 0 ? totalesData.cbm_total : null;
          }
          if (total_cajas_final === 0 || (totalesExcel && totalesExcel.total_cajas === null)) {
            total_cajas_final = totalesData.total_cajas || 0;
          }
          
          console.log(`[Carga] Totales finales:`, { 
            gw_total_final, 
            cbm_total_final, 
            total_cajas_final,
            fuente_gw: gw_total_excel_presente ? 'Excel' : 'Calculado',
            fuente_cbm: cbm_total_excel_presente ? 'Excel' : 'Calculado'
          });
        }
        
        // Actualizar la carga con los totales
        const updateData = {
          total_cajas: total_cajas_final || 0,
          gw_total: gw_total_final || null,
          cbm_total: cbm_total_final || null
        };
        
        // También actualizar campos adicionales si vienen en cargaMeta
        if (cargaMeta.shipping_mark !== undefined && cargaMeta.shipping_mark !== null && cargaMeta.shipping_mark !== '') {
          updateData.shipping_mark = cargaMeta.shipping_mark;
        }
        if (cargaMeta.fecha_recepcion !== undefined && cargaMeta.fecha_recepcion !== null && cargaMeta.fecha_recepcion !== '') {
          updateData.fecha_recepcion = cargaMeta.fecha_recepcion;
        }
        if (cargaMeta.fecha_envio !== undefined && cargaMeta.fecha_envio !== null && cargaMeta.fecha_envio !== '') {
          updateData.fecha_envio = cargaMeta.fecha_envio;
        }
        if (cargaMeta.fecha_arribo !== undefined && cargaMeta.fecha_arribo !== null && cargaMeta.fecha_arribo !== '') {
          updateData.fecha_arribo = cargaMeta.fecha_arribo;
        }
        if (cargaMeta.contenedor_asociado !== undefined && cargaMeta.contenedor_asociado !== null && cargaMeta.contenedor_asociado !== '') {
          updateData.contenedor_asociado = cargaMeta.contenedor_asociado;
        }
        
        await carga.update(cargaId, updateData);
        console.log(`[Carga] Carga ${cargaId} actualizada con totales y campos adicionales:`, updateData);
        
      } catch (totalesError) {
        console.error("[Carga] Error procesando totales:", totalesError);
        // No fallar toda la operación si falla el cálculo de totales
      }

      // Retornar resultado de la transacción (sin generar QRs aquí para evitar bloqueos)
      return {
        cargaId,
        filasConError
      };
    });
    
    // Si la carga ya existía, devolver respuesta inmediatamente
    if (resultado.isExisting) {
      return res.json(resultado.data);
    }

    const cargaId = resultado.cargaId;

    // Generar QRs automáticamente para todas las cajas creadas (FUERA de la transacción para evitar bloqueos)
    let qrsGenerados = 0;
    let qrsErrores = 0;
    try {
      console.log(`[Carga] Iniciando generación automática de QRs para carga ${cargaId} (después de transacción)`);
      
      // Importar el servicio de QR
      const { qrDataService } = await import('../services/qr-data.service.js');
      
      // Generar QRs para todas las cajas de esta carga
      const qrResult = await qrDataService.generateQRDataForCarga(cargaId);
      
      if (qrResult.success) {
        qrsGenerados = qrResult.data?.exitosos || 0;
        qrsErrores = qrResult.data?.errores || 0;
        console.log(`[Carga] QRs generados: ${qrsGenerados} exitosos, ${qrsErrores} errores`);
      } else {
        console.warn(`[Carga] Error generando QRs: ${qrResult.message}`);
        qrsErrores = 1;
      }
    } catch (qrError) {
      console.error("[Carga] Error en generación automática de QRs:", qrError);
      // No fallar toda la operación si falla la generación de QRs
      qrsErrores = 1;
    }

    // Enviar respuesta con los resultados
    res.json({
      success: true,
      data: {
        carga: {
          id: cargaId,
          codigo: cargaMeta.codigo_carga || `CARGA-${Date.now()}`,
        },
        qrs: {
          generados: qrsGenerados,
          errores: qrsErrores,
          automatico: true
        },
        filasConError: resultado.filasConError?.length || 0
      },
      message: qrsGenerados > 0 
        ? `Packing list guardado y ${qrsGenerados} QRs generados automáticamente`
        : 'Packing list guardado. Los QRs se pueden generar manualmente después.'
    });
  } catch (error) {
    console.error("Error en guardarConQR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Obtener packing list (artículos + cajas) por id de carga
export const obtenerPackingList = async (req, res) => {
  try {
    const cargaId = req.params.id || req.query.id;
    if (!cargaId)
      return res
        .status(400)
        .json({ success: false, message: "Falta id de carga" });

    // Obtener la carga con información del cliente
    const cargaRow =
      (await carga.findOne({ id_carga: Number(cargaId) })) ||
      (await carga.findOne({ id: Number(cargaId) }));
    if (!cargaRow)
      return res
        .status(404)
        .json({ success: false, message: "Carga no encontrada" });

    // Obtener información del cliente si existe
    let clienteInfo = null;
    if (cargaRow.id_cliente) {
      clienteInfo = await databaseRepository.clientes.findOne({ 
        id_cliente: cargaRow.id_cliente 
      });
    }

    // Obtener artículos asociados
    const articulosRows = await articulos.findAll({
      id_carga: cargaRow.id_carga || cargaRow.id,
    });

    // Crear array plano de items combinando artículos con información de cajas
    const items = [];
    let totalValor = 0;
    let pesoTotal = 0;
    let cantidadCajas = 0;

    for (const art of articulosRows) {
      // Obtener cajas del artículo
      const cajasRows = await cajas.findAll({
        id_articulo: art.id_articulo || art.id,
      });

      // Si hay cajas, crear un item por cada caja
      if (cajasRows && cajasRows.length > 0) {
        for (const cajaItem of cajasRows) {
          items.push({
            id_articulo: art.id_articulo || art.id,
            id_caja: cajaItem.id_caja || cajaItem.id,
            // Información del artículo (sin duplicados)
            ref_art: art.ref_art || art.cn || art.codigo_unico || "",
            cn: art.cn || art.ref_art || "",
            descripcion_espanol: art.descripcion_espanol || art.descripcion || "",
            descripcion_chino: art.descripcion_chino || "",
            unidad: art.unidad || "",
            cant_por_caja: art.cant_por_caja || art.cantidad || 0,
            precio_unidad: art.precio_unidad || 0,
            precio_total: art.precio_total || 0,
            material: art.material || "",
            marca_producto: art.marca_producto || "",
            serial: art.serial || "",
            medida_largo: art.medida_largo || null,
            medida_ancho: art.medida_ancho || null,
            medida_alto: art.medida_alto || null,
            imagen_url: art.imagen_url || null,
            fecha: art.fecha || art.created_at || null,
            // Información de la caja
            numero_caja: cajaItem.numero_caja || null,
            total_cajas: cajaItem.total_cajas || cajasRows.length,
            cantidad_en_caja: cajaItem.cantidad_en_caja || null,
            gw: cajaItem.gw || art.gw || 0,
            peso_total: cargaRow.gw_total || art.gw || 0, // Usar gw_total de la carga (del Excel G.W.TT)
            cbm: cajaItem.cbm || art.cbm || 0,
            detalle_cajas: `Caja ${cajaItem.numero_caja || ''} de ${cajaItem.total_cajas || cajasRows.length}`,
            estado_caja: cajaItem.estado || "pendiente",
            observaciones_caja: cajaItem.observaciones || "",
            // Información de la carga y cliente
            codigo_carga: cargaRow.codigo_carga || null,
            nombre_cliente: clienteInfo?.nombre_cliente || null,
            telefono_cliente: clienteInfo?.telefono_cliente || null,
            correo_cliente: clienteInfo?.correo_cliente || null,
            ciudad_cliente: clienteInfo?.ciudad_cliente || null,
            fecha_inicio: cargaRow.fecha_inicio || cargaRow.fecha_recepcion || null,
            fecha_creacion: cargaRow.fecha_recepcion || cargaRow.fecha_inicio || null,
            archivo_original: cargaRow.archivo_original || null,
          });

          // Acumular estadísticas
          totalValor += Number(art.precio_total || 0);
          pesoTotal += Number(cajaItem.gw || art.gw || 0);
          cantidadCajas += 1;
        }
      } else {
        // Si no hay cajas, crear un item solo con información del artículo
        items.push({
          id_articulo: art.id_articulo || art.id,
          id_caja: null,
          // Información del artículo (sin duplicados)
          ref_art: art.ref_art || art.cn || art.codigo_unico || "",
          cn: art.cn || art.ref_art || "",
          descripcion_espanol: art.descripcion_espanol || art.descripcion || "",
          descripcion_chino: art.descripcion_chino || "",
          unidad: art.unidad || "",
          cant_por_caja: art.cant_por_caja || art.cantidad || 0,
          precio_unidad: art.precio_unidad || 0,
          precio_total: art.precio_total || 0,
          material: art.material || "",
          marca_producto: art.marca_producto || "",
          serial: art.serial || "",
          medida_largo: art.medida_largo || null,
          medida_ancho: art.medida_ancho || null,
          medida_alto: art.medida_alto || null,
          imagen_url: art.imagen_url || null,
          fecha: art.fecha || art.created_at || null,
          // Información de la caja (vacía)
          numero_caja: null,
          total_cajas: 0,
          cantidad_en_caja: null,
          gw: art.gw || 0,
          peso_total: cargaRow.gw_total || art.gw || 0, // Usar gw_total de la carga (del Excel G.W.TT)
          cbm: art.cbm || 0,
          detalle_cajas: "",
          estado_caja: null,
          observaciones_caja: "",
          // Información de la carga y cliente
          codigo_carga: cargaRow.codigo_carga || null,
          nombre_cliente: clienteInfo?.nombre_cliente || null,
          telefono_cliente: clienteInfo?.telefono_cliente || null,
          correo_cliente: clienteInfo?.correo_cliente || null,
          ciudad_cliente: clienteInfo?.ciudad_cliente || null,
          fecha_inicio: cargaRow.fecha_inicio || cargaRow.fecha_recepcion || null,
          fecha_creacion: cargaRow.fecha_recepcion || cargaRow.fecha_inicio || null,
          archivo_original: cargaRow.archivo_original || null,
        });

        // Acumular estadísticas
        totalValor += Number(art.precio_total || 0);
        pesoTotal += Number(art.gw || 0);
      }
    }

    // Calcular estadísticas finales
    const estadisticas = {
      totalValor: totalValor,
      precio_total_carga: totalValor,
      pesoTotal: pesoTotal,
      cantidadItems: articulosRows.length,
      total_articulos: articulosRows.length,
      cantidadCajas: cantidadCajas || cargaRow.total_cajas || 0,
      total_cajas: cantidadCajas || cargaRow.total_cajas || 0,
      cbm_total: cargaRow.cbm_total || 0,
      gw_total: cargaRow.gw_total || pesoTotal || 0,
    };

    res.json({
      success: true,
      data: {
        items: items,
        estadisticas: estadisticas,
        carga: cargaRow,
        cliente: clienteInfo,
      },
    });
  } catch (error) {
    console.error("Error obteniendo packing list:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Obtener metadata de carga por id (compatibilidad móvil/alias)
export const obtenerCargaPorId = async (req, res) => {
  try {
    const cargaId = req.params.id || req.query.id;
    if (!cargaId)
      return res
        .status(400)
        .json({ success: false, message: "Falta id de carga" });

    const cargaRow =
      (await carga.findOne({ id_carga: Number(cargaId) })) ||
      (await carga.findOne({ id: Number(cargaId) }));
    if (!cargaRow)
      return res
        .status(404)
        .json({ success: false, message: "Carga no encontrada" });

    let cliente = null;
    if (cargaRow.id_cliente) {
      cliente =
        (await databaseRepository.clientes.findOne({
          id_cliente: cargaRow.id_cliente,
        })) ||
        (await databaseRepository.clientes.findOne({
          id: cargaRow.id_cliente,
        }));
    }

    res.json({ success: true, data: { carga: cargaRow, cliente } });
  } catch (error) {
    console.error("Error obteniendo carga por id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Transformar el Excel subido a un formato estandarizado y devolverlo para descarga
export const transformarExcel = async (req, res) => {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "No se ha subido ningún archivo" });
    const { normalized } = await parseExcelBuffer(req.file.buffer);

    // Crear workbook estandarizado
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("PACKING_LIST_STANDARD");

    const headers = [
      "ref_art",
      "descripcion_espanol",
      "material",
      "medida_largo",
      "medida_ancho",
      "medida_alto",
      "cant_por_caja",
      "total_cajas",
      "cantidad",
      "gw",
      "cbm",
    ];
    ws.addRow(headers);

    for (const row of normalized) {
      const r = [
        row.ref_art || row.REF || row.Item || "",
        row.descripcion_espanol || row.descripcion || row.DESCRIPCION || "",
        row.material || "",
        row.medida_largo || row.length || "",
        row.medida_ancho || row.width || "",
        row.medida_alto || row.height || "",
        row.cant_por_caja || row.qty_per_ctn || "",
        row.total_cajas || row.ctns || "",
        row.cantidad || row.total_qty || "",
        row.gw || "",
        row.cbm || "",
      ];
      ws.addRow(r);
    }

    const buffer = await wb.xlsx.writeBuffer();
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=packinglist_transformado.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    return res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("Error transformando Excel:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
