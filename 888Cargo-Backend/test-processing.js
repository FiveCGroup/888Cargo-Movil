import { initDatabase, insert, get, query } from './db/database.js';
import fs from 'fs';
import { procesarExcel } from './controllers/carga.controller.js';

async function probarProcesamiento() {
    try {
        console.log('🧪 Iniciando prueba de procesamiento...');
        
        // Inicializar base de datos
        await initDatabase();
        
        // Crear un cliente de prueba si no existe
        let cliente = await get('clientes', { id: 1 });
        if (!cliente) {
            await insert('clientes', {
                nombre: 'Cliente de Prueba',
                email: 'test@example.com',
                telefono: '123456789',
                direccion: 'Dirección de prueba'
            });
            console.log('✅ Cliente de prueba creado');
        }
        
        // Datos de la carga
        const datosCarga = {
            codigo_carga: `TEST-${Date.now()}`,
            id_cliente: 1,
            direccion_destino: 'Dirección de destino de prueba',
            ciudad_destino: 'Ciudad de prueba',
            creado_por: 1
        };
        
        // Leer archivo CSV como buffer
        const archivoPath = './test-packing-list.csv';
        const buffer = fs.readFileSync(archivoPath);
        
        console.log('📄 Archivo leído, iniciando procesamiento...');
        
        // Procesar archivo
        const resultado = await procesarArchivoExcel(buffer, datosCarga, 'test-packing-list.csv');
        
        console.log('✅ ¡Procesamiento exitoso!');
        console.log('📊 Resultado:', resultado);
        
        // Verificar datos creados
        const carga = await get('cargas', { codigo_carga: datosCarga.codigo_carga });
        console.log('📦 Carga creada:', carga);
        
        const articulos = await query('SELECT * FROM articulo_packing_list WHERE id_carga = ?', [carga.id_carga]);
        console.log('📋 Artículos creados:', articulos.length);
        
        const cajas = await query('SELECT * FROM caja WHERE id_carga = ?', [carga.id_carga]);
        console.log('📦 Cajas creadas:', cajas.length);
        
        if (cajas.length > 0) {
            console.log('🏷️ Generando QR para primera caja...');
            const { generateQRWithLogo } = await import('./models/qr.model.js');
            const qrResult = await generateQRWithLogo(cajas[0].id);
            console.log('🔲 QR generado:', qrResult);
        }
        
    } catch (error) {
        console.error('❌ Error en prueba:', error);
        console.error('Stack:', error.stack);
    }
}

probarProcesamiento();