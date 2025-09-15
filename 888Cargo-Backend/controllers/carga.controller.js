import xlsx from 'xlsx';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase, query } from '../db/database.js';

// Importar modelos
import * as CargaModel from '../models/carga.model.js';
import * as ArticuloModel from '../models/articulo.model.js';
import * as CajaModel from '../models/caja.model.js';
import * as QRModel from '../models/qr.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================== FUNCIONES AUXILIARES ==================

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

// Función para validar una fila (basada en el proyecto web)
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

    // Validar columnas numéricas (índices comunes)
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

// Función para procesar filas de Excel (basada en el proyecto web)
const procesarFilasSimple = (filas) => {
    const filasValidas = [];
    const filasConError = [];
    let filasExitosas = 0;
    let filasConErrorCount = 0;
    let filasVacias = 0;
    const totalFilas = filas.length - 1;

    console.log('🔄 [Carga Controller] === INICIANDO PROCESAMIENTO DE ARCHIVO ===');
    console.log(`🔄 [Carga Controller] Total de filas a procesar: ${totalFilas}`);

    // Procesar encabezados usando la función existente
    const encabezadosOriginales = filas[0];
    const encabezadosProcesados = procesarEncabezados(encabezadosOriginales);

    for (let i = 1; i < filas.length; i++) {
        const fila = filas[i];
        const validacion = validarFila(fila);

        if (validacion.esVacia) {
            filasVacias++;
            console.log(`🔄 [Carga Controller] Fila ${i + 1}: VACÍA - saltando`);
        } else if (validacion.valida) {
            // Procesar la fila para ajustar las columnas de medidas
            const filaProcesada = procesarFilaDatos(fila, encabezadosOriginales);
            filasValidas.push(filaProcesada);
            filasExitosas++;
            console.log(`🔄 [Carga Controller] Fila ${i + 1}: CARGADA EXITOSAMENTE`);
        } else {
            // Guardar fila con errores junto con información adicional
            const filaProcesada = procesarFilaDatos(fila, encabezadosOriginales);
            filasConError.push({
                numeroFila: i + 1,
                datos: filaProcesada,
                errores: validacion.errores,
            });
            filasConErrorCount++;
            console.log(`🔄 [Carga Controller] Fila ${i + 1}: ERROR - ${validacion.errores.join(", ")}`);
        }
    }

    console.log('🔄 [Carga Controller] === RESUMEN DE CARGA ===');
    console.log(`🔄 [Carga Controller] Total de filas: ${totalFilas}`);
    console.log(`🔄 [Carga Controller] Filas cargadas exitosamente: ${filasExitosas}`);
    console.log(`🔄 [Carga Controller] Filas con errores: ${filasConErrorCount}`);
    console.log(`🔄 [Carga Controller] Filas vacías: ${filasVacias}`);
    console.log('🔄 [Carga Controller] === FIN DE PROCESAMIENTO ===');

    return {
        filasValidas: [encabezadosProcesados, ...filasValidas], // Usar encabezados procesados
        filasConError: filasConError,
        estadisticas: {
            filasExitosas,
            filasConError: filasConErrorCount,
            filasVacias,
            totalFilas,
        },
    };
};

