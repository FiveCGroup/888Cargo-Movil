import express from 'express';
import { login, register, profile, resetPassword, verifyToken } from '../controllers/auth.controller.js';
import { authenticateToken } from '../utils/auth.middleware.js';

const router = express.Router();

// Rutas públicas
router.post('/login', login);
router.post('/register', register);
router.post('/reset-password', resetPassword);

// Rutas protegidas
router.get('/profile', authenticateToken, profile);
router.post('/verify-token', authenticateToken, verifyToken);

export default router;
