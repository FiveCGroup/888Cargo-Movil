// routes/recuperacion.routes.js
// Rutas para recuperación de contraseñas - Solo definición y delegación
import { Router } from 'express';
import { enviarEnlace, verificarToken, cambiarPassword } from '../controllers/recuperacion.controller.js';

const router = Router();

// Rutas de recuperación de contraseñas
router.post('/enviar-enlace', enviarEnlace);
router.get('/verificar-token/:token', verificarToken);
router.post('/cambiar-password', cambiarPassword);

export default router;
