import ExcelJS from 'exceljs';
import path from 'path';

async function crearArchivoExcelPrueba() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Packing List');
    
    // Agregar encabezados
    worksheet.addRow([
        'CODIGO', 'DESCRIPCION', 'QTY', 'PESO_UNIT', 'PESO_TOTAL',
        'CBM_UNIT', 'CBM_TOTAL', 'VALOR_UNIT', 'VALOR_TOTAL'
    ]);
    
    // Agregar datos de prueba
    worksheet.addRow(['TEST001', 'Producto de Prueba 1', 10, 2.5, 25, 0.1, 1, 100, 1000]);
    worksheet.addRow(['TEST002', 'Producto de Prueba 2', 5, 3.0, 15, 0.2, 1, 200, 1000]);
    worksheet.addRow(['TEST003', 'Producto de Prueba 3', 8, 1.5, 12, 0.15, 1.2, 150, 1200]);
    
    // Guardar archivo
    const filePath = './test-packing-list.xlsx';
    await workbook.xlsx.writeFile(filePath);
    console.log('✅ Archivo Excel de prueba creado:', filePath);
    
    return filePath;
}

crearArchivoExcelPrueba();