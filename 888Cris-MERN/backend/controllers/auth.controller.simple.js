// controllers/auth.controller.simple.js
// Versión simplificada para diagnóstico
import { createAccessToken } from "../libs/jwt.js";
import bcrypt from "bcrypt";
import { userRepository, clienteRepository } from "../repositories/index.js";
import { generateUniqueShippingMark } from "../models/user.model.js";

// Importar servicios de notificación - opcionales
let emailService, whatsappService;
try {
  emailService = (await import("../services/emailService.js")).default;
} catch (e) {
  console.warn('⚠️ Email service no disponible');
  emailService = null;
}

try {
  whatsappService = (await import("../services/whatsappService.js")).default;
} catch (e) {
  console.warn('⚠️ WhatsApp service no disponible');
  whatsappService = null;
}

/**
 * Registrar un nuevo usuario - versión simplificada
 */
export const register = async (req, res) => {
    try {
        console.log("Request data:", req.body);
        
        const { name, lastname, email, phone, country, city, shippingMark, password } = req.body;

        // Validación básica
        if (!name || !lastname || !email || !password) {
            return res.status(400).json({ 
                message: 'Faltan campos requeridos: name, lastname, email, password' 
            });
        }

        // Normalizar email
        const normalizedEmail = email.toLowerCase().trim();

        // Verificar si ya existe un usuario con el mismo correo
        const existingUser = await userRepository.findByEmail(normalizedEmail);
        if (existingUser) {
            return res.status(400).json({ message: 'Ya existe un usuario con ese correo' });
        }

        // Hashear la contraseña antes de guardar
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Mapear los campos al esquema de la tabla `users`
        // Usar el nombre completo del cliente para username en lugar del formato name_lastname
        const fullName = `${name} ${lastname}`;
        const username = fullName; // Usar nombre completo en lugar de formato name_lastname
        const userData = {
            username,
            email: normalizedEmail,
            password: hashedPassword,
            full_name: fullName,
            phone: phone || '',
            country: country || '',
            status: 'active'
        };

        // Crear el nuevo usuario usando el repository genérico
        const result = await userRepository.create(userData);
        const newUser = { id: result.id, ...userData };

        // Crear registro en la tabla clientes
        try {
            // Generar shippingMark si no se proporcionó
            let finalShippingMark = shippingMark;
            if (!finalShippingMark || finalShippingMark.trim() === '') {
                finalShippingMark = await generateUniqueShippingMark(fullName);
                console.log("ShippingMark generado automáticamente:", finalShippingMark);
            } else {
                // Validar que el shippingMark proporcionado no exista
                const existingShippingMark = await clienteRepository.findByShippingMark(finalShippingMark);
                if (existingShippingMark) {
                    // Si existe, generar uno nuevo
                    finalShippingMark = await generateUniqueShippingMark(fullName);
                    console.log("ShippingMark ya existe, generado uno nuevo:", finalShippingMark);
                }
            }

            const clienteData = {
                nombre_cliente: fullName,
                correo_cliente: normalizedEmail,
                telefono_cliente: phone || '',
                pais_cliente: country || '',
                ciudad_cliente: city || '',
                cliente_shippingMark: finalShippingMark
            };

            const createdCliente = await clienteRepository.create(clienteData);
            console.log("Cliente creado exitosamente en tabla clientes:", createdCliente);
        } catch (clienteError) {
            console.error("Error al crear cliente en tabla clientes (no crítico):", clienteError.message);
            // No lanzamos el error para no interrumpir el registro del usuario
        }

        // Generar token
        const token = await createAccessToken({ id: newUser.id });
        
        // Configurar cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 horas
        });
        
        console.log("Usuario registrado exitosamente:", newUser);
        
        // Enviar notificaciones por email y WhatsApp (sin esperar, sin bloquear)
        // Reutilizamos `username` y `newUser` mapeados al esquema `users`
        const notifUsername = username;

        // Email de bienvenida (async, no bloquea)
        if (emailService) {
            emailService.sendWelcomeEmail(newUser.email, name)
                .catch(err => console.error('⚠️ Email bienvenida error:', err.message));
        }

        // Email de confirmación (async, no bloquea)
        if (emailService) {
            emailService.sendRegistrationConfirmation(newUser.email, name, notifUsername)
                .catch(err => console.error('⚠️ Email confirmación error:', err.message));
        }
        
        // WhatsApp de bienvenida (async, no bloquea)
        if (whatsappService && phone) {
            whatsappService.sendWelcomeWhatsApp(phone, name)
                .catch(err => console.error('⚠️ WhatsApp bienvenida error:', err.message));
        }
        
        // WhatsApp de confirmación (async, no bloquea)
        if (whatsappService && phone) {
            whatsappService.sendRegistrationConfirmationWhatsApp(phone, name, username)
                .catch(err => console.error('⚠️ WhatsApp confirmación error:', err.message));
        }
        
        res.status(201).json({
            id: newUser.id,
            name: newUser.full_name,
            email: newUser.email,
            message: 'Usuario registrado exitosamente. Revisa tu email y WhatsApp para confirmar.'
        });
        
    } catch (error) {
        console.error("Error al registrar el usuario:", error);
        res.status(500).json({ 
            message: error.message || 'Error al registrar el usuario' 
        });
    }
};

