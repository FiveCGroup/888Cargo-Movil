import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import cargaService from '../services/cargaService';
import '../styles/components/Dashboard.css';
import '../styles/pages/VisualizarQR.css';
import '../styles/global/buttons.css';

const VisualizarQR = () => {
    const { idCarga } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [cargaData, setCargaData] = useState(null);
    const [qrData, setQrData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [descargandoPDF, setDescargandoPDF] = useState(false);
    
    // Estados para el modal de zoom del QR
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedQR, setSelectedQR] = useState(null);

    useEffect(() => {
        const u = localStorage.getItem('user');
        if (u) setUser(JSON.parse(u));
    }, []);

    useEffect(() => {
        const cargar = async () => {
            if (!idCarga) {
                setError('ID de carga no válido');
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const resp = await cargaService.obtenerPackingList(idCarga);
                if (!resp.success) throw new Error(resp.error || 'Error al obtener packing list');
                const payload = resp.data.data || resp.data || {};
                const items = payload.items || [];

                let meta = null;
                try { const m = await cargaService.obtenerCargaMeta(idCarga); if (m.success) meta = m.data.data || m.data; } catch (e) {}

                setCargaData({
                    carga: {
                        id: idCarga,
                        codigo_carga: meta?.codigo_carga || (items[0] && items[0].codigo_carga) || null,
                        createdAt: meta?.fecha_creacion || meta?.fecha_inicio || (items[0] && items[0].fecha_inicio) || null,
                        nombre_cliente: meta?.nombre_cliente || (items[0] && items[0].nombre_cliente) || null
                    },
                    items,
                });

                const qrResp = await cargaService.obtenerQRDataDeCarga(idCarga);
                if (qrResp.success && qrResp.data) {
                    const qrs = (qrResp.data.data || qrResp.data).qrs || [];
                    const mapped = qrs.map(qr => {
                        let parsed = null; try { parsed = qr.parsed_data || (qr.datos_qr ? JSON.parse(qr.datos_qr) : null); } catch(e){}
                        return {
                            id: qr.id_qr || qr.id,
                            id_articulo: qr.id_articulo,
                            numeroCaja: qr.numero_caja || (parsed ? parsed.numero_caja : null),
                            totalCajas: qr.total_cajas || (parsed ? parsed.total_cajas : null),
                            descripcion_espanol: qr.descripcion_espanol || (parsed ? parsed.descripcion : null),
                            cantidad_en_caja: qr.cantidad_en_caja || (parsed ? parsed.cantidad : null),
                            codigo_qr: qr.codigo_qr || (parsed ? parsed.codigo_unico : null),
                            ref_art: qr.ref_art || (parsed ? parsed.item : null),
                            datos_parseados: parsed
                        };
                    });
                    setQrData(mapped);
                } else setQrData([]);

            } catch (e) {
                console.error('Error cargar datos:', e);
                setError(e.message || 'Error');
            } finally { setLoading(false); }
        };
        cargar();
    }, [idCarga]);

    // Efecto para cerrar modal con tecla Escape
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && modalVisible) {
                closeModal();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [modalVisible]);

    const handleDescargarPDF = async () => {
        if (!idCarga) return;
        setDescargandoPDF(true);
        try { const res = await cargaService.descargarPDFQRs(idCarga); if (!res.success) setError(res.error || 'Error al descargar PDF'); }
        catch (e) { setError('Error al descargar PDF'); }
        finally { setDescargandoPDF(false); }
    };

    const volverACrearCarga = () => navigate('/crear-carga');
    const irAlDashboard = () => navigate('/dashboard');

    // Funciones para el modal de zoom
    const handleQRClick = (qrItem) => {
        setSelectedQR(qrItem);
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setSelectedQR(null);
    };

    const handleModalBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            closeModal();
        }
    };

    if (loading) return (
        <div className="dashboard-layout visualizar-qr-container">
            <Navbar user={user} />
            <div className="dashboard-main-content">
                <div className="visualizar-qr-loading">
                    <div className="loading-spinner"/>
                </div>
            </div>
        </div>
    );

    if (error) return (
        <div className="dashboard-layout visualizar-qr-container">
            <Navbar user={user} />
            <div className="dashboard-main-content">
                <div className="error-container">
                    <div className="error-message">Error: {error}</div>
                    <div className="visualizar-qr-error-actions">
                        <button className="btn btn-primary" onClick={volverACrearCarga}>
                            <i className="fas fa-plus"/> Crear Nueva Carga
                        </button>
                        <button className="btn btn-outline-secondary" onClick={irAlDashboard}>
                            <i className="fas fa-home"/> Ir al Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="dashboard-layout visualizar-qr-container">
            <Navbar user={user} />
            <div className="dashboard-main-content">
                <div className="visualizar-qr-header">
                    <div className="visualizar-qr-title-section">
                        <button className="btn-back-icon" onClick={volverACrearCarga} title="Volver a Crear Carga">
                            <i className="fas fa-arrow-left"/>
                        </button>
                        <h1 className="visualizar-qr-title">
                            Códigos QR - {cargaData?.carga?.codigo_carga || idCarga}
                        </h1>
                    </div>

                    <div className="visualizar-qr-actions">
                        <button 
                            onClick={() => navigate(`/packing-list/${idCarga}`)} 
                            className="btn btn-primary visualizar-qr-action-btn" 
                            title="Ver detalle del Packing List"
                        >
                            <i className="fas fa-list"/>
                            <span>Ver Packing List</span>
                        </button>
                        <button 
                            onClick={handleDescargarPDF} 
                            disabled={descargandoPDF} 
                            className={`btn btn-success visualizar-qr-action-btn ${descargandoPDF ? 'disabled' : ''}`} 
                            title="Descargar PDF con todos los códigos QR"
                        >
                            {descargandoPDF ? (
                                <>
                                    <div className="loading-spinner-small"/>
                                    <span>Generando...</span>
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-file-pdf"/>
                                    <span>Descargar PDF</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {cargaData && (
                    <div className="qr-info-card">
                        <h3 className="visualizar-qr-info-title">
                            <i className="fas fa-info-circle"/> Información de la Carga
                        </h3>
                        <div className="qr-info-grid">
                            <div className="qr-info-item">
                                <div className="qr-info-label">Cliente:</div>
                                <div className="qr-info-value">{cargaData.carga?.nombre_cliente || 'N/A'}</div>
                            </div>
                            <div className="qr-info-item">
                                <div className="qr-info-label">Código:</div>
                                <div className="qr-info-value">{cargaData.carga?.codigo_carga || 'N/A'}</div>
                            </div>
                            <div className="qr-info-item">
                                <div className="qr-info-label">Total de Cajas:</div>
                                <div className="qr-info-value">{qrData.length}</div>
                            </div>
                            <div className="qr-info-item">
                                <div className="qr-info-label">Fecha de Creación:</div>
                                <div className="qr-info-value">
                                    {cargaData.carga?.createdAt ? new Date(cargaData.carga.createdAt).toLocaleDateString('es-ES') : 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {qrData.length > 0 ? (
                    <div className="qr-grid-container">
                        {qrData.map((qr, index) => {
                            const cajasDelMismoArticulo = qrData.filter(i => i.id_articulo === qr.id_articulo);
                            const numeroCajaEnArticulo = cajasDelMismoArticulo.findIndex(i => i.id === qr.id) + 1;
                            const totalCajasDelArticulo = cajasDelMismoArticulo.length;
                            return (
                                <div key={qr.id || index} className="qr-card">
                                    <div className="qr-card-header">
                                        <h4 className="qr-card-title">
                                            Caja {qr.numeroCaja || numeroCajaEnArticulo} de {qr.totalCajas || totalCajasDelArticulo}
                                        </h4>
                                        <p className="qr-card-subtitle">QR ID: {qr.id}</p>
                                    </div>
                                    <div className="card-body">
                                        <div 
                                            className="qr-image-container qr-image-clickable" 
                                            onClick={() => handleQRClick(qr)} 
                                            title="Clic para ampliar el código QR"
                                        >
                                            <img 
                                                src={`/api/qr/image/${qr.id}?width=150&margin=10`} 
                                                alt={`QR ${index+1}`} 
                                                className="qr-image"
                                                onError={(e)=>{e.target.style.display='none'}}
                                            />
                                        </div>
                                        <div className="qr-details">
                                            {qr.datos_parseados ? (
                                                <div className="qr-details-grid">
                                                    <div className="qr-detail-label">ID QR:</div>
                                                    <div className="qr-detail-value">{qr.datos_parseados.qr_id || qr.id}</div>
                                                    <div className="qr-detail-label">Número de Caja:</div>
                                                    <div className="qr-detail-value">{qr.datos_parseados.numero_caja}</div>
                                                    <div className="qr-detail-label">Descripción:</div>
                                                    <div className="qr-detail-value">{qr.datos_parseados.descripcion}</div>
                                                </div>
                                            ) : (
                                                <div className="qr-no-data">Sin datos adicionales</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="empty-state">
                        <i className="fas fa-qrcode empty-state-icon"/>
                        <h3 className="empty-state-title">No se encontraron códigos QR</h3>
                        <p className="empty-state-message">Los códigos QR para esta carga no están disponibles.</p>
                    </div>
                )}

                <div className="navigation-footer">
                    <button onClick={volverACrearCarga} className="nav-btn primary">
                        <i className="fas fa-plus"/> Crear Nueva Carga
                    </button>
                    <button onClick={irAlDashboard} className="nav-btn">
                        <i className="fas fa-home"/> Ir al Dashboard
                    </button>
                </div>
            </div>

            {/* Modal para zoom del QR */}
            {modalVisible && selectedQR && (
                <div className="qr-modal-overlay" onClick={handleModalBackdropClick}>
                    <div className="qr-modal-container">
                        <div className="qr-modal-content">
                            {/* Header del modal */}
                            <div className="qr-modal-header">
                                <h3 className="qr-modal-title">
                                    Caja {selectedQR.numeroCaja || selectedQR.datos_parseados?.numero_caja || 'N/A'} de {selectedQR.totalCajas || selectedQR.datos_parseados?.total_cajas || 'N/A'}
                                </h3>
                                <button onClick={closeModal} className="qr-modal-close-btn" title="Cerrar">
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>

                            {/* Imagen QR ampliada */}
                            <div className="qr-modal-image-container">
                                <img 
                                    src={`/api/qr/image/${selectedQR.id}?width=400&margin=20`} 
                                    alt={`QR ampliado - ${selectedQR.descripcion_espanol || 'QR Code'}`}
                                    className="qr-modal-image"
                                />
                            </div>

                            {/* Información del QR */}
                            <div className="qr-modal-info">
                                <div className="qr-modal-detail">
                                    <span className="qr-modal-label">ID QR:</span>
                                    <span className="qr-modal-value">{selectedQR.id}</span>
                                </div>
                                
                                {selectedQR.descripcion_espanol && (
                                    <div className="qr-modal-detail">
                                        <span className="qr-modal-label">Descripción:</span>
                                        <span className="qr-modal-value">{selectedQR.descripcion_espanol}</span>
                                    </div>
                                )}
                                
                                {selectedQR.ref_art && (
                                    <div className="qr-modal-detail">
                                        <span className="qr-modal-label">Ref. Artículo:</span>
                                        <span className="qr-modal-value">{selectedQR.ref_art}</span>
                                    </div>
                                )}
                                
                                {selectedQR.codigo_qr && (
                                    <div className="qr-modal-detail qr-modal-code">
                                        <span className="qr-modal-label">Código QR:</span>
                                        <span className="qr-modal-value qr-modal-code-text">{selectedQR.codigo_qr}</span>
                                    </div>
                                )}
                            </div>

                            {/* Botones de acción */}
                            <div className="qr-modal-actions">
                                <button 
                                    onClick={() => window.open(`/api/qr/image/${selectedQR.id}?width=800&margin=20`, '_blank')}
                                    className="qr-modal-btn qr-modal-btn-primary"
                                    title="Abrir QR en nueva ventana"
                                >
                                    <i className="fas fa-external-link-alt"></i>
                                    Abrir en nueva ventana
                                </button>
                                <button 
                                    onClick={closeModal}
                                    className="qr-modal-btn qr-modal-btn-secondary"
                                >
                                    <i className="fas fa-times"></i>
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisualizarQR;