// Función auxiliar para mapear datos del artículo desde la fila del Excel
function mapearDatosArticulo(fila, headers, id_carga, secuencia) {
    // Crear un mapa de índices basado en los headers
    const headerMap = {};
    headers.forEach((header, index) => {
        if (header) {
            headerMap[header.toString().trim()] = index;
        }
    });

    // Función helper para obtener valor por header
    const getValueByHeader = (headerName) => {
        const index = headerMap[headerName];
        return index !== undefined && fila[index] !== undefined ? fila[index] : '';
    };

    // Mapear todos los campos según el header
    return {
        id_carga,
        secuencia,
        fecha: getValueByHeader('Fecha'),
        marca_cliente: getValueByHeader('Marca Cliente'),
        tel_cliente: getValueByHeader('Tel Cliente'),
        ciudad_destino: getValueByHeader('Ciudad Destino'),
        phto: getValueByHeader('PHTO'),
        cn: getValueByHeader('C/N'),
        ref_art: getValueByHeader('Ref Art'),
        descripcion_espanol: getValueByHeader('Descripción ES'),
        descripcion_chino: getValueByHeader('Descripción CN'),
        unit: getValueByHeader('Unit'),
        precio_unit: parseFloat(getValueByHeader('Precio Unit')) || 0,
        precio_total: parseFloat(getValueByHeader('Precio Total')) || 0,
        material: getValueByHeader('Material'),
        unidades_empaque: parseInt(getValueByHeader('Unidades x Empaque')) || 0,
        marca_producto: getValueByHeader('Marca Producto'),
        cajas: parseInt(getValueByHeader('Cajas')) || 0,
        cant_por_caja: parseInt(getValueByHeader('Cant por Caja')) || 0,
        cant_total: parseInt(getValueByHeader('Cant Total')) || 0,
        largo: parseFloat(getValueByHeader('Largo')) || 0,
        ancho: parseFloat(getValueByHeader('Ancho')) || 0,
        alto: parseFloat(getValueByHeader('Alto')) || 0,
        cbm: parseFloat(getValueByHeader('CBM')) || 0,
        cbmtt: parseFloat(getValueByHeader('CBM TT')) || 0,
        gw: parseFloat(getValueByHeader('G.W')) || 0,
        gwtt: parseFloat(getValueByHeader('G.W TT')) || 0,
        serial: getValueByHeader('Serial'),
        imagen_url: null // Se asignará después si hay imágenes
    };
}

// ================== CONTROLADORES PRINCIPALES ==================

// Procesar archivo Excel (mantener funcionalidad existente)
export const procesarExcel = async (req, res) => {
    try {
        console.log('📤 [Carga Controller] Procesando archivo Excel...');
        console.log('📄 [Carga Controller] req.file:', req.file ? 'Existe' : 'No existe');
        console.log('📄 [Carga Controller] req.body:', Object.keys(req.body || {}));

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No se ha enviado ningún archivo'
            });
        }

        console.log(`📄 [Carga Controller] Archivo recibido: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)}MB)`);
        console.log('📄 [Carga Controller] Tiene buffer:', !!req.file.buffer);
        console.log('📄 [Carga Controller] Tiene path:', !!req.file.path);

        // Intentar leer el archivo de diferentes maneras
        let workbook;
        if (req.file.buffer) {
            console.log('📄 [Carga Controller] Leyendo desde buffer...');
            workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        } else if (req.file.path) {
            console.log('📄 [Carga Controller] Leyendo desde path...');
            workbook = xlsx.readFile(req.file.path);
        } else {
            throw new Error('No se puede leer el archivo: no hay buffer ni path');
        }

        console.log('📄 [Carga Controller] Workbook sheets:', workbook.SheetNames);
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        console.log('📋 [Carga Controller] Hoja encontrada:', sheetName);

        // Convertir a JSON - Usar la misma configuración que el proyecto web
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { 
            header: 1, 
            raw: false,
            range: 4  // Empezar desde la fila 5 (índice 4) como en el proyecto web
        });

        console.log('📊 [Carga Controller] Total filas extraídas:', jsonData ? jsonData.length : 'jsonData es undefined');
        console.log('📊 [Carga Controller] jsonData tipo:', typeof jsonData);
        console.log('📊 [Carga Controller] jsonData es array:', Array.isArray(jsonData));
        
        if (!jsonData || !Array.isArray(jsonData)) {
            throw new Error('No se pudieron extraer datos del archivo Excel');
        }
        
        if (jsonData.length === 0) {
            throw new Error('El archivo Excel está vacío');
        }

        console.log('📊 [Carga Controller] Encabezados (fila 0):', jsonData[0]);
        console.log('📊 [Carga Controller] Primera fila de datos (fila 1):', jsonData[1]);
        console.log('📊 [Carga Controller] Segunda fila de datos (fila 2):', jsonData[2]);

        // Procesar las filas usando la lógica simple del proyecto web
        const resultado = procesarFilasSimple(jsonData);

        const estadisticas = {
            totalFilas: jsonData.length,
            filasEncabezado: 1, // Solo una fila de encabezado con range: 4
            filasValidas: resultado.filasValidas.length - 1, // -1 por el header
            filasConError: resultado.filasConError.length,
            columnas: jsonData[0]?.length || 0
        };

        console.log('📈 [Carga Controller] Estadísticas:', estadisticas);
        console.log('✅ [Carga Controller] Archivo procesado exitosamente');

        res.json({
            success: true,
            data: resultado.filasValidas,
            filasConError: resultado.filasConError,
            estadisticas,
            mensaje: 'Archivo Excel procesado exitosamente',
            nombreArchivo: req.file.originalname
        });

    } catch (error) {
        console.error('❌ [Carga Controller] Error al procesar Excel:', error);
        
        let errorMessage = 'Error al procesar el archivo Excel: ';
        
        // Manejo específico de errores
        if (error.message.includes('Bad compressed size')) {
            errorMessage = 'Archivo Excel corrupto o dañado. Verifique que el archivo no esté dañado y vuelva a intentar.';
        } else if (error.message.includes('parse')) {
            errorMessage = 'Error al leer el archivo Excel. Verifique que sea un archivo Excel válido (.xlsx o .xls).';
        } else if (error.message.includes('buffer')) {
            errorMessage = 'Error al procesar el contenido del archivo. El archivo puede estar corrupto.';
        } else {
            errorMessage += error.message;
        }

        res.status(500).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
        });
    }
};

