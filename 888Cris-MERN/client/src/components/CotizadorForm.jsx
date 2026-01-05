import React from 'react';

export default function CotizadorForm({
    tipoEnvio = 'maritimo',
    setTipoEnvio,
    formData,
    handleChange,
    handleSubmit,
    limpiarFormulario,
    destinoOptions,
    loading
}) {
    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>Tipo de envío</label>
                <select value={tipoEnvio ?? 'maritimo'} onChange={(e) => setTipoEnvio(e.target.value)}>
                    <option value="maritimo">Marítimo</option>
                    <option value="aereo">Aéreo</option>
                </select>
            </div>

            <div>
                <label>Destino</label>
                <select name="destino" value={formData.destino} onChange={handleChange}>
                    {destinoOptions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>

            <fieldset>
                <legend>Dimensiones (cm)</legend>
                <input name="largoCm" value={formData.largoCm} onChange={handleChange} placeholder="Largo (cm)" />
                <input name="anchoCm" value={formData.anchoCm} onChange={handleChange} placeholder="Ancho (cm)" />
                <input name="altoCm" value={formData.altoCm} onChange={handleChange} placeholder="Alto (cm)" />
            </fieldset>

            <fieldset>
                <legend>Dimensiones (m)</legend>
                <input name="largoMt" value={formData.largoMt} onChange={handleChange} placeholder="Largo (m)" />
                <input name="anchoMt" value={formData.anchoMt} onChange={handleChange} placeholder="Ancho (m)" />
                <input name="altoMt" value={formData.altoMt} onChange={handleChange} placeholder="Alto (m)" />
            </fieldset>

            <div>
                <input name="peso" value={formData.peso} onChange={handleChange} placeholder="Peso (kg)" />
                <input name="volumenManual" value={formData.volumenManual} onChange={handleChange} placeholder="Volumen manual (m³)" />
            </div>

            <div>
                <button type="submit" disabled={loading}>{loading ? 'Calculando...' : 'Calcular'}</button>
                <button type="button" onClick={limpiarFormulario}>Limpiar</button>
            </div>
        </form>
    );
}