import React from 'react';
import '../styles/components/ModalTest.css';

const ModalTest = ({ 
    mostrar, 
    onCerrar,
    infoCliente,
    infoCarga,
    onCambioCliente,
    onCambioCarga,
    onGuardar,
    onGenerarCodigo,
    guardandoBD,
    guardadoExitoso,
    datosGuardado,
    onDescargarPDF 
}) => {
    if (process.env.NODE_ENV === 'development') {
        console.log('[ModalTest] Component rendered, visible:', mostrar);
    }

    if (!mostrar) {
        return null;
    }

    return (
        <div className="modal-test-overlay" onClick={onCerrar}>
            <div className="modal-test-container" onClick={e => e.stopPropagation()}>
                <button className="modal-test-close-btn" onClick={onCerrar} title="Cerrar">
                    <i className="fas fa-times"></i>
                </button>
                <div className="modal-test-content">
                {/* HEADER */}
                <div className="modal-test-header">
                    <h2 className="modal-test-title">
                        📋 Información del Packing List
                    </h2>
                    <p className="modal-test-subtitle">
                        Complete la información del cliente y la carga
                    </p>
                </div>
                
                {/* INFORMACIÓN DEL CLIENTE */}
                <div className="modal-test-section">
                    <h3 className="modal-test-section-title">
                        <i className="fas fa-user"></i>
                        Información del Cliente
                    </h3>
                    
                    <div className="modal-test-form-group">
                        <label className="modal-test-label">
                            Nombre del Cliente *
                        </label>
                        <input
                            type="text"
                            name="nombre_cliente"
                            value={infoCliente?.nombre_cliente || ''}
                            onChange={onCambioCliente}
                            required
                            placeholder="Nombre completo del cliente"
                            className="modal-test-input"
                        />
                    </div>
                    
                    <div className="modal-test-form-group">
                        <label className="modal-test-label">
                            Correo Electrónico *
                        </label>
                        <input
                            type="email"
                            name="correo_cliente"
                            value={infoCliente?.correo_cliente || ''}
                            onChange={onCambioCliente}
                            required
                            placeholder="correo@ejemplo.com"
                            className="modal-test-input"
                        />
                    </div>
                    
                    <div className="modal-test-form-group">
                        <label className="modal-test-label">
                            Teléfono *
                        </label>
                        <input
                            type="text"
                            name="telefono_cliente"
                            value={infoCliente?.telefono_cliente || ''}
                            onChange={onCambioCliente}
                            required
                            placeholder="+1234567890"
                            className="modal-test-input"
                        />
                    </div>
                    
                    <div className="modal-test-form-group">
                        <label className="modal-test-label">
                            Dirección de Entrega de Mercancía *
                        </label>
                        <textarea
                            name="direccion_entrega"
                            value={infoCliente?.direccion_entrega || ''}
                            onChange={onCambioCliente}
                            required
                            placeholder="Dirección completa donde se recogerá la mercancía"
                            rows="2"
                            className="modal-test-textarea"
                        />
                    </div>
                </div>

                {/* INFORMACIÓN DE LA CARGA */}
                <div className="modal-test-section">
                    <h3 className="modal-test-section-title">
                        <i className="fas fa-box"></i>
                        Información del Packing List
                    </h3>
                    
                    <div className="modal-test-form-group">
                        <label className="modal-test-label">
                            Código del Packing List *
                        </label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                name="codigo_carga"
                                value={infoCarga?.codigo_carga || ''}
                                onChange={onCambioCarga}
                                required
                                placeholder="Código único del packing list"
                                className="modal-test-input"
                                style={{ flex: 1 }}
                            />
                            <button
                                type="button"
                                onClick={onGenerarCodigo}
                                className="modal-test-btn modal-test-btn-outline"
                                title="Generar nuevo código único"
                                style={{ whiteSpace: 'nowrap', minWidth: 'auto', padding: '10px 15px' }}
                            >
                                <i className="fas fa-random"></i> Generar
                            </button>
                        </div>
                    </div>
                    
                    <div className="modal-test-form-group">
                        <label className="modal-test-label">
                            Dirección de Destino *
                        </label>
                        <textarea
                            name="direccion_destino"
                            value={infoCarga?.direccion_destino || ''}
                            onChange={onCambioCarga}
                            required
                            placeholder="Dirección completa donde se entregará la mercancía"
                            rows="2"
                            className="modal-test-textarea"
                        />
                    </div>
                </div>

                {/* MENSAJE DE ÉXITO */}
                {guardadoExitoso && datosGuardado && (
                    <div className="modal-test-success-message">
                        <h4 className="modal-test-success-title">
                            <i className="fas fa-check-circle"></i>
                            ¡Packing List guardado exitosamente!
                        </h4>
                        <div className="modal-test-success-details">
                            <div className="modal-test-detail-item">
                                <span className="modal-test-detail-label">Total de QRs generados:</span>
                                <span className="modal-test-detail-value">{datosGuardado.totalQRs}</span>
                            </div>
                            <div className="modal-test-detail-item">
                                <span className="modal-test-detail-label">Código del Packing List:</span>
                                <span className="modal-test-detail-value">{infoCarga?.codigo_carga}</span>
                            </div>
                            <div className="modal-test-detail-item">
                                <span className="modal-test-detail-label">Cliente:</span>
                                <span className="modal-test-detail-value">{infoCliente?.nombre_cliente}</span>
                            </div>
                        </div>
                        {datosGuardado.pdfUrl && (
                            <div className="modal-test-actions" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #c3e6cb' }}>
                                <button
                                    onClick={onDescargarPDF}
                                    className="modal-test-btn modal-test-btn-success"
                                >
                                    <i className="fas fa-file-pdf"></i> Descargar PDF con QRs
                                </button>
                                <button
                                    onClick={onCerrar}
                                    className="modal-test-btn modal-test-btn-primary"
                                >
                                    <i className="fas fa-plus"></i> Crear Nuevo Packing List
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* BOTONES DEL MODAL */}
                <div className="modal-test-actions">
                    <button 
                        onClick={onCerrar}
                        className="modal-test-btn modal-test-btn-secondary"
                    >
                        <i className="fas fa-times"></i> Cancelar
                    </button>
                    <button 
                        onClick={onGuardar}
                        className="modal-test-btn modal-test-btn-primary" 
                        disabled={guardandoBD}
                    >
                        {guardandoBD ? (
                            <>
                                <div className="modal-test-loading-spinner"></div> 
                                Guardando...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-save"></i> 
                                Guardar en Base de Datos
                            </>
                        )}
                    </button>
                </div>
                </div>
            </div>
        </div>
    );
};

export default ModalTest;
