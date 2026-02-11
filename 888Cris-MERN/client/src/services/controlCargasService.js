import API from './api';

class ControlCargasService {
  /**
   * Obtener todas las cargas del cliente autenticado con filtros opcionales
   * @param {Object} filtros - { estado, ubicacion, contenedor }
   * @returns {Promise<Object>}
   */
  async obtenerCargas(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.ubicacion) params.append('ubicacion', filtros.ubicacion);
      if (filtros.contenedor) params.append('contenedor', filtros.contenedor);

      const queryString = params.toString();
      const url = `/control-cargas/cargas${queryString ? `?${queryString}` : ''}`;
      
      const response = await API.get(url);
      // El backend retorna { success: true, data: [...], total: ... }
      // Retornamos directamente response.data que ya tiene la estructura correcta
      return response.data;
    } catch (error) {
      console.error('Error al obtener cargas:', error);
      throw error;
    }
  }

  /**
   * Obtener información de una carga específica
   * @param {number} cargaId - ID de la carga
   * @returns {Promise<Object>}
   */
  async obtenerCargaPorId(cargaId) {
    try {
      const response = await API.get(`/control-cargas/carga/${cargaId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener carga:', error);
      throw error;
    }
  }

  /**
   * Obtener estados detallados de una carga
   * @param {number} cargaId - ID de la carga
   * @returns {Promise<Object>}
   */
  async obtenerEstadosCarga(cargaId) {
    try {
      const response = await API.get(`/control-cargas/carga/${cargaId}/estados`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estados de carga:', error);
      throw error;
    }
  }

  /**
   * Obtener opciones disponibles para los filtros
   * @returns {Promise<Object>}
   */
  async obtenerOpcionesFiltros() {
    try {
      const response = await API.get('/control-cargas/filtros/opciones');
      return response.data;
    } catch (error) {
      console.error('Error al obtener opciones de filtros:', error);
      throw error;
    }
  }
}

export default new ControlCargasService();
