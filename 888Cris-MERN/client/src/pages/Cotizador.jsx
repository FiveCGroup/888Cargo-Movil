import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import cotizacionService from '../services/cotizacionService';
import '../styles/Cotizador.css';

const DESTINOS = ['China', 'Miami', 'Europa'];
const CONFIG = cotizacionService.getConfig();

const Cotizador = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [tipoEnvio, setTipoEnvio] = useState('maritimo');
  
  const [formData, setFormData] = useState({
    largoCm: '',
    anchoCm: '',
    altoCm: '',
    largoMt: '',
    anchoMt: '',
    altoMt: '',
    peso: '',
    volumenManual: '',
    destino: 'China'
  });

  // Calcular volumen automáticamente
  const volumenCalculado = useMemo(() => {
    // Prioridad: manual > metros > centímetros
    if (formData.volumenManual.trim() !== '') {
      const vol = parseFloat(formData.volumenManual) || 0;
      if (vol > 0) return vol;
    }

    const lm = parseFloat(formData.largoMt) || 0;
    const am = parseFloat(formData.anchoMt) || 0;
    const hm = parseFloat(formData.altoMt) || 0;
    if (lm > 0 && am > 0 && hm > 0) {
      return lm * am * hm;
    }

    const lcm = parseFloat(formData.largoCm) || 0;
    const acm = parseFloat(formData.anchoCm) || 0;
    const hcm = parseFloat(formData.altoCm) || 0;
    if (lcm > 0 && acm > 0 && hcm > 0) {
      return (lcm / 100) * (acm / 100) * (hcm / 100);
    }

    return 0;
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const peso = parseFloat(formData.peso) || 0;
    const volumen = volumenCalculado;

    if (peso <= 0) {
      alert('Por favor ingresa un peso válido mayor a 0 kg.');
      return;
    }

    if (volumen <= 0) {
      alert('Por favor ingresa dimensiones válidas o un volumen manual.');
      return;
    }

    if (volumen > CONFIG.CAPACIDAD_CONTENEDOR_M3) {
      alert(`El volumen (${volumen.toFixed(3)} m³) excede la capacidad del contenedor estándar (${CONFIG.CAPACIDAD_CONTENEDOR_M3} m³). Se requiere cotización FCL.`);
    }

    setLoading(true);
    setResultado(null);

    try {
      // Obtener dimensiones en cm
      const largo = parseFloat(formData.largoCm) || (parseFloat(formData.largoMt) * 100) || 100;
      const ancho = parseFloat(formData.anchoCm) || (parseFloat(formData.anchoMt) * 100) || 100;
      const alto = parseFloat(formData.altoCm) || (parseFloat(formData.altoMt) * 100) || 100;

      const datos = {
        peso,
        largo,
        ancho,
        alto,
        destino: formData.destino
      };

      let response;
      if (tipoEnvio === 'maritimo') {
        response = await cotizacionService.cotizarMaritimo(datos);
      } else {
        response = await cotizacionService.cotizarAereo(datos);
      }

      if (response.success) {
        setResultado({
          ...response.data,
          tipo: tipoEnvio,
          isLocal: response.isLocal
        });
      }
    } catch (error) {
      console.error('Error al cotizar:', error);
      alert('Error al realizar la cotización');
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setFormData({
      largoCm: '',
      anchoCm: '',
      altoCm: '',
      largoMt: '',
      anchoMt: '',
      altoMt: '',
      peso: '',
      volumenManual: '',
      destino: 'China'
    });
    setResultado(null);
  };

  const tarifaActual = tipoEnvio === 'maritimo' 
    ? CONFIG.TARIFAS_USD.MARITIMO_LCL[formData.destino]?.promedio 
    : CONFIG.TARIFAS_USD.AEREO_KG[formData.destino]?.promedio;

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
            <span className="valor">{volumenCalculado.toFixed(3)} m³</span>
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
                      <span className="valor">{resultado.detalleCalculo?.volumenReal || resultado.volumen_m3} m³</span>
                    </div>
                    <div className="detalle-item destacado">
                      <span className="label">📦 Volumen Cobrable</span>
                      <span className="valor">{resultado.detalleCalculo?.volumenCobrable || resultado.volumen_m3} m³</span>
                    </div>
                    <div className="detalle-item">
                      <span className="label">⚖️ Peso Real (ref)</span>
                      <span className="valor">{resultado.peso_kg} kg</span>
                    </div>
                    <div className="detalle-item">
                      <span className="label">⚖️ Peso Volumétrico (ref)</span>
                      <span className="valor">{resultado.detalleCalculo?.pesoVolumetrico} kg</span>
                    </div>
                  </div>
                  <div className="info-banner maritimo">
                    <p>💡 En marítimo LCL se cobra SIEMPRE por volumen (m³), no por peso. Mínimo: {CONFIG.MINIMO_MARITIMO_M3} m³</p>
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
                      <span className="valor">{resultado.detalleCalculo?.pesoCobrable} kg</span>
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
                  <span className="valor">${resultado.detalleCalculo?.tarifaUSD} {resultado.detalleCalculo?.tipoCobro}</span>
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
            <button className="btn-descargar" onClick={() => window.print()}>
              📄 Descargar Cotización
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cotizador;