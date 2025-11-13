// validators/task.validator.js
// Validador para operaciones de tareas
import { z } from "zod";
import { BaseValidator } from "./base.validator.js";

export class TaskValidator extends BaseValidator {
    
    // Enum de prioridades válidas
    static PRIORITIES = ['low', 'medium', 'high'];
    static STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];

    // Schema para crear tarea
    static createTaskSchema = z.object({
        title: z.string()
            .min(1, "Título es requerido")
            .max(255, "Título no puede exceder 255 caracteres")
            .transform(val => val.trim()),
        
        description: z.string()
            .max(1000, "Descripción no puede exceder 1000 caracteres")
            .optional()
            .transform(val => val ? val.trim() : val),
        
        priority: z.enum(['low', 'medium', 'high'], {
            errorMap: () => ({ message: "Prioridad debe ser: low, medium o high" })
        }).default('medium'),
        
        dueDate: z.string()
            .datetime("Fecha de vencimiento debe ser una fecha válida")
            .optional()
            .or(z.date().optional()),
        
        categoryId: z.number()
            .positive("ID de categoría debe ser positivo")
            .optional(),
        
        tags: z.array(z.string().max(50, "Tag no puede exceder 50 caracteres"))
            .max(10, "No puede tener más de 10 tags")
            .optional()
            .default([])
    });

    // Schema para actualizar tarea
    static updateTaskSchema = z.object({
        title: z.string()
            .min(1, "Título no puede estar vacío")
            .max(255, "Título no puede exceder 255 caracteres")
            .transform(val => val.trim())
            .optional(),
        
        description: z.string()
            .max(1000, "Descripción no puede exceder 1000 caracteres")
            .transform(val => val ? val.trim() : val)
            .optional(),
        
        priority: z.enum(['low', 'medium', 'high'], {
            errorMap: () => ({ message: "Prioridad debe ser: low, medium o high" })
        }).optional(),
        
        dueDate: z.string()
            .datetime("Fecha de vencimiento debe ser una fecha válida")
            .optional()
            .or(z.date().optional())
            .or(z.null()),
        
        completed: z.boolean("Estado debe ser true o false").optional(),
        
        status: z.enum(['pending', 'in_progress', 'completed', 'cancelled'], {
            errorMap: () => ({ message: "Estado debe ser: pending, in_progress, completed o cancelled" })
        }).optional(),
        
        categoryId: z.number()
            .positive("ID de categoría debe ser positivo")
            .optional()
            .or(z.null()),
        
        tags: z.array(z.string().max(50, "Tag no puede exceder 50 caracteres"))
            .max(10, "No puede tener más de 10 tags")
            .optional()
    });

    // Schema para filtros de búsqueda
    static taskFiltersSchema = z.object({
        status: z.enum(['all', 'pending', 'in_progress', 'completed', 'cancelled'])
            .default('all'),
        
        priority: z.enum(['all', 'low', 'medium', 'high'])
            .default('all'),
        
        categoryId: z.number()
            .positive("ID de categoría debe ser positivo")
            .optional(),
        
        dueDate: z.object({
            from: z.string().datetime().optional(),
            to: z.string().datetime().optional()
        }).optional(),
        
        search: z.string()
            .max(255, "Búsqueda no puede exceder 255 caracteres")
            .optional(),
        
        tags: z.array(z.string())
            .optional(),
        
        page: z.number()
            .positive("Página debe ser un número positivo")
            .default(1),
        
        limit: z.number()
            .positive("Límite debe ser un número positivo")
            .max(100, "Límite no puede exceder 100")
            .default(10),
        
        sortBy: z.enum(['created_at', 'updated_at', 'due_date', 'priority', 'title'])
            .default('created_at'),
        
        sortOrder: z.enum(['asc', 'desc'])
            .default('desc')
    });

    /**
     * Validar datos para crear tarea
     * @param {Object} taskData - Datos de la tarea
     * @returns {Object} - Datos validados
     * @throws {Error} - Error de validación
     */
    static validateCreateTaskData(taskData) {
        try {
            const validatedData = this.createTaskSchema.parse(taskData);
            
            // Sanitizar título y descripción
            validatedData.title = this.sanitizeInput(validatedData.title);
            if (validatedData.description) {
                validatedData.description = this.sanitizeInput(validatedData.description);
            }
            
            // Validar fecha de vencimiento si se proporciona
            if (validatedData.dueDate) {
                const dueDate = new Date(validatedData.dueDate);
                if (dueDate < new Date()) {
                    throw new Error("La fecha de vencimiento no puede ser en el pasado");
                }
            }
            
            return validatedData;
        } catch (error) {
            throw new Error(this.formatZodError(error));
        }
    }

    /**
     * Validar datos para actualizar tarea
     * @param {Object} updateData - Datos a actualizar
     * @returns {Object} - Datos validados
     * @throws {Error} - Error de validación
     */
    static validateUpdateTaskData(updateData) {
        try {
            // Verificar que se proporcionen datos para actualizar
            if (Object.keys(updateData).length === 0) {
                throw new Error("No se proporcionaron datos para actualizar");
            }

            const validatedData = this.updateTaskSchema.parse(updateData);
            
            // Sanitizar campos de texto
            if (validatedData.title) {
                validatedData.title = this.sanitizeInput(validatedData.title);
            }
            
            if (validatedData.description) {
                validatedData.description = this.sanitizeInput(validatedData.description);
            }
            
            // Validar lógica de negocio
            if (validatedData.completed !== undefined && validatedData.status !== undefined) {
                if (validatedData.completed && validatedData.status !== 'completed') {
                    throw new Error("Una tarea marcada como completada debe tener estado 'completed'");
                }
                if (!validatedData.completed && validatedData.status === 'completed') {
                    throw new Error("Una tarea con estado 'completed' debe estar marcada como completada");
                }
            }
            
            // Validar fecha de vencimiento
            if (validatedData.dueDate && validatedData.dueDate !== null) {
                const dueDate = new Date(validatedData.dueDate);
                if (dueDate < new Date() && validatedData.status !== 'completed') {
                    console.warn("Advertencia: La fecha de vencimiento es en el pasado");
                }
            }
            
            return validatedData;
        } catch (error) {
            throw new Error(this.formatZodError(error));
        }
    }

    /**
     * Validar filtros de búsqueda de tareas
     * @param {Object} filters - Filtros de búsqueda
     * @returns {Object} - Filtros validados
     * @throws {Error} - Error de validación
     */
    static validateTaskFilters(filters) {
        try {
            const validatedFilters = this.taskFiltersSchema.parse(filters);
            
            // Validar rango de fechas
            if (validatedFilters.dueDate) {
                const { from, to } = validatedFilters.dueDate;
                if (from && to && new Date(from) > new Date(to)) {
                    throw new Error("La fecha de inicio no puede ser mayor que la fecha final");
                }
            }
            
            // Sanitizar término de búsqueda
            if (validatedFilters.search) {
                validatedFilters.search = this.sanitizeInput(validatedFilters.search.trim());
            }
            
            return validatedFilters;
        } catch (error) {
            throw new Error(this.formatZodError(error));
        }
    }

    /**
     * Validar ID de tarea
     * @param {any} taskId - ID de la tarea
     * @returns {number} - ID validado
     * @throws {Error} - Error de validación
     */
    static validateTaskId(taskId) {
        return this.validateId(taskId, "ID de tarea");
    }

    /**
     * Validar ID de usuario
     * @param {any} userId - ID del usuario
     * @returns {number} - ID validado
     * @throws {Error} - Error de validación
     */
    static validateUserId(userId) {
        return this.validateId(userId, "ID de usuario");
    }

    /**
     * Validar datos de categoría de tarea
     * @param {Object} categoryData - Datos de la categoría
     * @returns {Object} - Datos validados
     * @throws {Error} - Error de validación
     */
    static validateCategoryData(categoryData) {
        const { name, description, color } = categoryData;
        
        if (!name || typeof name !== 'string') {
            throw new Error("Nombre de categoría es requerido");
        }
        
        const validatedData = {
            name: this.sanitizeInput(name.trim()),
            description: description ? this.sanitizeInput(description.trim()) : null,
            color: color || '#6B7280'
        };
        
        if (validatedData.name.length < 1 || validatedData.name.length > 50) {
            throw new Error("Nombre de categoría debe tener entre 1 y 50 caracteres");
        }
        
        if (validatedData.description && validatedData.description.length > 255) {
            throw new Error("Descripción de categoría no puede exceder 255 caracteres");
        }
        
        // Validar formato de color hex
        if (!/^#[0-9A-F]{6}$/i.test(validatedData.color)) {
            throw new Error("Color debe ser un código hexadecimal válido (#RRGGBB)");
        }
        
        return validatedData;
    }

    /**
     * Validar datos de etiqueta
     * @param {Object} tagData - Datos de la etiqueta
     * @returns {Object} - Datos validados
     * @throws {Error} - Error de validación
     */
    static validateTagData(tagData) {
        const { name, color } = tagData;
        
        if (!name || typeof name !== 'string') {
            throw new Error("Nombre de etiqueta es requerido");
        }
        
        const validatedData = {
            name: this.sanitizeInput(name.trim().toLowerCase()),
            color: color || '#6B7280'
        };
        
        if (validatedData.name.length < 1 || validatedData.name.length > 30) {
            throw new Error("Nombre de etiqueta debe tener entre 1 y 30 caracteres");
        }
        
        // Validar que no contenga espacios
        if (validatedData.name.includes(' ')) {
            throw new Error("Nombre de etiqueta no puede contener espacios");
        }
        
        // Validar formato de color hex
        if (!/^#[0-9A-F]{6}$/i.test(validatedData.color)) {
            throw new Error("Color debe ser un código hexadecimal válido (#RRGGBB)");
        }
        
        return validatedData;
    }

    /**
     * Validar operaciones en lote
     * @param {Object} batchData - Datos de operación en lote
     * @returns {Object} - Datos validados
     * @throws {Error} - Error de validación
     */
    static validateBatchOperation(batchData) {
        const { taskIds, operation, data } = batchData;
        
        if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
            throw new Error("Se requiere al menos un ID de tarea");
        }
        
        if (taskIds.length > 50) {
            throw new Error("No se pueden procesar más de 50 tareas a la vez");
        }
        
        // Validar que todos los IDs sean válidos
        const validatedIds = taskIds.map(id => this.validateTaskId(id));
        
        const allowedOperations = ['delete', 'update_status', 'update_priority', 'assign_category', 'add_tags', 'remove_tags'];
        if (!allowedOperations.includes(operation)) {
            throw new Error(`Operación no válida. Permitidas: ${allowedOperations.join(', ')}`);
        }
        
        return {
            taskIds: validatedIds,
            operation,
            data: data || {}
        };
    }

    /**
     * Validar estadísticas de tareas
     * @param {Object} statsFilters - Filtros para estadísticas
     * @returns {Object} - Filtros validados
     * @throws {Error} - Error de validación
     */
    static validateStatsFilters(statsFilters) {
        const {
            dateRange = 'month',
            userId,
            categoryId
        } = statsFilters;
        
        const allowedRanges = ['week', 'month', 'quarter', 'year', 'all'];
        if (!allowedRanges.includes(dateRange)) {
            throw new Error(`Rango de fecha inválido. Permitidos: ${allowedRanges.join(', ')}`);
        }
        
        const validatedFilters = { dateRange };
        
        if (userId !== undefined) {
            validatedFilters.userId = this.validateUserId(userId);
        }
        
        if (categoryId !== undefined) {
            validatedFilters.categoryId = this.validateId(categoryId, "ID de categoría");
        }
        
        return validatedFilters;
    }
}
