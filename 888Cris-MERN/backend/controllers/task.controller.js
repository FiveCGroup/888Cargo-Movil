// controllers/task.controller.js
// Controlador para operaciones de tareas - Solo responsabilidad HTTP
import { TaskService } from "../services/task.service.js";

/**
 * Obtener todas las tareas del usuario
 */
export const getTasks = async (req, res) => {
    try {
        const tasks = await TaskService.getUserTasks(req.user.id);
        res.json({
            success: true,
            data: tasks
        });
    } catch (error) {
        console.error("Error al obtener tareas:", error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al obtener tareas'
        });
    }
};

/**
 * Crear una nueva tarea
 */
export const createTask = async (req, res) => {
    try {
        const newTask = await TaskService.createTask(req.body, req.user.id);
        res.status(201).json({
            success: true,
            data: newTask,
            message: 'Tarea creada exitosamente'
        });
    } catch (error) {
        console.error("Error al crear tarea:", error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al crear tarea'
        });
    }
};

/**
 * Obtener una tarea específica
 */
export const getTask = async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const task = await TaskService.getTaskById(taskId, req.user.id);
        res.json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error("Error al obtener tarea:", error);
        res.status(404).json({
            success: false,
            message: error.message || 'Tarea no encontrada'
        });
    }
};

/**
 * Actualizar una tarea
 */
export const updateTask = async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const updatedTask = await TaskService.updateTask(taskId, req.body, req.user.id);
        res.json({
            success: true,
            data: updatedTask,
            message: 'Tarea actualizada exitosamente'
        });
    } catch (error) {
        console.error("Error al actualizar tarea:", error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al actualizar tarea'
        });
    }
};

/**
 * Eliminar una tarea
 */
export const deleteTask = async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        await TaskService.deleteTask(taskId, req.user.id);
        res.json({
            success: true,
            message: 'Tarea eliminada exitosamente'
        });
    } catch (error) {
        console.error("Error al eliminar tarea:", error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al eliminar tarea'
        });
    }
};

/**
 * Marcar tarea como completada/incompleta
 */
export const toggleTaskCompletion = async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const { completed } = req.body;
        
        const updatedTask = await TaskService.toggleTaskCompletion(taskId, completed, req.user.id);
        res.json({
            success: true,
            data: updatedTask,
            message: completed ? 'Tarea marcada como completada' : 'Tarea marcada como pendiente'
        });
    } catch (error) {
        console.error("Error al cambiar estado de tarea:", error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al cambiar estado de tarea'
        });
    }
};

/**
 * Obtener estadísticas de tareas del usuario
 */
export const getTaskStats = async (req, res) => {
    try {
        const stats = await TaskService.getUserTaskStats(req.user.id);
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error("Error al obtener estadísticas:", error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al obtener estadísticas'
        });
    }
};