// repositories/index.js
// Punto de entrada centralizado para todos los repositories

// Importar repositories base
import { BaseRepository } from './base.repository.js';
import transactionManager from './transaction.manager.js';

// Importar repositories específicos
import userRepository from './user.repository.js';
import articlesRepository from './articles.repository.js';
import qrRepository from './qr.repository.js';

/**
 * Repositorio principal que agrupa todos los repositories
 * Proporciona acceso centralizado a todas las operaciones de base de datos
 */
export class DatabaseRepository {
    constructor() {
        this.users = userRepository;
        this.articles = articlesRepository;
        this.qr = qrRepository;
        this.transaction = transactionManager;
        this.BaseRepository = BaseRepository;
    }

    /**
     * Obtener estadísticas generales de toda la base de datos
     */
    async getSystemStats() {
        const [userStats, articleStats, qrStats] = await Promise.all([
            this.users.getUserStats(),
            this.articles.getGeneralStats(),
            this.qr.getQRStats()
        ]);

        return {
            timestamp: new Date().toISOString(),
            users: userStats,
            articles: articleStats,
            qr: qrStats,
            summary: {
                totalUsers: userStats.total,
                totalArticles: articleStats.total,
                totalQRs: qrStats.total,
                activeUsers: userStats.activeUsers,
                totalBoxes: articleStats.cajas?.total_cajas || 0,
                scannedQRs: qrStats.totalEscaneados
            }
        };
    }

    /**
     * Verificar integridad de la base de datos
     */
    async checkDatabaseIntegrity() {
        const issues = [];
        
        try {
            // Verificar QRs huérfanos
            const orphanedQRs = await this.qr.executeQuery(`
                SELECT COUNT(*) as count
                FROM qr_codes q
                LEFT JOIN articulos_packing_list a ON q.id_articulo = a.id
                WHERE a.id IS NULL
            `);
            
            if (orphanedQRs[0].count > 0) {
                issues.push({
                    type: 'orphaned_qrs',
                    severity: 'warning',
                    count: orphanedQRs[0].count,
                    message: `${orphanedQRs[0].count} QRs sin artículo asociado`
                });
            }

            // Verificar códigos QR duplicados
            const duplicateQRs = await this.qr.findDuplicateCodes();
            if (duplicateQRs.length > 0) {
                issues.push({
                    type: 'duplicate_qrs',
                    severity: 'error',
                    count: duplicateQRs.length,
                    message: `${duplicateQRs.length} códigos QR duplicados encontrados`,
                    details: duplicateQRs
                });
            }

            // Verificar usuarios sin actividad reciente
            const inactiveUsers = await this.users.executeQuery(`
                SELECT COUNT(*) as count
                FROM users
                WHERE is_active = 1 AND created_at < datetime('now', '-30 days')
            `);

            if (inactiveUsers[0].count > 0) {
                issues.push({
                    type: 'inactive_users',
                    severity: 'info',
                    count: inactiveUsers[0].count,
                    message: `${inactiveUsers[0].count} usuarios activos sin actividad reciente`
                });
            }

        } catch (error) {
            issues.push({
                type: 'check_error',
                severity: 'error',
                message: `Error verificando integridad: ${error.message}`
            });
        }

        return {
            timestamp: new Date().toISOString(),
            status: issues.length === 0 ? 'healthy' : 'issues_found',
            issues
        };
    }

    /**
     * Ejecutar operaciones de mantenimiento
     */
    async performMaintenance() {
        const maintenanceLog = [];
        
        try {
            // Limpiar QRs huérfanos
            const orphanedCleaned = await this.qr.cleanOrphanedQRs();
            if (orphanedCleaned > 0) {
                maintenanceLog.push({
                    action: 'clean_orphaned_qrs',
                    result: `${orphanedCleaned} QRs huérfanos eliminados`
                });
            }

            // Aquí se pueden agregar más operaciones de mantenimiento
            // como VACUUM, ANALYZE, etc.

            maintenanceLog.push({
                action: 'maintenance_completed',
                result: 'Mantenimiento completado exitosamente'
            });

        } catch (error) {
            maintenanceLog.push({
                action: 'maintenance_error',
                result: `Error en mantenimiento: ${error.message}`
            });
        }

        return {
            timestamp: new Date().toISOString(),
            operations: maintenanceLog
        };
    }

    /**
     * Crear repository personalizado para una tabla específica
     */
    createCustomRepository(tableName) {
        return new BaseRepository(tableName);
    }

    /**
     * Exportar datos de una tabla en formato JSON
     */
    async exportTableData(tableName, conditions = {}) {
        const repository = this.createCustomRepository(tableName);
        const data = await repository.findAll(conditions);
        
        return {
            tableName,
            exportDate: new Date().toISOString(),
            recordCount: data.length,
            data
        };
    }

    /**
     * Obtener información del esquema de base de datos
     */
    async getDatabaseSchema() {
        const schema = await this.users.executeQuery(`
            SELECT 
                name as table_name,
                sql as create_statement
            FROM sqlite_master 
            WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        `);

        return {
            timestamp: new Date().toISOString(),
            tables: schema
        };
    }

    /**
     * Ejecutar backup lógico de datos importantes
     */
    async createLogicalBackup() {
        const backup = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            data: {}
        };

        try {
            // Backup de usuarios (sin passwords)
            backup.data.users = await this.users.findAllSafe();
            
            // Backup de artículos
            backup.data.articles = await this.articles.findAll();
            
            // Backup de QRs
            backup.data.qr_codes = await this.qr.findAll();

            backup.status = 'success';
            backup.recordCounts = {
                users: backup.data.users.items ? backup.data.users.items.length : 0,
                articles: backup.data.articles.length,
                qr_codes: backup.data.qr_codes.length
            };

        } catch (error) {
            backup.status = 'error';
            backup.error = error.message;
        }

        return backup;
    }
}

// Instancia singleton del repositorio principal
const databaseRepository = new DatabaseRepository();

// Exportaciones individuales para compatibilidad
export { 
    BaseRepository,
    transactionManager,
    userRepository,
    articlesRepository,
    qrRepository
};

// Exportación por defecto del repositorio principal
export default databaseRepository;
