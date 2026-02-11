import React from 'react';
import { formatearFecha, formatearMoneda } from '../utils/cargaUtils';
import '../styles/BusquedaPackingList.css';
import '../styles/global/buttons.css';

const BusquedaPackingList = ({ 
    codigoCarga, 
    setCodigoCarga, 
    onBuscar, 
    onLimpiar, 
    onVerDetalles,
    busquedaLoading, 
    mostrandoResultados, 
    resultadosBusqueda,
}) => {
    return (
        <div className="busqueda-container">
            <h3 className="busqueda-title">Buscar Packing Lists Existentes</h3>
            
            {/* Formulario de búsqueda */}
            <div className="busqueda-form">
                        <div className="busqueda-field">
                            <label className="busqueda-label">
                                Código de Carga:
                            </label>
                            <div className="busqueda-input-container">
                                <input
                                    type="text"
                                    className="busqueda-input"
                                    value={codigoCarga}
                                    onChange={e => setCodigoCarga(e.target.value)}
                                    placeholder="Ej: PL-20250820-696-3640"
                                    onKeyPress={(e) => e.key === 'Enter' && onBuscar()}
                                />
                                <button 
                                    className="btn btn-primary busqueda-btn" 
                                    onClick={onBuscar} 
                                    disabled={busquedaLoading || !codigoCarga.trim()}
                                >
                                    <i className="fas fa-search"></i>
                                    {busquedaLoading ? 'Buscando...' : 'Buscar'}
                                </button>
                                {mostrandoResultados && (
                                    <button 
                                        className="btn btn-secondary busqueda-btn-clear" 
                                        onClick={onLimpiar}
                                    >
                                        <i className="fas fa-times-circle"></i>Limpiar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
            
            {/* Resultados de búsqueda */}
            {mostrandoResultados && resultadosBusqueda.length > 0 && (
                <div>
                    <h4 className="resultados-title">
                        <i className="fas fa-check-circle"></i>
                        Packing Lists Encontrados ({resultadosBusqueda.length})
                    </h4>
                    
                    <div className="resultados-lista">
                        {resultadosBusqueda.map((packing) => (
                            <div 
                                key={packing.id_carga}
                                className="resultado-item"
                            >
                                {/* Header del resultado */}
                                <div className="resultado-header">
                                    <div className="resultado-info">
                                        <h5>
                                            {packing.codigo_carga}
                                        </h5>
                                        <p>
                                            Creado: {formatearFecha(packing.fecha_inicio || packing.fecha_creacion)}
                                        </p>
                                    </div>
                                    <button 
                                        className="btn btn-outline btn-sm resultado-btn" 
                                        onClick={() => onVerDetalles(packing.id_carga)}
                                    >
                                        <i className="fas fa-eye"></i>Ver Detalles
                                    </button>
                                </div>

                                {/* Información principal */}
                                <div className="resultado-detalles">
                                    
                                    {/* Información del Cliente */}
                                    <div className="detalle-seccion">
                                        <h6>
                                            <i className="fas fa-user detalle-icon detalle-cliente-icon"></i>
                                            Cliente
                                        </h6>
                                        <div className="detalle-content">
                                            <div><strong>Nombre:</strong> {packing.cliente?.nombre_cliente || 'N/A'}</div>
                                            <div><strong>Email:</strong> {packing.cliente?.correo_cliente || 'N/A'}</div>
                                            <div><strong>Teléfono:</strong> {packing.cliente?.telefono_cliente || 'N/A'}</div>
                                        </div>
                                    </div>

                                    {/* Información de Envío */}
                                    <div className="detalle-seccion">
                                        <h6>
                                            <i className="fas fa-shipping-fast detalle-icon detalle-shipping-icon"></i>
                                            Envío
                                        </h6>
                                        <div className="detalle-content">
                                            <div><strong>Destino:</strong> {packing.ciudad_destino || packing.direccion_destino || 'N/A'}</div>
                                            <div><strong>Archivo:</strong> {packing.archivo_original || 'N/A'}</div>
                                            <div><strong>Fecha Fin:</strong> {packing.fecha_fin ? formatearFecha(packing.fecha_fin) : 'No disponible'}</div>
                                        </div>
                                    </div>

                                    {/* Estadísticas */}
                                    <div className="detalle-seccion">
                                        <h6>
                                            <i className="fas fa-chart-bar detalle-icon detalle-estadisticas-icon"></i>
                                            Estadísticas
                                        </h6>
                                        <div className="estadisticas-grid">
                                            <div className="estadistica-item">
                                                <div className="estadistica-valor estadistica-articulos">
                                                    {packing.estadisticas?.total_articulos || 0}
                                                </div>
                                                <div className="estadistica-label">Artículos</div>
                                            </div>
                                            <div className="estadistica-item">
                                                <div className="estadistica-valor estadistica-valor-total">
                                                    {formatearMoneda(packing.estadisticas?.precio_total_carga || 0)}
                                                </div>
                                                <div className="estadistica-label">Valor</div>
                                            </div>
                                            <div className="estadistica-item">
                                                <div className="estadistica-valor estadistica-cbm">
                                                    {(packing.estadisticas?.cbm_total || 0).toFixed(2)}
                                                </div>
                                                <div className="estadistica-label">CBM</div>
                                            </div>
                                            <div className="estadistica-item">
                                                <div className="estadistica-valor estadistica-peso">
                                                    {(packing.estadisticas?.peso_total || 0).toFixed(1)} kg
                                                </div>
                                                <div className="estadistica-label">Peso</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BusquedaPackingList;
