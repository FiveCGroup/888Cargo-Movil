// repositories/base.repository.js
// Repository base con operaciones CRUD comunes
import db from "../db.js";

/**
 * Repository base con operaciones CRUD estándar
 * Todas las demás repositories heredan de esta clase
 */
export class BaseRepository {
    constructor(tableName) {
        this.tableName = tableName;
        this.db = db;
    }

    /**
     * Ejecutar consulta SQL con parámetros
     */
    async executeQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error(`Error en consulta SQL: ${sql}`, err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Ejecutar consulta que devuelve una sola fila
     */
    async executeQuerySingle(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error(`Error en consulta SQL: ${sql}`, err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Ejecutar consulta que modifica datos (INSERT, UPDATE, DELETE)
     */
    async executeModifyQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error(`Error en consulta SQL: ${sql}`, err);
                    reject(err);
                } else {
                    resolve({
                        lastID: this.lastID,
                        changes: this.changes
                    });
                }
            });
        });
    }

    /**
     * Obtener todos los registros
     */
    async findAll(conditions = {}, orderBy = null, limit = null) {
        let sql = `SELECT * FROM ${this.tableName}`;
        const params = [];

        // Agregar condiciones WHERE
        if (Object.keys(conditions).length > 0) {
            const whereClause = Object.keys(conditions)
                .map(key => `${key} = ?`)
                .join(' AND ');
            sql += ` WHERE ${whereClause}`;
            params.push(...Object.values(conditions));
        }

        // Agregar ORDER BY
        if (orderBy) {
            sql += ` ORDER BY ${orderBy}`;
        }

        // Agregar LIMIT
        if (limit) {
            sql += ` LIMIT ?`;
            params.push(limit);
        }

        return await this.executeQuery(sql, params);
    }

    /**
     * Obtener un registro por ID
     */
    async findById(id) {
        const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
        return await this.executeQuerySingle(sql, [id]);
    }

    /**
     * Obtener un registro por condiciones
     */
    async findOne(conditions) {
        const whereClause = Object.keys(conditions)
            .map(key => `${key} = ?`)
            .join(' AND ');
        const sql = `SELECT * FROM ${this.tableName} WHERE ${whereClause} LIMIT 1`;
        return await this.executeQuerySingle(sql, Object.values(conditions));
    }

    /**
     * Crear un nuevo registro
     */
    async create(data) {
        const columns = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
        
        const result = await this.executeModifyQuery(sql, Object.values(data));
        
        // Retornar el registro creado
        if (result.lastID) {
            return await this.findById(result.lastID);
        }
        
        return result;
    }

    /**
     * Actualizar un registro por ID
     */
    async updateById(id, data) {
        const setClause = Object.keys(data)
            .map(key => `${key} = ?`)
            .join(', ');
        const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
        const params = [...Object.values(data), id];
        
        const result = await this.executeModifyQuery(sql, params);
        
        // Retornar el registro actualizado si hubo cambios
        if (result.changes > 0) {
            return await this.findById(id);
        }
        
        return null;
    }

    /**
     * Eliminar un registro por ID
     */
    async deleteById(id) {
        const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
        const result = await this.executeModifyQuery(sql, [id]);
        return result.changes > 0;
    }

    /**
     * Eliminar múltiples registros por condiciones
     */
    async delete(conditions) {
        const whereClause = Object.keys(conditions)
            .map(key => `${key} = ?`)
            .join(' AND ');
        const sql = `DELETE FROM ${this.tableName} WHERE ${whereClause}`;
        const result = await this.executeModifyQuery(sql, Object.values(conditions));
        return result.changes;
    }

    /**
     * Contar registros
     */
    async count(conditions = {}) {
        let sql = `SELECT COUNT(*) as total FROM ${this.tableName}`;
        const params = [];

        if (Object.keys(conditions).length > 0) {
            const whereClause = Object.keys(conditions)
                .map(key => `${key} = ?`)
                .join(' AND ');
            sql += ` WHERE ${whereClause}`;
            params.push(...Object.values(conditions));
        }

        const result = await this.executeQuerySingle(sql, params);
        return result.total;
    }

    /**
     * Verificar si existe un registro
     */
    async exists(conditions) {
        const count = await this.count(conditions);
        return count > 0;
    }

    /**
     * Búsqueda con paginación
     */
    async findWithPagination(conditions = {}, page = 1, pageSize = 10, orderBy = 'id ASC') {
        const offset = (page - 1) * pageSize;
        
        // Contar total de registros
        const total = await this.count(conditions);
        
        // Obtener registros paginados
        let sql = `SELECT * FROM ${this.tableName}`;
        const params = [];

        if (Object.keys(conditions).length > 0) {
            const whereClause = Object.keys(conditions)
                .map(key => `${key} = ?`)
                .join(' AND ');
            sql += ` WHERE ${whereClause}`;
            params.push(...Object.values(conditions));
        }

        sql += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
        params.push(pageSize, offset);

        const items = await this.executeQuery(sql, params);

        return {
            items,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
                hasNext: page < Math.ceil(total / pageSize),
                hasPrev: page > 1
            }
        };
    }

    /**
     * Búsqueda con LIKE (para texto)
     */
    async search(field, term, limit = 50) {
        const sql = `SELECT * FROM ${this.tableName} WHERE ${field} LIKE ? LIMIT ?`;
        return await this.executeQuery(sql, [`%${term}%`, limit]);
    }

    /**
     * Obtener estadísticas básicas
     */
    async getStats() {
        const total = await this.count();
        
        // Intentar obtener registro más reciente
        let latestRecord = null;
        try {
            const sql = `SELECT * FROM ${this.tableName} ORDER BY id DESC LIMIT 1`;
            latestRecord = await this.executeQuerySingle(sql);
        } catch (error) {
            // Ignorar errores si no hay registros
        }

        return {
            total,
            latestRecord,
            tableName: this.tableName
        };
    }
}

export default BaseRepository;
