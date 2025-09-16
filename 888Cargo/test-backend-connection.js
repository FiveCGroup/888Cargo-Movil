// ===================================
// 888CARGO - TEST DE CONECTIVIDAD BACKEND
// Verificar conexión con backend web unificado
// ===================================

const testBackendConnection = async () => {
  console.log('🔗 Iniciando test de conectividad con backend web...');
  
  // URLs a probar (Backend web en puerto 4000)
  const urlsToTest = [
    'http://10.0.2.2:4000',         // Android Emulator 
    'http://127.0.0.1:4000',        // Localhost
    'http://localhost:4000'         // Localhost alternativo
  ];

  for (const baseUrl of urlsToTest) {
    try {
      console.log(`\n🌐 Probando: ${baseUrl}`);
      
      // Test endpoint básico
      const response = await fetch(`${baseUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 5000
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Conexión exitosa a ${baseUrl}`);
        console.log(`📊 Respuesta:`, data);
      } else {
        console.log(`❌ Error HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      console.log(`❌ Error de conexión a ${baseUrl}:`, error.message);
    }
  }

  console.log('\n🏁 Test de conectividad completado.');
};

// Ejecutar test si se corre directamente
if (require.main === module) {
  testBackendConnection();
}

module.exports = { testBackendConnection };