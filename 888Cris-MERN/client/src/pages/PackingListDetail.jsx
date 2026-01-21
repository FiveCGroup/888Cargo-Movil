import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import cargaService from "../services/cargaService";
import "../styles/components/Dashboard.css";
import "../styles/global/buttons.css";

const PackingListDetail = () => {
  const { idCarga } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [carga, setCarga] = useState(null);
  const [Items, setItems] = useState([]); // items crudos tal como vienen del backend (para tabla completa)
  const [estadisticas, setEstadisticas] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!idCarga) {
        setError("ID de carga no válido");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const resp = await cargaService.obtenerPackingList(idCarga);
        if (!resp.success)
          throw new Error(
            resp.error || "No fue posible obtener el packing list"
          );

        // El backend responde { success: true, data: { items: [...], estadisticas: {...}, carga: {...}, cliente: {...} } }
        const payload = resp.data.data || resp.data || {};
        const itemsList = payload.items || [];
        const statsFromServer = payload.estadisticas || {};
        const cargaFromServer = payload.carga || {};
        const clienteFromServer = payload.cliente || {};

        // Extraer metadata de la carga desde el backend o desde el primer item si existe
        let cargaMeta = {
          id: idCarga,
          codigo_carga: cargaFromServer.codigo_carga || null,
          nombre_cliente: clienteFromServer?.nombre_cliente || cargaFromServer.nombre_cliente || null,
          telefono_cliente: clienteFromServer?.telefono_cliente || cargaFromServer.telefono_cliente || null,
          correo_cliente: clienteFromServer?.correo_cliente || cargaFromServer.correo_cliente || null,
          ciudad_cliente: clienteFromServer?.ciudad_cliente || cargaFromServer.ciudad_cliente || null,
          createdAt: cargaFromServer.fecha_recepcion || cargaFromServer.fecha_inicio || cargaFromServer.created_at || null,
          destino: cargaFromServer.destino || null,
          shipping_mark: cargaFromServer.shipping_mark || null,
          estado: cargaFromServer.estado || null,
        };

        // Si no hay datos del backend, intentar desde el primer item
        if (itemsList.length > 0 && !cargaMeta.codigo_carga) {
          const primer = itemsList[0];
          cargaMeta = {
            ...cargaMeta,
            nombre_cliente: cargaMeta.nombre_cliente || primer.nombre_cliente || primer.cliente || primer.nombre || null,
            codigo_carga: cargaMeta.codigo_carga || primer.codigo_carga || primer.codigo || null,
            createdAt: cargaMeta.createdAt || primer.fecha_inicio || primer.fecha_creacion || primer.fecha || null,
            telefono_cliente: cargaMeta.telefono_cliente || primer.telefono_cliente || primer.telefono || null,
          };
        }

        // Normalizar items para la tabla (columnas: REF, Descripción, Cantidad, Cajas, Peso, Valor)
        const normalized = itemsList.map((it) => ({
          id: it.id_articulo || it.id_articulo || it.id || it.id_articulo,
          ref: it.ref_art || it.ref || it.cn || it.codigo_unico || "",
          descripcion:
            it.descripcion_espanol || it.descripcion || it.name || "",
          cantidad:
            it.cant_por_caja ||
            it.cantidad_en_caja ||
            it.cantidad ||
            it.unidad ||
            0,
          cajas:
            it.detalle_cajas || it.total_cajas || it.total_cajas_articulo || "",
          peso: it.gw || it.peso_total || it.weight || 0,
          valor: it.precio_total || it.valor_total || it.price_total || 0,
          imagen_url: it.imagen_url || null,
        }));

        // Si backend entrega estadísticas agregadas, úsalas; si no, calcula valores básicos
        const stats = { ...statsFromServer };
        if (!stats.totalValor) {
          stats.totalValor = normalized.reduce(
            (s, x) => s + Number(x.valor || 0),
            0
          );
        }
        if (!stats.pesoTotal) {
          stats.pesoTotal = normalized.reduce(
            (s, x) => s + Number(x.peso || 0),
            0
          );
        }
        if (!stats.cantidadItems) stats.cantidadItems = normalized.length;
        if (!stats.cantidadCajas) {
          // intentar inferir cajas contando cadenas detalle_cajas
          const cajasSet = new Set();
          itemsList.forEach((it) => {
            if (it.detalle_cajas) cajasSet.add(it.detalle_cajas);
          });
          stats.cantidadCajas =
            stats.total_cajas ||
            stats.totalCajas ||
            cajasSet.size ||
            normalized.length;
        }

        setCarga(cargaMeta);
        setItems(itemsList);
        setEstadisticas(stats);
      } catch (err) {
        console.error("Error obteniendo packing list:", err);
        setError(err.message || "Error al obtener datos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [idCarga]);

  if (loading)
    return (
      <div className="dashboard-layout visualizar-qr-container">
        <Navbar user={null} />
        <div className="dashboard-main-content">
          <div style={{ padding: 40, textAlign: "center" }}>
            Cargando packing list...
          </div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="dashboard-layout visualizar-qr-container">
        <Navbar user={null} />
        <div className="dashboard-main-content">
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "var(--color-danger)",
            }}
          >
            Error: {error}
          </div>
          <div style={{ textAlign: "center" }}>
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate(-1)}
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="dashboard-layout visualizar-qr-container">
      <Navbar user={user} />
      <div className="dashboard-main-content">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <button
            className="btn-back-icon"
            onClick={() => navigate(-1)}
            title="Volver"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1
            style={{
              flex: 1,
              textAlign: "center",
              color: "var(--color-primary)",
            }}
          >
            Packing List - Carga {carga?.codigo_carga || `#${idCarga}`}
          </h1>
        </div>

        {/* Información de la carga */}
        {carga && (
          <div
            style={{
              background: "var(--bg-secondary)",
              padding: "1rem",
              borderRadius: 8,
              marginBottom: "1rem",
            }}
          >
            <h3 style={{ marginTop: 0, color: "var(--color-primary)" }}>
              Información de la Carga
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {carga.nombre_cliente && (
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    Cliente
                  </div>
                  <div style={{ fontWeight: 600 }}>{carga.nombre_cliente}</div>
                </div>
              )}
              {carga.correo_cliente && (
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    Email
                  </div>
                  <div style={{ fontWeight: 600 }}>{carga.correo_cliente}</div>
                </div>
              )}
              {carga.telefono_cliente && (
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    Teléfono
                  </div>
                  <div style={{ fontWeight: 600 }}>{carga.telefono_cliente}</div>
                </div>
              )}
              {carga.destino && (
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    Destino
                  </div>
                  <div style={{ fontWeight: 600 }}>{carga.destino}</div>
                </div>
              )}
              {carga.shipping_mark && (
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    Shipping Mark
                  </div>
                  <div style={{ fontWeight: 600 }}>{carga.shipping_mark}</div>
                </div>
              )}
              {carga.estado && (
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    Estado
                  </div>
                  <div style={{ fontWeight: 600 }}>{carga.estado}</div>
                </div>
              )}
              {carga.createdAt && (
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    Fecha de creación
                  </div>
                  <div style={{ fontWeight: 600 }}>
                    {new Date(carga.createdAt).toLocaleString("es-ES")}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Estadísticas */}
        <div
          style={{
            marginBottom: "1rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          <div
            style={{
              padding: 12,
              background: "var(--bg-primary)",
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              Valor total
            </div>
            <div style={{ fontWeight: 600 }}>
              {Number(
                estadisticas.totalValor || estadisticas.precio_total_carga || 0
              ).toLocaleString("es-ES", { style: "currency", currency: "USD" })}
            </div>
          </div>
          <div
            style={{
              padding: 12,
              background: "var(--bg-primary)",
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              Peso total
            </div>
            <div style={{ fontWeight: 600 }}>
              {Number(
                estadisticas.pesoTotal || 0
              ).toLocaleString("es-ES")}{" "}
              kg
            </div>
          </div>
          <div
            style={{
              padding: 12,
              background: "var(--bg-primary)",
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              Cantidad de items
            </div>
            <div style={{ fontWeight: 600 }}>
              {estadisticas.cantidadItems || estadisticas.total_articulos || 0}
            </div>
          </div>
          <div
            style={{
              padding: 12,
              background: "var(--bg-primary)",
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              Cantidad de cajas
            </div>
            <div style={{ fontWeight: 600 }}>
              {estadisticas.cantidadCajas ||
                estadisticas.total_cajas ||
                estadisticas.totalCajas ||
                0}
            </div>
          </div>
          {estadisticas.cbm_total !== undefined && estadisticas.cbm_total > 0 && (
            <div
              style={{
                padding: 12,
                background: "var(--bg-primary)",
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Volumen total (CBM)
              </div>
              <div style={{ fontWeight: 600 }}>
                {Number(estadisticas.cbm_total || 0).toLocaleString("es-ES", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                m³
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            background: "var(--bg-secondary)",
            padding: 12,
            borderRadius: 8,
          }}
        >
          <h3 style={{ marginTop: 0, color: "var(--color-primary)" }}>
            Detalle de Items
          </h3>
          <div
            className="tabla-container"
            style={{ overflowX: "auto", maxWidth: "100%" }}
          >
            {/* Build headers as union of all keys returned by backend to show every field */}
            {Items && Items.length > 0 ? (
              (() => {
                const allKeys = new Set();
                Items.forEach((it) =>
                  Object.keys(it || {}).forEach((k) => allKeys.add(k))
                );
                // Preferir un orden sensato para campos comunes (excluyendo duplicados)
                // Campos duplicados eliminados: "ref", "descripcion", "cantidad", "peso", "valor"
                const preferred = [
                  "id",
                  "id_articulo",
                  "ref_art", // Solo ref_art, no "ref"
                  "cn",
                  "descripcion_espanol", // Solo descripcion_espanol, no "descripcion"
                  "descripcion_chino",
                  "unidad",
                  "cant_por_caja", // Solo cant_por_caja, no "cantidad"
                  "precio_unidad",
                  "precio_total", // Solo precio_total, no "valor"
                  "gw", // Solo gw, no "peso"
                  "peso_total", // Peso total del Excel (G.W.TT)
                  "cbm",
                  "medida_largo",
                  "medida_ancho",
                  "medida_alto",
                  "material",
                  "marca_producto",
                  "numero_caja",
                  "total_cajas",
                  "cantidad_en_caja",
                  "detalle_cajas",
                  "estado_caja",
                  "observaciones_caja",
                  "imagen_url",
                  "serial",
                  "fecha",
                ];
                
                // Campos a excluir explícitamente (duplicados)
                const excludedFields = new Set([
                  "ref", // Duplicado de ref_art
                  "descripcion", // Duplicado de descripcion_espanol
                  "cantidad", // Duplicado de cant_por_caja
                  "peso", // Duplicado de gw
                  "valor", // Duplicado de precio_total
                  "cajas", // Información redundante
                ]);
                const headers = [];
                preferred.forEach((h) => {
                  if (allKeys.has(h) && !excludedFields.has(h)) {
                    headers.push(h);
                    allKeys.delete(h);
                  }
                });
                // Append remaining keys (excluyendo campos duplicados)
                const rest = Array.from(allKeys)
                  .filter(k => !excludedFields.has(k))
                  .sort();
                const finalHeaders = headers.concat(rest);

                return (
                  <table
                    className="tabla-datos"
                    style={{
                      minWidth: Math.max(1000, finalHeaders.length * 160),
                    }}
                  >
                    <thead>
                      <tr>
                        {finalHeaders.map((h) => {
                          // Traducir nombres de columnas a español legible
                          const headerLabels = {
                            id: "ID",
                            id_articulo: "ID Artículo",
                            id_caja: "ID Caja",
                            ref_art: "Ref. Artículo",
                            cn: "CN",
                            descripcion_espanol: "Descripción Español",
                            descripcion_chino: "Descripción Chino",
                            unidad: "Unidad",
                            cant_por_caja: "Unidades Empaque",
                            precio_unidad: "Precio Unitario",
                            precio_total: "Precio Total",
                            gw: "Peso (GW)",
                            peso_total: "Peso Total",
                            cbm: "CBM",
                            medida_largo: "Medida Largo (cm)",
                            medida_ancho: "Medida Ancho (cm)",
                            medida_alto: "Medida Alto (cm)",
                            material: "Material",
                            marca_producto: "Marca Producto",
                            numero_caja: "Número Caja",
                            total_cajas: "Total Cajas",
                            cantidad_en_caja: "Cantidad en Caja",
                            detalle_cajas: "Detalle Cajas",
                            estado_caja: "Estado Caja",
                            observaciones_caja: "Observaciones Caja",
                            imagen_url: "Imagen",
                            serial: "Serial",
                            fecha: "Fecha",
                            codigo_carga: "Código Carga",
                            nombre_cliente: "Cliente",
                            telefono_cliente: "Teléfono",
                            correo_cliente: "Email",
                            ciudad_cliente: "Ciudad",
                            fecha_inicio: "Fecha Inicio",
                            fecha_creacion: "Fecha Creación",
                          };
                          
                          const displayLabel = headerLabels[h] || h.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                          
                          return (
                            <th
                              key={h}
                              style={{ padding: 8, whiteSpace: "nowrap" }}
                            >
                              {displayLabel}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {Items.map((it, idx) => (
                        <tr key={it.id_articulo || it.id || idx}>
                          {finalHeaders.map((h) => {
                            let v = it[h];
                            if (v === null || v === undefined) v = "";
                            
                            // Formatear números y moneda para campos comunes
                            // Diferenciar precio_unidad de precio_total/valor
                            if (
                              h === "precio_unidad" &&
                              !isNaN(Number(v)) &&
                              Number(v) !== 0
                            ) {
                              try {
                                v = Number(v).toLocaleString("es-ES", {
                                  style: "currency",
                                  currency: "USD",
                                });
                              } catch {
                                /* ignorar */
                              }
                            } else if (
                              (h.toLowerCase().includes("precio") ||
                                h.toLowerCase().includes("valor") ||
                                h.toLowerCase().includes("price") ||
                                h === "precio_total" ||
                                h === "valor") &&
                              h !== "precio_unidad" &&
                              !isNaN(Number(v)) &&
                              Number(v) !== 0
                            ) {
                              try {
                                v = Number(v).toLocaleString("es-ES", {
                                  style: "currency",
                                  currency: "USD",
                                });
                              } catch {
                                /* ignorar */
                              }
                            } else if (
                              (h.toLowerCase().includes("peso") ||
                                h.toLowerCase().includes("gw") ||
                                h === "gw" ||
                                h === "peso_total") &&
                              !isNaN(Number(v)) &&
                              Number(v) !== 0
                            ) {
                              v = Number(v).toLocaleString("es-ES", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }) + " kg";
                            } else if (
                              (h.toLowerCase().includes("cbm") ||
                                h === "cbm") &&
                              !isNaN(Number(v)) &&
                              Number(v) !== 0
                            ) {
                              v = Number(v).toLocaleString("es-ES", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }) + " m³";
                            } else if (
                              (h.toLowerCase().includes("medida") ||
                                h === "medida_largo" ||
                                h === "medida_ancho" ||
                                h === "medida_alto") &&
                              !isNaN(Number(v)) &&
                              Number(v) !== 0
                            ) {
                              v = Number(v).toLocaleString("es-ES", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }) + " cm";
                            } else if (
                              (h.toLowerCase().includes("cantidad") ||
                                h === "cantidad" ||
                                h === "cant_por_caja" ||
                                h === "cantidad_en_caja") &&
                              !isNaN(Number(v)) &&
                              Number(v) !== 0
                            ) {
                              v = Number(v).toLocaleString("es-ES");
                            } else if (
                              h.toLowerCase().includes("fecha") ||
                              h === "fecha" ||
                              h === "created_at" ||
                              h === "fecha_creacion" ||
                              h === "fecha_inicio"
                            ) {
                              try {
                                if (v && v !== "") {
                                  const fecha = new Date(v);
                                  if (!isNaN(fecha.getTime())) {
                                    v = fecha.toLocaleString("es-ES");
                                  }
                                }
                              } catch {
                                /* ignorar */
                              }
                            }
                            
                            // Manejar URLs de imágenes: mostrar enlace compacto en lugar de URL completa
                            const isImageUrlField = (
                              h.toLowerCase().includes("imagen") ||
                              h.toLowerCase().includes("image") ||
                              h === "imagen_url" ||
                              h === "image_url"
                            );
                            
                            const hasImageUrl = isImageUrlField && v && String(v).trim() !== "";
                            
                            // Si es una URL (http/https) o una ruta, tratarla como imagen
                            const isUrl = hasImageUrl && (
                              String(v).startsWith("http") ||
                              String(v).startsWith("https") ||
                              String(v).startsWith("/") ||
                              String(v).includes(".")
                            );
                            
                            return (
                              <td
                                key={h}
                                style={{ 
                                  padding: 8, 
                                  whiteSpace: "nowrap",
                                  maxWidth: isUrl ? "120px" : "auto"
                                }}
                              >
                                {isUrl ? (
                                  <a
                                    href={String(v)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      color: "var(--color-primary)",
                                      textDecoration: "none",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      maxWidth: "100%",
                                    }}
                                    title={`Ver imagen: ${String(v)}`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <i className="fas fa-image" style={{ fontSize: "14px", flexShrink: 0 }}></i>
                                    <span style={{ 
                                      overflow: "hidden", 
                                      textOverflow: "ellipsis", 
                                      whiteSpace: "nowrap",
                                      maxWidth: "80px"
                                    }}>
                                      Ver imagen
                                    </span>
                                  </a>
                                ) : (
                                  <span style={{ 
                                    display: "inline-block",
                                    maxWidth: isImageUrlField ? "150px" : "300px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap"
                                  }}
                                  title={String(v)}
                                  >
                                    {String(v)}
                                  </span>
                                )}
                              </td>
                            );
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
