import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';
import path from 'path';

console.log('🧪 [Test Excel] Iniciando test de upload Excel...');

async function testExcelUpload() {
    try {
        // Buscar un archivo Excel de ejemplo en el directorio de assets
        const excelPath = path.join(process.cwd(), '../888Cris-MERN/backend/uploads');
        console.log('📁 [Test Excel] Buscando archivos Excel en:', excelPath);
        
        // Si no existe, crear un archivo Excel simple de ejemplo
        if (!fs.existsSync(excelPath)) {
            console.log('📁 [Test Excel] Directorio no existe, creando archivo de ejemplo...');
            // Por simplicidad, vamos a usar un archivo existente o crear uno básico
        }

        // Buscar archivos Excel
        const files = fs.readdirSync('.').filter(file => 
            file.endsWith('.xlsx') || file.endsWith('.xls')
        );

        console.log('📄 [Test Excel] Archivos Excel encontrados:', files);

        if (files.length === 0) {
            console.log('⚠️ [Test Excel] No se encontraron archivos Excel para probar');
            return;
        }

        const testFile = files[0];
        console.log('📄 [Test Excel] Usando archivo:', testFile);

        // Crear FormData
        const formData = new FormData();
        const fileStream = fs.createReadStream(testFile);
        formData.append('excelFile', fileStream, {
            filename: testFile,
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        console.log('📤 [Test Excel] Enviando archivo al servidor...');

        // Realizar petición
        const response = await fetch('http://localhost:3102/api/cargas/procesar-excel', {
            method: 'POST',
            body: formData
        });

        console.log('📥 [Test Excel] Respuesta recibida:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        });

        const result = await response.json();
        console.log('📊 [Test Excel] Resultado:', result);

        if (result.success) {
            console.log('✅ [Test Excel] Test exitoso!');
            console.log('📊 [Test Excel] Estadísticas:', result.estadisticas);
        } else {
            console.log('❌ [Test Excel] Test falló:', result.message);
        }

    } catch (error) {
        console.error('❌ [Test Excel] Error en test:', error.message);
    }
}

// Esperar un poco para que el servidor esté listo
setTimeout(testExcelUpload, 3000);