// controllers/controlCargas.controller.js
// Controlador para el módulo "Control de Cargas"
import {
  obtenerClientePorEmail,
  obtenerCargasCliente,
  obtenerEstadosCarga,
  obtenerOpcionesFiltros
} from '../services/controlCargas.service.js';

/**
 * Obtener todas las cargas del cliente autenticado con filtros opcionales
 * GET /control-cargas/cargas
 * Query params opcionales: estado, ubicacion, contenedor
 */
export const listarCargasCliente = async (req, res) => {
  try {
    const userEmail = req.user?.email;
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Obtener el cliente asociado al usuario
    const cliente = await obtenerClientePorEmail(userEmail);
    
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado. Por favor, verifica tu información de cuenta. Si acabas de registrarte, intenta cerrar sesión y volver a iniciar sesión.'
      });
    }

    // Obtener el ID del cliente (compatibilidad con diferentes formatos de retorno)
    const clienteId = cliente.id_cliente || cliente.id;
    
    if (!clienteId) {
      return res.status(500).json({
        success: false,
        message: 'Error: No se pudo determinar el ID del cliente'
      });
    }

    // Obtener filtros de query params
    const filtros = {
      estado: req.query.estado || null,
      ubicacion: req.query.ubicacion || null,
      contenedor: req.query.contenedor || null
    };

    // Remover filtros nulos
    Object.keys(filtros).forEach(key => {
      if (filtros[key] === null || filtros[key] === '') {
        delete filtros[key];
      }
    });

    // Obtener las cargas del cliente
    const cargas = await obtenerCargasCliente(clienteId, filtros);

    res.json({
      success: true,
      data: cargas,
      total: cargas.length,
      filtros_aplicados: Object.keys(filtros).length > 0 ? filtros : null,
      cliente: {
        id_cliente: clienteId,
        nombre_cliente: cliente.nombre_cliente
      }
    });
  } catch (error) {
    console.error('Error en listarCargasCliente:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener las cargas del cliente'
    });
  }
};

/**
 * Obtener estados detallados de una carga específica
 * GET /control-cargas/carga/:id/estados
 */
export const obtenerEstadosCargaDetallados = async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const cargaId = parseInt(req.params.id);

    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    if (!cargaId || isNaN(cargaId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de carga inválido'
      });
    }

    // Obtener el cliente asociado al usuario
    const cliente = await obtenerClientePorEmail(userEmail);
    
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Obtener el ID del cliente (compatibilidad con diferentes formatos de retorno)
    const clienteId = cliente.id_cliente || cliente.id;
    
    if (!clienteId) {
      return res.status(500).json({
        success: false,
        message: 'Error: No se pudo determinar el ID del cliente'
      });
    }

    // Obtener estados detallados de la carga
    const estadosDetallados = await obtenerEstadosCarga(cargaId, clienteId);

    res.json({
      success: true,
      data: estadosDetallados
    });
  } catch (error) {
    console.error('Error en obtenerEstadosCargaDetallados:', error);
    
    if (error.message === 'Carga no encontrada' || error.message.includes('Acceso denegado')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener los estados de la carga'
    });
  }
};

/**
 * Obtener opciones disponibles para los filtros
 * GET /control-cargas/filtros/opciones
 */
export const obtenerOpcionesFiltrosDisponibles = async (req, res) => {
  try {
    const userEmail = req.user?.email;
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Obtener el cliente asociado al usuario
    const cliente = await obtenerClientePorEmail(userEmail);
    
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Obtener el ID del cliente (compatibilidad con diferentes formatos de retorno)
    const clienteId = cliente.id_cliente || cliente.id;
    
    if (!clienteId) {
      return res.status(500).json({
        success: false,
        message: 'Error: No se pudo determinar el ID del cliente'
      });
    }

    // Obtener opciones de filtros
    const opciones = await obtenerOpcionesFiltros(clienteId);

    res.json({
      success: true,
      data: opciones
    });
  } catch (error) {
    console.error('Error en obtenerOpcionesFiltrosDisponibles:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener las opciones de filtros'
    });
  }
};

/**
 * Obtener información resumida de una carga específica
 * GET /control-cargas/carga/:id
 */
export const obtenerCargaPorId = async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const cargaId = parseInt(req.params.id);

    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    if (!cargaId || isNaN(cargaId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de carga inválido'
      });
    }

    // Obtener el cliente asociado al usuario
    const cliente = await obtenerClientePorEmail(userEmail);
    
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Obtener el ID del cliente (compatibilidad con diferentes formatos de retorno)
    const clienteId = cliente.id_cliente || cliente.id;
    
    if (!clienteId) {
      return res.status(500).json({
        success: false,
        message: 'Error: No se pudo determinar el ID del cliente'
      });
    }

    // Obtener las cargas del cliente (para validar acceso)
    const cargas = await obtenerCargasCliente(clienteId);
    const carga = cargas.find(c => c.id_carga === cargaId);

    if (!carga) {
      return res.status(404).json({
        success: false,
        message: 'Carga no encontrada o no tienes acceso a esta carga'
      });
    }

    res.json({
      success: true,
      data: carga
    });
  } catch (error) {
    console.error('Error en obtenerCargaPorId:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener la carga'
    });
  }
};
