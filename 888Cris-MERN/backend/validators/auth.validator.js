// validators/auth.validator.js
// Validador para operaciones de autenticación
import { z } from "zod";
import { BaseValidator } from "./base.validator.js";

export class AuthValidator extends BaseValidator {
    
    // Schema para registro de usuario
    static registrationSchema = z.object({
        name: z.string()
            .min(2, "Nombre debe tener al menos 2 caracteres")
            .max(50, "Nombre no puede exceder 50 caracteres")
            .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Nombre solo puede contener letras"),
        
        lastname: z.string()
            .min(2, "Apellido debe tener al menos 2 caracteres")
            .max(50, "Apellido no puede exceder 50 caracteres")
            .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Apellido solo puede contener letras"),
        
        email: z.string()
            .email("Formato de email inválido")
            .max(100, "Email no puede exceder 100 caracteres"),
        
        phone: z.string()
            .regex(/^\+?[0-9]{10,15}$/, "Formato de teléfono inválido (ej: +573001112233)"),
        
        country: z.string()
            .min(2, "País debe tener al menos 2 caracteres")
            .max(50, "País no puede exceder 50 caracteres"),
        
        password: z.string()
            .min(6, "Contraseña debe tener al menos 6 caracteres")
            .max(100, "Contraseña no puede exceder 100 caracteres")
            .regex(/[A-Za-z]/, "Contraseña debe contener al menos una letra")
            .regex(/[0-9]/, "Contraseña debe contener al menos un número")
    });

    // Schema para login
    static loginSchema = z.object({
        email: z.string()
            .email("Formato de email inválido"),
        
        password: z.string()
            .min(1, "Contraseña es requerida")
    });

    // Schema para actualización de perfil
    static profileUpdateSchema = z.object({
        name: z.string()
            .min(2, "Nombre debe tener al menos 2 caracteres")
            .max(50, "Nombre no puede exceder 50 caracteres")
            .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Nombre solo puede contener letras")
            .optional(),
        
        lastname: z.string()
            .min(2, "Apellido debe tener al menos 2 caracteres")
            .max(50, "Apellido no puede exceder 50 caracteres")
            .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Apellido solo puede contener letras")
            .optional(),
        
        phone: z.string()
            .regex(/^\+?[0-9]{10,15}$/, "Formato de teléfono inválido")
            .optional(),
        
        country: z.string()
            .min(2, "País debe tener al menos 2 caracteres")
            .max(50, "País no puede exceder 50 caracteres")
            .optional()
    });

    // Schema para cambio de contraseña
    static passwordChangeSchema = z.object({
        currentPassword: z.string()
            .min(1, "Contraseña actual es requerida"),
        
        newPassword: z.string()
            .min(6, "Nueva contraseña debe tener al menos 6 caracteres")
            .max(100, "Nueva contraseña no puede exceder 100 caracteres")
            .regex(/[A-Za-z]/, "Nueva contraseña debe contener al menos una letra")
            .regex(/[0-9]/, "Nueva contraseña debe contener al menos un número")
    });

    /**
     * Validar datos de registro
     * @param {Object} userData - Datos del usuario
     * @returns {Object} - Datos validados
     * @throws {Error} - Error de validación
     */
    static validateRegistrationData(userData) {
        try {
            // Validar con Zod
            const validatedData = this.registrationSchema.parse(userData);
            
            // Normalizar teléfono
            validatedData.phone = this.normalizePhone(validatedData.phone);
            
            // Sanitizar strings
            validatedData.name = this.sanitizeInput(validatedData.name.trim());
            validatedData.lastname = this.sanitizeInput(validatedData.lastname.trim());
            validatedData.email = validatedData.email.toLowerCase().trim();
            validatedData.country = this.sanitizeInput(validatedData.country.trim());
            
            return validatedData;
        } catch (error) {
            throw new Error(this.formatZodError(error));
        }
    }

    /**
     * Validar datos de login
     * @param {Object} credentials - Credenciales
     * @returns {Object} - Credenciales validadas
     * @throws {Error} - Error de validación
     */
    static validateLoginData(credentials) {
        try {
            const validatedData = this.loginSchema.parse(credentials);
            
            // Normalizar email
            validatedData.email = validatedData.email.toLowerCase().trim();
            
            return validatedData;
        } catch (error) {
            throw new Error(this.formatZodError(error));
        }
    }

