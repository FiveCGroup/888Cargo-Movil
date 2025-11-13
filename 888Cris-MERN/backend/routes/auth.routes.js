import { Router } from 'express';
import { register, login, logout, profile } from '../controllers/auth.controller.simple.js';
import { authRequired } from '../middlewares/validateToken.js';

const router = Router();

/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegistration'
 *           example:
 *             name: "Juan"
 *             lastname: "Pérez"
 *             email: "juan@ejemplo.com"
 *             phone: "+573001112233"
 *             country: "Colombia"
 *             password: "miContraseña123"
 *             acceptWhatsapp: true
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *             example:
 *               success: true
 *               message: "Usuario registrado exitosamente"
 *               data:
 *                 id: 1
 *                 name: "Juan Pérez"
 *                 email: "juan@ejemplo.com"
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: "token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
// Rutas de autenticación - Solo definición y delegación
router.post('/register', register);

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *           example:
 *             email: "juan@ejemplo.com"
 *             password: "miContraseña123"
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: "token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict"
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Credenciales inválidas"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/login', login);

/**
 * @swagger
 * /api/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Autenticación]
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: true
 *               message: "Sesión cerrada correctamente"
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict"
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/logout', logout);

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Autenticación]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *             example:
 *               id: 1
 *               name: "Juan Pérez"
 *               email: "juan@ejemplo.com"
 *               phone: "+573001112233"
 *               country: "Colombia"
 *               isActive: true
 *               createdAt: "2024-01-15T10:30:00Z"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/profile', authRequired, profile);

export default router;