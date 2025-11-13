// repositories/articles.repository.js
// Repository para operaciones de artículos del packing list
import { BaseRepository } from './base.repository.js';
import transactionManager from './transaction.manager.js';

/**
 * Repository para gestión de artículos del packing list
 * Incluye operaciones específicas para manejo de cajas y QR
 */
export class ArticlesRepository extends BaseRepository {
    constructor() {
        super('articulos_packing_list');
    }

    /**
     * Obtener artículos por código de carga
     */
    async findByCodigoCarga(codigoCarga) {
        return await this.findAll({ codigo_carga: codigoCarga }, 'numero_fila ASC');
    }

    /**
     * Obtener artículo por ID de carga y número de fila
     */
    async findByLoadAndRow(idCarga, numeroFila) {
        return await this.findOne({ 
            id_carga: idCarga, 
            numero_fila: numeroFila 
        });
    }

    /**
     * Crear múltiples artículos en una transacción
     */
    async createBulkArticles(articulos) {
        return await transactionManager.executeInTransaction(async () => {
            const createdArticles = [];
            
            for (const articulo of articulos) {
                const articuloData = {
                    ...articulo,
                    fecha_creacion: new Date().toISOString(),
                    fecha_actualizacion: new Date().toISOString()
                };
                
                const sql = `
                    INSERT INTO ${this.tableName} 
                    (codigo_carga, id_carga, numero_fila, descripcion, cantidad_cajas, 
                     peso_bruto, peso_neto, dimensiones, observaciones, numero_contenedor,
                     fecha_creacion, fecha_actualizacion) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                
                const params = [
                    articuloData.codigo_carga,
                    articuloData.id_carga,
                    articuloData.numero_fila,
                    articuloData.descripcion,
                    articuloData.cantidad_cajas,
                    articuloData.peso_bruto,
                    articuloData.peso_neto,
                    articuloData.dimensiones,
                    articuloData.observaciones,
                    articuloData.numero_contenedor,
                    articuloData.fecha_creacion,
                    articuloData.fecha_actualizacion
                ];
                
                const result = await transactionManager.executeModifyQuery(sql, params);
                
                if (result.lastID) {
                    const createdArticle = await this.findById(result.lastID);
                    createdArticles.push(createdArticle);
                }
            }
            
            return createdArticles;
        });
    }

    /**
     * Actualizar artículo con timestamp
     */
    async updateArticle(id, updateData) {
        const dataWithTimestamp = {
            ...updateData,
            fecha_actualizacion: new Date().toISOString()
        };
        
        return await this.updateById(id, dataWithTimestamp);
    }

    /**
     * Obtener estadísticas de artículos por carga
     */
    async getLoadStatistics(codigoCarga) {
        const sql = `
            SELECT 
                COUNT(*) as total_articulos,
                SUM(cantidad_cajas) as total_cajas,
                SUM(peso_bruto) as peso_bruto_total,
                SUM(peso_neto) as peso_neto_total,
                AVG(cantidad_cajas) as promedio_cajas_por_articulo,
                MIN(fecha_creacion) as primer_articulo,
                MAX(fecha_actualizacion) as ultimo_update
            FROM ${this.tableName} 
            WHERE codigo_carga = ?
        `;
        
        return await this.executeQuerySingle(sql, [codigoCarga]);
    }

    /**
     * Obtener artículos con información de QR
     */
    async findWithQRInfo(codigoCarga) {
        const sql = `
            SELECT 
                a.*,
                COUNT(q.id) as total_qrs_generados,
                GROUP_CONCAT(q.codigo_qr) as codigos_qr
            FROM ${this.tableName} a
            LEFT JOIN qr_codes q ON a.id = q.id_articulo
            WHERE a.codigo_carga = ?
            GROUP BY a.id
            ORDER BY a.numero_fila ASC
        `;
        
        return await this.executeQuery(sql, [codigoCarga]);
    }

    /**
     * Buscar artículos por descripción
     */
    async searchByDescription(searchTerm, codigoCarga = null) {
        let sql = `
            SELECT * FROM ${this.tableName} 
            WHERE descripcion LIKE ?
        `;
        const params = [`%${searchTerm}%`];
        
        if (codigoCarga) {
            sql += ` AND codigo_carga = ?`;
            params.push(codigoCarga);
        }
        
        sql += ` ORDER BY numero_fila ASC LIMIT 50`;
        
        return await this.executeQuery(sql, params);
    }

    /**
     * Obtener resumen de cajas por artículo
     */
    async getBoxSummary(articuloId) {
        const articulo = await this.findById(articuloId);
        
        if (!articulo) {
            return null;
        }

        // Obtener información de QRs generados para las cajas
        const sql = `
            SELECT 
                numero_caja,
                codigo_qr,
                fecha_generacion,
                estado
            FROM qr_codes 
            WHERE id_articulo = ? 
            ORDER BY numero_caja ASC
        `;
        
        const qrCodes = await this.executeQuery(sql, [articuloId]);
        
        return {
            articulo,
            cajas: {
                total: articulo.cantidad_cajas,
                con_qr: qrCodes.length,
                pendientes: articulo.cantidad_cajas - qrCodes.length,
                detalle: qrCodes
            }
        };
    }

    /**
     * Validar integridad de datos del artículo
     */
    validateArticleData(articleData) {
        const errors = [];

        // Validaciones requeridas
        if (!articleData.codigo_carga) {
            errors.push('Código de carga es requerido');
        }

        if (!articleData.numero_fila || articleData.numero_fila <= 0) {
            errors.push('Número de fila debe ser mayor a 0');
        }

        if (!articleData.descripcion || articleData.descripcion.trim().length === 0) {
            errors.push('Descripción es requerida');
        }

        if (!articleData.cantidad_cajas || articleData.cantidad_cajas <= 0) {
            errors.push('Cantidad de cajas debe ser mayor a 0');
        }

        // Validaciones de formato
        if (articleData.peso_bruto && (isNaN(articleData.peso_bruto) || articleData.peso_bruto < 0)) {
            errors.push('Peso bruto debe ser un número válido');
        }

        if (articleData.peso_neto && (isNaN(articleData.peso_neto) || articleData.peso_neto < 0)) {
            errors.push('Peso neto debe ser un número válido');
        }

        // Validación lógica: peso neto no puede ser mayor que peso bruto
        if (articleData.peso_bruto && articleData.peso_neto && 
            articleData.peso_neto > articleData.peso_bruto) {
            errors.push('Peso neto no puede ser mayor que peso bruto');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Obtener artículos duplicados (mismo código de carga y número de fila)
     */
    async findDuplicates(codigoCarga, numeroFila, excludeId = null) {
        let sql = `
            SELECT * FROM ${this.tableName} 
            WHERE codigo_carga = ? AND numero_fila = ?
        `;
        const params = [codigoCarga, numeroFila];

        if (excludeId) {
            sql += ` AND id != ?`;
            params.push(excludeId);
        }

        return await this.executeQuery(sql, params);
    }

    /**
     * Eliminar artículos por código de carga
     */
    async deleteByCodigoCarga(codigoCarga) {
        return await transactionManager.executeInTransaction(async () => {
            // Primero eliminar QRs asociados
            const deleteQRsSQL = `
                DELETE FROM qr_codes 
                WHERE id_articulo IN (
                    SELECT id FROM ${this.tableName} WHERE codigo_carga = ?
                )
            `;
            await transactionManager.executeModifyQuery(deleteQRsSQL, [codigoCarga]);

            // Luego eliminar artículos
            const deleteArticlesSQL = `DELETE FROM ${this.tableName} WHERE codigo_carga = ?`;
            const result = await transactionManager.executeModifyQuery(deleteArticlesSQL, [codigoCarga]);

            return result.changes;
        });
    }

    /**
     * Obtener estadísticas generales de artículos
     */
    async getGeneralStats() {
        const baseStats = await this.getStats();
        
        // Total de cajas en todos los artículos
        const boxStats = await this.executeQuerySingle(`
            SELECT 
                SUM(cantidad_cajas) as total_cajas,
                AVG(cantidad_cajas) as promedio_cajas,
                MAX(cantidad_cajas) as max_cajas,
                MIN(cantidad_cajas) as min_cajas
            FROM ${this.tableName}
        `);

        // Peso total
        const weightStats = await this.executeQuerySingle(`
            SELECT 
                SUM(peso_bruto) as peso_bruto_total,
                SUM(peso_neto) as peso_neto_total,
                AVG(peso_bruto) as peso_bruto_promedio,
                AVG(peso_neto) as peso_neto_promedio
            FROM ${this.tableName}
        `);

        // Cargas únicas
        const uniqueLoads = await this.executeQuerySingle(`
            SELECT COUNT(DISTINCT codigo_carga) as cargas_unicas
            FROM ${this.tableName}
        `);

        return {
            ...baseStats,
            cajas: boxStats,
            pesos: weightStats,
            cargasUnicas: uniqueLoads.cargas_unicas
        };
    }
}

// Instancia singleton del repository
const articlesRepository = new ArticlesRepository();

export default articlesRepository;
