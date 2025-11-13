// routes/debug.routes.js
// Rutas para debugging y logs del frontend
import { Router } from "express";

const router = Router();

/**
 * Recibir logs del frontend para debugging
 */
router.post('/frontend-log', (req, res) => {
    const { message, timestamp } = req.body;
    console.log(`${timestamp} ${message}`);
    res.status(200).json({ received: true });
});

export default router;
