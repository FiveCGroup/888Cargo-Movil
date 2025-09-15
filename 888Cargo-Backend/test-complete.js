import { initDatabase, insert, get, query } from './db/database.js';
import multer from 'multer';
import fs from 'fs';

// Configurar multer para procesar archivos
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Simular req y res para testing
function crearMockRequest(archivoPath, datosAdicionales = {}) {
    const buffer = fs.readFileSync(archivoPath);
    
    return {
        file: {
            buffer: buffer,
            originalname: 'test-packing-list.csv',
            mimetype: 'text/csv'
        },
        body: {
            codigo_carga: `TEST-${Date.now()}`,
            id_cliente: '1',
            direccion_destino: 'Dirección de destino de prueba',
            ciudad_destino: 'Ciudad de prueba',
            ...datosAdicionales
        }
    };
}

function crearMockResponse() {
    let statusCode = 200;
    let responseData = null;
    
    return {
        status: (code) => {
            statusCode = code;
            return {
                json: (data) => {
                    responseData = data;
                    console.log(`📤 Response ${statusCode}:`, data);
                    return responseData;
                }
            };
        },
        json: (data) => {
            responseData = data;
            console.log(`📤 Response ${statusCode}:`, data);
            return responseData;
        }
    };
}

async function probarProcesamientoCompleto() {
    try {
        console.log('🧪 Iniciando prueba completa de procesamiento...');
        
        // Inicializar base de datos
        await initDatabase();
        
        // Crear un cliente de prueba si no existe
        let cliente = await get('SELECT * FROM clientes WHERE id = ?', [1]);
        if (!cliente) {
            const clienteId = await query(
                'INSERT INTO clientes (nombre_cliente, correo_cliente, telefono_cliente, ciudad_cliente) VALUES (?, ?, ?, ?)',
                ['Cliente de Prueba', 'test@example.com', '123456789', 'Ciudad de prueba']
            );
            console.log('✅ Cliente de prueba creado con ID:', clienteId);
        } else {
            console.log('✅ Cliente existente encontrado:', cliente.nombre_cliente);
        }
        
        // Importar dinámicamente el controlador
        const { procesarExcel } = await import('./controllers/carga.controller.js');
        
        // Crear mock request y response
        const req = crearMockRequest('./test-packing-list.csv');
        const res = crearMockResponse();
        
        console.log('📄 Archivo CSV leído, iniciando procesamiento...');
        console.log('📋 Datos de carga:', req.body);
        
        // Procesar archivo usando el controlador
        await procesarExcel(req, res);
        
        console.log('✅ ¡Procesamiento completado!');
        
        // Verificar resultados en la base de datos
        const cargas = await query('SELECT * FROM cargas ORDER BY fecha_creacion DESC LIMIT 1');
        if (cargas.length > 0) {
            const carga = cargas[0];
            console.log('📦 Carga creada:', carga);
            
            const articulos = await query('SELECT * FROM articulo_packing_list WHERE id_carga = ?', [carga.id_carga]);
            console.log('📋 Artículos creados:', articulos.length);
            
            const cajas = await query('SELECT * FROM caja WHERE id_carga = ?', [carga.id_carga]);
            console.log('📦 Cajas creadas:', cajas.length);
            
            if (cajas.length > 0) {
                console.log('🏷️ Verificando QR para primera caja...');
                const qrs = await query('SELECT * FROM qr WHERE id_caja = ?', [cajas[0].id]);
                console.log('🔲 QRs generados:', qrs.length);
                
                if (qrs.length > 0) {
                    console.log('🎉 ¡QR generado exitosamente!');
                    console.log('📸 Información del QR:', qrs[0]);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error en prueba:', error);
        console.error('Stack:', error.stack);
    }
}

probarProcesamientoCompleto();