// Guardar packing list completo con QRs
export const guardarPackingListConQR = async (req, res) => {
    try {
        console.log('💾 [Carga Controller] Guardando packing list completo con QRs...');
        
        const { datos, metadata } = req.body;
        
        if (!datos || !Array.isArray(datos) || datos.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Datos del packing list requeridos'
            });
        }

        // Inicializar base de datos
        await initDatabase();

        // 1. Crear carga
        const codigoCarga = metadata?.codigo_carga || CargaModel.generarCodigoCarga();
        const cargaData = {
            codigo_carga: codigoCarga,
            id_cliente: metadata?.id_cliente || 1,
            direccion_destino: metadata?.direccion_destino || '',
            ciudad_destino: metadata?.ciudad_destino || '',
            archivo_original: metadata?.archivo_original || 'archivo.xlsx'
        };

        console.log('📦 [Carga Controller] Creando carga:', codigoCarga);
        const carga = await CargaModel.createCarga(cargaData);

        // 2. Procesar artículos (saltear encabezados - primera fila)
        const headers = datos[0];
        const filasArticulos = datos.slice(1);
        const articulosCreados = [];
        const cajasCreadas = [];
        const qrsCreados = [];

        console.log(`📋 [Carga Controller] Procesando ${filasArticulos.length} artículos...`);

        for (let i = 0; i < filasArticulos.length; i++) {
            const fila = filasArticulos[i];
            
            // Validar fila no vacía
            if (!fila || fila.every(celda => !celda || celda.toString().trim() === '')) {
                continue;
            }

            // Mapear datos del artículo según headers
            const articuloData = mapearDatosArticulo(fila, headers, carga.id_carga, i + 1);
            
            // 3. Crear artículo
            console.log(`📄 [Carga Controller] Creando artículo ${i + 1}: ${articuloData.ref_art}`);
            const articulo = await ArticuloModel.createArticulo(articuloData);
            articulosCreados.push(articulo);

            // 4. Crear cajas para el artículo
            const totalCajas = parseInt(articuloData.cajas) || 1;
            if (totalCajas > 0) {
                console.log(`📦 [Carga Controller] Creando ${totalCajas} cajas para artículo ${articulo.id_articulo}`);
                const cajas = await CajaModel.createCajasForArticulo(articulo.id_articulo, totalCajas, articuloData);
                cajasCreadas.push(...cajas);

                // 5. Crear QRs para cada caja
                for (const caja of cajas) {
                    console.log(`🏷️ [Carga Controller] Generando QR para caja ${caja.numero_caja}`);
                    const cajaInfo = {
                        ...caja,
                        ref_art: articuloData.ref_art,
                        descripcion_espanol: articuloData.descripcion_espanol,
                        descripcion_chino: articuloData.descripcion_chino,
                        codigo_carga: carga.codigo_carga,
                        ciudad_destino: carga.ciudad_destino
                    };
                    
                    const qr = await QRModel.createQRForCaja(caja.id_caja, cajaInfo);
                    qrsCreados.push(qr);
                }
            }
        }

        // 6. Actualizar estadísticas de la carga
        console.log('📊 [Carga Controller] Actualizando estadísticas de la carga...');
        await CargaModel.actualizarEstadisticasCarga(carga.id_carga);

        // 7. Obtener estadísticas finales
        const estadisticasFinales = {
            carga: await CargaModel.getCargaById(carga.id_carga),
            articulos: articulosCreados.length,
            cajas: cajasCreadas.length,
            qrs: qrsCreados.length,
            estadisticas_articulos: await ArticuloModel.getEstadisticasArticulos(carga.id_carga),
            estadisticas_cajas: await CajaModel.getEstadisticasCajas(carga.id_carga),
            estadisticas_qrs: await QRModel.getEstadisticasQRs(carga.id_carga)
        };

        console.log('✅ [Carga Controller] Packing list guardado exitosamente');
        console.log(`📈 [Carga Controller] Resumen: ${articulosCreados.length} artículos, ${cajasCreadas.length} cajas, ${qrsCreados.length} QRs`);

        res.json({
            success: true,
            message: 'Packing list guardado exitosamente',
            data: {
                carga,
                articulos_creados: articulosCreados.length,
                cajas_creadas: cajasCreadas.length,
                qrs_creados: qrsCreados.length,
                estadisticas: estadisticasFinales
            }
        });

    } catch (error) {
        console.error('❌ [Carga Controller] Error al guardar packing list:', error);
        res.status(500).json({
            success: false,
            message: 'Error al guardar packing list',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Buscar packing list por código
export const buscarPackingList = async (req, res) => {
    try {
        const { codigo } = req.params;
        console.log(`🔍 [Carga Controller] Buscando packing list: ${codigo}`);

        // Buscar carga por código
        const carga = await CargaModel.getCargaByCodigo(codigo);
        
        if (!carga) {
            return res.status(404).json({
                success: false,
                message: 'Packing list no encontrado'
            });
        }

        // Obtener artículos de la carga
        const articulos = await ArticuloModel.getArticulosByCarga(carga.id_carga);
        
        // Obtener cajas y QRs
        const cajas = await CajaModel.getCajasByCarga(carga.id_carga);
        const qrs = await QRModel.getQRsByCarga(carga.id_carga);

        console.log(`✅ [Carga Controller] Packing list encontrado: ${articulos.length} artículos`);

        res.json({
            success: true,
            data: {
                carga,
                articulos,
                cajas,
                qrs,
                estadisticas: {
                    total_articulos: articulos.length,
                    total_cajas: cajas.length,
                    total_qrs: qrs.length
                }
            }
        });

    } catch (error) {
        console.error('❌ [Carga Controller] Error al buscar packing list:', error);
        res.status(500).json({
            success: false,
            message: 'Error al buscar packing list',
            error: error.message
        });
    }
};

// Generar código único para carga
export const generarCodigoCarga = () => {
    return CargaModel.generarCodigoCarga();
};

// ================== FUNCIONES DEL SERVER.JS EXISTENTE ==================

// Función para procesar estructura específica (migrada desde server.js)
function procesarEstructuraEspecifica(jsonData) {
    console.log('🔄 [Excel Server] Procesando estructura específica...');
    console.log('🔄 [Excel Server] jsonData recibido:', jsonData ? `Array de ${jsonData.length} elementos` : 'undefined/null');
    
    if (!jsonData || !Array.isArray(jsonData)) {
        throw new Error('Datos de Excel inválidos: jsonData no es un array válido');
    }
    
    // Verificar que tenemos al menos 6 filas (5 de encabezado + 1 de datos)
    if (jsonData.length < 6) {
        throw new Error(`Archivo demasiado pequeño. Se esperaban al menos 6 filas pero se encontraron ${jsonData.length}. Verifique que el archivo tenga la estructura correcta con 5 filas de encabezado.`);
    }
    
    // La fila 5 (índice 4) contiene los encabezados reales
    const encabezadosOriginales = jsonData[4] || [];
    console.log('📋 [Excel Server] Fila 4 (encabezados):', encabezadosOriginales);
    console.log('📋 [Excel Server] Tipo de fila 4:', typeof jsonData[4]);
    console.log('📋 [Excel Server] Es array fila 4:', Array.isArray(jsonData[4]));
    
    if (!Array.isArray(encabezadosOriginales)) {
        throw new Error('Los encabezados en la fila 5 no son válidos');
    }
    
    // Procesar encabezados - separar "MEDIDA DE CAJA" en Largo, Ancho, Alto
    const encabezadosProcesados = procesarEncabezados(encabezadosOriginales);
    
    // Procesar datos desde la fila 6 en adelante
    const datosProcesados = [encabezadosProcesados];
    
    for (let i = 5; i < jsonData.length; i++) {
        const fila = jsonData[i];
        if (fila && fila.some(celda => celda !== null && celda !== undefined && celda !== '')) {
            const filaProcesada = procesarFilaDatos(fila, encabezadosOriginales);
            datosProcesados.push(filaProcesada);
        }
    }
    
    console.log('✅ [Excel Server] Datos procesados:', datosProcesados.length, 'filas');
    console.log('📋 [Excel Server] Ejemplo fila procesada:', datosProcesados[1]);
    
    return datosProcesados;
}

// Función para procesar encabezados
function procesarEncabezados(encabezadosOriginales) {
    const encabezadosMapeo = {
        'Fecha': 'Fecha',
        'MARCA DEL CLIENTE': 'Marca Cliente',
        '# TEL./ CLIENTE': 'Tel Cliente',
        '# TEL./ CLIENTE ': 'Tel Cliente',
        'CIUDADDESTINO': 'Ciudad Destino',
        'PHTO': 'PHTO',
        'C/N': 'C/N',
        'REF.ART': 'Ref Art',
        'DESCRIPCION ESPAÑOL': 'Descripción ES',
        'DESCRIPCION CHINO': 'Descripción CN',
        'UNIT': 'Unit',
        'PRECIO UNIT': 'Precio Unit',
        'PRECIO. UNIT': 'Precio Unit',
        'PRECIO TOTAL': 'Precio Total',
        'PRECIO. TOTAL': 'Precio Total',
        'MATERIAL': 'Material',
        'UNIDADES X EMPAQUE': 'Unidades x Empaque',
        'MARCA DEL PRODUCTO': 'Marca Producto',
        'CAJAS': 'Cajas',
        'CANT POR CAJA': 'Cant por Caja',
        'CANT TOTAL': 'Cant Total',
        'CANT. TOTAL': 'Cant Total',
        'CBM': 'CBM',
        'CBM.TT': 'CBM TT',
        'G.W': 'G.W',
        'G.W.': 'G.W',
        'G.W.TT': 'G.W TT',
        'Serial': 'Serial'
    };

    // Si existe un encabezado 'MEDIDA DE CAJA' que abarca 3 columnas, reemplazarlo por 'Largo', 'Ancho', 'Alto'
    let encabezadosProcesados = [];
    for (let i = 0; i < encabezadosOriginales.length; i++) {
        const encabezadoLimpio = encabezadosOriginales[i] ? encabezadosOriginales[i].toString().trim() : '';
        if (encabezadoLimpio.toUpperCase() === 'MEDIDA DE CAJA') {
            // Reemplazar la celda combinada por tres encabezados
            encabezadosProcesados.push('Largo', 'Ancho', 'Alto');
            // Saltar las siguientes dos columnas (ya que la celda combinada abarca 3 columnas)
            i += 2;
        } else if (encabezadosMapeo[encabezadoLimpio]) {
            encabezadosProcesados.push(encabezadosMapeo[encabezadoLimpio]);
        } else if (encabezadoLimpio) {
            encabezadosProcesados.push(encabezadoLimpio);
        }
    }

    console.log('📋 [Excel Server] Encabezados procesados:', encabezadosProcesados);
    console.log('📊 [Excel Server] Total encabezados:', encabezadosProcesados.length);

    return encabezadosProcesados;
}

// Función para procesar fila de datos
function procesarFilaDatos(fila, encabezadosOriginales) {
    // Procesar fila considerando que si el encabezado es 'MEDIDA DE CAJA' (celda combinada), los siguientes 3 valores son Largo, Ancho, Alto
    let filaProcesada = [];
    for (let i = 0; i < encabezadosOriginales.length; i++) {
        const encabezadoLimpio = encabezadosOriginales[i] ? encabezadosOriginales[i].toString().trim() : '';
        if (encabezadoLimpio.toUpperCase() === 'MEDIDA DE CAJA') {
            // Tomar los siguientes 3 valores como Largo, Ancho, Alto
            filaProcesada.push(
                fila[i] ? fila[i].toString().trim() : '',
                fila[i+1] ? fila[i+1].toString().trim() : '',
                fila[i+2] ? fila[i+2].toString().trim() : ''
            );
            i += 2;
        } else {
            filaProcesada.push(fila[i] ? fila[i].toString().trim() : '');
        }
    }
    
    console.log('🔍 [Excel Server] Fila procesada - Original:', fila.length, 'celdas, Procesada:', filaProcesada.length, 'celdas');
    console.log('📊 [Excel Server] Datos procesados:', filaProcesada.slice(0, 10), '...');
    
    return filaProcesada;
}

// ================== FUNCIONES PARA OBTENER DATOS ==================

// Obtener información de una carga por ID
export async function obtenerCargaPorId(req, res) {
    try {
        const { idCarga } = req.params;
        console.log('📋 [Carga Controller] Obteniendo información de carga:', idCarga);

        const carga = await CargaModel.getCargaById(idCarga);
        
        if (!carga) {
            return res.status(404).json({
                success: false,
                message: 'Carga no encontrada'
            });
        }

        console.log('✅ [Carga Controller] Información de carga obtenida exitosamente');
        res.json({
            success: true,
            data: carga,
            message: 'Información de carga obtenida exitosamente'
        });

    } catch (error) {
        console.error('❌ [Carga Controller] Error al obtener carga:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
}

// Obtener códigos QR de una carga
export async function obtenerQRsDeCarga(req, res) {
    try {
        const { idCarga } = req.params;
        console.log('🏷️ [Carga Controller] Obteniendo QRs de carga:', idCarga);

        // Primero verificar que la carga existe
        const carga = await CargaModel.getCargaById(idCarga);
        if (!carga) {
            return res.status(404).json({
                success: false,
                message: 'Carga no encontrada'
            });
        }

        // Obtener QRs asociados a la carga
        const qrs = await query(`
            SELECT 
                qr.id_qr as id,
                qr.codigo_qr as qr_code,
                qr.datos_qr,
                apl.descripcion_espanol as descripcion,
                apl.secuencia as item_numero,
                c.numero_caja,
                qr.url_imagen
            FROM qr 
            INNER JOIN caja c ON qr.id_caja = c.id_caja
            INNER JOIN articulo_packing_list apl ON c.id_articulo = apl.id_articulo
            WHERE apl.id_carga = ?
            ORDER BY apl.secuencia ASC, c.numero_caja ASC
        `, [idCarga]);

        console.log('✅ [Carga Controller] QRs obtenidos exitosamente:', qrs.length, 'códigos');
        res.json({
            success: true,
            data: qrs,
            message: `${qrs.length} códigos QR obtenidos exitosamente`
        });

    } catch (error) {
        console.error('❌ [Carga Controller] Error al obtener QRs:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
}