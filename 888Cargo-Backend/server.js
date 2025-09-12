const express = require('express');
const cors = require('cors');
const multer = require('multer');
const XLSX = require('xlsx');

const app = express();
const PORT = 3102;

console.log('🚀 [Excel Server] Iniciando servidor con procesamiento real de Excel...');

// CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Multer
const upload = multer({ storage: multer.memoryStorage() });

// Health check
app.get('/api/health', (req, res) => {
    console.log('🏥 Health check');
    res.json({ status: 'ok', port: PORT });
});

// Procesar Excel REAL
app.post('/api/cargas/procesar-excel', upload.single('excelFile'), (req, res) => {
    console.log('📄 [Excel Server] === PROCESANDO ARCHIVO EXCEL REAL ===');
    console.log('📄 [Excel Server] Archivo:', req.file ? req.file.originalname : 'No hay archivo');
    
    if (!req.file) {
        console.log('❌ [Excel Server] No se recibió archivo');
        return res.status(400).json({
            success: false,
            message: 'No se recibió ningún archivo Excel'
        });
    }
    
    try {
        console.log('📊 [Excel Server] Procesando archivo:', {
            nombre: req.file.originalname,
            tamaño: req.file.size,
            tipo: req.file.mimetype
        });
        
        // Verificar que el buffer no esté vacío
        if (!req.file.buffer || req.file.buffer.length === 0) {
            throw new Error('Buffer del archivo está vacío');
        }
        
        console.log('📦 [Excel Server] Buffer recibido:', req.file.buffer.length, 'bytes');
        
        // Leer el archivo Excel desde el buffer - FALLAR SI HAY ERROR
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        
        // Obtener la primera hoja
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        console.log('📋 [Excel Server] Hoja encontrada:', sheetName);
        
        // Convertir a JSON para analizar
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
        
        console.log('� [Excel Server] Total filas en archivo:', jsonData.length);
        console.log('📊 [Excel Server] Primeras 3 filas:', jsonData.slice(0, 3));
        
        // Procesar según la estructura específica
        const datosExcelProcesados = procesarEstructuraEspecifica(jsonData);
        
        // Calcular estadísticas
        const estadisticas = {
            totalFilas: jsonData.length,
            filasEncabezado: 5, // Las primeras 5 filas son encabezados
            filasValidas: datosExcelProcesados.length - 1, // -1 por el header procesado
            filasConError: 0,
            columnas: datosExcelProcesados[0]?.length || 0
        };
        
        console.log('✅ [Excel Server] Archivo procesado exitosamente');
        console.log('📊 [Excel Server] Estadísticas:', estadisticas);
        
        res.json({
            success: true,
            message: 'Archivo Excel procesado correctamente',
            data: {
                filename: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype,
                codigoCarga: 'CARGA-' + Date.now(),
                datosExcel: datosExcelProcesados,
                estadisticas: estadisticas
            }
        });
        
    } catch (error) {
        console.error('❌ [Excel Server] Error al procesar archivo:', error);
        
        let errorMessage = 'Error al procesar el archivo Excel: ';
        
        // Categorizar errores específicos
        if (error.message.includes('Bad compressed size') || error.message.includes('compressed')) {
            errorMessage += 'El archivo Excel está corrupto o dañado. Por favor, verifique que el archivo sea un Excel válido.';
        } else if (error.message.includes('Buffer del archivo está vacío')) {
            errorMessage += 'El archivo está vacío o no se pudo leer correctamente.';
        } else if (error.message.includes('Archivo demasiado pequeño')) {
            errorMessage += error.message;
        } else if (error.message.includes('parse')) {
            errorMessage += 'No se pudo leer el formato del archivo. Asegúrese de que sea un archivo Excel válido (.xlsx).';
        } else {
            errorMessage += error.message;
        }
        
        res.status(400).json({
            success: false,
            message: errorMessage,
            error: {
                type: error.name || 'ProcessingError',
                details: error.message
            }
        });
    }
});

// Función para procesar la estructura específica del Excel
function procesarEstructuraEspecifica(jsonData) {
    console.log('🔄 [Excel Server] Procesando estructura específica...');
    
        // Verificar que tenemos al menos 6 filas (5 de encabezado + 1 de datos)
        if (jsonData.length < 6) {
            throw new Error(`Archivo demasiado pequeño. Se esperaban al menos 6 filas pero se encontraron ${jsonData.length}. Verifique que el archivo tenga la estructura correcta con 5 filas de encabezado.`);
        }    // La fila 5 (índice 4) contiene los encabezados reales
    const encabezadosOriginales = jsonData[4] || [];
    console.log('📋 [Excel Server] Encabezados fila 5:', encabezadosOriginales);
    
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

    // Usar solo una declaración de encabezadosProcesados

    // Si existe un encabezado 'MEDIDA DE CAJA' que abarca 3 columnas, reemplazarlo por 'Largo', 'Ancho', 'Alto'
    // Eliminada declaración duplicada de encabezadosProcesados
    let encabezadosProcesados = [];
    for (let i = 0; i < encabezadosOriginales.length; i++) {
        const encabezadoLimpio = encabezadosOriginales[i] ? encabezadosOriginales[i].toString().trim() : '';
        if (encabezadoLimpio.toUpperCase() === 'MEDIDA DE CAJA') {
            encabezadosProcesados.push('Largo', 'Ancho', 'Alto');
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
    // Eliminada declaración duplicada de filaProcesada
    // Procesar fila considerando que si el encabezado es 'MEDIDA DE CAJA' (celda combinada), los siguientes 3 valores son Largo, Ancho, Alto
    let filaProcesada = [];
    for (let i = 0; i < encabezadosOriginales.length; i++) {
        const encabezadoLimpio = encabezadosOriginales[i] ? encabezadosOriginales[i].toString().trim() : '';
        if (encabezadoLimpio.toUpperCase() === 'MEDIDA DE CAJA') {
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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor en puerto ${PORT}`);
    console.log(`🌐 Local: http://localhost:${PORT}/api/health`);
    console.log(`📱 Emulador: http://10.0.2.2:${PORT}/api/health`);
});