    /**
     * Validar datos de actualización de perfil
     * @param {Object} updateData - Datos a actualizar
     * @returns {Object} - Datos validados
     * @throws {Error} - Error de validación
     */
    static validateProfileUpdateData(updateData) {
        try {
            // Verificar que se proporcionen datos para actualizar
            if (Object.keys(updateData).length === 0) {
                throw new Error("No se proporcionaron datos para actualizar");
            }

            const validatedData = this.profileUpdateSchema.parse(updateData);
            
            // Sanitizar y normalizar datos si están presentes
            if (validatedData.name) {
                validatedData.name = this.sanitizeInput(validatedData.name.trim());
            }
            
            if (validatedData.lastname) {
                validatedData.lastname = this.sanitizeInput(validatedData.lastname.trim());
            }
            
            if (validatedData.phone) {
                validatedData.phone = this.normalizePhone(validatedData.phone);
            }
            
            if (validatedData.country) {
                validatedData.country = this.sanitizeInput(validatedData.country.trim());
            }
            
            return validatedData;
        } catch (error) {
            throw new Error(this.formatZodError(error));
        }
    }

    /**
     * Validar datos de cambio de contraseña
     * @param {Object} passwordData - Datos de contraseña
     * @returns {Object} - Datos validados
     * @throws {Error} - Error de validación
     */
    static validatePasswordChangeData(passwordData) {
        try {
            const validatedData = this.passwordChangeSchema.parse(passwordData);
            
            // Verificar que la nueva contraseña sea diferente a la actual
            if (validatedData.currentPassword === validatedData.newPassword) {
                throw new Error("La nueva contraseña debe ser diferente a la actual");
            }
            
            return validatedData;
        } catch (error) {
            throw new Error(this.formatZodError(error));
        }
    }

    /**
     * Validar token JWT
     * @param {string} token - Token a validar
     * @returns {string} - Token validado
     * @throws {Error} - Error de validación
     */
    static validateToken(token) {
        if (!token || typeof token !== 'string') {
            throw new Error("Token es requerido");
        }

        if (token.length < 10) {
            throw new Error("Token inválido");
        }

        return token;
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
     * Verificar si un email ya existe (para uso en servicios)
     * @param {string} email - Email a verificar
     * @returns {string} - Email normalizado
     * @throws {Error} - Error de validación
     */
    static validateUniqueEmail(email) {
        this.validateEmail(email);
        return email.toLowerCase().trim();
    }

    /**
     * Validar datos de restablecimiento de contraseña
     * @param {Object} resetData - Datos de restablecimiento
     * @returns {Object} - Datos validados
     * @throws {Error} - Error de validación
     */
    static validatePasswordResetData(resetData) {
        const { email } = resetData;
        
        if (!email) {
            throw new Error("Email es requerido para el restablecimiento");
        }

        this.validateEmail(email);
        
        return {
            email: email.toLowerCase().trim()
        };
    }

    /**
     * Validar código de verificación
     * @param {string} code - Código a validar
     * @returns {string} - Código validado
     * @throws {Error} - Error de validación
     */
    static validateVerificationCode(code) {
        if (!code || typeof code !== 'string') {
            throw new Error("Código de verificación es requerido");
        }

        if (code.length !== 6 || !/^\d{6}$/.test(code)) {
            throw new Error("Código de verificación debe ser de 6 dígitos");
        }

        return code;
    }

    /**
     * Validar fortaleza de contraseña (versión avanzada)
     * @param {string} password - Contraseña a validar
     * @returns {Object} - Resultado de la validación con score
     */
    static validatePasswordStrength(password) {
        let score = 0;
        const feedback = [];

        if (!password || password.length < 6) {
            return {
                isValid: false,
                score: 0,
                feedback: ["Contraseña debe tener al menos 6 caracteres"]
            };
        }

        // Longitud
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;

        // Complejidad
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

        // Patrones
        if (!/(.)\1{2,}/.test(password)) score += 1; // No repeticiones
        if (!/123|abc|qwe|password/i.test(password)) score += 1; // No patrones comunes

        // Feedback
        if (password.length < 8) feedback.push("Use al menos 8 caracteres");
        if (!/[a-z]/.test(password)) feedback.push("Incluya letras minúsculas");
        if (!/[A-Z]/.test(password)) feedback.push("Incluya letras mayúsculas");
        if (!/[0-9]/.test(password)) feedback.push("Incluya números");
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) feedback.push("Incluya caracteres especiales");

        return {
            isValid: score >= 4,
            score: Math.min(score, 8),
            strength: score < 3 ? 'Débil' : score < 6 ? 'Media' : 'Fuerte',
            feedback: feedback
        };
    }
}
