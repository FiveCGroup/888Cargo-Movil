// controllers/carga.controller.js
// Controlador para la lógica de las rutas de carga
import multer from "multer";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import * as articuloModel from "../models/articulosPL.model.js";
import { PackingListModel } from "../models/packingList.model.js";
import { createCarga } from "../models/carga.model.js";
import { createCajasForArticulo } from "../models/caja.model.js";
import { createQRForCaja, updateQRImage } from "../models/qr.model.js";
import { query, run, get } from "../db.js";

// ========== CONFIGURACIONES Y DIRECTORIOS ==========

// Configuración de multer para manejo de archivos
const storage = multer.memoryStorage();
export const upload = multer({ 
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
        fieldSize: 50 * 1024 * 1024 // 50MB para campos
    },
    fileFilter: (req, file, cb) => {
        // Validar tipos de archivo Excel
        const allowedMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'application/octet-stream' // Algunos navegadores envían Excel como octet-stream
        ];
        
        if (allowedMimeTypes.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls)$/i)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'), false);
        }
    }
});

// Directorio para imágenes
const imageDir = path.join(process.cwd(), "uploads", "images");
const QR_IMAGES_DIR = path.join(process.cwd(), "uploads", "qr-codes");

// Crear directorios si no existen
if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
}

if (!fs.existsSync(QR_IMAGES_DIR)) {
    fs.mkdirSync(QR_IMAGES_DIR, { recursive: true });
}

// ========== FUNCIONES AUXILIARES ==========

// Función para asegurar que existe el directorio de QR
const ensureQRDirectory = async () => {
    if (!fs.existsSync(QR_IMAGES_DIR)) {
        fs.mkdirSync(QR_IMAGES_DIR, { recursive: true });
    }
};

// Función para extraer imágenes de Excel
const extraerImagenesExcel = async (buffer) => {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.getWorksheet(1);
        const worksheetImages = worksheet.getImages();
        const imagenes = {};
        
        // Buscar columna PHTO
        let columnaPHTO = -1;
        for (let col = 1; col <= 30; col++) {
            const celda = worksheet.getCell(5, col);
            if (celda.value && celda.value.toString().toLowerCase().trim() === 'phto') {
                columnaPHTO = col;
                break;
            }
        }

        worksheetImages.forEach((image, index) => {
            const img = workbook.model.media[image.imageId];
            if (img) {
                const range = image.range;
                const filaImagen = range.tl.row;
                const columnaImagen = range.tl.col;
                const margenColumna = 2;
                const columnaImagenReal = columnaImagen + 1;
                
                if (Math.abs(columnaImagenReal - columnaPHTO) <= margenColumna) {
                    const filaRelativa = filaImagen - 5;
                    if (filaRelativa > 0) {
                        const extension = img.extension || 'png';
                        const nombreArchivo = `imagen_fila_${filaRelativa}_${Date.now()}_${index}.${extension}`;
                        
                        imagenes[filaRelativa] = {
                            buffer: img.buffer,
                            nombre: nombreArchivo,
                            tipo: `image/${extension}`,
                            extension: extension,
                            url: null
                        };
                    }
                }
            }
        });

        return imagenes;
    } catch (error) {
        console.error("Error extrayendo imágenes:", error);
        return {};
    }
};

// Función para validar fila
const validarFila = (fila) => {
    const errores = [];
    
    // Verificar si la fila está vacía
    const filaVacia = !fila || fila.length === 0 || fila.every(celda => 
        celda === null || celda === undefined || String(celda).trim() === ""
    );
    
    if (filaVacia) {
        return {
            valida: false,
            esVacia: true,
            errores: ["Fila vacía"]
        };
    }

    // Validaciones básicas
    if (!fila[0] || String(fila[0]).trim() === "") {
        errores.push("Fecha faltante");
    }

    if (!fila[1] || String(fila[1]).trim() === "") {
        errores.push("Marca del cliente faltante");
    }

    // Validar columnas numéricas
    const columnasNumericas = [10, 11, 14, 15, 16, 17, 19, 20, 21, 22];
    columnasNumericas.forEach((indice) => {
        const valor = fila[indice];
        if (valor !== undefined && valor !== null && valor !== '' && isNaN(Number(valor))) {
            errores.push(`Valor no numérico en columna ${indice + 1}`);
        }
    });

    return {
        valida: errores.length === 0,
        esVacia: false,
        errores,
    };
};

