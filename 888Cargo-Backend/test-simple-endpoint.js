import fetch from 'node-fetch';

console.log('🧪 [Test] Iniciando test de endpoint sin autenticación...');

async function testEndpoint() {
    try {
        const response = await fetch('http://localhost:3102/api/cargas/generar-codigo');
        const data = await response.json();
        
        console.log('✅ [Test] Response status:', response.status);
        console.log('✅ [Test] Response data:', data);
        
        if (response.ok && data.success) {
            console.log('🎉 [Test] El endpoint funciona correctamente sin autenticación');
        } else {
            console.log('❌ [Test] El endpoint no funciona como esperado');
        }
    } catch (error) {
        console.error('❌ [Test] Error al hacer la petición:', error.message);
    }
}

// Esperar un poco para que el servidor esté listo
setTimeout(testEndpoint, 2000);