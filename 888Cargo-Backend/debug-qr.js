import { initDatabase } from './db/database.js';
import { createQRForCaja, generarCodigoQR } from './models/qr.model.js';

async function debugQRCreation() {
    try {
        console.log('🧪 Debuggeando creación de QR...');
        
        await initDatabase();
        
        // Test 1: Generar código QR
        console.log('\n1. Test generarCodigoQR:');
        const codigo1 = generarCodigoQR(1);
        const codigo2 = generarCodigoQR(2);
        console.log('   código1:', codigo1);
        console.log('   código2:', codigo2);
        console.log('   tipo codigo1:', typeof codigo1);
        console.log('   es string codigo1:', typeof codigo1 === 'string');
        console.log('   length codigo1:', codigo1?.length);
        
        // Test 2: Verificar que haya cajas en la BD
        const { query } = await import('./db/database.js');
        const cajas = await query('SELECT * FROM caja ORDER BY id_caja DESC LIMIT 3');
        console.log('\n2. Cajas disponibles:', cajas.length);
        
        if (cajas.length > 0) {
            const caja = cajas[0];
            console.log('   Usando caja:', caja.id_caja);
            
            // Test 3: Crear QR
            console.log('\n3. Creando QR para caja:', caja.id_caja);
            
            const cajaInfo = {
                ref_art: 'TEST-REF',
                descripcion_espanol: 'Descripción de prueba',
                descripcion_chino: '测试描述',
                codigo_carga: 'TEST-CARGO-123',
                ciudad_destino: 'Ciudad de prueba'
            };
            
            console.log('   cajaInfo:', cajaInfo);
            
            const qr = await createQRForCaja(caja.id_caja, cajaInfo);
            console.log('   ✅ QR creado exitosamente:', qr.id_qr);
            console.log('   codigo_qr:', qr.codigo_qr);
            
        } else {
            console.log('   ❌ No hay cajas en la BD para probar');
        }
        
    } catch (error) {
        console.error('❌ Error en debug:', error);
        console.error('Stack:', error.stack);
    }
}

debugQRCreation();