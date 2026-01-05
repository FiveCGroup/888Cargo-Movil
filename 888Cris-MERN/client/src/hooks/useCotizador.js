import { useState, useMemo } from 'react';
import cotizacionService from '../services/cotizacionService';
import { calcularVolumenDesdeForm } from '../utils/calcVolumen';

export default function useCotizador(initialTipo = 'maritimo') {
    const [loading, setLoading] = useState(false);
    const [resultado, setResultado] = useState(null);
    const [resultadoId, setResultadoId] = useState(null);
    const [tipoEnvio, setTipoEnvio] = useState(initialTipo);
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

    const volumenCalculado = useMemo(() => calcularVolumenDesdeForm(formData), [formData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
        setResultadoId(null);
    };

    const handleSubmit = async (e) => {
      e?.preventDefault?.();
      try {
        setLoading(true);
        setResultado(null);
        const payload = {
          peso_kg: Number(formData.peso) || 0,
          largo_cm: Number(formData.largoCm) || 0,
          ancho_cm: Number(formData.anchoCm) || 0,
          alto_cm: Number(formData.altoCm) || 0,
          volumen_m3: Number(volumenCalculado) || 0,
          destino: formData.destino || 'China',
          tipoEnvio // enviar para trazabilidad
        };

        let response;
        if (tipoEnvio === 'maritimo') response = await cotizacionService.cotizarMaritimo(payload);
        else response = await cotizacionService.cotizarAereo(payload);

+     console.log('[COTIZADOR] payload:', payload);
+     console.log('[COTIZADOR] response wrapper:', response);
      // normalizar wrapper { success, data } vs resultado directo
      const wrapper = response?.data ?? response;
      const data = wrapper?.data ?? wrapper;
+     console.log('[COTIZADOR] data:', data);
      if (!data.tipo) data.tipo = tipoEnvio;
      setResultado(data);
      setResultadoId(data?.id ?? wrapper?.id ?? null);
      } catch (err) {
        console.error('Error cotizando:', err);
      } finally {
        setLoading(false);
      }
    };

    return {
        loading,
        resultado,
        resultadoId,
        tipoEnvio,
        setTipoEnvio,
        formData,
        setFormData,
        volumenCalculado,
        handleChange,
        handleSubmit,
        limpiarFormulario
    };
}