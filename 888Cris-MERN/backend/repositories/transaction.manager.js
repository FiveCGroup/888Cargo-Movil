// repositories/transaction.manager.js
// Gestor de transacciones para operaciones complejas
import db from "../db.js";

/**
 * Gestor de transacciones para operaciones que requieren atomicidad
 */
export class TransactionManager {
    constructor() {
        this.db = db;
        this.isInTransaction = false;
    }

    /**
     * Iniciar una transacción
     */
    async beginTransaction() {
        if (this.isInTransaction) {
            throw new Error('Ya hay una transacción en curso');
        }

        return new Promise((resolve, reject) => {
            this.db.run('BEGIN TRANSACTION', (err) => {
                if (err) {
                    reject(err);
                } else {
                    this.isInTransaction = true;
                    console.log('🔄 Transacción iniciada');
                    resolve();
                }
            });
        });
    }

    /**
     * Confirmar la transacción
     */
    async commit() {
        if (!this.isInTransaction) {
            throw new Error('No hay transacción activa para confirmar');
        }

        return new Promise((resolve, reject) => {
            this.db.run('COMMIT', (err) => {
                if (err) {
                    reject(err);
                } else {
                    this.isInTransaction = false;
                    console.log('✅ Transacción confirmada');
                    resolve();
                }
            });
        });
    }

    /**
     * Revertir la transacción
     */
    async rollback() {
        if (!this.isInTransaction) {
            console.warn('⚠️ No hay transacción activa para revertir');
            return;
        }

        return new Promise((resolve, reject) => {
            this.db.run('ROLLBACK', (err) => {
                if (err) {
                    reject(err);
                } else {
                    this.isInTransaction = false;
                    console.log('🔄 Transacción revertida');
                    resolve();
                }
            });
        });
    }

    /**
     * Ejecutar operaciones dentro de una transacción
     * @param {Function} operations - Función async que contiene las operaciones
     * @returns {Promise<any>} - Resultado de las operaciones
     */
    async executeInTransaction(operations) {
        try {
            await this.beginTransaction();
            
            const result = await operations();
            
            await this.commit();
            return result;
            
        } catch (error) {
            console.error('❌ Error en transacción:', error.message);
            await this.rollback();
            throw error;
        }
    }

    /**
     * Ejecutar consulta dentro de la transacción actual
     */
    async executeQuery(sql, params = []) {
        if (!this.isInTransaction) {
            throw new Error('No hay transacción activa');
        }

        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error(`Error en consulta transaccional: ${sql}`, err);
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
        if (!this.isInTransaction) {
            throw new Error('No hay transacción activa');
        }

        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error(`Error en consulta transaccional: ${sql}`, err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Ejecutar consulta que modifica datos
     */
    async executeModifyQuery(sql, params = []) {
        if (!this.isInTransaction) {
            throw new Error('No hay transacción activa');
        }

        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error(`Error en consulta transaccional: ${sql}`, err);
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
     * Obtener estado de la transacción
     */
    getTransactionState() {
        return {
            isActive: this.isInTransaction,
            timestamp: new Date().toISOString()
        };
    }
}

// Instancia singleton del gestor de transacciones
const transactionManager = new TransactionManager();

export default transactionManager;
