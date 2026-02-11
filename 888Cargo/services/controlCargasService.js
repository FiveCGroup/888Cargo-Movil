// 888CARGO MOBILE - Servicio Control de Cargas (mismo backend que la web)
import { API_CONFIG } from '../constants/API';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = API_CONFIG.BASE_URL;

const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('@auth:token');
  } catch (e) {
    console.error('[controlCargasService] Error obteniendo token:', e);
    return null;
  }
};

const controlCargasService = {
  async obtenerCargas(filtros = {}) {
    const token = await getAuthToken();
    if (!token) throw new Error('No hay sesión. Inicia sesión.');
    const params = new URLSearchParams();
    if (filtros.estado) params.append('estado', filtros.estado);
    if (filtros.ubicacion) params.append('ubicacion', filtros.ubicacion);
    if (filtros.contenedor) params.append('contenedor', filtros.contenedor);
    const qs = params.toString();
    const url = `${API_BASE_URL}/control-cargas/cargas${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    return res.json();
  },

  async obtenerOpcionesFiltros() {
    const token = await getAuthToken();
    if (!token) throw new Error('No hay sesión. Inicia sesión.');
    const res = await fetch(`${API_BASE_URL}/control-cargas/filtros/opciones`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    return res.json();
  },

  async obtenerCargaPorId(cargaId) {
    const token = await getAuthToken();
    if (!token) throw new Error('No hay sesión. Inicia sesión.');
    const res = await fetch(`${API_BASE_URL}/control-cargas/carga/${cargaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    return res.json();
  },

  /**
   * Obtener estados detallados de una carga (historial + carga + packing list)
   * GET /control-cargas/carga/:id/estados
   */
  async obtenerEstadosCarga(cargaId) {
    const token = await getAuthToken();
    if (!token) throw new Error('No hay sesión. Inicia sesión.');
    const res = await fetch(`${API_BASE_URL}/control-cargas/carga/${cargaId}/estados`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(res.status === 404 ? 'Carga no encontrada' : `Error ${res.status}`);
    return res.json();
  },
};

export default controlCargasService;
