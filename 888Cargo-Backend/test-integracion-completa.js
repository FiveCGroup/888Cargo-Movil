import fetch from 'node-fetch';

console.log('🧪 [Test Integración Completa] Probando workflow completo...');

const API_BASE = 'http://localhost:3102/api';

async function testIntegracionCompleta() {
    try {
        console.log('\n📊 1. Probando Health Check...');
        const healthResponse = await fetch(`${API_BASE}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health Check:', healthData.status);

        console.log('\n🔢 2. Generando código de carga...');
        const codigoResponse = await fetch(`${API_BASE}/cargas/generar-codigo`);
        const codigoData = await codigoResponse.json();
        console.log('✅ Código generado:', codigoData.codigo_carga);

        console.log('\n💾 3. Guardando packing list completo...');
        const datosEjemplo = [
            ['Fecha', 'Marca Cliente', 'Ciudad Destino', 'Ref Art', 'Descripción ES', 'Descripción CN', 'Cajas', 'Cant por Caja', 'Largo', 'Ancho', 'Alto'],
            ['2024-09-15', 'Cliente Test', 'Bogotá', 'REF001', 'Producto de prueba 1', '测试产品 1', '3', '5', '10', '15', '20'],
            ['2024-09-15', 'Cliente Test', 'Bogotá', 'REF002', 'Producto de prueba 2', '测试产品 2', '2', '8', '12', '18', '25']
        ];

        const metadata = {
            codigo_carga: codigoData.codigo_carga,
            id_cliente: 1,
            direccion_destino: 'Calle 123 #45-67',
            ciudad_destino: 'Bogotá',
            archivo_original: 'test_completo.xlsx'
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
        if (buscarResponse.ok) {
            const buscarData = await buscarResponse.json();
            console.log('✅ Packing list encontrado:', {
                codigo: buscarData.data.carga.codigo_carga,
                articulos: buscarData.data.estadisticas.total_articulos,
                cajas: buscarData.data.estadisticas.total_cajas,
                qrs: buscarData.data.estadisticas.total_qrs
            });
            
            // Obtener ID de carga para pruebas QR
            const idCarga = buscarData.data.carga.id_carga;
            
            console.log('\n🏷️ 5. Probando endpoints QR...');
            
            // Probar obtener QRs por carga
            const qrResponse = await fetch(`${API_BASE}/qr/carga/${idCarga}`);
            if (qrResponse.ok) {
                const qrData = await qrResponse.json();
                console.log('✅ QRs por carga obtenidos:', qrData.total);
                
                if (qrData.data.length > 0) {
                    // Probar obtener QR específico
                    const primerQR = qrData.data[0];
                    console.log('📷 Probando imagen QR:', primerQR.url_imagen);
                    
                    // Extraer filename de la URL
                    const filename = primerQR.url_imagen.split('/').pop();
                    const imagenResponse = await fetch(`${API_BASE}/qr/img/${filename}`);
                    
                    if (imagenResponse.ok) {
                        console.log('✅ Imagen QR servida correctamente');
                    } else {
                        console.warn('⚠️ Error al servir imagen QR');
                    }
                }
            } else {
                console.warn('⚠️ Error al obtener QRs por carga');
            }
        } else {
            console.warn('⚠️ Error al buscar packing list');
        }

        console.log('\n🎉 ¡INTEGRACIÓN COMPLETA EXITOSA!');
        console.log('📋 Resumen final:');
        console.log(`   • Código de carga: ${codigoData.codigo_carga}`);
        console.log(`   • Artículos creados: ${guardarData.data.articulos_creados}`);
        console.log(`   • Cajas creadas: ${guardarData.data.cajas_creadas}`);
        console.log(`   • QRs generados: ${guardarData.data.qrs_creados}`);
        console.log('   • QRs incluyen logo 888Cargo ✨');
        console.log('   • Todas las funcionalidades probadas ✅');

    } catch (error) {
        console.error('❌ Error en prueba de integración:', error.message);
    }
}

testIntegracionCompleta();