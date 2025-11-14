import React from "react";
import { useQRLanding } from "../hooks/useQRLanding";
import CrearCarga from "../components/CrearCarga";
import LoadingSpinner from '../components/LoadingSpinner';  
import ErrorMessage from '../components/ErrorMessage';      

import '../styles/pages/QRLanding.css';

const QRLanding = () => {
    const {
        qrCode,            
        articuloData,        
        cargaData,               
        seguimientoData,         
        loading,              
        error,                 
        notFound,                
        mostrandoSeguimiento,      
        loadingSeguimiento,    
        cargarSeguimiento,      
        verVistaCompleta,
        compartirQR,        
        setMostrandoSeguimiento    
    } = useQRLanding();

    if (loading) {
        return (
            <div className="qr-landing-container">
                <LoadingSpinner message="Cargando información del artículo..." />
            </div>
        );
    }
    if (notFound) {
        return (
            <div className="qr-landing-container qr-landing-error">
                <div className="error-content">
                    <div className="error-icon">📦</div>
                
                    <h2>Artículo no encontrado</h2>
                    <p>El código QR escaneado no corresponde a ningún artículo registrado en nuestro sistema.</p>
                    <div className="error-actions">
                        <button 
                            className="btn-primary"
                            onClick={() => window.history.back()} 
                        >
                            Volver
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    if (error) {
        return (
            <div className="qr-landing-container">
                <ErrorMessage 
                    message={error}
                    onRetry={() => window.location.reload()}
                />
            </div>
        );
    }
    return (
        <div className="qr-landing-container">
            
            <div className="qr-landing-header">
                <img src="/logo-888cargo.png" alt="888Cargo" className="logo" />
                <h1>Información del Artículo</h1>
            </div>
            <div className="articulo-card">
                <div className="articulo-header">
                    <h2>{articuloData.descripcion}</h2>
                    <span className="qr-code-badge">QR: {qrCode}</span>
                </div>
                
                <div className="articulo-details">
                
                    <div className="detail-group">
                        <label>Código del Artículo:</label>
                        <span>{articuloData.codigo_articulo}</span>
                    </div>
                
                    <div className="detail-group">
                        <label>Cantidad:</label>
                        <span>{articuloData.cantidad} {articuloData.unidad || 'unidades'}</span>
                    </div>
                    
                    <div className="detail-group">
                        <label>Peso:</label>
                        <span>{articuloData.peso} kg</span>
                    </div>
                    {articuloData.dimensiones && (
                        <div className="detail-group">
                            <label>Dimensiones:</label>
                            <span>{articuloData.dimensiones}</span>
                        </div>
                    )}
                </div>
            </div>
            {cargaData && (
                <div className="carga-card">
                    <h3>Información del Envío</h3>
                
                    <div className="carga-details">
                    
                        <div className="detail-group">
                            <label>Código de Carga:</label>
                            <span className="codigo-carga">{cargaData.codigo_carga}</span>
                        </div>
                        <div className="detail-group">
                            <label>Cliente:</label>
                            <span>{cargaData.nombre_cliente}</span>
                        </div>
                        
                        <div className="detail-group">
                            <label>Destino:</label>
                            <span>{cargaData.direccion_destino}</span>
                        </div>
            
                        <div className="detail-group">
                            <label>Fecha de Envío:</label>
                            <span>{new Date(cargaData.fecha_creacion).toLocaleDateString('es-ES')}</span>
                        </div>
                    </div>
                </div>
            )}
            <div className="action-buttons">
                
                <button 
                    className="btn-secondary"
                    onClick={cargarSeguimiento}     
                    disabled={loadingSeguimiento}      
                >
                    {loadingSeguimiento ? 'Cargando...' : 'Ver Seguimiento'}
                </button>
            
                <button 
                    className="btn-primary"
                    onClick={verVistaCompleta}
                >
                    Ver Detalles Completos
                </button>
                
                <button 
                    className="btn-outline"
                    onClick={compartirQR}
                >
                    Compartir
                </button>
            </div>
            {mostrandoSeguimiento && seguimientoData && (
                <div className="modal-overlay" onClick={() => setMostrandoSeguimiento(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Estado del Seguimiento</h3>
                            <button 
                                className="modal-close"
                                onClick={() => setMostrandoSeguimiento(false)}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="seguimiento-timeline">
                            {seguimientoData.estados?.map((estado, index) => (
                                <div key={index} className={`timeline-item ${estado.actual ? 'active' : ''}`}>
                                    <div className="timeline-dot"></div>
                                    <div className="timeline-content">
                                        <h4>{estado.nombre}</h4>
                                        <p>{estado.descripcion}</p>
                                        {estado.fecha && (
                                            <small>{new Date(estado.fecha).toLocaleString('es-ES')}</small>
                                        )}
                                    </div>
                                 </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default QRLanding;