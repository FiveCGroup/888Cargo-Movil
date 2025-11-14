// tasks/cleanup.tasks.js
// Tareas de limpieza programadas
import { RecuperacionService } from '../services/recuperacion.service.js';

export class CleanupTasks {
    
    static intervals = [];

    /**
     * Iniciar todas las tareas de limpieza
     */
    static startAll() {
        this.startTokenCleanup();
        console.log('🧹 Tareas de limpieza iniciadas');
    }

    /**
     * Detener todas las tareas de limpieza
     */
    static stopAll() {
        this.intervals.forEach(interval => {
            clearInterval(interval);
        });
        this.intervals = [];
        console.log('🛑 Tareas de limpieza detenidas');
    }

    /**
     * Iniciar limpieza automática de tokens de recuperación
     */
    static startTokenCleanup() {
        // Ejecutar cada 15 minutos (900,000 ms)
        const interval = setInterval(async () => {
            try {
                const cleanedCount = await RecuperacionService.cleanAllExpiredTokens();
                if (cleanedCount > 0) {
                    console.log(`🧹 Limpieza automática: ${cleanedCount} tokens eliminados`);
                }
            } catch (error) {
                console.error('❌ Error en limpieza automática de tokens:', error.message);
            }
        }, 15 * 60 * 1000); // 15 minutos

        this.intervals.push(interval);

        // Ejecutar una limpieza inmediata al iniciar
        setTimeout(async () => {
            try {
                const cleanedCount = await RecuperacionService.cleanAllExpiredTokens();
                if (cleanedCount > 0) {
                    console.log(`🧹 Limpieza inicial: ${cleanedCount} tokens expirados eliminados`);
                }
            } catch (error) {
                console.error('❌ Error en limpieza inicial:', error.message);
            }
        }, 5000); // Después de 5 segundos de iniciar el servidor
    }
}