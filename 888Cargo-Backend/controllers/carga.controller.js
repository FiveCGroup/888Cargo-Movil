import xlsx from 'xlsx';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase } from '../db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para validar estructura del Excel
const validarEstructuraExcel = (datosExcel) => {
    const errores = [];
    const filasConError = [];
    
    if (!datosExcel || datosExcel.length === 0) {
        return { esValido: false, errores: ['El archivo está vacío'] };
    }
    
    // Validar headers mínimos (primera fila)
    const headers = datosExcel[0];
    if (!headers || headers.length < 3) {
        errores.push('El archivo debe tener al menos 3 columnas');
    }
    
    // Validar cada fila de datos
    for (let i = 1; i < datosExcel.length; i++) {
        const fila = datosExcel[i];
        const erroresFila = [];
        
        // Validar que la fila no esté completamente vacía
        const filaVacia = !fila || fila.every(celda => !celda || celda.toString().trim() === '');
        if (filaVacia) {
            erroresFila.push('Fila vacía');
        }
        
        // Validar cantidad mínima de datos
        if (fila && fila.length < 2) {
            erroresFila.push('Faltan datos requeridos');
        }
        
        if (erroresFila.length > 0) {
            filasConError.push({
                numeroFila: i + 1,
                errores: erroresFila,
                datos: fila || []
            });
        }
    }
    
    return {
        esValido: errores.length === 0,
        errores,
        filasConError
    };
};

// Procesar archivo Excel
export const procesarExcel = async (req, res) => {
    try {
        console.log('📤 [Carga Controller] Procesando archivo Excel...');
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No se ha enviado ningún archivo'
            });
        }
        
        console.log(`📄 [Carga Controller] Archivo recibido: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)}MB)`);
        
        // Leer el archivo Excel desde el buffer
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        
        // Obtener la primera hoja
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir a JSON (array de arrays)
        const datosExcel = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log(`📊 [Carga Controller] Datos extraídos: ${datosExcel.length} filas`);
        
        // Validar estructura
        const validacion = validarEstructuraExcel(datosExcel);
        
        // Calcular estadísticas
        const estadisticas = {
            totalFilas: datosExcel.length - 1, // Excluir header
            filasValidas: (datosExcel.length - 1) - validacion.filasConError.length,
            filasConErrores: validacion.filasConError.length,
            columnas: datosExcel[0]?.length || 0
        };
        
        console.log('📈 [Carga Controller] Estadísticas:', estadisticas);
        
        res.json({
            success: true,
            message: 'Archivo procesado correctamente',
            data: {
                datosExcel,
                filasConError: validacion.filasConError,
                estadisticas,
                nombreArchivo: req.file.originalname
            }
        });
        
    } catch (error) {
        console.error('❌ [Carga Controller] Error al procesar Excel:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar el archivo Excel',
            error: error.message
        });
    }
};

// Generar código único para carga
const generarCodigoUnico = () => {
    const fecha = new Date();
    const timestamp = fecha.getTime();
    const random = Math.floor(Math.random() * 1000);
    return `PL-${fecha.getFullYear()}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}-${random}-${timestamp.toString().slice(-4)}`;
};

// Guardar packing list con QRs
export const guardarPackingListConQR = async (req, res) => {
    try {
        console.log('💾 [Carga Controller] Guardando packing list con QRs...');
        
        const { cliente, carga, items, estadisticas } = req.body;
        
        // Validar datos requeridos
        if (!cliente || !carga || !items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos para guardar la carga'
            });
        }
        
        const db = await initDatabase();
        
        // Insertar cliente
        const insertCliente = db.prepare(`
            INSERT INTO clientes (nombre_cliente, correo_cliente, telefono_cliente, direccion_entrega, fecha_creacion)
            VALUES (?, ?, ?, ?, datetime('now'))
        `);
        
        const resultadoCliente = insertCliente.run(
            cliente.nombre_cliente,
            cliente.correo_cliente,
            cliente.telefono_cliente,
            cliente.direccion_entrega
        );
        
        const idCliente = resultadoCliente.lastInsertRowid;
        console.log(`👤 [Carga Controller] Cliente insertado con ID: ${idCliente}`);
        
        // Insertar carga
        const insertCarga = db.prepare(`
            INSERT INTO cargas (
                codigo_carga, 
                id_cliente, 
                direccion_destino, 
                archivo_original, 
                total_items, 
                fecha_creacion
            )
            VALUES (?, ?, ?, ?, ?, datetime('now'))
        `);
        
        const resultadoCarga = insertCarga.run(
            carga.codigo_carga,
            idCliente,
            carga.direccion_destino,
            carga.archivo_original || '',
            items.length
        );
        
        const idCarga = resultadoCarga.lastInsertRowid;
        console.log(`📦 [Carga Controller] Carga insertada con ID: ${idCarga}`);
        
        // Insertar items y generar QRs
        const insertItem = db.prepare(`
            INSERT INTO packing_list_items (
                id_carga,
                item_numero,
                descripcion,
                cantidad,
                peso,
                medidas,
                valor,
                observaciones,
                qr_code,
                fecha_creacion
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `);
        
        let qrsGenerados = 0;
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const itemNumero = i + 1;
            
            // Generar código QR único para cada item
            const qrData = {
                carga: carga.codigo_carga,
                item: itemNumero,
                descripcion: item[1] || `Item ${itemNumero}`,
                timestamp: Date.now()
            };
            
            const qrCode = JSON.stringify(qrData);
            
            try {
                insertItem.run(
                    idCarga,
                    itemNumero,
                    item[1] || '', // Descripción
                    item[2] || 1, // Cantidad
                    item[3] || 0, // Peso
                    item[4] || '', // Medidas
                    item[5] || 0, // Valor
                    item[6] || '', // Observaciones
                    qrCode
                );
                
                qrsGenerados++;
            } catch (error) {
                console.error(`❌ Error al insertar item ${itemNumero}:`, error);
            }
        }
        
        console.log(`🏷️ [Carga Controller] ${qrsGenerados} QRs generados`);
        
        // Respuesta exitosa
        res.json({
            success: true,
            message: 'Packing list guardado correctamente con códigos QR',
            data: {
                idCarga,
                idCliente,
                codigo_carga: carga.codigo_carga,
                total_items: items.length,
                qrs_generados: qrsGenerados
            }
        });
        
    } catch (error) {
        console.error('❌ [Carga Controller] Error al guardar packing list:', error);
        res.status(500).json({
            success: false,
            message: 'Error al guardar el packing list',
            error: error.message
        });
    }
};

