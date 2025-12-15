// backend/tasks/cleanup.tasks.js
import { run } from '../db.js';

export class CleanupTasks {
  static intervals = [];

  static startAll() {
    this.startTokenCleanup();
    console.log('Tareas de limpieza iniciadas');
  }

  static stopAll() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    console.log('Tareas de limpieza detenidas');
  }

  static startTokenCleanup() {
    const cleanTokens = async () => {
      try {
        // Solo borramos los tokens expirados
        const result = await run(
          `DELETE FROM recovery_tokens 
           WHERE expires_at < CURRENT_TIMESTAMP`
        );
        if (result.changes > 0) {
          console.log(`Limpieza automática: ${result.changes} tokens eliminados`);
        }
      } catch (error) {
        console.error('Error en limpieza automática:', error.message);
      }
    };

    // Cada 15 minutos
    const interval = setInterval(cleanTokens, 15 * 60 * 1000);
    this.intervals.push(interval);

    // Limpieza inmediata al iniciar
    setTimeout(cleanTokens, 5000);
  }
}