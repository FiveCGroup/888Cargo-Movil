// services/task.service.js
// Servicio para lógica de negocio de tareas
import { query, run, get } from '../db.js';
import { TaskValidator } from '../validators/task.validator.js';

export class TaskService {
    
    /**
     * Obtener todas las tareas de un usuario
     * @param {number} userId - ID del usuario
     * @returns {Promise<Array>} - Lista de tareas
     */
    static async getUserTasks(userId) {
        TaskValidator.validateUserId(userId);
        
        const tasks = await query(
            'SELECT * FROM task WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        
        return tasks || [];
    }

    /**
     * Crear una nueva tarea
     * @param {Object} taskData - Datos de la tarea
     * @param {number} userId - ID del usuario
     * @returns {Promise<Object>} - Tarea creada
     */
    static async createTask(taskData, userId) {
        TaskValidator.validateTaskData(taskData);
        TaskValidator.validateUserId(userId);
        
        const { title, description, priority = 'medium', dueDate } = taskData;
        
        const result = await run(
            `INSERT INTO task (title, description, priority, due_date, user_id, completed, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))`,
            [title, description, priority, dueDate, userId]
        );
        
        // Obtener la tarea creada
        const newTask = await get(
            'SELECT * FROM task WHERE id = ?',
            [result.id]
        );
        
        return newTask;
    }

    /**
     * Actualizar una tarea
     * @param {number} taskId - ID de la tarea
     * @param {Object} updateData - Datos a actualizar
     * @param {number} userId - ID del usuario
     * @returns {Promise<Object>} - Tarea actualizada
     */
    static async updateTask(taskId, updateData, userId) {
        TaskValidator.validateTaskId(taskId);
        TaskValidator.validateUserId(userId);
        
        // Verificar que la tarea pertenece al usuario
        const existingTask = await get(
            'SELECT * FROM task WHERE id = ? AND user_id = ?',
            [taskId, userId]
        );
        
        if (!existingTask) {
            throw new Error('Tarea no encontrada o no tienes permisos para modificarla');
        }
        
        // Construir query de actualización dinámicamente
        const allowedFields = ['title', 'description', 'priority', 'due_date', 'completed'];
        const updates = [];
        const values = [];
        
        Object.keys(updateData).forEach(key => {
            const dbField = key === 'dueDate' ? 'due_date' : key;
            if (allowedFields.includes(dbField)) {
                updates.push(`${dbField} = ?`);
                values.push(updateData[key]);
            }
        });
        
        if (updates.length === 0) {
            throw new Error('No hay campos válidos para actualizar');
        }
        
        // Agregar timestamp de actualización
        updates.push('updated_at = datetime(\'now\')');
        values.push(taskId, userId);
        
        await run(
            `UPDATE task SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
            values
        );
        
        // Obtener la tarea actualizada
        const updatedTask = await get(
            'SELECT * FROM task WHERE id = ? AND user_id = ?',
            [taskId, userId]
        );
        
        return updatedTask;
    }

    /**
     * Eliminar una tarea
     * @param {number} taskId - ID de la tarea
     * @param {number} userId - ID del usuario
     * @returns {Promise<boolean>} - True si se eliminó
     */
    static async deleteTask(taskId, userId) {
        TaskValidator.validateTaskId(taskId);
        TaskValidator.validateUserId(userId);
        
        // Verificar que la tarea pertenece al usuario
        const existingTask = await get(
            'SELECT * FROM task WHERE id = ? AND user_id = ?',
            [taskId, userId]
        );
        
        if (!existingTask) {
            throw new Error('Tarea no encontrada o no tienes permisos para eliminarla');
        }
        
        const result = await run(
            'DELETE FROM task WHERE id = ? AND user_id = ?',
            [taskId, userId]
        );
        
        return result.changes > 0;
    }

    /**
     * Obtener una tarea específica
     * @param {number} taskId - ID de la tarea
     * @param {number} userId - ID del usuario
     * @returns {Promise<Object>} - Tarea encontrada
     */
    static async getTaskById(taskId, userId) {
        TaskValidator.validateTaskId(taskId);
        TaskValidator.validateUserId(userId);
        
        const task = await get(
            'SELECT * FROM task WHERE id = ? AND user_id = ?',
            [taskId, userId]
        );
        
        if (!task) {
            throw new Error('Tarea no encontrada');
        }
        
        return task;
    }

    /**
     * Marcar tarea como completada/incompleta
     * @param {number} taskId - ID de la tarea
     * @param {boolean} completed - Estado de completado
     * @param {number} userId - ID del usuario
     * @returns {Promise<Object>} - Tarea actualizada
     */
    static async toggleTaskCompletion(taskId, completed, userId) {
        return await this.updateTask(taskId, { completed: completed ? 1 : 0 }, userId);
    }

    /**
     * Obtener estadísticas de tareas del usuario
     * @param {number} userId - ID del usuario
     * @returns {Promise<Object>} - Estadísticas
     */
    static async getUserTaskStats(userId) {
        TaskValidator.validateUserId(userId);
        
        const stats = await get(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN due_date < date('now') AND completed = 0 THEN 1 ELSE 0 END) as overdue
             FROM task WHERE user_id = ?`,
            [userId]
        );
        
        return {
            total: stats?.total || 0,
            completed: stats?.completed || 0,
            pending: stats?.pending || 0,
            overdue: stats?.overdue || 0
        };
    }
}