/**
 * Iniciar sesión de usuario - versión simplificada
 */
export const login = async (req, res) => {
    console.log("[AUTH] Processing login request");
    if (process.env.NODE_ENV === 'development') {
        console.log("[AUTH] Request details:", {
            hasBody: !!req.body,
            userAgent: req.headers['user-agent']?.substring(0, 50),
            origin: req.headers.origin
        });
    }
    
    // Identificar tipo de cliente
    const isMobileClient = req.headers['user-agent']?.includes('Expo-Mobile-App') || 
                          req.headers['x-requested-with'] === 'XMLHttpRequest';
    const clientType = isMobileClient ? 'MÓVIL' : 'WEB';
    
    console.log("📱 [AUTH] Tipo de cliente:", clientType);
    
    try {
        const { email, password } = req.body;
        console.log("[AUTH] Credentials extracted - Email:", email, "Password:", password ? "***" : "MISSING");
        
        // Validación básica
        if (!email || !password) {
            console.log("❌ [AUTH] Faltan datos - retornando 400");
            return res.status(400).json({ 
                message: 'Email y contraseña son requeridos' 
            });
        }

        // Normalizar email
        const normalizedEmail = email.toLowerCase().trim();
        console.log("[AUTH] Email normalized:", normalizedEmail);
        
        // Verificar credenciales usando el repository
        console.log("🚀 [AUTH] Verificando credenciales...");
        const userFound = await userRepository.verifyCredentials(normalizedEmail, password);
        console.log("🚀 [AUTH] Resultado verificación:", userFound ? "Usuario encontrado" : "Usuario NO encontrado");
        
        if (!userFound) {
            console.log("❌ [AUTH] Credenciales incorrectas - retornando 401");
            const errorResponse = { 
                message: 'El correo electrónico o la contraseña son incorrectos' 
            };
            console.log("❌ [AUTH] Enviando respuesta 401:", errorResponse);
            return res.status(401).json(errorResponse);
        }

        // Verificar que el usuario esté activo
        console.log("🚀 [AUTH] Verificando si usuario está activo:", userFound.is_active);
        if (!userFound.is_active) {
            console.log("❌ [AUTH] Usuario inactivo - retornando 403");
            return res.status(403).json({ 
                message: 'Tu cuenta está inactiva. Contacta al administrador para reactivarla.' 
            });
        }
        
        // Generar token
        console.log("🚀 [AUTH] Generando token...");
        const token = await createAccessToken({ id: userFound.id });
        console.log("🚀 [AUTH] Token generado correctamente");
        
        // Configurar cookie con configuración específica para el tipo de cliente
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: isMobileClient ? 'none' : 'strict', // Permitir cookies cross-origin para móvil
            maxAge: 24 * 60 * 60 * 1000 // 24 horas
        };
        
        console.log(`🚀 [AUTH] Configurando cookie para ${clientType}:`, cookieOptions);
        res.cookie('token', token, cookieOptions);
        
        const responseData = {
            id: userFound.id,
            name: userFound.nombre_cliente || userFound.username,
            email: userFound.correo_cliente || userFound.email
        };
        
        console.log(`✅ [AUTH] Login exitoso para ${clientType} - retornando datos:`, responseData);
        res.json(responseData);
        
    } catch (error) {
        console.error("💥 [AUTH] Error al iniciar sesión:", error);
        console.error("💥 [AUTH] Stack trace:", error.stack);
        res.status(500).json({ 
            message: error.message || 'Error al iniciar sesión' 
        });
    }
};

/**
 * Cerrar sesión de usuario
 */
export const logout = async (req, res) => {
    try {
        res.clearCookie('token', { 
            expires: new Date(0),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        res.json({ message: 'Sesión cerrada correctamente' });
        
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        res.status(500).json({ 
            message: 'Error al cerrar sesión' 
        });
    }
};

/**
 * Obtener perfil de usuario
 */
export const profile = async (req, res) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ 
                message: 'No hay usuario autenticado' 
            });
        }
        
        // Obtener perfil del usuario usando el repository
        const result = await userRepository.findByIdSafe(userId);
        
        if (!result) {
            return res.status(404).json({ 
                message: 'Usuario no encontrado' 
            });
        }

        const userProfile = {
            id: result.id,
            name: result.nombre_cliente || result.username,
            email: result.correo_cliente || result.email,
            phone: result.telefono_cliente,
            country: result.pais_cliente,
            isActive: result.is_active,
            createdAt: result.created_at
        };
        
        res.json(userProfile);
        
    } catch (error) {
        console.error("Error al obtener perfil:", error);
        res.status(500).json({ 
            message: error.message || 'Error al obtener perfil de usuario' 
        });
    }
};
