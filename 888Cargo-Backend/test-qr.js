import * as QRModel from './models/qr.model.js';
import { initDatabase } from './db/database.js';

console.log('🧪 [Test QR] Probando generación de QR con logo...');

async function testQRGeneration() {
    try {
        // Inicializar base de datos
        await initDatabase();
        console.log('✅ [Test QR] Base de datos inicializada');

        // Datos de prueba para el QR
        const cajaInfo = {
            numero_caja: 1,
            cant_por_caja: 10,
            ref_art: 'TEST001',
            descripcion_espanol: 'Producto de prueba',
            descripcion_chino: '测试产品',
            codigo_carga: 'PL-TEST-2024',
            ciudad_destino: 'Bogotá'
        };

        // Generar QR para prueba
        console.log('🎨 [Test QR] Generando QR con datos de prueba...');
        const qr = await QRModel.createQRForCaja(1, cajaInfo);
        
        console.log('✅ [Test QR] QR generado exitosamente:', {
            id_qr: qr.id_qr,
            codigo_qr: qr.codigo_qr,
            url_imagen: qr.url_imagen,
            estado: qr.estado
        });

        // Verificar que el archivo se creó
        const fs = await import('fs');
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const qrImagePath = path.join(__dirname, 'qr-images');
        
        const files = fs.readdirSync(qrImagePath);
        console.log('📁 [Test QR] Archivos en qr-images:', files);

        console.log('🎉 [Test QR] Prueba completada exitosamente');
        
    } catch (error) {
        console.error('❌ [Test QR] Error en prueba:', error);
    }
}

testQRGeneration();