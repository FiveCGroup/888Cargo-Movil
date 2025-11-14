import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import cargaService from '../services/cargaService';
import '../styles/components/Dashboard.css';
import '../styles/global/buttons.css';

const PackingListDetail = () => {
    const { idCarga } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [carga, setCarga] = useState(null);
    const [items, setItems] = useState([]); // normalized items (para stats y vistas resumidas)
    const [rawItems, setRawItems] = useState([]); // items crudos tal como vienen del backend (para tabla completa)
    const [estadisticas, setEstadisticas] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            if (!idCarga) {
                setError('ID de carga no válido');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const resp = await cargaService.obtenerPackingList(idCarga);
                if (!resp.success) throw new Error(resp.error || 'No fue posible obtener el packing list');

                // El backend responde { success: true, data: { items: [...], estadisticas: {...} } }
                const payload = resp.data.data || resp.data || {};
                const itemsList = payload.items || [];
                const statsFromServer = payload.estadisticas || payload || {};

                // Extraer metadata de la carga desde el primer item si existe
                let cargaMeta = {};
                if (itemsList.length > 0) {
                    const primer = itemsList[0];
                    cargaMeta = {
                        id: idCarga,
                        nombre_cliente: primer.nombre_cliente || primer.cliente || primer.nombre || null,
                        codigo_carga: primer.codigo_carga || primer.codigo || null,
                        createdAt: primer.fecha_inicio || primer.fecha_creacion || primer.fecha || null,
                        telefono_cliente: primer.telefono_cliente || primer.telefono || null,
                        archivo_original: primer.archivo_original || null
                    };
                }

                // Normalizar items para la tabla (columnas: REF, Descripción, Cantidad, Cajas, Peso, Valor)
                const normalized = itemsList.map(it => ({
                    id: it.id_articulo || it.id_articulo || it.id || it.id_articulo,
                    ref: it.ref_art || it.ref || it.cn || it.codigo_unico || '',
                    descripcion: it.descripcion_espanol || it.descripcion || it.name || '',
                    cantidad: it.unidades_empaque || it.cantidad_en_caja || it.cantidad || it.unidad || 0,
                    cajas: it.detalle_cajas || it.total_cajas || it.total_cajas_articulo || '',
                    peso: it.gw || it.peso_total || it.weight || 0,
                    valor: it.precio_total || it.valor_total || it.price_total || 0,
                    imagen_url: it.imagen_url || null
                }));

                // Si backend entrega estadísticas agregadas, úsalas; si no, calcula valores básicos
                const stats = { ...statsFromServer };
                if (!stats.totalValor) {
                    stats.totalValor = normalized.reduce((s, x) => s + Number(x.valor || 0), 0);
                }
                if (!stats.pesoTotal) {
                    stats.pesoTotal = normalized.reduce((s, x) => s + Number(x.peso || 0), 0);
                }
                if (!stats.cantidadItems) stats.cantidadItems = normalized.length;
                if (!stats.cantidadCajas) {
                    // intentar inferir cajas contando cadenas detalle_cajas
                    const cajasSet = new Set();
                    itemsList.forEach(it => {
                        if (it.detalle_cajas) cajasSet.add(it.detalle_cajas);
                    });
                    stats.cantidadCajas = (stats.total_cajas || stats.totalCajas) || (cajasSet.size || normalized.length);
                }

                setCarga(cargaMeta);
                setItems(normalized);
                setRawItems(itemsList);
                setEstadisticas(stats);

                    // Obtener metadata oficial de la carga (nombre cliente y fecha de creación)
                    try {
                        const metaResp = await cargaService.obtenerCargaMeta(idCarga);
                        if (metaResp.success && metaResp.data && metaResp.data.data) {
                            const meta = metaResp.data.data;
                            setCarga(prev => ({ ...prev, nombre_cliente: meta.nombre_cliente || meta.nombre || prev.nombre_cliente, createdAt: meta.fecha_creacion || meta.fecha_inicio || prev.createdAt }));
                        }
                    } catch (metaErr) {
                        // No crítico
                        console.warn('No se pudo obtener metadata adicional de la carga', metaErr);
                    }
            } catch (err) {
                console.error('Error obteniendo packing list:', err);
                setError(err.message || 'Error al obtener datos');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [idCarga]);

    if (loading) return (
        <div className="dashboard-layout visualizar-qr-container">
            <Navbar user={null} />
            <div className="dashboard-main-content">
                <div style={{ padding: 40, textAlign: 'center' }}>Cargando packing list...</div>
            </div>
        </div>
    );

    if (error) return (
        <div className="dashboard-layout visualizar-qr-container">
            <Navbar user={null} />
            <div className="dashboard-main-content">
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-danger)' }}>Error: {error}</div>
                <div style={{ textAlign: 'center' }}>
                    <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>Volver</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="dashboard-layout visualizar-qr-container">
            <Navbar user={null} />
            <div className="dashboard-main-content">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <button className="btn-back-icon" onClick={() => navigate(-1)} title="Volver">
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <h1 style={{ flex: 1, textAlign: 'center', color: 'var(--color-primary)' }}>Packing List - Carga {carga?.codigo_carga || `#${idCarga}`}</h1>
                </div>

                <div style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 8 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Creado por</div>
                        <div style={{ fontWeight: 600 }}>{carga?.nombre_cliente || carga?.createdBy || carga?.usuario || 'Sin datos'}</div>
                    </div>
                    <div style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 8 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Fecha de creación</div>
                        <div style={{ fontWeight: 600 }}>{carga?.createdAt ? new Date(carga.createdAt).toLocaleString('es-ES') : 'Sin fecha'}</div>
                    </div>
                    <div style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 8 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Valor total</div>
                        <div style={{ fontWeight: 600 }}>{Number(estadisticas.totalValor || estadisticas.precio_total_carga || 0).toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</div>
                    </div>
                    <div style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 8 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Peso total</div>
                        <div style={{ fontWeight: 600 }}>{Number(estadisticas.pesoTotal || estadisticas.peso_total || estadisticas.peso_total || estadisticas.peso_total || estadisticas.peso_total || estadisticas.peso_total || estadisticas.peso_total || estadisticas.peso_total || estadisticas.peso_total || estadisticas.peso_total || estadisticas.peso_total || estadisticas.peso_total || estadisticas.peso_total || estadisticas.peso_total || estadisticas.peso_total || estadisticas.peso_total || estadisticas.peso_total || estadisticas.peso_total || estadisticas.peso_total || 0).toLocaleString('es-ES')} kg</div>
                    </div>
                    <div style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 8 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Cantidad de items</div>
                        <div style={{ fontWeight: 600 }}>{estadisticas.cantidadItems || estadisticas.total_articulos || 0}</div>
                    </div>
                    <div style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 8 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Cantidad de cajas</div>
                        <div style={{ fontWeight: 600 }}>{estadisticas.cantidadCajas || estadisticas.total_cajas || estadisticas.totalCajas || 0}</div>
                    </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>
                    <h3 style={{ marginTop: 0, color: 'var(--color-primary)' }}>Detalle de Items</h3>
                    <div className="tabla-container" style={{ overflowX: 'auto', maxWidth: '100%' }}>
                        {/* Build headers as union of all keys returned by backend to show every field */}
            {rawItems && rawItems.length > 0 ? (
                            (() => {
                const allKeys = new Set();
                rawItems.forEach(it => Object.keys(it || {}).forEach(k => allKeys.add(k)));
                                // Preferir un orden sensato para campos comunes
                                const preferred = [
                                    'id', 'id_articulo', 'ref', 'ref_art', 'cn', 'descripcion', 'descripcion_espanol', 'unidad',
                                    'cantidad', 'unidades_empaque', 'precio_unidad', 'precio_total', 'valor', 'peso', 'gw', 'cbm',
                                    'medida_largo','medida_ancho','medida_alto','detalle_cajas','cajas','imagen_url','serial','fecha'
                                ];
                                const headers = [];
                                preferred.forEach(h => { if (allKeys.has(h)) { headers.push(h); allKeys.delete(h); } });
                                // Append remaining keys
                                const rest = Array.from(allKeys).sort();
                                const finalHeaders = headers.concat(rest);

                                return (
                                    <table className="tabla-datos" style={{ minWidth: Math.max(1000, finalHeaders.length * 160) }}>
                                        <thead>
                                            <tr>
                                                {finalHeaders.map((h) => (
                                                            <th key={h} style={{ padding: 8, whiteSpace: 'nowrap' }}>{h}</th>
                                                        ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                                    {rawItems.map((it, idx) => (
                                                        <tr key={it.id_articulo || it.id || idx}>
                                                            {finalHeaders.map(h => {
                                                                let v = it[h];
                                                        if (v === null || v === undefined) v = '';
                                                        // Formatear números y moneda para campos comunes
                                                        if ((h.toLowerCase().includes('precio') || h.toLowerCase().includes('valor') || h.toLowerCase().includes('price') || h === 'precio_total' || h === 'valor') && !isNaN(Number(v))) {
                                                            try { v = Number(v).toLocaleString('es-ES', { style: 'currency', currency: 'USD' }); } catch(e) {}
                                                        }
                                                        if ((h.toLowerCase().includes('peso') || h.toLowerCase().includes('gw') || h === 'gw' || h === 'peso_total') && !isNaN(Number(v))) {
                                                            v = Number(v).toLocaleString('es-ES');
                                                        }
                                                        return <td key={h} style={{ padding: 8, whiteSpace: 'nowrap' }}>{String(v)}</td>;
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                );
                            })()
                        ) : (
                            <div style={{ padding: 12 }}>No hay items para mostrar</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PackingListDetail;
