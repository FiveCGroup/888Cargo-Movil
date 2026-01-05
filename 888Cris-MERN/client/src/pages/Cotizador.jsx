import React from 'react';
import { useNavigate } from 'react-router-dom';
import cotizacionService from '../services/cotizacionService';
import useCotizador from '../hooks/useCotizador';
import CotizadorForm from '../components/CotizadorForm';
import ResultadoCotizacion from '../components/ResultadoCotizacion';
import '../styles/Cotizador.css'; // <-- conexión al CSS

const DESTINOS = ['China', 'Miami', 'Europa'];
const CONFIG = cotizacionService.getConfig ? cotizacionService.getConfig() : {};

// helper local para formatear números de forma segura
const fmt = (v, dp = 2) => Number(v ?? 0).toFixed(dp);

const Cotizador = () => {
    const navigate = useNavigate();
    const {
        loading,
        resultado,
        resultadoId,
        tipoEnvio,
        setTipoEnvio,
        formData,
        volumenCalculado,
        handleChange,
        handleSubmit,
        limpiarFormulario
    } = useCotizador('maritimo');

    // tarifa actual según tipo y destino (evita referencia indefinida)
    const tarifaActual = tipoEnvio === 'maritimo'
      ? CONFIG.TARIFAS_USD?.MARITIMO_LCL?.[formData.destino]?.promedio ?? 0
      : CONFIG.TARIFAS_USD?.AEREO_KG?.[formData.destino]?.promedio ?? 0;
    
    // antes del return, calcular comparativa segura
    const detalle = resultado?.detalleCalculo ?? {};
    const volumenReal = Number(detalle.volumenReal ?? resultado?.volumen_m3 ?? volumenCalculado ?? 0);
    const volumenCobrable = Number(detalle.volumenCobrable ?? Math.max(volumenReal, CONFIG.MINIMO_MARITIMO_M3 || 1));
    const pesoReal = Number(detalle.pesoReal ?? resultado?.peso_kg ?? 0);
    const tarifaUSD = Number(detalle.tarifaUSD ?? tarifaActual ?? 0);

    // opción A: solo volumen (considera posible FCL si tienes ese dato en detalle)
    const costoPorVolumenUSD = Number(detalle.costoPorVolumenUSD ?? (volumenCobrable * tarifaUSD).toFixed(2)) || 0;
    // opción B: volumen + peso (componente peso configurable; usar 0.10 si no viene)
    const factorPesoUSD = Number(detalle.factorPesoUSD ?? 0.10);
    const costoPorPesoUSD = Number(detalle.costoPorPesoUSD ?? (pesoReal * factorPesoUSD).toFixed(2)) || 0;
    const costoPorVolumenMasPesoUSD = Number(detalle.costoPorVolumenMasPesoUSD ?? ( (volumenCobrable * tarifaUSD) + costoPorPesoUSD ).toFixed(2)) || 0;
    const elegido = detalle.elegido ?? (costoPorVolumenUSD >= costoPorVolumenMasPesoUSD ? 'volumen' : 'volumen+peso');
    // si UI usa resultado.detalleCalculo.*, podemos mejorar antes de renderizar:
    const detalleParaMostrar = { ...detalle, costoPorVolumenUSD, costoPorVolumenMasPesoUSD, costoPorPesoUSD, elegido };

    return (
        <div className="cotizador-container">
      <div className="cotizador-header">
        <button className="btn-volver" onClick={() => navigate('/dashboard')}>
          ← Volver
        </button>
        <div className="header-info">
          <h1>Cotizador China → Colombia 🇨🇴</h1>
          <p className="header-subtitle">
            Puerto destino: Buenaventura | TRM: ${CONFIG.TRM_COP_USD.toLocaleString('es-CO')} COP/USD
          </p>
        </div>
      </div>

      <div className="cotizador-content">
        {/* Info de tarifa actual */}
        <div className="tarifa-info">
          {tipoEnvio === 'maritimo' ? (
            <span>⚠️ Marítimo LCL se cobra por VOLUMEN (m³): ${tarifaActual} USD/m³</span>
          ) : (
            <span>✈️ Aéreo se cobra por PESO COBRABLE: ${tarifaActual} USD/kg</span>
          )}
        </div>

        {/* Selector de tipo de envío */}
        <div className="tipo-envio-selector">
          <button 
            className={`tipo-btn ${tipoEnvio === 'maritimo' ? 'active' : ''}`}
            onClick={() => setTipoEnvio('maritimo')}
          >
            🚢 Marítimo
          </button>
          <button 
            className={`tipo-btn ${tipoEnvio === 'aereo' ? 'active' : ''}`}
            onClick={() => setTipoEnvio('aereo')}
          >
            ✈️ Aéreo
          </button>
        </div>

        {/* Formulario */}
        <form className="cotizador-form" onSubmit={handleSubmit}>
          {/* Destino */}
          <div className="form-group">
            <label>Destino de Origen</label>
            <select 
              name="destino" 
              value={formData.destino} 
              onChange={handleChange}
            >
              {DESTINOS.map(d => (
                <option key={d} value={d}>
                  {d === 'China' ? '🇨🇳 China / Asia' : d === 'Miami' ? '🇺🇸 Miami / USA' : '🇪🇺 Europa'}
                </option>
              ))}
            </select>
          </div>

          {/* Dimensiones */}
          <div className="dimensiones-section">
            <h3>📐 Dimensiones (prioridad: manual {'>'} metros {'>'} centímetros)</h3>
            
            <div className="dimensiones-grid">
              <div className="dimension-col">
                <label className="col-title">Largo</label>
                <div className="input-group">
                  <input
                    type="number"
                    name="largoCm"
                    value={formData.largoCm}
                    onChange={handleChange}
                    placeholder="cm"
                    min="0"
                  />
                  <span className="input-suffix">cm</span>
                </div>
                <div className="input-group">
                  <input
                    type="number"
                    name="largoMt"
                    value={formData.largoMt}
                    onChange={handleChange}
                    placeholder="m"
                    min="0"
                    step="0.01"
                  />
                  <span className="input-suffix">m</span>
                </div>
              </div>

              <div className="dimension-col">
                <label className="col-title">Ancho</label>
                <div className="input-group">
                  <input
                    type="number"
                    name="anchoCm"
                    value={formData.anchoCm}
                    onChange={handleChange}
                    placeholder="cm"
                    min="0"
                  />
                  <span className="input-suffix">cm</span>
                </div>
                <div className="input-group">
                  <input
                    type="number"
                    name="anchoMt"
                    value={formData.anchoMt}
                    onChange={handleChange}
                    placeholder="m"
                    min="0"
                    step="0.01"
                  />
                  <span className="input-suffix">m</span>
                </div>
              </div>

              <div className="dimension-col">
                <label className="col-title">Alto</label>
                <div className="input-group">
                  <input
                    type="number"
                    name="altoCm"
                    value={formData.altoCm}
                    onChange={handleChange}
                    placeholder="cm"
                    min="0"
                  />
                  <span className="input-suffix">cm</span>
                </div>
                <div className="input-group">
                  <input
                    type="number"
                    name="altoMt"
                    value={formData.altoMt}
                    onChange={handleChange}
                    placeholder="m"
                    min="0"
                    step="0.01"
                  />
                  <span className="input-suffix">m</span>
                </div>
              </div>

              <div className="dimension-col">
                <label className="col-title">Peso *</label>
                <div className="input-group">
                  <input
                    type="number"
                    name="peso"
                    value={formData.peso}
                    onChange={handleChange}
                    placeholder="kg"
                    min="0"
                    step="0.1"
                    required
                  />
                  <span className="input-suffix">kg</span>
                </div>
              </div>
            </div>

            {/* Volumen Manual */}
            <div className="volumen-manual">
              <label>Volumen Manual (opcional)</label>
              <div className="input-group">
                <input
                  type="number"
                  name="volumenManual"
                  value={formData.volumenManual}
                  onChange={handleChange}
                  placeholder="m³"
                  min="0"
                  step="0.001"
                />
                <span className="input-suffix">m³</span>
              </div>
            </div>
          </div>

          {/* Volumen Calculado */}
          <div className="volumen-calculado">
            <span className="label">📦 Volumen Calculado:</span>
            <span className="valor">{(Number(volumenCalculado) || 0).toFixed(3)} m³</span>
          </div>

          {/* Botones */}
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-limpiar"
              onClick={limpiarFormulario}
            >
              🗑️ Limpiar
            </button>
            <button 
              type="submit" 
              className="btn-cotizar"
              disabled={loading}
            >
              {loading ? '⏳ Calculando...' : '💰 Cotizar Envío'}
            </button>
          </div>
        </form>

        {/* Resultado */}
        {resultado && (
          <div className="resultado-cotizacion">
            <h2>📊 Resultado de Cotización</h2>
            
            <div className="resultado-header">
              <span className="tipo-badge">
                {resultado.tipo === 'maritimo' ? '🚢 Marítimo LCL' : '✈️ Aéreo'}
              </span>
              <span className="destino-badge">
                {resultado.destino} → Colombia 🇨🇴
              </span>
              {resultado.isLocal && (
                <span className="local-badge">⚠️ Cálculo local</span>
              )}
            </div>

            {/* Precios */}
            <div className="resultado-precios">
              <div className="precio-item principal">
                <span className="label">💵 Total USD</span>
                <span className="valor">${resultado.valor_usd}</span>
              </div>
              <div className="precio-item">
                <span className="label">💵 Total COP</span>
                <span className="valor">${resultado.valor_cop?.toLocaleString('es-CO')}</span>
              </div>
            </div>

            {/* Detalles del cálculo */}
            <div className="resultado-detalles">
              <h3>📋 Detalles del Cálculo</h3>
              
              {resultado.tipo === 'maritimo' ? (
                <>
                  <div className="detalle-grid">
                    <div className="detalle-item">
                      <span className="label">📦 Volumen Real</span>
                      <span className="valor">{fmt(detalleParaMostrar.volumenReal ?? resultado.volumen_m3, 3)} m³</span>
                    </div>
                    <div className="detalle-item destacado">
                      <span className="label">📦 Volumen Cobrable</span>
                      <span className="valor">{fmt(detalleParaMostrar.volumenCobrable ?? resultado.volumen_m3, 3)} m³</span>
                    </div>
                    <div className="detalle-item">
                      <span className="label">⚖️ Peso Real (ref)</span>
                      <span className="valor">{fmt(detalleParaMostrar.pesoReal ?? resultado.peso_kg, 2)} kg</span>
                    </div>
                    <div className="detalle-item">
                      <span className="label">⚖️ Peso Volumétrico (ref)</span>
                      <span className="valor">{fmt(detalleParaMostrar.pesoVolumetrico ?? 0, 2)} kg</span>
                    </div>
                  </div>

                  {/* Eliminado aviso repetitivo — diseño reorganizado abajo */}
                  <div className="detalle-layout">
                    <div className="left-panel">
                      {/* comparativa y explicación */}
                      <div className="comparativa-maritima">
                        <h4>🔍 Comparativa Marítima</h4>
                        <div className="detalle-grid">
                          <div className="detalle-item">
                            <span className="label">Opción A — Por volumen</span>
                            <span className="valor">${fmt(detalleParaMostrar.costoPorVolumenUSD, 2)} USD</span>
                          </div>
                          <div className="detalle-item">
                            <span className="label">Opción B — Volumen + Peso</span>
                            <span className="valor">${fmt(detalleParaMostrar.costoPorVolumenMasPesoUSD, 2)} USD</span>
                          </div>
                          <div className="detalle-item">
                            <span className="label">Componente peso (USD)</span>
                            <span className="valor">${fmt(detalleParaMostrar.costoPorPesoUSD, 2)} USD</span>
                          </div>
                          <div className="detalle-item destacado">
                            <span className="label">Elegido</span>
                            <span className="valor">{detalleParaMostrar.elegido ?? 'volumen'}</span>
                          </div>
                        </div>
                        <p className="explicacion">{detalleParaMostrar.explicacion}</p>
                      </div>
                    </div>
                    <div className="right-panel">
                      {/* espacio para tarjetas resumen si hace falta, reuse existing detalles */}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="detalle-grid">
                    <div className="detalle-item">
                      <span className="label">📦 Volumen</span>
                      <span className="valor">{resultado.volumen_m3} m³</span>
                    </div>
                    <div className="detalle-item">
                      <span className="label">⚖️ Peso Real</span>
                      <span className="valor">{resultado.peso_kg} kg</span>
                    </div>
                    <div className="detalle-item">
                      <span className="label">📊 Peso Volumétrico</span>
                      <span className="valor">{resultado.detalleCalculo?.pesoVolumetrico} kg</span>
                    </div>
                    <div className="detalle-item destacado">
                      <span className="label">💰 Peso Cobrable</span>
                      <span className="valor">{detalleParaMostrar.pesoCobrable} kg</span>
                    </div>
                  </div>
                  <div className="info-banner aereo">
                    <p>💡 Gana: <strong>{resultado.detalleCalculo?.gana}</strong>. {resultado.detalleCalculo?.explicacion}</p>
                  </div>
                </>
              )}

              <div className="detalle-grid extra">
                <div className="detalle-item">
                  <span className="label">Tarifa Base</span>
                  <span className="valor">${detalleParaMostrar.tarifaUSD} {detalleParaMostrar.tipoCobro}</span>
                </div>
                <div className="detalle-item">
                  <span className="label">TRM</span>
                  <span className="valor">${resultado.trm?.toLocaleString('es-CO')} COP/USD</span>
                </div>
                <div className="detalle-item">
                  <span className="label">⏱️ Tiempo Estimado</span>
                  <span className="valor">{resultado.tiempo_estimado}</span>
                </div>
              </div>
            </div>

            {/* Botón descargar */}
            <button
              className="btn-descargar"
              onClick={async () => {
                if (!resultadoId) {
                  // si no hay id, fallback a imprimir
                  return window.print();
                }
                try {
                  await cotizacionService.descargarPdfCotizacion(resultadoId);
                } catch (err) {
                  console.error('Error descargando PDF:', err);
                  window.print();
                }
              }}
            >
              📄 Descargar Cotización
            </button>
          </div>
        )}
      </div>
    </div>
    );
};

export default Cotizador;