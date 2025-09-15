const API_BASE = 'http://localhost:3102/api';

async function probarProcesarExcel() {
    try {
        console.log('🧪 Probando procesamiento de Excel...');
        
        // Crear datos de prueba como FormData
        const formData = new FormData();
        
        // Crear un blob de datos CSV simple para simular un archivo Excel
        const csvContent = `CODIGO,DESCRIPCION,QTY,PESO_UNIT,PESO_TOTAL,CBM_UNIT,CBM_TOTAL,VALOR_UNIT,VALOR_TOTAL
ABC001,Producto Test 1,10,1.5,15,0.1,1,100,1000
ABC002,Producto Test 2,5,2.0,10,0.2,1,200,1000`;
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const archivo = new File([blob], 'test-packing-list.csv', { type: 'text/csv' });
        
        formData.append('archivo', archivo);
        formData.append('codigo_carga', 'TEST-' + Date.now());
        formData.append('id_cliente', '1');
        formData.append('direccion_destino', 'Dirección de prueba');
        formData.append('ciudad_destino', 'Ciudad de prueba');
        
        console.log('📤 Enviando archivo de prueba...');
        
        const response = await fetch(`${API_BASE}/upload/procesar-packing-list`, {
            method: 'POST',
            body: formData
        });
        
        const resultado = await response.json();
        
        if (response.ok) {
            console.log('✅ Archivo procesado exitosamente:', resultado);
        } else {
            console.error('❌ Error al procesar archivo:', resultado);
        }
        
    } catch (error) {
        console.error('💥 Error en prueba:', error);
    }
}

// Solo ejecutar en navegador
if (typeof window !== 'undefined') {
    probarProcesarExcel();
}