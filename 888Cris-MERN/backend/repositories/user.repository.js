// repositories/user.repository.js
// Repository para operaciones de usuarios
import { BaseRepository } from './base.repository.js';
import bcrypt from 'bcrypt';
import { createCliente } from '../models/user.model.js';

/**
 * Repository para gestión de usuarios
 * Extiende BaseRepository con operaciones específicas de usuarios
 */
export class UserRepository extends BaseRepository {
    constructor() {
        super('users');
    }

    /**
     * Buscar usuario por email
     */
    async findByEmail(email) {
        return await this.findOne({ email });
    }

    /**
     * Buscar usuario por username
     */
    async findByUsername(username) {
        return await this.findOne({ username });
    }

    /**
     * Verificar si existe un usuario con email o username
     */
    async existsByEmailOrUsername(email, username) {
        const sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE email = ? OR username = ?`;
        const result = await this.executeQuerySingle(sql, [email, username]);
        return result.count > 0;
    }

    /**
     * Crear usuario con password hasheado
     */
    async createUser(userData) {
        const { password, ...otherData } = userData;
        
        // Hashear password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        const userToCreate = {
            ...otherData,
            password: hashedPassword,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

                const createdUser = await this.create(userToCreate);

                // Intentar crear también un registro en la tabla 'cliente' para que
                // se genere el cliente_shippingMark automáticamente. No bloquear la
                // creación del usuario si esto falla: solo loguear el error.
                try {
                    const clienteData = {
                        nombre_cliente: otherData.nombre_cliente || `${otherData.username || 'User'}`,
                        correo_cliente: otherData.correo_cliente || otherData.email || null,
                        telefono_cliente: otherData.telefono_cliente || otherData.phone || '',
                        ciudad_cliente: otherData.ciudad_cliente || '',
                        pais_cliente: otherData.pais_cliente || ''
                    };
                    await createCliente(clienteData);
                } catch (err) {
                    console.warn('⚠️ No se pudo crear registro cliente automáticamente:', err?.message || err);
                }

                return createdUser;
    }

    /**
     * Verificar credenciales de usuario
     */
    async verifyCredentials(email, password) {
        const user = await this.findByEmail(email);
        
        if (!user) {
            return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (isPasswordValid) {
            // Retornar usuario sin password
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }

        return null;
    }

    /**
     * Actualizar password de usuario
     */
    async updatePassword(userId, newPassword) {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        
        return await this.updateById(userId, {
            password: hashedPassword,
            updated_at: new Date().toISOString()
        });
    }

    /**
     * Actualizar perfil de usuario (sin password)
     */
    async updateProfile(userId, profileData) {
        // Asegurar que no se incluya password en updates de perfil
        const { password, ...safeData } = profileData;
        
        const updateData = {
            ...safeData,
            updated_at: new Date().toISOString()
        };

        return await this.updateById(userId, updateData);
    }

    /**
     * Obtener usuario por ID sin password
     */
    async findByIdSafe(id) {
        const user = await this.findById(id);
        
        if (user) {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        
        return null;
    }

    /**
     * Buscar usuarios con paginación (sin passwords)
     */
    async findAllSafe(conditions = {}, page = 1, pageSize = 10) {
        const result = await this.findWithPagination(conditions, page, pageSize, 'created_at DESC');
        
        // Remover passwords de los resultados
        result.items = result.items.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });

        return result;
    }

    /**
     * Activar/desactivar usuario
     */
    async toggleUserStatus(userId, isActive = true) {
        return await this.updateById(userId, {
            is_active: isActive ? 1 : 0,
            updated_at: new Date().toISOString()
        });
    }

    /**
     * Obtener estadísticas de usuarios
     */
    async getUserStats() {
        const baseStats = await this.getStats();
        
        // Usuarios activos
        const activeUsers = await this.count({ is_active: 1 });
        
        // Usuarios inactivos
        const inactiveUsers = await this.count({ is_active: 0 });
        
        // Usuarios registrados en las últimas 24 horas
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE created_at >= ?`;
        const recentUsers = await this.executeQuerySingle(sql, [yesterday.toISOString()]);

        return {
            ...baseStats,
            activeUsers,
            inactiveUsers,
            recentRegistrations: recentUsers.count
        };
    }

    /**
     * Buscar usuarios por término de búsqueda
     */
    async searchUsers(searchTerm, limit = 20) {
        const sql = `
            SELECT id, username, email, created_at, is_active 
            FROM ${this.tableName} 
            WHERE username LIKE ? OR email LIKE ? 
            ORDER BY username ASC 
            LIMIT ?
        `;
        
        const term = `%${searchTerm}%`;
        return await this.executeQuery(sql, [term, term, limit]);
    }

    /**
     * Validar formato de email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validar fortaleza de password
     */
    validatePasswordStrength(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        const errors = [];

        if (password.length < minLength) {
            errors.push(`Password debe tener al menos ${minLength} caracteres`);
        }
        
        if (!hasUpperCase) {
            errors.push('Password debe contener al menos una letra mayúscula');
        }
        
        if (!hasLowerCase) {
            errors.push('Password debe contener al menos una letra minúscula');
        }
        
        if (!hasNumbers) {
            errors.push('Password debe contener al menos un número');
        }
        
        if (!hasSpecialChar) {
            errors.push('Password debe contener al menos un carácter especial');
        }

        return {
            isValid: errors.length === 0,
            errors,
            strength: this.calculatePasswordStrength(password)
        };
    }

    /**
     * Calcular fortaleza de password (1-5)
     */
    calculatePasswordStrength(password) {
        let strength = 0;
        
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

        return Math.min(5, strength);
    }
}

// Instancia singleton del repository
const userRepository = new UserRepository();

export default userRepository;
