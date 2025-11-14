import dotenv from 'dotenv';
import app from "./app.js";
import db, { initializeDatabase } from "./db.js";
import { PORT } from './config.js';

dotenv.config();

const serverSignature = 'TmlyYW0gTmFpdHNpcmM=';

const startServer = async () => {
  try {
    console.log('🔄 Inicializando base de datos...');
    await initializeDatabase();
    console.log('✅ Base de datos inicializada');
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] 888Cargo Server running on http://0.0.0.0:${PORT}`);
      console.log(`🌐 Accesible desde:`);
      console.log(`   • Localhost: http://127.0.0.1:${PORT}`);
      console.log(`   • Android Emulator: http://10.0.2.2:${PORT}`);
      console.log(`   • Red local: http://[tu-ip-local]:${PORT}`);
    });

    // Manejar errores del servidor
    server.on('error', (error) => {
      console.error('❌ Error del servidor:', error);
      process.exit(1);
    });

    // Manejar cierre del proceso
    process.on('SIGINT', () => {
      console.log('🛑 Cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado');
        process.exit(0);
      });
    });

    process.on('SIGTERM', () => {
      console.log('🛑 Cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
};

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  process.exit(1);
});

startServer();
