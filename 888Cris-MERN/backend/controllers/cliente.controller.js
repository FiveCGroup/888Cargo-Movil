// controllers/cliente.controller.js
import { getMisCargas, getDetalleCargaCliente, getDashboardCliente } from '../services/cliente.service.js';

export const misCargas = async (req, res) => {
  try {
    const result = await getMisCargas(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const detalleCarga = async (req, res) => {
  try {
    const { codigo } = req.params;
    const result = await getDetalleCargaCliente(codigo, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const dashboard = async (req, res) => {
  try {
    const result = await getDashboardCliente(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};