// ========== HANDLERS MIGRADOS ==========
export const procesarExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No se ha enviado ningún archivo",
            });
        }

        console.log("Procesando archivo Excel con imágenes...");

        // Primero extraer imágenes con ExcelJS
        const imagenes = await extraerImagenesExcel(req.file.buffer);

        // Luego extraer datos con xlsx
        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            range: 4,
        });

        // Procesar las filas incluyendo las imágenes
        const resultado = procesarFilas(jsonData, imagenes);

        res.json({
            success: true,
            data: resultado.filasValidas,
            filasConError: resultado.filasConError,
            estadisticas: resultado.estadisticas,
        });
    } catch (error) {
        console.error("Error al procesar archivo Excel:", error);
        res.status(500).json({
            success: false,
            message: "Error al procesar el archivo Excel",
        });
    }
};

// Función para procesar las filas
const procesarFilas = (filas, imagenes = {}) => {
    const filasValidas = [];
    const filasConError = [];
    let filasExitosas = 0;
    let filasConErrorCount = 0;
    let filasVacias = 0;
    const totalFilas = filas.length - 1;

    console.log("=== INICIANDO PROCESAMIENTO DE ARCHIVO ===");
    console.log(`Total de filas a procesar: ${totalFilas}`);
    console.log(`Imágenes encontradas: ${Object.keys(imagenes).length}`);

    // Encontrar el índice de la columna PHTO
    const indicePHTO = filas[0].findIndex(col => 
        col && col.toString().toLowerCase().trim() === 'phto'
    );
    console.log(`Índice de columna PHTO encontrado: ${indicePHTO}`);

    for (let i = 1; i < filas.length; i++) {
        const fila = filas[i];
        const validacion = validarFila(fila);

        if (validacion.esVacia) {
            filasVacias++;
            console.log(`Fila ${i + 1}: VACÍA - saltando`);
        } else if (validacion.valida) {
            // Crear copia de la fila
            const filaModificada = [...fila];
            
            // Si encontramos imágenes y existe la columna PHTO, guardar imagen y asignar URL
            if (imagenes[i] && indicePHTO !== -1) {
                try {
                    // Guardar imagen físicamente en el directorio
                    const rutaImagen = path.join(imageDir, imagenes[i].nombre);
                    
                    // Crear directorio si no existe
                    if (!fs.existsSync(imageDir)) {
                        fs.mkdirSync(imageDir, { recursive: true });
                    }
                    
                    // Escribir archivo de imagen
                    fs.writeFileSync(rutaImagen, imagenes[i].buffer);
                    
                    // Crear URL de acceso público
                    const urlImagen = `/uploads/images/${imagenes[i].nombre}`;
                    
                    // Almacenar la URL en lugar del objeto imagen
                    filaModificada[indicePHTO] = urlImagen;
                    
                    console.log(`✅ Imagen guardada y URL asignada a PHTO en fila ${i + 1}:`);
                    console.log(`   Archivo: ${rutaImagen}`);
                    console.log(`   URL: ${urlImagen}`);
                    console.log(`   Tamaño: ${imagenes[i].buffer.length} bytes`);
                } catch (error) {
                    console.error(`❌ Error al guardar imagen para fila ${i + 1}:`, error);
                    filaModificada[indicePHTO] = null;
                }
            } else if (indicePHTO !== -1) {
                console.log(`⚠️ No se encontró imagen para fila ${i + 1}, columna PHTO queda con valor: ${filaModificada[indicePHTO]}`);
            } else {
                console.log(`❌ Columna PHTO no encontrada en encabezados`);
            }
            
            filasValidas.push(filaModificada);
            filasExitosas++;
            console.log(`Fila ${i + 1}: CARGADA EXITOSAMENTE`);
        } else {
            // Guardar fila con errores junto con información adicional
            filasConError.push({
                numeroFila: i + 1,
                datos: fila,
                errores: validacion.errores,
            });
            filasConErrorCount++;
            console.log(`Fila ${i + 1}: ERROR - ${validacion.errores.join(", ")}`);
        }
    }

    console.log("=== RESUMEN DE CARGA ===");
    console.log(`Total de filas: ${totalFilas}`);
    console.log(`Filas cargadas exitosamente: ${filasExitosas}`);
    console.log(`Filas con errores: ${filasConErrorCount}`);
    console.log(`Filas vacías: ${filasVacias}`);
    console.log("=== FIN DE PROCESAMIENTO ===");

    return {
        filasValidas: [filas[0], ...filasValidas], // Usar encabezado original
        filasConError: filasConError,
        estadisticas: {
            filasExitosas,
            filasConError: filasConErrorCount,
            filasVacias,
            totalFilas,
        },
    };
};

