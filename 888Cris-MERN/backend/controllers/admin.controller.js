// controllers/admin.controller.js
import { crearUsuario, listarUsuarios, crearRol } from '../services/admin.service.js';

export const crearUsuarioAdmin = async (req, res) => {
  try {
    const result = await crearUsuario(req.body, req.user.id);
    res.status(201).json(result);
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

export const getUsuarios = async (req, res) => {
  try {
    const usuarios = await listarUsuarios();
    res.json({ success: true, data: usuarios });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const crearRolAdmin = async (req, res) => {
  try {
    const { nombre, permisos } = req.body;
    const result = await crearRol(nombre, permisos, req.user.id);
    res.status(201).json(result);
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};