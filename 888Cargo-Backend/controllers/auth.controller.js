import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { get, insert } from '../db/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mobile_secret_888cargo_2024';

// Generar token JWT
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '24h' });
};

// Login de usuario
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('🔐 [Auth] Intento de login:', email);
        
        // Validar datos
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y password son requeridos'
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'El formato del email no es válido'
            });
        }

        // Buscar usuario por email (normalizar a minúsculas)
        const user = await get(
            'SELECT * FROM users WHERE (email = ? OR correo_cliente = ?) AND is_active = 1', 
            [email.toLowerCase(), email.toLowerCase()]
        );

        if (!user) {
            console.log('❌ [Auth] Usuario no encontrado:', email);
            return res.status(401).json({
                success: false,
                message: 'Email o contraseña incorrectos'
            });
        }

        // Verificar password
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            console.log('❌ [Auth] Password incorrecto para:', email);
            return res.status(401).json({
                success: false,
                message: 'Email o contraseña incorrectos'
            });
        }

        // Generar token
        const token = generateToken(user.id);

        // Respuesta exitosa
        const response = {
            success: true,
            message: 'Login exitoso',
            data: {
                user: {
                    id: user.id.toString(),
                    name: user.nombre_cliente || user.username || 'Usuario',
                    email: user.correo_cliente || user.email,
                    phone: user.telefono_cliente || '',
                    country: user.pais_cliente || ''
                },
                token,
                refreshToken: null // Por simplicidad, sin refresh token
            }
        };

        console.log('✅ [Auth] Login exitoso:', email);
        res.json(response);

    } catch (error) {
        console.error('❌ [Auth] Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Error del servidor'
        });
    }
};

// Registro de usuario
export const register = async (req, res) => {
    try {
        const { name, lastname, email, phone, country, password } = req.body;
        
        console.log('📝 [Auth] Intento de registro:', email);
        console.log('📝 [Auth] Datos recibidos:', { name, lastname, email, phone, country, passwordLength: password?.length });
        
        // Validar datos requeridos
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, email y password son requeridos'
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'El formato del email no es válido'
            });
        }

        // Validar longitud de password
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Verificar si el usuario ya existe
        const existingUser = await get(
            'SELECT * FROM users WHERE email = ? OR correo_cliente = ?',
            [email.toLowerCase(), email.toLowerCase()]
        );

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un usuario con ese email'
            });
        }

        // Hash del password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear usuario
        const fullName = `${name} ${lastname || ''}`.trim();
        const username = `${name}_${lastname || 'user'}`.toLowerCase().replace(/\s+/g, '_');
        
        const result = await insert(`
            INSERT INTO users (
                username, email, password, nombre_cliente,
                correo_cliente, telefono_cliente, pais_cliente, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `, [
            username,
            email.toLowerCase(),
            hashedPassword,
            fullName,
            email.toLowerCase(),
            phone || '',
            country || ''
        ]);

        // Respuesta exitosa (sin generar token automáticamente en registro)
        const response = {
            success: true,
            message: 'Usuario registrado exitosamente. Ahora puedes iniciar sesión.',
            data: {
                user: {
                    id: result.id.toString(),
                    name: fullName,
                    email: email.toLowerCase(),
                    phone: phone || '',
                    country: country || ''
                }
            }
        };

        console.log('✅ [Auth] Registro exitoso:', email);
        res.status(201).json(response);

    } catch (error) {
        console.error('❌ [Auth] Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Error del servidor'
        });
    }
};

// Recuperación de contraseña
export const resetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        console.log('🔑 [Auth] Solicitud de recuperación de contraseña:', email);
        
        // Validar email
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email es requerido'
            });
        }

        // Verificar si el usuario existe
        const user = await get(
            'SELECT * FROM users WHERE email = ? OR correo_cliente = ?',
            [email, email]
        );

        // Por seguridad, siempre responder exitosamente aunque el usuario no exista
        // No revelar si el email existe o no
        if (!user) {
            console.log('⚠️ [Auth] Intento de recuperación para email inexistente:', email);
        } else {
            console.log('✅ [Auth] Usuario encontrado para recuperación:', email);
            // Aquí podrías implementar el envío de email real
            // Por ahora solo logueamos
        }

        // Simular envío de email
        // En producción aquí irían servicios como SendGrid, Nodemailer, etc.
        
        res.json({
            success: true,
            message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación en unos minutos.'
        });

    } catch (error) {
        console.error('❌ [Auth] Error en recuperación de contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// Verificar token
export const verifyToken = async (req, res) => {
    try {
        // Si llegamos aquí, el token ya fue verificado por el middleware
        const user = req.user;
        
        res.json({
            success: true,
            message: 'Token válido',
            data: {
                user: {
                    id: user.id,
                    name: user.nombre_cliente || user.username,
                    email: user.correo_cliente || user.email,
                    phone: user.telefono_cliente,
                    country: user.pais_cliente
                }
            }
        });

    } catch (error) {
        console.error('❌ [Auth] Error verificando token:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// Obtener perfil de usuario
export const profile = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const user = await get('SELECT * FROM users WHERE id = ?', [userId]);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.nombre_cliente || user.username,
                    email: user.correo_cliente || user.email,
                    phone: user.telefono_cliente,
                    country: user.pais_cliente
                }
            }
        });

    } catch (error) {
        console.error('❌ [Auth] Error obteniendo perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};
