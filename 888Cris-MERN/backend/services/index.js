// services/index.js
// Índice centralizado de todos los servicios especializados
export { BaseService } from './base.service.js';
export { QRService, qrService } from './qr.service.js';
export { QRDataService, qrDataService } from './qr-data.service.js';
export { NotificationService, notificationService } from './notification.service.js';
export { AuditService, auditService } from './audit.service.js';

/**
 * Servicio integrador que combina todos los servicios especializados
 * Crea instancias dinámicamente para evitar dependencias circulares
 */
export class IntegratedService {
    constructor() {
        this.qr = null;
        this.notification = null;
        this.audit = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        const { qrService } = await import('./qr.service.js');
        const { notificationService } = await import('./notification.service.js');
        const { auditService } = await import('./audit.service.js');
        
        this.qr = qrService;
        this.notification = notificationService;
        this.audit = auditService;
        this.initialized = true;
    }

    async generateQRsWithFullTracking(articuloId, options = {}) {
        await this.initialize();
        
        try {
            // 1. Generar QRs
            const qrResult = await this.qr.generateQRsForArticle(articuloId, options);
            
            if (!qrResult.success) {
                return qrResult;
            }

            // 2. Registrar en auditoría
            if (options.userId) {
                await this.audit.logQRGeneration(
                    options.userId, 
                    qrResult.data, 
                    options.sessionInfo || {}
                );
            }

            // 3. Enviar notificaciones si están configuradas
            if (options.notifications && options.notifications.recipients) {
                await this.notification.notifyQRGenerated(
                    options.notifications.recipients,
                    qrResult.data
                );
            }

            return qrResult;

        } catch (error) {
            // Registrar error en auditoría
            if (options.userId) {
                await this.audit.logSystemError(error, {
                    resource: 'qr_generation',
                    articuloId
                }, options.sessionInfo || {});
            }
            
            throw error;
        }
    }

    async generateBatchQRsWithTracking(articuloIds, options = {}) {
        await this.initialize();
        
        try {
            // 1. Ejecutar operación en lote
            const batchResult = await this.qr.generateBatchQRs(articuloIds, options);
            
            if (!batchResult.success) {
                return batchResult;
            }

            // 2. Registrar operación en lote en auditoría
            if (options.userId) {
                await this.audit.logBulkOperation(
                    options.userId,
                    {
                        operationType: 'qr_batch_generation',
                        total: batchResult.data.summary.total,
                        successful: batchResult.data.summary.successful,
                        failed: batchResult.data.summary.failed,
                        operationId: batchResult.data.operationId
                    },
                    options.sessionInfo || {}
                );
            }

            // 3. Notificar finalización del lote
            if (options.notifications && options.notifications.recipients) {
                await this.notification.notifyBulkComplete(
                    options.notifications.recipients,
                    batchResult.data.summary
                );
            }

            return batchResult;

        } catch (error) {
            // Registrar error en auditoría
            if (options.userId) {
                await this.audit.logSystemError(error, {
                    resource: 'batch_qr_generation',
                    articuloIds
                }, options.sessionInfo || {});
            }
            
            throw error;
        }
    }

    async scanQRWithTracking(qrContent, scannerInfo = {}) {
        await this.initialize();
        
        try {
            // 1. Procesar escaneo
            const scanResult = await this.qr.scanQRCode(qrContent, scannerInfo);
            
            if (!scanResult.success) {
                return scanResult;
            }

            // 2. Registrar escaneo en auditoría
            if (scannerInfo.userId) {
                await this.audit.logQRScan(
                    scannerInfo.userId,
                    scanResult.data,
                    scannerInfo.sessionInfo || {}
                );
            }

            return scanResult;

        } catch (error) {
            // Registrar error en auditoría
            if (scannerInfo.userId) {
                await this.audit.logSystemError(error, {
                    resource: 'qr_scan',
                    qrContent: qrContent.substring(0, 100)
                }, scannerInfo.sessionInfo || {});
            }
            
            throw error;
        }
    }

    async getSystemDashboard(filters = {}) {
        await this.initialize();
        
        try {
            // Obtener estadísticas de QRs
            const qrStats = await this.qr.getQRStatistics(filters);
            
            // Obtener historial de auditoría resumido
            const auditHistory = await this.audit.getAuditHistory({
                ...filters,
                limit: 50
            });

            // Validar integridad de auditoría
            const integrityCheck = await this.audit.validateAuditIntegrity(filters);

            return {
                success: true,
                data: {
                    qr: qrStats.success ? qrStats.data : null,
                    audit: auditHistory.success ? auditHistory.data : null,
                    integrity: integrityCheck.success ? integrityCheck.data : null,
                    system: {
                        uptime: process.uptime(),
                        memory: process.memoryUsage(),
                        timestamp: new Date().toISOString()
                    }
                },
                message: 'Dashboard del sistema generado exitosamente'
            };

        } catch (error) {
            console.error('Error generando dashboard del sistema:', error);
            return {
                success: false,
                error: error.message,
                message: 'Error generando dashboard del sistema'
            };
        }
    }

    async runSystemDiagnostics() {
        await this.initialize();
        
        const diagnostics = {
            timestamp: new Date().toISOString(),
            services: {},
            overall: { status: 'healthy', issues: [] }
        };

        // Diagnosticar servicio de QR
        try {
            await this.qr.validateQRContent('{"test": true}');
            diagnostics.services.qr = { status: 'healthy', message: 'Servicio QR operativo' };
        } catch (error) {
            diagnostics.services.qr = { status: 'error', message: error.message };
            diagnostics.overall.issues.push('Servicio QR no operativo');
        }

        // Diagnosticar servicio de notificaciones
        try {
            this.notification.generateSystemTemplate('test', {});
            diagnostics.services.notification = { status: 'healthy', message: 'Servicio de notificaciones operativo' };
        } catch (error) {
            diagnostics.services.notification = { status: 'error', message: error.message };
            diagnostics.overall.issues.push('Servicio de notificaciones no operativo');
        }

        // Diagnosticar servicio de auditoría
        try {
            await this.audit.validateAuditFilters({});
            diagnostics.services.audit = { status: 'healthy', message: 'Servicio de auditoría operativo' };
        } catch (error) {
            diagnostics.services.audit = { status: 'error', message: error.message };
            diagnostics.overall.issues.push('Servicio de auditoría no operativo');
        }

        // Determinar estado general
        const hasErrors = Object.values(diagnostics.services).some(service => service.status === 'error');
        diagnostics.overall.status = hasErrors ? 'degraded' : 'healthy';

        return {
            success: true,
            data: diagnostics,
            message: `Diagnóstico completado: Sistema ${diagnostics.overall.status}`
        };
    }
}

// Instancia singleton del servicio integrado
export const integratedService = new IntegratedService();