// Buscar packing list por código
export const buscarPackingList = async (req, res) => {
    try {
        const { codigo } = req.params;
        console.log(`🔍 [Carga Controller] Buscando packing list: ${codigo}`);
        
        const db = await initDatabase();
        
        const query = `
            SELECT 
                c.id,
                c.codigo_carga,
                c.direccion_destino,
                c.total_items,
                c.fecha_creacion,
                cl.nombre_cliente,
                cl.correo_cliente,
                cl.telefono_cliente
            FROM cargas c
            JOIN clientes cl ON c.id_cliente = cl.id
            WHERE c.codigo_carga LIKE ?
            ORDER BY c.fecha_creacion DESC
            LIMIT 10
        `;
        
        const resultados = db.prepare(query).all(`%${codigo}%`);
        
        console.log(`📋 [Carga Controller] Encontrados ${resultados.length} resultados`);
        
        res.json({
            success: true,
            data: resultados,
            total: resultados.length
        });
        
    } catch (error) {
        console.error('❌ [Carga Controller] Error en búsqueda:', error);
        res.status(500).json({
            success: false,
            message: 'Error al buscar packing list',
            error: error.message
        });
    }
};

// Obtener packing list por ID
export const obtenerPackingList = async (req, res) => {
    try {
        const { idCarga } = req.params;
        console.log(`📄 [Carga Controller] Obteniendo packing list ID: ${idCarga}`);
        
        const db = await initDatabase();
        
        const query = `
            SELECT 
                item_numero,
                descripcion,
                cantidad,
                peso,
                medidas,
                valor,
                observaciones,
                qr_code
            FROM packing_list_items
            WHERE id_carga = ?
            ORDER BY item_numero ASC
        `;
        
        const items = db.prepare(query).all(idCarga);
        
        // Convertir a formato de matriz (como Excel)
        const headers = ['#', 'Descripción', 'Cantidad', 'Peso', 'Medidas', 'Valor', 'Observaciones'];
        const datosExcel = [headers];
        
        items.forEach(item => {
            datosExcel.push([
                item.item_numero,
                item.descripcion,
                item.cantidad,
                item.peso,
                item.medidas,
                item.valor,
                item.observaciones
            ]);
        });
        
        console.log(`📊 [Carga Controller] Enviando ${items.length} items`);
        
        res.json({
            success: true,
            data: datosExcel
        });
        
    } catch (error) {
        console.error('❌ [Carga Controller] Error al obtener packing list:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener packing list',
            error: error.message
        });
    }
};

// Obtener metadata de carga
export const obtenerCargaMeta = async (req, res) => {
    try {
        const { idCarga } = req.params;
        console.log(`📋 [Carga Controller] Obteniendo metadata de carga ID: ${idCarga}`);
        
        const db = await initDatabase();
        
        const query = `
            SELECT 
                c.id,
                c.codigo_carga,
                c.direccion_destino,
                c.archivo_original,
                c.total_items,
                c.fecha_creacion,
                cl.nombre_cliente,
                cl.correo_cliente,
                cl.telefono_cliente,
                cl.direccion_entrega
            FROM cargas c
            JOIN clientes cl ON c.id_cliente = cl.id
            WHERE c.id = ?
        `;
        
        const carga = db.prepare(query).get(idCarga);
        
        if (!carga) {
            return res.status(404).json({
                success: false,
                message: 'Carga no encontrada'
            });
        }
        
        console.log(`✅ [Carga Controller] Metadata obtenida para: ${carga.codigo_carga}`);
        
        res.json({
            success: true,
            data: carga
        });
        
    } catch (error) {
        console.error('❌ [Carga Controller] Error al obtener metadata:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener información de la carga',
            error: error.message
        });
    }
};

// Middleware de multer para export
