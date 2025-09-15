import fetch from 'node-fetch';

console.log('🧪 [Test Backend] Probando funcionalidad completa del backend...');

const API_BASE = 'http://localhost:3102/api';

async function testCompleto() {
    try {
        console.log('\n📊 1. Probando Health Check...');
        const healthResponse = await fetch(`${API_BASE}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health Check:', healthData);

        console.log('\n🔢 2. Generando código de carga...');
        const codigoResponse = await fetch(`${API_BASE}/cargas/generar-codigo`);
        const codigoData = await codigoResponse.json();
        console.log('✅ Código generado:', codigoData.codigo_carga);

        console.log('\n💾 3. Probando guardar packing list...');
        const datosEjemplo = [
            ['Fecha', 'Marca Cliente', 'Ciudad Destino', 'Ref Art', 'Descripción ES', 'Cajas', 'Cant por Caja'],
            ['2024-09-15', 'Cliente Test', 'Bogotá', 'REF001', 'Producto de prueba', '2', '10']
        ];

        const metadata = {
            codigo_carga: codigoData.codigo_carga,
            id_cliente: 1,
            direccion_destino: 'Calle 123 #45-67',
            ciudad_destino: 'Bogotá',
            archivo_original: 'test.xlsx'
        };

        const guardarResponse = await fetch(`${API_BASE}/cargas/guardar-packing-list`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                datos: datosEjemplo,
                metadata
            })
        });

        if (!guardarResponse.ok) {
            const errorText = await guardarResponse.text();
            throw new Error(`Error al guardar: ${errorText}`);
        }

        const guardarData = await guardarResponse.json();
        console.log('✅ Packing list guardado:', {
            articulos: guardarData.data.articulos_creados,
            cajas: guardarData.data.cajas_creadas,
            qrs: guardarData.data.qrs_creados
        });

        console.log('\n🔍 4. Buscando packing list...');
        const buscarResponse = await fetch(`${API_BASE}/cargas/buscar/${codigoData.codigo_carga}`);
        const buscarData = await buscarResponse.json();
        console.log('✅ Packing list encontrado:', {
            codigo: buscarData.data.carga.codigo_carga,
            articulos: buscarData.data.estadisticas.total_articulos,
            cajas: buscarData.data.estadisticas.total_cajas,
            qrs: buscarData.data.estadisticas.total_qrs
        });

        console.log('\n🎉 ¡Todas las pruebas exitosas!');
        console.log('📋 Resumen:');
        console.log(`   • Código de carga: ${codigoData.codigo_carga}`);
        console.log(`   • Artículos creados: ${guardarData.data.articulos_creados}`);
        console.log(`   • Cajas creadas: ${guardarData.data.cajas_creadas}`);
        console.log(`   • QRs generados: ${guardarData.data.qrs_creados}`);

    } catch (error) {
        console.error('❌ Error en las pruebas:', error.message);
    }
}

testCompleto();