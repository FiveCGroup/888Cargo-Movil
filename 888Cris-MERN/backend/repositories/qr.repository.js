// repositories/qr.repository.js
// Repository para operaciones de códigos QR
import { BaseRepository } from './base.repository.js';
import transactionManager from './transaction.manager.js';

/**
 * Repository para gestión de códigos QR
 * Maneja la generación, almacenamiento y consulta de QRs
 */
export class QRRepository extends BaseRepository {
    constructor() {
        super('qr');
    }

    /**
     * Obtener QRs por ID de artículo
     */
    async findByArticleId(articuloId) {
        return await this.findAll({ id_articulo: articuloId }, 'numero_caja ASC');
    }

    /**
     * Obtener QR por código
     */
    async findByCode(codigoQR) {
        return await this.findOne({ codigo_qr: codigoQR });
    }

    /**
     * Generar QRs para todas las cajas de un artículo
     */
    async generateQRsForArticle(articuloId, cantidadCajas, codigoCarga) {
        return await transactionManager.executeInTransaction(async () => {
            const qrCodes = [];
            const timestamp = new Date().toISOString();

            for (let numeroCaja = 1; numeroCaja <= cantidadCajas; numeroCaja++) {
                // Generar código QR único
                const codigoQR = this.generateUniqueQRCode(codigoCarga, articuloId, numeroCaja);

                const qrData = {
                    id_articulo: articuloId,
                    numero_caja: numeroCaja,
                    codigo_qr: codigoQR,
                    estado: 'generado',
                    fecha_generacion: timestamp,
                    fecha_actualizacion: timestamp
                };

                const sql = `
                    INSERT INTO ${this.tableName} 
                    (id_articulo, numero_caja, codigo_qr, estado, fecha_generacion, fecha_actualizacion)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;

                const params = [
                    qrData.id_articulo,
                    qrData.numero_caja,
                    qrData.codigo_qr,
                    qrData.estado,
                    qrData.fecha_generacion,
                    qrData.fecha_actualizacion
                ];

                const result = await transactionManager.executeModifyQuery(sql, params);
                
                if (result.lastID) {
                    qrCodes.push({
                        ...qrData,
                        id: result.lastID
                    });
                }
            }

            return qrCodes;
        });
    }

    /**
     * Generar QR para una caja específica
     */
    async generateQRForBox(articuloId, numeroCaja, codigoCarga) {
        // Verificar si ya existe QR para esta caja
        const existingQR = await this.findOne({ 
            id_articulo: articuloId, 
            numero_caja: numeroCaja 
        });

        if (existingQR) {
            throw new Error(`Ya existe un QR para la caja ${numeroCaja} del artículo ${articuloId}`);
        }

        const codigoQR = this.generateUniqueQRCode(codigoCarga, articuloId, numeroCaja);
        const timestamp = new Date().toISOString();

        const qrData = {
            id_articulo: articuloId,
            numero_caja: numeroCaja,
            codigo_qr: codigoQR,
            estado: 'generado',
            fecha_generacion: timestamp,
            fecha_actualizacion: timestamp
        };

        return await this.create(qrData);
    }

    /**
     * Regenerar QR (marcar como regenerado)
     */
    async regenerateQR(qrId) {
        const qr = await this.findById(qrId);
        
        if (!qr) {
            throw new Error(`QR con ID ${qrId} no encontrado`);
        }

        // Generar nuevo código QR
        const newCode = this.generateUniqueQRCode(
            qr.codigo_qr.split('_')[0], // Extraer código de carga del QR existente
            qr.id_articulo, 
            qr.numero_caja,
            true // Indicar que es regeneración
        );

        return await this.updateById(qrId, {
            codigo_qr: newCode,
            estado: 'regenerado',
            fecha_actualizacion: new Date().toISOString()
        });
    }

    /**
     * Marcar QR como utilizado/escaneado
     */
    async markAsScanned(qrId, scannedBy = null) {
        return await this.updateById(qrId, {
            estado: 'escaneado',
            fecha_escaneado: new Date().toISOString(),
            escaneado_por: scannedBy,
            fecha_actualizacion: new Date().toISOString()
        });
    }

    /**
     * Sobrescribir findById para usar id_qr en lugar de id
     */
    async findById(qrId) {
        const sql = `SELECT * FROM ${this.tableName} WHERE id_qr = ?`;
        return await this.executeQuerySingle(sql, [qrId]);
    }

    /**
     * Sobrescribir updateById para usar id_qr en lugar de id
     */
    async updateById(qrId, data) {
        const setClause = Object.keys(data)
            .map(key => `${key} = ?`)
            .join(', ');
        const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id_qr = ?`;
        const params = [...Object.values(data), qrId];
        
        const result = await this.executeModifyQuery(sql, params);
        
        // Retornar el registro actualizado si hubo cambios
        if (result.changes > 0) {
            return await this.findById(qrId);
        }
        
        return null;
    }

    /**
     * Marcar QR como impreso
     */
    async markAsPrinted(qrId, printedBy = null) {
        return await this.updateById(qrId, {
            impreso: true,
            fecha_impreso: new Date().toISOString(),
            impreso_por: printedBy,
            fecha_actualizacion: new Date().toISOString()
        });
    }

    /**
     * Obtener QRs con información del artículo
     */
    async findWithArticleInfo(conditions = {}) {
        let sql = `
            SELECT 
                q.*,
                a.codigo_carga,
                a.numero_fila,
                a.descripcion,
                a.cantidad_cajas
            FROM ${this.tableName} q
            LEFT JOIN articulos_packing_list a ON q.id_articulo = a.id
        `;
        
        const params = [];
        
        if (Object.keys(conditions).length > 0) {
            const whereClause = Object.keys(conditions)
                .map(key => `q.${key} = ?`)
                .join(' AND ');
            sql += ` WHERE ${whereClause}`;
            params.push(...Object.values(conditions));
        }
        
        sql += ` ORDER BY a.numero_fila ASC, q.numero_caja ASC`;
        
        return await this.executeQuery(sql, params);
    }

    /**
     * Obtener QRs por código de carga
     */
    async findByLoadCode(codigoCarga) {
        const sql = `
            SELECT 
                q.*,
                a.numero_fila,
                a.descripcion
            FROM ${this.tableName} q
            LEFT JOIN articulos_packing_list a ON q.id_articulo = a.id
            WHERE a.codigo_carga = ?
            ORDER BY a.numero_fila ASC, q.numero_caja ASC
        `;
        
        return await this.executeQuery(sql, [codigoCarga]);
    }

    /**
     * Eliminar QRs por ID de artículo
     */
    async deleteByArticleId(articuloId) {
        return await this.delete({ id_articulo: articuloId });
    }

    /**
     * Obtener estadísticas de QRs
     */
    async getQRStats() {
        const baseStats = await this.getStats();
        
        // Estados de QRs
        const estadosSQL = `
            SELECT 
                estado,
                COUNT(*) as cantidad
            FROM ${this.tableName}
            GROUP BY estado
        `;
        const estados = await this.executeQuery(estadosSQL);

        // QRs generados por día (últimos 7 días)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const qrsPorDiaSQL = `
            SELECT 
                DATE(fecha_generacion) as fecha,
                COUNT(*) as cantidad
            FROM ${this.tableName}
            WHERE fecha_generacion >= ?
            GROUP BY DATE(fecha_generacion)
            ORDER BY fecha DESC
        `;
        const qrsPorDia = await this.executeQuery(qrsPorDiaSQL, [sevenDaysAgo.toISOString()]);

        // QRs más escaneados
        const qrsEscaneadosSQL = `
            SELECT COUNT(*) as total_escaneados
            FROM ${this.tableName}
            WHERE estado = 'escaneado'
        `;
        const qrsEscaneados = await this.executeQuerySingle(qrsEscaneadosSQL);

        return {
            ...baseStats,
            estadosDistribucion: estados,
            generacionReciente: qrsPorDia,
            totalEscaneados: qrsEscaneados.total_escaneados
        };
    }

    /**
     * Generar código QR único
     */
    generateUniqueQRCode(codigoCarga, articuloId, numeroCaja, isRegeneration = false) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        const prefix = isRegeneration ? 'RGN' : 'QR';
        
        return `${prefix}_${codigoCarga}_${articuloId}_${numeroCaja}_${timestamp}_${random}`;
    }

    /**
     * Validar formato de código QR
     */
    validateQRCode(codigoQR) {
        // Formato esperado: QR_CODIGOCARGA_ARTICULOID_NUMEROCAJA_TIMESTAMP_RANDOM
        // o RGN_CODIGOCARGA_ARTICULOID_NUMEROCAJA_TIMESTAMP_RANDOM (regenerado)
        const qrPattern = /^(QR|RGN)_[A-Za-z0-9]+_\d+_\d+_\d+_[a-z0-9]+$/;
        
        return qrPattern.test(codigoQR);
    }

    /**
     * Extraer información del código QR
     */
    parseQRCode(codigoQR) {
        if (!this.validateQRCode(codigoQR)) {
            return null;
        }

        const parts = codigoQR.split('_');
        
        return {
            isRegenerated: parts[0] === 'RGN',
            codigoCarga: parts[1],
            articuloId: parseInt(parts[2]),
            numeroCaja: parseInt(parts[3]),
            timestamp: parseInt(parts[4]),
            random: parts[5]
        };
    }

    /**
     * Buscar QRs duplicados
     */
    async findDuplicateCodes() {
        const sql = `
            SELECT 
                codigo_qr,
                COUNT(*) as cantidad
            FROM ${this.tableName}
            GROUP BY codigo_qr
            HAVING COUNT(*) > 1
        `;
        
        return await this.executeQuery(sql);
    }

    /**
     * Limpiar QRs huérfanos (sin artículo asociado)
     */
    async cleanOrphanedQRs() {
        const sql = `
            DELETE FROM ${this.tableName}
            WHERE id_articulo NOT IN (
                SELECT id FROM articulos_packing_list
            )
        `;
        
        const result = await this.executeModifyQuery(sql);
        return result.changes;
    }

    /**
     * Obtener QRs pendientes de generar para un artículo
     */
    async getPendingQRsForArticle(articuloId) {
        // Obtener información del artículo
        const sql = `
            SELECT 
                a.cantidad_cajas,
                COUNT(q.id) as qrs_generados
            FROM articulos_packing_list a
            LEFT JOIN ${this.tableName} q ON a.id = q.id_articulo
            WHERE a.id = ?
            GROUP BY a.id, a.cantidad_cajas
        `;
        
        const result = await this.executeQuerySingle(sql, [articuloId]);
        
        if (!result) {
            return null;
        }

        const pendientes = result.cantidad_cajas - (result.qrs_generados || 0);
        
        return {
            articuloId,
            totalCajas: result.cantidad_cajas,
            qrsGenerados: result.qrs_generados || 0,
            qrsPendientes: Math.max(0, pendientes)
        };
    }

    /**
     * Obtener QRs por ID de carga (actualizado para nueva estructura)
     */
    async findByCargaId(idCarga) {
        const sql = `
            SELECT 
                q.*, 
                c.numero_caja,
                c.total_cajas,
                a.descripcion_espanol,
                a.ref_art,
                carga.codigo_carga
            FROM ${this.tableName} q
            INNER JOIN caja c ON q.id_caja = c.id_caja
            INNER JOIN articulo_packing_list a ON c.id_articulo = a.id_articulo
            INNER JOIN carga ON a.id_carga = carga.id_carga
            WHERE carga.id_carga = ?
            ORDER BY a.id_articulo, c.numero_caja
        `;
        
        return await this.executeQuery(sql, [idCarga]);
    }

    /**
     * Crear QR con estructura de datos optimizada
     */
    async createOptimizedQR(qrData) {
        const sql = `
            INSERT INTO ${this.tableName} 
            (id_caja, codigo_qr, tipo_qr, datos_qr, contenido_json, estado, opciones_render)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            qrData.id_caja,
            qrData.codigo_qr,
            qrData.tipo_qr || 'caja',
            qrData.datos_qr,
            qrData.contenido_json || qrData.datos_qr,
            qrData.estado || 'generado',
            qrData.opciones_render || JSON.stringify({width: 300, margin: 2})
        ];

        return await this.executeModifyQuery(sql, params);
    }

    /**
     * Actualizar datos QR
     */
    async updateQRData(qrId, newData) {
        return await this.updateById(qrId, {
            datos_qr: newData.datos_qr,
            contenido_json: newData.contenido_json || newData.datos_qr,
            fecha_actualizacion: new Date().toISOString()
        });
    }

    /**
     * Marcar QR como escaneado con contador
     */
    async markAsScannedWithCounter(qrId, scannedBy = null) {
        const qr = await this.findById(qrId);
        const newCount = (qr?.contador_escaneos || 0) + 1;

        return await this.updateById(qrId, {
            estado: 'escaneado',
            fecha_escaneado: new Date().toISOString(),
            escaneado_por: scannedBy,
            contador_escaneos: newCount,
            fecha_actualizacion: new Date().toISOString()
        });
    }

    /**
     * Obtener estadísticas mejoradas incluyendo datos optimizados
     */
    async getOptimizedStats() {
        const baseStats = await this.getStats();
        
        // QRs con datos válidos vs inválidos
        const validDataSQL = `
            SELECT 
                CASE 
                    WHEN datos_qr IS NOT NULL AND datos_qr != '' THEN 'valid'
                    ELSE 'invalid'
                END as data_status,
                COUNT(*) as cantidad
            FROM ${this.tableName}
            GROUP BY data_status
        `;
        const dataStatus = await this.executeQuery(validDataSQL);

        // Conteo de escaneos totales
        const totalScansSQL = `
            SELECT SUM(contador_escaneos) as total_scans
            FROM ${this.tableName}
            WHERE contador_escaneos > 0
        `;
        const scanCount = await this.executeQuerySingle(totalScansSQL);

        // QRs más escaneados
        const topScannedSQL = `
            SELECT 
                codigo_qr,
                contador_escaneos,
                fecha_escaneado
            FROM ${this.tableName}
            WHERE contador_escaneos > 0
            ORDER BY contador_escaneos DESC
            LIMIT 10
        `;
        const topScanned = await this.executeQuery(topScannedSQL);

        return {
            ...baseStats,
            dataIntegrity: dataStatus,
            totalScans: scanCount?.total_scans || 0,
            topScannedQRs: topScanned,
            version: '2.0-optimized'
        };
    }
}

// Instancia singleton del repository
const qrRepository = new QRRepository();

export default qrRepository;
