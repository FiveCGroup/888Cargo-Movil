import { Router } from 'express';
import { cotizarMaritimo, cotizarAereo } from '../controllers/cotizacion.controller.js';

const router = Router();

// Rutas públicas (no requieren autenticación)
router.post('/maritimo', cotizarMaritimo);
router.post('/aereo', cotizarAereo);

export default router;