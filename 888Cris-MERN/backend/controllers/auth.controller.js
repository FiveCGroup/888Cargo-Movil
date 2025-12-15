// controllers/auth.controller.js
import { register, login, requestPasswordReset, resetPassword } from '../services/auth.service.js';

export const registerUser = async (req, res) => {
  try {
    const result = await register(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const result = await login(req.body.email, req.body.password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

export const requestReset = async (req, res) => {
  try {
    await requestPasswordReset(req.body.email);
    res.json({ success: true, message: 'Enlace enviado' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resetPass = async (req, res) => {
  try {
    await resetPassword(req.body.token, req.body.newPassword);
    res.json({ success: true, message: 'Contraseña actualizada' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};