export const guardarCarga = async (req, res) => {
    try {
        const { codigoCarga, datosExcel } = req.body;
        if (!codigoCarga || !Array.isArray(datosExcel) || datosExcel.length < 2) {
            return res.status(400).json({ success: false, message: "Datos insuficientes para guardar la carga." });
        }
        const filas = datosExcel.slice(1);
        const filasFiltradas = filas.filter(fila => Array.isArray(fila) && fila.length >= 25);
        if (filasFiltradas.length === 0) {
            return res.status(400).json({ success: false, message: "No hay filas válidas para guardar." });
        }
        for (const fila of filasFiltradas) {
            await articuloModel.createArticulo({
                id_carga: codigoCarga,
                fecha: fila[0],
                cn: fila[4],
                ref_art: fila[5],
                descripcion_espanol: fila[6],
                descripcion_chino: fila[7],
                unidad: fila[8],
                precio_unidad: Number(fila[9]) || 0,
                precio_total: Number(fila[10]) || 0,
                material: fila[11],
                unidades_empaque: Number(fila[12]) || 0,
                marca_producto: fila[13],
                serial: fila[25]
            });
        }
        res.json({ success: true, message: "Artículos guardados en PostgreSQL" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al guardar en MongoDB" });
    }
};

export const guardarPackingList = async (req, res) => {
    try {
        const { datosExcel, infoCliente, infoCarga } = req.body;
        if (!datosExcel || !Array.isArray(datosExcel) || datosExcel.length < 2) {
            return res.status(400).json({ success: false, message: "Datos de Excel insuficientes" });
        }
        if (!infoCliente || !infoCarga) {
            return res.status(400).json({ success: false, message: "Información de cliente y carga requerida" });
        }
        let clienteId;
        if (infoCliente.correo_cliente) {
            const clienteExistente = await PackingListModel.obtenerClientePorCorreo(infoCliente.correo_cliente);
            if (clienteExistente) {
                clienteId = clienteExistente.id_cliente;
            } else {
                clienteId = await PackingListModel.crearCliente(infoCliente);
            }
        } else {
            clienteId = await PackingListModel.crearCliente(infoCliente);
        }
        const cargaData = { ...infoCarga, id_cliente: clienteId };
        const codigoUnico = await PackingListModel.validarCodigoCargaUnico(cargaData.codigo_carga);
        if (!codigoUnico) {
            return res.status(400).json({ success: false, message: "El código de carga ya existe" });
        }
        const cargaId = await PackingListModel.crearCarga(cargaData);
        const filasArticulos = datosExcel.slice(1);
        let articulosCreados = 0;
        let errores = [];
        for (let i = 0; i < filasArticulos.length; i++) {
            try {
                const fila = filasArticulos[i];
                if (!fila || fila.length < 10) continue;
                const articuloData = {
                    id_carga: cargaId,
                    fecha: fila[0] || null,
                    cn: fila[5] || null,
                    ref_art: fila[6] || null,
                    descripcion_espanol: fila[7] || null,
                    descripcion_chino: fila[8] || null,
                    unidad: fila[9] || null,
                    precio_unidad: parseFloat(fila[10]) || 0,
                    precio_total: parseFloat(fila[11]) || 0,
                    material: fila[12] || null,
                    unidades_empaque: parseInt(fila[13]) || 0,
                    marca_producto: fila[14] || null,
                    serial: fila[25] || null,
                    medida_largo: parseFloat(fila[18]) || 0,
                    medida_ancho: parseFloat(fila[19]) || 0,
                    medida_alto: parseFloat(fila[20]) || 0,
                    cbm: parseFloat(fila[21]) || 0,
                    gw: parseFloat(fila[23]) || 0,
                    imagen_url: null,
                    imagen_data: null,
                    imagen_nombre: null,
                    imagen_tipo: null
                };
                await PackingListModel.crearArticulo(articuloData);
                articulosCreados++;
            } catch (error) {
                errores.push(`Fila ${i + 1}: ${error.message}`);
            }
        }
        const estadisticas = await PackingListModel.calcularEstadisticasCarga(cargaId);
        res.json({
            success: true,
            message: "Packing List guardado exitosamente",
            data: { id_cliente: clienteId, id_carga: cargaId, articulos_creados: articulosCreados, errores, estadisticas }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error interno del servidor al guardar", error: error.message });
    }
};

export const obtenerPackingList = async (req, res) => {
    try {
        const { id_carga } = req.params;
        const packingList = await PackingListModel.obtenerPackingListCompleto(id_carga);
        const estadisticas = await PackingListModel.calcularEstadisticasCarga(id_carga);
        res.json({ success: true, data: { items: packingList, estadisticas } });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener packing list" });
    }
};

export const obtenerCargaPorId = async (req, res) => {
    try {
        const { id_carga } = req.params;
        const carga = await PackingListModel.obtenerCargaPorId(id_carga);
        if (!carga) return res.status(404).json({ success: false, message: 'Carga no encontrada' });
        return res.json({ success: true, data: carga });
    } catch (error) {
        console.error('Error al obtener carga por id:', error);
        res.status(500).json({ success: false, message: 'Error al obtener carga' });
    }
};

export const obtenerCargasCliente = async (req, res) => {
    try {
        const { id_cliente } = req.params;
        const cargas = await PackingListModel.obtenerCargasPorCliente(id_cliente);
        res.json({ success: true, data: cargas });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener cargas del cliente" });
    }
};

export const obtenerImagenArticulo = async (req, res) => {
    try {
        // Verificar si es una imagen por filename o por id_articulo
        if (req.params.filename) {
            // Ruta /imagenes/:filename - servir archivo físico
            const filename = req.params.filename;
            const rutaImagen = path.join(imageDir, filename);
            
            if (fs.existsSync(rutaImagen)) {
                res.sendFile(rutaImagen);
            } else {
                res.status(404).json({
                    success: false,
                    message: "Imagen no encontrada"
                });
            }
        } else if (req.params.id_articulo) {
            // Ruta /imagen/:id_articulo - servir desde base de datos
            const { id_articulo } = req.params;
            
            const imagenData = await PackingListModel.obtenerImagenArticulo(id_articulo);
            
            if (!imagenData || !imagenData.imagen_data) {
                return res.status(404).json({ error: 'Imagen no encontrada' });
            }
            
            // Configurar headers apropiados
            res.set({
                'Content-Type': imagenData.imagen_tipo || 'image/png',
                'Content-Length': imagenData.imagen_data.length,
                'Cache-Control': 'public, max-age=86400' // Cache por 24 horas
            });
            
            // Enviar los datos de la imagen
            res.send(imagenData.imagen_data);
        } else {
            res.status(400).json({
                success: false,
                message: "Parámetros inválidos"
            });
        }
    } catch (error) {
        console.error('Error al obtener imagen:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor',
            message: "Error al servir la imagen"
        });
    }
};

export const buscarPackingList = async (req, res) => {
    try {
        const { codigo_carga } = req.params;
        res.set({ 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' });
        const cargas = await PackingListModel.buscarCargasPorCodigo(codigo_carga);
        if (!cargas || cargas.length === 0) {
            return res.status(404).json({ success: false, message: 'No se encontraron packing lists con ese código' });
        }
        const resultados = [];
        for (const carga of cargas) {
            const estadisticas = await PackingListModel.obtenerEstadisticasCarga(carga.id_carga);
            const articulosCount = await PackingListModel.contarArticulosCarga(carga.id_carga);
            resultados.push({
                id_carga: carga.id_carga,
                codigo_carga: carga.codigo_carga,
                fecha_inicio: carga.fecha_inicio,
                fecha_fin: carga.fecha_fin,
                ciudad_destino: carga.ciudad_destino,
                archivo_original: carga.archivo_original,
                cliente: {
                    id_cliente: carga.id_cliente,
                    nombre_cliente: carga.nombre_cliente,
                    correo_cliente: carga.correo_cliente,
                    telefono_cliente: carga.telefono_cliente
                },
                estadisticas: {
                    articulos_creados: articulosCount,
                    total_articulos: estadisticas.total_articulos || 0,
                    precio_total_carga: estadisticas.precio_total_carga || 0,
                    cbm_total: estadisticas.cbm_total || 0,
                    peso_total: estadisticas.peso_total || 0,
                    total_cajas: estadisticas.total_cajas || 0
                }
            });
        }
        res.status(200).json({ success: true, data: resultados, mensaje: `Se encontraron ${resultados.length} packing list(s) con el código "${codigo_carga}"`, timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error interno del servidor', details: error.message });
    }
};

export const obtenerTodasCargas = async (req, res) => {
    try {
        res.set({ 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' });
        const cargas = await PackingListModel.obtenerTodasLasCargas();
        if (!cargas || cargas.length === 0) {
            return res.json({ success: true, data: [], mensaje: 'No hay packing lists guardados' });
        }
        const cargasConEstadisticas = [];
        for (const carga of cargas) {
            const estadisticas = await PackingListModel.obtenerEstadisticasCarga(carga.id_carga);
            const articulosCount = await PackingListModel.contarArticulosCarga(carga.id_carga);
            cargasConEstadisticas.push({
                ...carga,
                estadisticas: {
                    articulos_creados: articulosCount,
                    total_articulos: estadisticas.total_articulos || 0,
                    precio_total_carga: estadisticas.precio_total_carga || 0,
                    cbm_total: estadisticas.cbm_total || 0,
                    peso_total: estadisticas.peso_total || 0,
                    total_cajas: estadisticas.total_cajas || 0
                }
            });
        }
        res.status(200).json({ success: true, data: cargasConEstadisticas, timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error interno del servidor', details: error.message });
    }
};

export const guardarConQR = async (req, res) => {
    try {
        const { datosExcel, infoCliente, infoCarga } = req.body;
        if (!datosExcel || !Array.isArray(datosExcel) || datosExcel.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Datos de Excel insuficientes"
            });
        }
        if (!infoCliente?.nombre_cliente || !infoCliente?.correo_cliente || !infoCliente?.telefono_cliente || !infoCliente?.direccion_entrega) {
            return res.status(400).json({
                success: false,
                message: "Información del cliente incompleta (nombre, correo, teléfono y dirección de entrega son obligatorios)"
            });
        }
        if (!infoCarga?.codigo_carga || !infoCarga?.direccion_destino) {
            return res.status(400).json({
                success: false,
                message: "Información de carga incompleta (código y dirección de destino son obligatorios)"
            });
        }
        // PASO 1: CREAR/OBTENER CLIENTE
        let clienteId;
        const clienteExistente = await get(
            'SELECT * FROM cliente WHERE correo_cliente = ?',
            [infoCliente.correo_cliente]
        );
        if (clienteExistente) {
            clienteId = clienteExistente.id_cliente;
            await run(`
                UPDATE cliente 
                SET nombre_cliente = ?, telefono_cliente = ?, direccion_entrega = ?, updated_at = datetime('now')
                WHERE id_cliente = ?
            `, [infoCliente.nombre_cliente, infoCliente.telefono_cliente, infoCliente.direccion_entrega, clienteId]);
        } else {
            // Generar shipping mark para nuevo cliente
            const { generateUniqueShippingMark } = await import('../models/user.model.js');
            const cliente_shippingMark = await generateUniqueShippingMark(infoCliente.nombre_cliente);
            
            const resultCliente = await run(`
                INSERT INTO cliente (nombre_cliente, correo_cliente, telefono_cliente, direccion_entrega, cliente_shippingMark) 
                VALUES (?, ?, ?, ?, ?)
            `, [infoCliente.nombre_cliente, infoCliente.correo_cliente, infoCliente.telefono_cliente, infoCliente.direccion_entrega, cliente_shippingMark]);
            clienteId = resultCliente.id;
            
            console.log(`✅ Cliente creado desde móvil con Shipping Mark: ${cliente_shippingMark}`);
        }
        // PASO 2: CREAR CARGA
        const cargaExistente = await get(
            'SELECT * FROM carga WHERE codigo_carga = ?',
            [infoCarga.codigo_carga]
        );
        if (cargaExistente) {
            return res.status(400).json({
                success: false,
                message: `El código de carga "${infoCarga.codigo_carga}" ya existe`
            });
        }
        const cargaData = {
            codigo_carga: infoCarga.codigo_carga,
            direccion_destino: infoCarga.direccion_destino,
            archivo_original: infoCarga.archivo_original || 'packing-list.xlsx',
            id_cliente: clienteId
        };
        const nuevaCarga = await createCarga(cargaData);
        // PASO 3: PROCESAR ARTÍCULOS DEL EXCEL
        const filasArticulos = datosExcel.slice(1);
        let articulosCreados = 0;
        let articulosIds = [];
        let articulosConIndices = [];
        for (let i = 0; i < filasArticulos.length; i++) {
            try {
                const fila = filasArticulos[i];
                if (!fila || fila.length < 5 || !fila[5]) continue;
                const articuloData = {
                    id_carga: nuevaCarga.id_carga,
                    fecha: fila[0] || null,
                    cn: fila[5] || null,
                    ref_art: fila[6] || null,
                    descripcion_espanol: fila[7] || null,
                    descripcion_chino: fila[8] || null,
                    unidad: fila[9] || null,
                    precio_unidad: parseFloat(fila[10]) || 0,
                    precio_total: parseFloat(fila[11]) || 0,
                    material: fila[12] || null,
                    unidades_empaque: parseInt(fila[13]) || 0,
                    marca_producto: fila[14] || null,
                    serial: fila[25] || null,
                    medida_largo: parseFloat(fila[18]) || 0,
                    medida_ancho: parseFloat(fila[19]) || 0,
                    medida_alto: parseFloat(fila[20]) || 0,
                    cbm: parseFloat(fila[21]) || 0,
                    gw: parseFloat(fila[23]) || 0,
                    imagen_url: fila[4] || null,
                    imagen_data: null,
                    imagen_nombre: null,
                    imagen_tipo: null
                };
                const articuloResult = await run(`
                    INSERT INTO articulo_packing_list (
                        id_carga, fecha, cn, ref_art, descripcion_espanol, descripcion_chino,
                        unidad, precio_unidad, precio_total, material, unidades_empaque,
                        marca_producto, serial, medida_largo, medida_ancho, medida_alto,
                        cbm, gw, imagen_url, imagen_data, imagen_nombre, imagen_tipo
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    articuloData.id_carga, articuloData.fecha, articuloData.cn, articuloData.ref_art,
                    articuloData.descripcion_espanol, articuloData.descripcion_chino, articuloData.unidad,
                    articuloData.precio_unidad, articuloData.precio_total, articuloData.material,
                    articuloData.unidades_empaque, articuloData.marca_producto, articuloData.serial,
                    articuloData.medida_largo, articuloData.medida_ancho, articuloData.medida_alto,
                    articuloData.cbm, articuloData.gw, articuloData.imagen_url, articuloData.imagen_data,
                    articuloData.imagen_nombre, articuloData.imagen_tipo
                ]);
                articulosIds.push(articuloResult.id);
                articulosConIndices.push({ id: articuloResult.id, filaIndex: i });
                articulosCreados++;
            } catch (error) {}
        }
        // PASO 4: GENERAR CAJAS Y QRS AUTOMÁTICAMENTE (SISTEMA OPTIMIZADO v2.0)
        let totalCajasGeneradas = 0;
        let totalQRsGenerados = 0;
        
        // Importar servicio QR optimizado
        const { qrDataService } = await import('../services/qr-data.service.js');
        
        for (let articuloIndex = 0; articuloIndex < articulosConIndices.length; articuloIndex++) {
            const articuloInfo = articulosConIndices[articuloIndex];
            const articuloId = articuloInfo.id;
            const filaOriginalIndex = articuloInfo.filaIndex;
            try {
                const filaArticulo = filasArticulos[filaOriginalIndex];
                const numCajas = parseInt(filaArticulo[15]) || 1;
                const cantPorCaja = parseInt(filaArticulo[16]) || 0;
                
                // Crear cajas
                const cajasCreadas = await createCajasForArticulo(articuloId, numCajas);
                totalCajasGeneradas += cajasCreadas.length;
                
                // Obtener datos del artículo para el QR
                const articuloCompleto = await get(
                    "SELECT * FROM articulo_packing_list WHERE id_articulo = ?",
                    [articuloId]
                );
                
                // Obtener datos de la carga
                const cargaCompleta = await get(
                    "SELECT * FROM carga WHERE id_carga = ?",
                    [nuevaCarga.id_carga]
                );
                
                // Generar QR optimizado para cada caja usando el nuevo servicio
                for (const caja of cajasCreadas) {
                    try {
                        // Preparar datos de la caja para el servicio QR
                        const datosCaja = {
                            id_caja: caja.id_caja,
                            numero_caja: caja.numero_caja,
                            total_cajas: caja.total_cajas,
                            codigo_carga: cargaCompleta.codigo_carga,
                            descripcion_espanol: articuloCompleto.descripcion_espanol || "Sin descripción",
                            ref_art: articuloCompleto.ref_art || "Sin referencia",
                            id_articulo: articuloId
                        };
                        
                        // Usar servicio optimizado para generar QR como datos
                        const qrResult = await qrDataService.generateQRDataForCaja(datosCaja);
                        
                        if (qrResult.success) {
                            totalQRsGenerados++;
                            console.log(`✅ QR optimizado generado para caja ${caja.numero_caja} de ${caja.total_cajas}`);
                        } else {
                            console.warn(`⚠️ Error generando QR para caja ${caja.numero_caja}:`, qrResult.message);
                        }
                    } catch (qrError) {
                        console.error(`❌ Error generando QR optimizado para caja ${caja.numero_caja}:`, qrError);
                    }
                }
            } catch (error) {
                console.error(`❌ Error procesando artículo ${articuloId}:`, error);
            }
        }
        // PASO 5: CALCULAR ESTADÍSTICAS FINALES
        const estadisticas = {
            cliente_id: clienteId,
            carga_id: nuevaCarga.id_carga,
            codigo_carga: nuevaCarga.codigo_carga,
            articulos_creados: articulosCreados,
            cajas_generadas: totalCajasGeneradas,
            qrs_generados: totalQRsGenerados,
            fecha_creacion: nuevaCarga.fecha_creacion,
            sistema_qr: 'optimizado_v2.0' // Indicar que se usó el sistema optimizado
        };

        console.log(`✅ Guardado completado con sistema QR optimizado:`);
        console.log(`   - Artículos: ${articulosCreados}`);
        console.log(`   - Cajas: ${totalCajasGeneradas}`);
        console.log(`   - QRs: ${totalQRsGenerados}`);
        console.log(`   - Sistema: Optimizado v2.0 (datos en BD, sin archivos)`);

        res.json({
            success: true,
            message: "Packing List guardado y QRs generados exitosamente con sistema optimizado v2.0",
            data: {
                cliente: {
                    id: clienteId,
                    nombre: infoCliente.nombre_cliente,
                    correo: infoCliente.correo_cliente
                },
                carga: {
                    id: nuevaCarga.id_carga,
                    codigo: nuevaCarga.codigo_carga,
                    direccion_destino: infoCarga.direccion_destino
                },
                estadisticas: estadisticas,
                pdfDisponible: true,
                pdfUrl: `/api/qr/pdf-carga/${nuevaCarga.id_carga}?useOptimized=true`, // Usar versión optimizada
                sistemaQR: 'optimizado_v2.0',
                siguientePaso: `PDF optimizado con QRs disponible en: GET /api/qr/pdf-carga/${nuevaCarga.id_carga}?useOptimized=true`
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// ========== GENERAR CÓDIGO DE CARGA ==========
export const generarCodigoCarga = async (req, res) => {
    try {
        // Generar código único basado en timestamp
        const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
        const random = Math.random().toString(36).substring(2, 5).toUpperCase();
        const codigo_carga = `CG${timestamp}${random}`;

        res.json({
            success: true,
            codigo_carga: codigo_carga,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error generando código de carga:', error);
        res.status(500).json({
            success: false,
            message: "Error generando código de carga",
            error: error.message
        });
    }
};
