import { Router } from 'express';
import { 
  cotizarMaritimo, 
  cotizarAereo,
  obtenerHistorial,
  eliminarCotizacion,
  obtenerPdfCotizacion,
  enviarCotizacionWhatsapp
} from '../controllers/cotizacion.controller.js';
import { authRequired } from '../middlewares/validateToken.js';

const router = Router();

// Rutas públicas (no requieren autenticación)
router.post('/maritimo', cotizarMaritimo);
router.post('/aereo', cotizarAereo);

// Rutas protegidas (requieren autenticación)
router.get('/historial', authRequired, obtenerHistorial);
router.delete('/:id', authRequired, eliminarCotizacion);
router.get('/:id/pdf', authRequired, obtenerPdfCotizacion);
router.post('/:id/send-whatsapp', authRequired, enviarCotizacionWhatsapp);

export default router;