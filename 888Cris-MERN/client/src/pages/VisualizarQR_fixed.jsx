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

    // Obtener información del usuario desde localStorage
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    // Cargar datos de la carga y QRs
    useEffect(() => {
        const cargarDatos = async () => {
            if (!idCarga) {
                setError('ID de carga no válido');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                
                // Obtener datos completos de la carga usando el mismo método que funciona en otros componentes
                const cargaResponse = await cargaService.obtenerPackingList(idCarga);
                console.log('📦 Datos de carga obtenidos:', cargaResponse);
                
                if (cargaResponse.success && cargaResponse.data) {
                    // Los datos pueden estar en cargaResponse.data.data o directamente en cargaResponse.data
                    const responseData = cargaResponse.data.data || cargaResponse.data;
                    const items = responseData.items || [];
                    const estadisticas = responseData.estadisticas || {};
                    
                    console.log('📊 Items extraídos:', items);
                    console.log('📈 Estadísticas extraídas:', estadisticas);
                    
                    if (items.length > 0) {
                        const primerItem = items[0];
                        // Intentar obtener metadata oficial de la carga (incluye nombre_cliente y fecha_creacion)
                        let cargaMeta = null;
                        try {
                            const metaResp = await cargaService.obtenerCargaMeta(idCarga);
                            if (metaResp && metaResp.success && metaResp.data) {
                                cargaMeta = metaResp.data.data || metaResp.data;
                                console.log('\u2139\ufe0f Metadata oficial de carga obtenida:', cargaMeta);
                            }
                        } catch (metaErr) {
                            console.warn('No se pudo obtener metadata de la carga, usando valores desde items:', metaErr);
                        }

                        const datosCompletos = {
                            carga: {
                                id: idCarga,
                                codigo_carga: cargaMeta?.codigo_carga || primerItem.codigo_carga,
                                fecha_inicio: cargaMeta?.fecha_inicio || primerItem.fecha_inicio,
                                ciudad_destino: cargaMeta?.ciudad_destino || primerItem.ciudad_destino,
                                archivo_original: cargaMeta?.archivo_original || primerItem.archivo_original,
                                // Preferir fecha_creacion si está disponible en los metadatos; si no, usar fecha_inicio
                                createdAt: cargaMeta?.fecha_creacion || cargaMeta?.fecha_inicio || primerItem.fecha_inicio,
                                nombre_cliente: cargaMeta?.nombre_cliente || primerItem.nombre_cliente,
                                telefono_cliente: cargaMeta?.telefono_cliente || primerItem.telefono_cliente,
                                ciudad_cliente: cargaMeta?.ciudad_cliente || primerItem.ciudad_cliente
                            },
                            items: items,
                            estadisticas: estadisticas
                        };
                        setCargaData(datosCompletos);
                        console.log('\u2705 Datos de carga configurados (fusionando metadata):', datosCompletos);
                    } else {
                        throw new Error('No se encontraron artículos en la carga');
                    }
                } else {
                    throw new Error(cargaResponse.error || 'Error al obtener datos de la carga');
                }

                // Obtener datos QR usando el método correcto
                const qrResponse = await cargaService.obtenerQRDataDeCarga(idCarga);
                console.log('🏷️ Datos QR obtenidos:', qrResponse);
                
                if (qrResponse.success && qrResponse.data) {
                    const qrData = qrResponse.data;
                    
                    if (qrData.qrs && qrData.qrs.length > 0) {
                        // Procesar los QRs para el formato que espera el componente
                        const qrsFormateados = qrData.qrs.map(qr => {
                            let parsedData = null;
                            try {
                                parsedData = qr.parsed_data || (qr.datos_qr ? JSON.parse(qr.datos_qr) : null);
                            } catch (e) {
                                console.warn('Error parseando datos QR:', e);
                            }

                            return {
                                id: qr.id_qr || qr.id,
                                numeroCaja: qr.numero_caja || (parsedData ? parsedData.numero_caja : 'N/A'),
                                totalCajas: qr.total_cajas || (parsedData ? parsedData.total_cajas : 'N/A'),
                                producto: qr.descripcion_espanol || (parsedData ? parsedData.descripcion : 'N/A'),
                                cantidad: qr.cantidad_en_caja || 'N/A',
                                codigo_qr: qr.codigo_qr || (parsedData ? parsedData.codigo_unico : `QR-${qr.id_qr || qr.id}`),
                                ref_art: qr.ref_art || (parsedData ? parsedData.item : 'N/A'),
                                caja_numero: qr.numero_caja,
                                datos_parseados: parsedData
                            };
                        });
                        
                        setQrData(qrsFormateados);
                        console.log('✅ QRs formateados:', qrsFormateados);
                    } else {
                        // Si no hay datos QR, intentar generarlos
                        console.log('📝 No se encontraron QRs existentes, intentando generar...');
                        const generateResponse = await cargaService.generarQRDataParaCarga(idCarga);
                        
                        if (generateResponse.success && generateResponse.data) {
                            // Recargar datos QR después de generar
                            const qrResponseNew = await cargaService.obtenerQRDataDeCarga(idCarga);
                            if (qrResponseNew.success && qrResponseNew.data && qrResponseNew.data.qrs) {
                                const qrsFormateados = qrResponseNew.data.qrs.map(qr => {
                                    let parsedData = null;
                                    try {
                                        parsedData = qr.parsed_data || (qr.datos_qr ? JSON.parse(qr.datos_qr) : null);
                                    } catch (e) {
                                        console.warn('Error parseando datos QR:', e);
                                    }

                                    return {
                                        id: qr.id_qr || qr.id,
                                        numeroCaja: qr.numero_caja || (parsedData ? parsedData.numero_caja : 'N/A'),
                                        totalCajas: qr.total_cajas || (parsedData ? parsedData.total_cajas : 'N/A'),
                                        producto: qr.descripcion_espanol || (parsedData ? parsedData.descripcion : 'N/A'),
                                        cantidad: qr.cantidad_en_caja || 'N/A',
                                        codigo_qr: qr.codigo_qr || (parsedData ? parsedData.codigo_unico : `QR-${qr.id_qr || qr.id}`),
                                        ref_art: qr.ref_art || (parsedData ? parsedData.item : 'N/A'),
                                        caja_numero: qr.numero_caja,
                                        datos_parseados: parsedData
                                    };
                                });
                                setQrData(qrsFormateados);
                            } else {
                                setQrData([]);
                            }
                        } else {
                            throw new Error('No se pudieron generar códigos QR para esta carga');
                        }
                    }
                } else {
                    throw new Error('Error al obtener códigos QR');
                }
            } catch (err) {
                console.error('❌ Error al cargar datos:', err);
                setError(err.message || 'Error al cargar los datos');
            } finally {
                setLoading(false);
            }
        };

        cargarDatos();
    }, [idCarga]);

    const handleDescargarPDF = async () => {
        if (!idCarga) return;
        
        setDescargandoPDF(true);
        try {
            const resultado = await cargaService.descargarPDFQRs(idCarga);
            if (!resultado.success) {
                setError(resultado.error || 'Error al descargar el PDF');
            }
        } catch (error) {
            console.error('Error al descargar PDF:', error);
            setError('Error al descargar el PDF. Inténtalo de nuevo.');
        } finally {
            setDescargandoPDF(false);
        }
    };

    const volverACrearCarga = () => {
        navigate('/crear-carga');
    };

    const irAlDashboard = () => {
        navigate('/dashboard');
    };

    if (loading) {
        return (
            <div className="dashboard-layout visualizar-qr-container">
                <Navbar user={user} />
                <div className="dashboard-main-content">
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '60vh',
                        flexDirection: 'column'
                    }}>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            border: '4px solid var(--bg-secondary)',
                            borderTop: '4px solid var(--color-primary)',
                            borderRadius: 'var(--border-radius-full)',
                            animation: 'spin 1s linear infinite',
                            marginBottom: 'var(--spacing-lg)'
                        }} />
                        <h3 style={{ 
                            color: 'var(--color-primary)', 
                            marginBottom: 'var(--spacing-sm)',
                            fontSize: 'var(--font-size-lg)',
                            fontWeight: 'var(--font-weight-semibold)'
                        }}>Cargando códigos QR...</h3>
                        <p style={{ 
                            color: 'var(--text-muted)',
                            fontSize: 'var(--font-size-base)'
                        }}>Por favor espera un momento</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-layout visualizar-qr-container">
                <Navbar user={user} />
                <div className="dashboard-main-content">
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '60vh',
                        flexDirection: 'column'
                    }}>
                        <div className="alert alert-danger" style={{ 
                            textAlign: 'center',
                            maxWidth: '500px',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}>
                            <div style={{
                                fontSize: '3rem',
                                color: 'var(--color-danger)',
                                marginBottom: 'var(--spacing-lg)'
                            }}>
                                <i className="fas fa-exclamation-triangle"></i>
                            </div>
                            <h3 style={{ 
                                color: 'var(--color-danger)', 
                                marginBottom: 'var(--spacing-md)',
                                fontSize: 'var(--font-size-xl)',
                                fontWeight: 'var(--font-weight-semibold)'
                            }}>Error</h3>
                            <p style={{ 
                                color: 'var(--color-danger)', 
                                marginBottom: 'var(--spacing-lg)',
                                fontSize: 'var(--font-size-base)'
                            }}>{error}</p>
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap', justifyContent: 'center' }}>
                                <button 
                                    onClick={volverACrearCarga}
                                    className="btn btn-primary"
                                >
                                    <i className="fas fa-plus"></i> Crear Nueva Carga
                                </button>
                                <button 
                                    onClick={irAlDashboard}
                                    className="btn btn-outline-secondary"
                                >
                                    <i className="fas fa-home"></i> Ir al Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-layout visualizar-qr-container">
            <Navbar user={user} />
            
            <div className="dashboard-main-content">
                {/* Header con navegación */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    position: 'relative',
                    marginBottom: 'var(--spacing-xl)'
                }}>
                    <button 
                        className="btn-back-icon" 
                        onClick={volverACrearCarga}
                        title="Volver a Crear Carga"
                    >
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    
                    <h1 style={{ 
                        flex: '1', 
                        textAlign: 'center', 
                        margin: '0',
                        fontSize: 'var(--font-size-xxxl)',
                        fontWeight: 'var(--font-weight-bold)',
                        color: 'var(--color-primary)'
                    }}>
                        Códigos QR - Carga #{idCarga}
                    </h1>
                </div>

                {/* Información de la carga */}
                {cargaData && (
                    <div style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--border-radius-lg)',
                        padding: 'var(--spacing-xl)',
                        marginBottom: 'var(--spacing-xl)',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <h3 style={{ 
                            color: 'var(--color-primary)', 
                            marginBottom: 'var(--spacing-md)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-sm)',
                            fontSize: 'var(--font-size-lg)',
                            fontWeight: 'var(--font-weight-semibold)'
                        }}>
                            <i className="fas fa-info-circle"></i>
                            Información de la Carga
                        </h3>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                            gap: 'var(--spacing-md)' 
                        }}>
                            <div style={{
                                padding: 'var(--spacing-md)',
                                backgroundColor: 'var(--bg-primary)',
                                borderRadius: 'var(--border-radius-base)',
                                borderLeft: '4px solid var(--color-primary)'
                            }}>
                                <div style={{ 
                                    fontWeight: 'var(--font-weight-semibold)', 
                                    color: 'var(--text-secondary)', 
                                    fontSize: 'var(--font-size-sm)',
                                    marginBottom: 'var(--spacing-xs)'
                                }}>Cliente:</div>
                                <div style={{ color: 'var(--text-primary)' }}>{cargaData.carga?.nombre_cliente || 'N/A'}</div>
                            </div>
                            <div style={{
                                padding: 'var(--spacing-md)',
                                backgroundColor: 'var(--bg-primary)',
                                borderRadius: 'var(--border-radius-base)',
                                borderLeft: '4px solid var(--color-primary)'
                            }}>
                                <div style={{ 
                                    fontWeight: 'var(--font-weight-semibold)', 
                                    color: 'var(--text-secondary)', 
                                    fontSize: 'var(--font-size-sm)',
                                    marginBottom: 'var(--spacing-xs)'
                                }}>Código:</div>
                                <div style={{ color: 'var(--text-primary)' }}>{cargaData.carga?.codigo_carga || 'N/A'}</div>
                            </div>
                            <div style={{
                                padding: 'var(--spacing-md)',
                                backgroundColor: 'var(--bg-primary)',
                                borderRadius: 'var(--border-radius-base)',
                                borderLeft: '4px solid var(--color-primary)'
                            }}>
                                <div style={{ 
                                    fontWeight: 'var(--font-weight-semibold)', 
                                    color: 'var(--text-secondary)', 
                                    fontSize: 'var(--font-size-sm)',
                                    marginBottom: 'var(--spacing-xs)'
                                }}>Total de Cajas:</div>
                                <div style={{ color: 'var(--text-primary)' }}>{qrData.length}</div>
                            </div>
                            <div style={{
                                padding: 'var(--spacing-md)',
                                backgroundColor: 'var(--bg-primary)',
                                borderRadius: 'var(--border-radius-base)',
                                borderLeft: '4px solid var(--color-primary)'
                            }}>
                                <div style={{ 
                                    fontWeight: 'var(--font-weight-semibold)', 
                                    color: 'var(--text-secondary)', 
                                    fontSize: 'var(--font-size-sm)',
                                    marginBottom: 'var(--spacing-xs)'
                                }}>Fecha de Creación:</div>
                                <div style={{ color: 'var(--text-primary)' }}>
                                    {cargaData.carga?.createdAt 
                                        ? new Date(cargaData.carga.createdAt).toLocaleDateString('es-ES')
                                        : 'N/A'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sección de descarga PDF */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '30px',
                    padding: '20px',
                    backgroundColor: 'white',
                    borderRadius: 'var(--border-radius-lg)',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--border-color)'
                }}>
                    <button
                        onClick={handleDescargarPDF}
                        disabled={descargandoPDF}
                        className={`btn btn-success btn-lg ${descargandoPDF ? 'disabled' : ''}`}
                    >
                        {descargandoPDF ? (
                            <>
                                <div className="loading-spinner" style={{ width: '20px', height: '20px', margin: 0 }} />
                                Generando PDF...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-file-pdf"></i>
                                Descargar PDF con Códigos QR
                            </>
                        )}
                    </button>
                </div>

                {/* Grid de códigos QR */}
                {qrData.length > 0 ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: 'var(--spacing-lg)',
                        marginBottom: 'var(--spacing-xl)'
                    }}>
                        {qrData.map((qr, index) => (
                            <div key={qr.id || index} className="card" style={{
                                textAlign: 'center',
                                transition: 'all var(--transition-fast)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                            }}
                            >
                                {/* Barra superior de color */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '4px',
                                    background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-hover))'
                                }}></div>

                                <div className="card-header">
                                    <h4 style={{
                                        margin: '0 0 var(--spacing-xs) 0',
                                        color: 'var(--color-primary)',
                                        fontSize: 'var(--font-size-lg)',
                                        fontWeight: 'var(--font-weight-semibold)'
                                    }}>
                                        Caja #{qr.numeroCaja || qr.caja_numero || index + 1}
                                    </h4>
                                    <p style={{
                                        margin: '0',
                                        fontSize: 'var(--font-size-sm)',
                                        color: 'var(--text-muted)'
                                    }}>
                                        QR ID: {qr.id}
                                    </p>
                                </div>

                                <div className="card-body">
                                    {/* Contenedor del código QR */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        marginBottom: 'var(--spacing-md)',
                                        padding: 'var(--spacing-md)',
                                        backgroundColor: 'var(--bg-secondary)',
                                        borderRadius: 'var(--border-radius-base)',
                                        minHeight: '170px',
                                        alignItems: 'center'
                                    }}>
                                        <img 
                                            src={`/api/qr/image/${qr.id}?width=150&margin=10`}
                                            alt={`QR Caja ${qr.numeroCaja || index + 1}`}
                                            style={{
                                                maxWidth: '150px',
                                                maxHeight: '150px',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: 'var(--border-radius-base)',
                                                backgroundColor: 'var(--bg-primary)'
                                            }}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                const placeholder = e.target.parentNode.querySelector('.qr-image-placeholder');
                                                if (!placeholder) {
                                                    const placeholderDiv = document.createElement('div');
                                                    placeholderDiv.className = 'qr-image-placeholder';
                                                    placeholderDiv.style.cssText = `
                                                        width: 150px; 
                                                        height: 150px; 
                                                        background: var(--bg-secondary); 
                                                        border: 2px dashed var(--border-color-dark); 
                                                        border-radius: var(--border-radius-base); 
                                                        display: flex; 
                                                        flex-direction: column; 
                                                        align-items: center; 
                                                        justify-content: center; 
                                                        color: var(--text-muted); 
                                                        font-size: var(--font-size-sm);
                                                    `;
                                                    placeholderDiv.innerHTML = '<i class="fas fa-qrcode" style="font-size: 2rem; margin-bottom: 0.5rem;"></i><div>QR no disponible</div>';
                                                    e.target.parentNode.appendChild(placeholderDiv);
                                                }
                                            }}
                                        />
                                    </div>

                                    {/* Información adicional */}
                                    <div style={{
                                        marginTop: 'var(--spacing-md)',
                                        paddingTop: 'var(--spacing-md)',
                                        borderTop: '1px solid var(--border-color)'
                                    }}>
                                        {qr.producto && (
                                            <div style={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'center',
                                                padding: 'var(--spacing-sm) 0',
                                                borderBottom: '1px solid var(--bg-secondary)'
                                            }}>
                                                <span style={{ 
                                                    fontWeight: 'var(--font-weight-semibold)', 
                                                    color: 'var(--text-secondary)', 
                                                    fontSize: 'var(--font-size-sm)' 
                                                }}>Producto:</span>
                                                <span style={{ 
                                                    color: 'var(--text-primary)', 
                                                    fontSize: 'var(--font-size-sm)',
                                                    textAlign: 'right',
                                                    maxWidth: '60%',
                                                    wordBreak: 'break-word'
                                                }}>{qr.producto}</span>
                                            </div>
                                        )}
                                        {qr.ref_art && (
                                            <div style={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'center',
                                                padding: 'var(--spacing-sm) 0',
                                                borderBottom: '1px solid var(--bg-secondary)'
                                            }}>
                                                <span style={{ 
                                                    fontWeight: 'var(--font-weight-semibold)', 
                                                    color: 'var(--text-secondary)', 
                                                    fontSize: 'var(--font-size-sm)' 
                                                }}>REF:</span>
                                                <span style={{ 
                                                    color: 'var(--text-primary)', 
                                                    fontSize: 'var(--font-size-sm)' 
                                                }}>{qr.ref_art}</span>
                                            </div>
                                        )}
                                        {qr.totalCajas && (
                                            <div style={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'center',
                                                padding: 'var(--spacing-sm) 0',
                                                borderBottom: '1px solid var(--bg-secondary)'
                                            }}>
                                                <span style={{ 
                                                    fontWeight: 'var(--font-weight-semibold)', 
                                                    color: 'var(--text-secondary)', 
                                                    fontSize: 'var(--font-size-sm)' 
                                                }}>Total Cajas:</span>
                                                <span style={{ 
                                                    color: 'var(--text-primary)', 
                                                    fontSize: 'var(--font-size-sm)' 
                                                }}>{qr.totalCajas}</span>
                                            </div>
                                        )}
                                        {qr.codigo_qr && (
                                            <div style={{ 
                                                wordBreak: 'break-all',
                                                fontSize: 'var(--font-size-xs)',
                                                backgroundColor: 'var(--bg-secondary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: 'var(--border-radius-base)',
                                                padding: 'var(--spacing-sm)',
                                                marginTop: 'var(--spacing-md)',
                                                fontFamily: 'monospace',
                                                color: 'var(--text-secondary)'
                                            }}>
                                                <strong>Código:</strong> {qr.codigo_qr}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: 'var(--spacing-xxl)',
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: 'var(--border-radius-lg)',
                        border: '2px dashed var(--border-color)',
                        margin: 'var(--spacing-xl) 0'
                    }}>
                        <i className="fas fa-qrcode" style={{ 
                            fontSize: '4rem', 
                            color: 'var(--text-muted)', 
                            marginBottom: 'var(--spacing-lg)'
                        }}></i>
                        <h3 style={{ 
                            color: 'var(--text-muted)', 
                            marginBottom: 'var(--spacing-md)',
                            fontSize: 'var(--font-size-xl)',
                            fontWeight: 'var(--font-weight-semibold)'
                        }}>
                            No se encontraron códigos QR
                        </h3>
                        <p style={{ 
                            color: 'var(--text-muted)',
                            margin: '0',
                            fontSize: 'var(--font-size-base)'
                        }}>
                            Los códigos QR para esta carga no están disponibles.
                        </p>
                    </div>
                )}

                {/* Botones de navegación inferior */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 'var(--spacing-md)',
                    paddingTop: 'var(--spacing-xl)',
                    borderTop: '2px solid var(--border-color)',
                    flexWrap: 'wrap'
                }}>
                    <button 
                        onClick={volverACrearCarga}
                        className="btn btn-primary"
                    >
                        <i className="fas fa-plus"></i> Crear Nueva Carga
                    </button>
                    <button 
                        onClick={irAlDashboard}
                        className="btn btn-outline-secondary"
                    >
                        <i className="fas fa-home"></i> Ir al Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VisualizarQR;
