import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import controlCargasService from '../services/controlCargasService';
import API from '../services/api';
import '../styles/pages/ControlCargas.css';

const ControlCargas = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cargas, setCargas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    estado: '',
    ubicacion: '',
    contenedor: ''
  });
  const [opcionesFiltros, setOpcionesFiltros] = useState({
    estados: [],
    ubicaciones: [],
    contenedores: []
  });
  const [modalTipo, setModalTipo] = useState(null); // 'estados' | 'detalles'
  const [cargaSeleccionada, setCargaSeleccionada] = useState(null);
  const [datosModal, setDatosModal] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);

  // Obtener perfil del usuario
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await API.get('/profile');
        setUser(response.data?.user || response.data);
      } catch (error) {
        console.error('Error al obtener perfil:', error);
      }
    };
    fetchUser();
  }, []);

  // Función para cargar cargas
  const cargarCargas = React.useCallback(async () => {
    setLoading(true);
    const filtrosAplicar = {};
    if (filtros.estado) filtrosAplicar.estado = filtros.estado;
    if (filtros.ubicacion) filtrosAplicar.ubicacion = filtros.ubicacion;
    if (filtros.contenedor) filtrosAplicar.contenedor = filtros.contenedor;

    try {
      const result = await controlCargasService.obtenerCargas(filtrosAplicar);
      // El backend retorna { success: true, data: [...], total: ... }
      if (result && result.success && Array.isArray(result.data)) {
        setCargas(result.data);
      } else {
        console.error('Error al cargar cargas: respuesta inválida', result);
        setCargas([]);
      }
    } catch (error) {
      console.error('Error al cargar cargas:', error);
      setCargas([]);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  // Cargar opciones de filtros
  useEffect(() => {
    const cargarOpcionesFiltros = async () => {
      try {
        const result = await controlCargasService.obtenerOpcionesFiltros();
        // El backend retorna { success: true, data: { estados: [], ubicaciones: [], contenedores: [] } }
        if (result && result.success && result.data) {
          setOpcionesFiltros({
            estados: result.data.estados || [],
            ubicaciones: result.data.ubicaciones || [],
            contenedores: result.data.contenedores || []
          });
        } else {
          setOpcionesFiltros({
            estados: [],
            ubicaciones: [],
            contenedores: []
          });
        }
      } catch (error) {
        console.error('Error al cargar opciones de filtros:', error);
        setOpcionesFiltros({
          estados: [],
          ubicaciones: [],
          contenedores: []
        });
      }
    };
    cargarOpcionesFiltros();
  }, []);

  // Cargar cargas cuando cambian los filtros
  useEffect(() => {
    cargarCargas();
  }, [cargarCargas]);

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      estado: '',
      ubicacion: '',
      contenedor: ''
    });
  };

  // Abrir modal de Estados de cargas (solo timeline de estados)
  const verEstadosCarga = async (carga) => {
    setCargaSeleccionada(carga);
    setModalTipo('estados');
    setLoadingModal(true);
    setDatosModal(null);
    try {
      const result = await controlCargasService.obtenerEstadosCarga(carga.id_carga);
      if (result && result.success && result.data) {
        setDatosModal(result.data);
      } else {
        alert('Error al obtener los estados de la carga');
        setModalTipo(null);
      }
    } catch (error) {
      console.error('Error al obtener estados:', error);
      alert(error.response?.data?.message || 'Error al obtener los estados de la carga');
      setModalTipo(null);
    } finally {
      setLoadingModal(false);
    }
  };

  // Abrir modal de Ver detalles (información completa de la carga)
  const verDetallesCarga = async (carga) => {
    setCargaSeleccionada(carga);
    setModalTipo('detalles');
    setLoadingModal(true);
    setDatosModal(null);
    try {
      const result = await controlCargasService.obtenerEstadosCarga(carga.id_carga);
      if (result && result.success && result.data) {
        setDatosModal(result.data);
      } else {
        alert('Error al obtener los detalles de la carga');
        setModalTipo(null);
      }
    } catch (error) {
      console.error('Error al obtener detalles:', error);
      alert(error.response?.data?.message || 'Error al obtener los detalles de la carga');
      setModalTipo(null);
    } finally {
      setLoadingModal(false);
    }
  };

  const cerrarModal = () => {
    setModalTipo(null);
    setCargaSeleccionada(null);
    setDatosModal(null);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    try {
      const d = new Date(fecha);
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return String(fecha);
    }
  };

  return (
    <div className="control-cargas-layout">
      <Navbar user={user} />
      
      <div className="control-cargas-container">
        <h1 className="control-cargas-title">Control de Cargas</h1>

        {/* Botones de acción */}
        <div className="control-cargas-actions">
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/crear-carga')}
          >
            → Cargar Packing List
          </button>
        </div>

        {/* Filtros */}
        <div className="control-cargas-filtros">
          <div className="filtro-group">
            <label>Estado</label>
            <select
              value={filtros.estado}
              onChange={(e) => handleFiltroChange('estado', e.target.value)}
            >
              <option value="">Todos</option>
              {opcionesFiltros.estados.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
          </div>

          <div className="filtro-group">
            <label>Ubicación</label>
            <select
              value={filtros.ubicacion}
              onChange={(e) => handleFiltroChange('ubicacion', e.target.value)}
            >
              <option value="">Todas</option>
              {opcionesFiltros.ubicaciones.map(ubicacion => (
                <option key={ubicacion} value={ubicacion}>{ubicacion}</option>
              ))}
            </select>
          </div>

          <div className="filtro-group">
            <label>Contenedor</label>
            <select
              value={filtros.contenedor}
              onChange={(e) => handleFiltroChange('contenedor', e.target.value)}
            >
              <option value="">Todos</option>
              {opcionesFiltros.contenedores.map(contenedor => (
                <option key={contenedor} value={contenedor}>{contenedor}</option>
              ))}
            </select>
          </div>

          {(filtros.estado || filtros.ubicacion || filtros.contenedor) && (
            <button className="btn btn-link" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Tabla de cargas */}
        <div className="control-cargas-tabla-container">
          {loading ? (
            <div className="loading-message">Cargando cargas...</div>
          ) : cargas.length === 0 ? (
            <div className="empty-message">
              No se encontraron cargas {Object.values(filtros).some(f => f) ? 'con los filtros aplicados' : ''}
            </div>
          ) : (
            <table className="control-cargas-tabla">
              <thead>
                <tr>
                  <th>Id Carga</th>
                  <th>Shipping Mark</th>
                  <th>Estado</th>
                  <th>Ubicación</th>
                  <th>Destino</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargas.map(carga => (
                  <React.Fragment key={carga.id_carga}>
                    <tr>
                      <td>{carga.codigo_carga || carga.id_carga}</td>
                      <td>{carga.shipping_mark || '-'}</td>
                      <td>
                        <span className={`estado-badge estado-${carga.estado?.toLowerCase().replace(/\s+/g, '-')}`}>
                          {carga.estado || 'En bodega China'}
                        </span>
                      </td>
                      <td>{carga.ubicacion || 'China'}</td>
                      <td>{carga.destino || '-'}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-info"
                          type="button"
                          onClick={() => verDetallesCarga(carga)}
                          aria-label="Ver detalles de la carga"
                        >
                          Ver detalles
                        </button>
                      </td>
                    </tr>
                    <tr className="estados-row">
                      <td colSpan="6">
                        <button
                          className="btn btn-link btn-estados"
                          type="button"
                          onClick={() => verEstadosCarga(carga)}
                          aria-label="Ver estados de la carga"
                        >
                          → Estados de cargas
                        </button>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Estados de cargas: solo timeline de estados (como imagen de referencia) */}
      {modalTipo === 'estados' && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content modal-estados" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Estado de cargas</h2>
              <button className="btn-close" onClick={cerrarModal} aria-label="Cerrar">×</button>
            </div>
            <div className="modal-body">
              {loadingModal ? (
                <div className="loading-message">Cargando estados...</div>
              ) : datosModal ? (
                <>
                  <div className="estados-etiqueta">
                    Etiqueta #{cargaSeleccionada?.codigo_carga || cargaSeleccionada?.shipping_mark || cargaSeleccionada?.id_carga}
                  </div>
                  <div className="estados-badge-actual">
                    <span className={`estado-badge estado-${datosModal.carga?.estado_actual?.toLowerCase().replace(/\s+/g, '-')}`}>
                      {datosModal.carga?.estado_actual || 'En bodega China'}
                    </span>
                    <span className="estado-check">✓</span>
                  </div>
                  <div className="estados-timeline">
                    {datosModal.historial_estados && datosModal.historial_estados.length > 0 ? (
                      datosModal.historial_estados.map((item, idx) => (
                        <div key={idx} className="estados-timeline-item">
                          <div className="estados-timeline-node" />
                          <div className="estados-timeline-contenido">
                            <div className="estados-timeline-estado">{item.estado}</div>
                            <div className="estados-timeline-fecha">{formatearFecha(item.fecha)}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="estados-sin-historial">No hay historial de estados disponible</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="error-message">No se pudieron cargar los estados</div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={cerrarModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver detalles: información completa de la carga */}
      {modalTipo === 'detalles' && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalles de la Carga: {cargaSeleccionada?.codigo_carga}</h2>
              <button className="btn-close" onClick={cerrarModal} aria-label="Cerrar">×</button>
            </div>
            <div className="modal-body">
              {loadingModal ? (
                <div className="loading-message">Cargando detalles...</div>
              ) : datosModal?.carga ? (
                <>
                  <div className="estados-info-carga">
                    <h3>Información de la Carga</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <strong>Código:</strong> {datosModal.carga.codigo_carga}
                      </div>
                      <div className="info-item">
                        <strong>Shipping Mark:</strong> {datosModal.carga.shipping_mark || '-'}
                      </div>
                      <div className="info-item">
                        <strong>Estado:</strong>{' '}
                        <span className={`estado-badge estado-${datosModal.carga.estado_actual?.toLowerCase().replace(/\s+/g, '-')}`}>
                          {datosModal.carga.estado_actual}
                        </span>
                      </div>
                      <div className="info-item">
                        <strong>Ubicación:</strong> {datosModal.carga.ubicacion_actual}
                      </div>
                      <div className="info-item">
                        <strong>Destino:</strong> {datosModal.carga.destino}
                      </div>
                      {datosModal.carga.numero_contenedor && (
                        <div className="info-item">
                          <strong>Contenedor:</strong> {datosModal.carga.numero_contenedor}
                        </div>
                      )}
                    </div>
                  </div>
                  {datosModal.carga.estadisticas && (
                    <div className="estados-estadisticas">
                      <h3>Estadísticas</h3>
                      <div className="stats-grid">
                        <div className="stat-item">
                          <strong>Artículos:</strong> {datosModal.carga.estadisticas.total_articulos}
                        </div>
                        <div className="stat-item">
                          <strong>Cajas:</strong> {datosModal.carga.estadisticas.total_cajas}
                        </div>
                        <div className="stat-item">
                          <strong>Peso Total:</strong> {datosModal.carga.estadisticas.peso_total} kg
                        </div>
                      </div>
                    </div>
                  )}
                  {datosModal.packing_list && datosModal.packing_list.length > 0 && (
                    <div className="estados-packing-list">
                      <h3>Packing List</h3>
                      <div className="packing-list-scroll">
                        <table className="packing-list-tabla">
                          <thead>
                            <tr>
                              <th>CN</th>
                              <th>Ref Art</th>
                              <th>Descripción (ES)</th>
                              <th>Descripción (CN)</th>
                              <th>Unidad</th>
                              <th>Cantidad</th>
                              <th>Cant/Caja</th>
                              <th>Precio/U</th>
                              <th>Precio Total</th>
                              <th>Material</th>
                              <th>Marca</th>
                              <th>CBM</th>
                              <th>GW</th>
                            </tr>
                          </thead>
                          <tbody>
                            {datosModal.packing_list.map((art, idx) => (
                              <React.Fragment key={art.id_articulo || idx}>
                                <tr>
                                  <td>{art.cn || '-'}</td>
                                  <td>{art.ref_art || '-'}</td>
                                  <td>{art.descripcion_espanol || '-'}</td>
                                  <td>{art.descripcion_chino || '-'}</td>
                                  <td>{art.unidad || '-'}</td>
                                  <td>{art.cantidad ?? '-'}</td>
                                  <td>{art.cant_por_caja ?? '-'}</td>
                                  <td>{art.precio_unidad ?? '-'}</td>
                                  <td>{art.precio_total ?? '-'}</td>
                                  <td>{art.material || '-'}</td>
                                  <td>{art.marca_producto || '-'}</td>
                                  <td>{art.cbm ?? '-'}</td>
                                  <td>{art.gw ?? '-'}</td>
                                </tr>
                                {art.cajas && art.cajas.length > 0 && (
                                  <tr className="packing-cajas-row">
                                    <td colSpan="13">
                                      <div className="packing-cajas-detalle">
                                        <strong>Cajas:</strong>
                                        {art.cajas
                                          .sort((a, b) => (a.numero_caja ?? 0) - (b.numero_caja ?? 0))
                                          .map((c, i) => {
                                            const totalCajas = art.cajas.length;
                                            const numCaja = c.numero_caja ?? (i + 1);
                                            return (
                                              <span key={c.id_caja || i} className="caja-badge">
                                                Caja {numCaja}/{totalCajas}
                                              </span>
                                            );
                                          })}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="error-message">No se pudieron cargar los detalles</div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={cerrarModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlCargas;
