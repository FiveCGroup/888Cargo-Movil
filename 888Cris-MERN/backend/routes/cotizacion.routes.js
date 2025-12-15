import { Router } from 'express';
import { 
  cotizarMaritimo, 
  cotizarAereo,
  obtenerHistorial,
  eliminarCotizacion
} from '../controllers/cotizacion.controller.js';
import { authRequired } from '../middlewares/validateToken.js';

const router = Router();

// Rutas públicas (no requieren autenticación)
router.post('/maritimo', cotizarMaritimo);
router.post('/aereo', cotizarAereo);

// Rutas protegidas (requieren autenticación)
router.get('/historial', authRequired, obtenerHistorial);
router.delete('/:id', authRequired, eliminarCotizacion);

export default router;