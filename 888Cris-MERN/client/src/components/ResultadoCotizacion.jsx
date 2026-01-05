import React, { useState } from 'react';
import cotizacionService from '../services/cotizacionService';

export default function ResultadoCotizacion({ resultado, resultadoId }) {
    const [sending, setSending] = useState(false);

    if (!resultado) return null;

    // Coerciones seguras
    const valorUsd = Number(resultado.valor_usd ?? 0) || 0;
    const valorCop = Number(resultado.valor_cop ?? 0) || 0;
    const volumen = Number(resultado.volumen_m3 ?? resultado.detalleCalculo?.volumenReal) || 0;
    const pesoReal = Number(resultado.peso_kg ?? resultado.detalleCalculo?.pesoReal) || 0;
    const pesoVol = Number(resultado.detalleCalculo?.pesoVolumetrico ?? 0) || 0;
    const pesoCobrable = Number(resultado.detalleCalculo?.pesoCobrable ?? 0) || 0;

    const handleDownload = async () => {
        if (!resultadoId) return window.print();
        try {
            await cotizacionService.descargarPdfCotizacion(resultadoId);
        } catch (err) {
            console.error('Error descargando PDF:', err);
            window.print();
        }
    };

    const handleSendWhatsapp = async () => {
        if (!resultadoId) return;
        setSending(true);
        try {
            await cotizacionService.enviarCotizacionWhatsapp(resultadoId);
        } catch (err) {
            console.error('Error enviando WhatsApp:', err);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="resultado-cotizacion">
            <h3>Resultado</h3>
            <div>Valor USD: ${valorUsd.toFixed(2)}</div>
            <div>Valor COP: ${valorCop.toLocaleString()}</div>

            <div className="detalle-grid">
                <div>Volumen: {volumen.toFixed(3)} m³</div>
                <div>Peso real: {pesoReal.toFixed(2)} kg</div>
                <div>Peso volumétrico: {pesoVol.toFixed(2)} kg</div>
                <div>Peso cobrable: {pesoCobrable.toFixed(2)} kg</div>
            </div>

            <pre>{JSON.stringify(resultado.detalleCalculo || resultado.detalle_calculo || {}, null, 2)}</pre>

            <div>
                <button onClick={handleDownload} disabled={!resultadoId}>Descargar PDF</button>
                <button onClick={handleSendWhatsapp} disabled={!resultadoId || sending}>
                    {sending ? 'Enviando...' : 'Enviar por WhatsApp'}
                </button>
            </div>
        </div>
    );
}