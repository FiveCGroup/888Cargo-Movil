const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('🔍 Debug Excel - Analizando archivo subido (método buffer)...');

// Ruta al archivo Excel subido
const archivoPath = path.join(__dirname, 'uploads', '1757695936900-888-DFF.xlsx');

try {
    // Verificar que el archivo existe
    if (!fs.existsSync(archivoPath)) {
        console.error('❌ Archivo no encontrado:', archivoPath);
        process.exit(1);
    }

    console.log('📄 Archivo encontrado:', archivoPath);
    
    // Obtener info del archivo
    const stats = fs.statSync(archivoPath);
    console.log('📊 Tamaño del archivo:', stats.size, 'bytes');

    // Leer el archivo como buffer (como lo hace el servidor)
    const buffer = fs.readFileSync(archivoPath);
    console.log('📦 Buffer leído:', buffer.length, 'bytes');

    // Leer el archivo Excel desde buffer
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Obtener la primera hoja
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    console.log('📋 Hoja encontrada:', sheetName);
    
    // Convertir a JSON para analizar
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
    
    console.log('📊 Total filas en archivo:', jsonData.length);
    console.log('\n=== ANÁLISIS DETALLADO ===');
    
    // Mostrar las primeras 8 filas completas
    for (let i = 0; i < Math.min(8, jsonData.length); i++) {
        console.log(`\nFila ${i + 1} (${jsonData[i]?.length || 0} columnas):`, jsonData[i]);
    }
    
    // Encontrar la fila de encabezados (fila 5, índice 4)
    if (jsonData.length > 4) {
        const encabezados = jsonData[4];
        console.log('\n=== ENCABEZADOS (Fila 5) ===');
        if (encabezados) {
            encabezados.forEach((header, index) => {
                console.log(`Columna ${index + 1}: "${header}"`);
            });
            
            // Buscar la columna "MEDIDA DE CAJA"
            const indiceMedida = encabezados.findIndex(h => h && h.toString().trim() === 'MEDIDA DE CAJA');
            
            if (indiceMedida !== -1) {
                console.log(`\n=== DATOS DE COLUMNA "MEDIDA DE CAJA" (Índice ${indiceMedida}) ===`);
                
                // Mostrar los datos de esa columna en todas las filas de datos
                for (let i = 5; i < jsonData.length; i++) {
                    const fila = jsonData[i];
                    if (fila && fila.length > indiceMedida) {
                        const valorMedida = fila[indiceMedida];
                        console.log(`Fila ${i + 1}: "${valorMedida}" (tipo: ${typeof valorMedida})`);
                    }
                }
            } else {
                console.log('\n❌ No se encontró la columna "MEDIDA DE CAJA"');
                console.log('Buscando columnas similares...');
                encabezados.forEach((header, index) => {
                    if (header && header.toString().toLowerCase().includes('medida')) {
                        console.log(`  Columna ${index + 1}: "${header}"`);
                    }
                });
            }
        }
    }
    
} catch (error) {
    console.error('❌ Error al leer archivo Excel:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}