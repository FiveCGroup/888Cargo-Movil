// services/auth.service.js
// Servicio para lógica de negocio de autenticación
import { createAccessToken } from "../libs/jwt.js";
import { userRepository } from "../repositories/index.js";
import { AuthValidator } from "../validators/auth.validator.js";
import { AuthUtils } from "../utils/auth.utils.js";

export class AuthService {
    
    /**
     * Registrar un nuevo usuario
     * @param {Object} userData - Datos del usuario
     * @param {string} ip - Dirección IP del usuario
     * @returns {Promise<Object>} - Usuario registrado y token
     */
    static async registerUser(userData, ip) {
        const { name, lastname, email, phone, country, password, acceptWhatsapp } = userData;
        
        // Validar datos de entrada
        AuthValidator.validateRegistrationData(userData);
        
        // Normalizar email
        const normalizedEmail = AuthUtils.normalizeEmail(email);
        
        // Verificar si ya existe un usuario con el mismo correo
        const existingUser = await userRepository.findByEmail(normalizedEmail);
        
        if (existingUser) {
            throw new Error("Ya existe un usuario con ese correo");
        }

        // Crear el nuevo usuario usando el repository
        const newUser = await userRepository.createUser({
            username: `${name}_${lastname}`.toLowerCase().replace(' ', '_'),
            email: normalizedEmail,
            password: password, // El repository se encarga del hash
            nombre_cliente: `${name} ${lastname}`,
            correo_cliente: normalizedEmail,
            telefono_cliente: phone,
            ciudad_cliente: '', 
            pais_cliente: country,
            is_active: 1
        });

        // Generar token
        const token = await createAccessToken({ id: newUser.id });
        
        // Log de registro
        console.log("Registro nuevo usuario -> IP:", ip, "Acepta WhatsApp:", acceptWhatsapp);

        return {
            user: {
                id: newUser.id,
                name: newUser.nombre_cliente,
                email: newUser.correo_cliente
            },
            token
        };
    }

    /**
     * Iniciar sesión de usuario
     * @param {Object} credentials - Credenciales de login
     * @returns {Promise<Object>} - Usuario y token
     */
    static async loginUser(credentials) {
        const { email, password } = credentials;
        
        // Validar credenciales
        AuthValidator.validateLoginData(credentials);
        
        // Normalizar email
        const normalizedEmail = AuthUtils.normalizeEmail(email);
        
        // Verificar credenciales usando el repository
        const userFound = await userRepository.verifyCredentials(normalizedEmail, password);
        if (!userFound) {
            throw new Error('Credenciales inválidas');
        }

        // Verificar que el usuario esté activo
        if (!userFound.is_active) {
            throw new Error('Usuario inactivo');
        }
        
        // Generar token
        const token = await createAccessToken({ id: userFound.id });
        
        return {
            user: {
                id: userFound.id,
                name: userFound.nombre_cliente || userFound.username,
                email: userFound.correo_cliente || userFound.email
            },
            token
        };
    }

    /**
     * Obtener perfil de usuario
     * @param {number} userId - ID del usuario
     * @returns {Promise<Object>} - Datos del perfil
     */
    static async getUserProfile(userId) {
        const result = await userRepository.findByIdSafe(userId);
        
        if (!result) {
            throw new Error('Usuario no encontrado');
        }

        return {
            id: result.id,
            name: result.nombre_cliente || result.username,
            email: result.correo_cliente || result.email,
            phone: result.telefono_cliente,
            country: result.pais_cliente,
            isActive: result.is_active,
            createdAt: result.created_at
        };
    }
}
