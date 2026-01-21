import React from 'react';
import { obtenerUrlImagen } from '../utils/cargaUtils';
import '../styles/components/TablasDatos.css';

const TablasDatos = ({ datosExcel, filasConError }) => {
    // Validar que datosExcel tenga el formato correcto
    const datosValidos = Array.isArray(datosExcel) && datosExcel.length > 0;
    const tieneHeader = datosValidos && Array.isArray(datosExcel[0]);
    
    return (
        <>
            {/* Mostrar tabla de filas con errores */}
            {filasConError && filasConError.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                    <h3 className="tabla-titulo error" style={{ 
                        color: '#dc3545', 
                        marginBottom: '15px',
                        fontSize: '18px',
                        fontWeight: 'bold'
                    }}>
                        ⚠️ Filas con errores ({filasConError.length})
                    </h3>
                    <div className="tabla-container" style={{ 
                        overflowX: 'auto',
                        border: '2px solid #dc3545',
                        borderRadius: '8px',
                        padding: '10px',
                        backgroundColor: '#fff5f5'
                    }}>
                        <table className="tabla-datos tabla-errores" style={{ 
                            width: '100%',
                            borderCollapse: 'collapse',
                            minWidth: '600px'
                        }}>
                            <thead>
                                <tr style={{ backgroundColor: '#dc3545', color: 'white' }}>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Fila #</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Errores</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Datos de la fila</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filasConError.map((filaError, idx) => (
                                    <tr key={idx} style={{ 
                                        borderBottom: '1px solid #ddd',
                                        backgroundColor: idx % 2 === 0 ? '#fff' : '#ffe6e6'
                                    }}>
                                        <td style={{ padding: '10px', fontWeight: 'bold' }}>
                                            {filaError.numeroFila || filaError.row || idx + 1}
                                        </td>
                                        <td className="celda-error" style={{ 
                                            padding: '10px',
                                            color: '#dc3545',
                                            fontWeight: '500'
                                        }}>
                                            {Array.isArray(filaError.errores) 
                                                ? filaError.errores.join(', ') 
                                                : filaError.error || filaError.message || 'Error desconocido'}
                                        </td>
                                        <td style={{ padding: '10px', fontSize: '13px', color: '#666' }}>
                                            {Array.isArray(filaError.datos) && filaError.datos.length > 0 ? (
                                                <>
                                                    {filaError.datos.slice(0, 5).map((celda, cidx) => (
                                                        <span key={cidx}>
                                                            [{cidx}]: {String(celda || 'vacío').substring(0, 30)}
                                                            {cidx < 4 && ' | '}
                                                        </span>
                                                    ))}
                                                    {filaError.datos.length > 5 && ` ... (+${filaError.datos.length - 5} más)`}
                                                </>
                                            ) : (
                                                <span style={{ fontStyle: 'italic', color: '#999' }}>
                                                    Sin datos disponibles
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="tabla-leyenda" style={{ 
                        marginTop: '10px',
                        fontSize: '12px',
                        color: '#666',
                        textAlign: 'center'
                    }}>
                        ← Desliza horizontalmente para ver más información →
                    </div>
                </div>
            )}

            {/* Mostrar tabla del archivo Excel si hay datos válidos */}
            {datosValidos && tieneHeader && datosExcel.length > 1 && (
                <div style={{ marginBottom: '30px' }}>
                    <h3 className="tabla-titulo success" style={{ 
                        color: '#28a745', 
                        marginBottom: '15px',
                        fontSize: '18px',
                        fontWeight: 'bold'
                    }}>
                        ✅ Datos cargados exitosamente ({datosExcel.length - 1} filas)
                    </h3>
                    <div className="tabla-container" style={{ 
                        overflowX: 'auto',
                        border: '2px solid #28a745',
                        borderRadius: '8px',
                        padding: '10px',
                        backgroundColor: '#f8fff9'
                    }}>
                        <table className="tabla-datos" style={{ 
                            width: '100%',
                            borderCollapse: 'collapse',
                            minWidth: '800px'
                        }}>
                            <thead>
                                <tr style={{ backgroundColor: '#28a745', color: 'white' }}>
                                    {datosExcel[0].map((col, idx) => {
                                        const headerText = String(col || '').trim();
                                        
                                        // Si es una columna de medida, crear 3 headers
                                        if (headerText.toLowerCase().includes('medida') && 
                                            (headerText.toLowerCase().includes('largo') || 
                                             headerText.toLowerCase().includes('ancho') || 
                                             headerText.toLowerCase().includes('alto'))) {
                                            // Ya está separado, solo mostrar el header
                                            return (
                                                <th key={idx} style={{ 
                                                    padding: '12px', 
                                                    textAlign: 'left', 
                                                    fontWeight: 'bold',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {headerText || `Columna ${idx + 1}`}
                                                </th>
                                            );
                                        }
                                        
                                        return (
                                            <th key={idx} style={{ 
                                                padding: '12px', 
                                                textAlign: 'left', 
                                                fontWeight: 'bold',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {headerText || `Columna ${idx + 1}`}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {datosExcel.slice(1).map((row, idx) => (
                                    <tr key={idx} style={{ 
                                        borderBottom: '1px solid #ddd',
                                        backgroundColor: idx % 2 === 0 ? '#fff' : '#f8fff9'
                                    }}>
                                        {row.map((cellValue, cidx) => {
                                            const header = datosExcel[0][cidx];
                                            const headerText = String(header || '').toLowerCase();
                                            
                                            // Si es la columna PHTO o imagen, mostrar imagen
                                            if (headerText === 'phto' || headerText.includes('imagen') || headerText.includes('photo')) {
                                                const imagenUrl = obtenerUrlImagen(cellValue);
                                                
                                                return (
                                                    <td key={cidx} className="celda-imagen" style={{ 
                                                        padding: '10px',
                                                        textAlign: 'center'
                                                    }}>
                                                        {imagenUrl ? (
                                                            <img
                                                                src={imagenUrl}
                                                                alt="Imagen del producto"
                                                                style={{
                                                                    width: '50px',
                                                                    height: '50px',
                                                                    objectFit: 'cover',
                                                                    borderRadius: '4px',
                                                                    border: '1px solid #ddd'
                                                                }}
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                    e.target.parentNode.innerHTML = '<span style="color: #999; font-size: 11px;">Sin imagen</span>';
                                                                }}
                                                            />
                                                        ) : (
                                                            <span style={{ color: '#999', fontSize: '12px' }}>Sin imagen</span>
                                                        )}
                                                    </td>
                                                );
                                            }
                                            
                                            // Para descripción, mostrar con tooltip
                                            if (headerText.includes('descripcion') || headerText.includes('description')) {
                                                const descripcion = String(cellValue || '');
                                                return (
                                                    <td key={cidx} className="celda-descripcion" style={{ 
                                                        padding: '10px',
                                                        maxWidth: '300px',
                                                        wordWrap: 'break-word'
                                                    }} title={descripcion}>
                                                        {descripcion || ''}
                                                    </td>
                                                );
                                            }
                                            
                                            // Para números, formatear
                                            if (headerText.includes('precio') || headerText.includes('price') || 
                                                headerText.includes('gw') || headerText.includes('cbm') ||
                                                headerText.includes('cantidad') || headerText.includes('qty')) {
                                                const numValue = Number(cellValue);
                                                const formatted = !isNaN(numValue) && numValue !== 0 
                                                    ? numValue.toLocaleString('es-ES', { 
                                                        minimumFractionDigits: 0, 
                                                        maximumFractionDigits: 2 
                                                    })
                                                    : String(cellValue || '');
                                                
                                                return (
                                                    <td key={cidx} style={{ 
                                                        padding: '10px',
                                                        textAlign: 'right',
                                                        fontFamily: 'monospace'
                                                    }}>
                                                        {formatted}
                                                    </td>
                                                );
                                            }
                                            
                                            // Para cualquier otra columna
                                            return (
                                                <td key={cidx} style={{ 
                                                    padding: '10px',
                                                    fontSize: '14px'
                                                }}>
                                                    {String(cellValue || '')}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="tabla-leyenda" style={{ 
                        marginTop: '10px',
                        fontSize: '12px',
                        color: '#666',
                        textAlign: 'center'
                    }}>
                        ← Desliza horizontalmente para ver más columnas →
                    </div>
                </div>
            )}
            
            {/* Mensaje si no hay datos */}
            {(!datosValidos || !tieneHeader || datosExcel.length <= 1) && filasConError.length === 0 && (
                <div style={{ 
                    padding: '20px',
                    textAlign: 'center',
                    color: '#666',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #ddd'
                }}>
                    <p style={{ margin: 0, fontSize: '16px' }}>
                        No hay datos para mostrar. Por favor, carga un archivo Excel.
                    </p>
                </div>
            )}
        </>
    );
};

export default TablasDatos;
