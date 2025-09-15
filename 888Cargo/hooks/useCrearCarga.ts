import { useState } from 'react';
import { router } from 'expo-router';
import { InfoCliente, InfoCarga, generarCodigoUnico, prepararDatosFormulario } from '../utils/cargaUtils';
import CargaService from '../services/cargaService.js';

export const useCrearCarga = () => {
  // Estados principales
  const [codigoCarga, setCodigoCarga] = useState('');
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<any>(null);
  const [datosExcel, setDatosExcel] = useState<any[][]>([]);
  const [filasConError, setFilasConError] = useState<any[]>([]);
  const [estadisticasCarga, setEstadisticasCarga] = useState<any>(null);
  
  // Estados de búsqueda
  const [resultadosBusqueda, setResultadosBusqueda] = useState<any[]>([]);
  const [mostrandoResultados, setMostrandoResultados] = useState(false);
  const [busquedaLoading, setBusquedaLoading] = useState(false);
  
  // Estados del formulario
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [infoCliente, setInfoCliente] = useState<InfoCliente>({
    nombre_cliente: '',
    correo_cliente: '',
    telefono_cliente: '',
    direccion_entrega: ''
  });
  const [infoCarga, setInfoCarga] = useState<InfoCarga>({
    codigo_carga: '',
    direccion_destino: '',
    archivo_original: ''
  });
  
  // Estados de carga y guardado
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [guardandoBD, setGuardandoBD] = useState(false);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [datosGuardado, setDatosGuardado] = useState<any>(null);

  // Funciones de limpieza
  const limpiarFormulario = () => {
    setArchivoSeleccionado(null);
    setDatosExcel([]);
    setFilasConError([]);
    setEstadisticasCarga(null);
    setMostrarFormulario(false);
    setError('');
    setGuardandoBD(false);
    setGuardadoExitoso(false);
    setDatosGuardado(null);
    
    // Resetear info del cliente y carga
    setInfoCliente({
      nombre_cliente: '',
      correo_cliente: '',
      telefono_cliente: '',
      direccion_entrega: ''
    });
    setInfoCarga({
      codigo_carga: '',
      direccion_destino: '',
      archivo_original: ''
    });
  };

  const limpiarBusqueda = () => {
    setCodigoCarga('');
    setResultadosBusqueda([]);
    setMostrandoResultados(false);
    setBusquedaLoading(false);
    setError('');
  };

  // Funciones de manejo de cambios
  const handleCambioCliente = (campo: keyof InfoCliente, valor: string) => {
    setInfoCliente(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleCambioCarga = (campo: keyof InfoCarga, valor: string) => {
    setInfoCarga(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  // Función para preparar datos cuando se carga un Excel
  const prepararFormularioDesdeExcel = async () => {
    const datosPreprarados = prepararDatosFormulario(datosExcel, archivoSeleccionado);
    
    setInfoCliente(prev => ({
      ...prev,
      ...datosPreprarados.cliente
    }));
    
    // Generar código automáticamente al preparar el formulario
    let codigoGenerado = '';
    try {
      codigoGenerado = await generarNuevoCodigo();
    } catch (error) {
      console.warn('⚠️ [useCrearCarga] Error al generar código automático');
      codigoGenerado = generarCodigoUnico(); // Fallback
    }
    
    setInfoCarga(prev => ({
      ...prev,
      ...datosPreprarados.carga,
      codigo_carga: codigoGenerado
    }));
  };

  // Función para generar nuevo código usando el servicio backend
  const generarNuevoCodigo = async () => {
    try {
      console.log('🔢 [useCrearCarga] Generando código desde backend...');
      const resultado = await CargaService.generarCodigoCarga();
      
      if (resultado.success && resultado.codigo_carga) {
        const nuevoCodigo = resultado.codigo_carga;
        console.log('✅ [useCrearCarga] Código generado:', nuevoCodigo);
        
        setInfoCarga(prev => ({
          ...prev,
          codigo_carga: nuevoCodigo
        }));
        
        return nuevoCodigo;
      } else {
        console.warn('⚠️ [useCrearCarga] Error del backend, usando código local');
        throw new Error('Error al generar código desde backend');
      }
    } catch (error) {
      console.warn('⚠️ [useCrearCarga] Fallback a código local:', error);
      // Fallback a código local si hay error con el backend
      const nuevoCodigo = generarCodigoUnico();
      setInfoCarga(prev => ({
        ...prev,
        codigo_carga: nuevoCodigo
      }));
      return nuevoCodigo;
    }
  };

  return {
    // Estados
    codigoCarga,
    setCodigoCarga,
    archivoSeleccionado,
    setArchivoSeleccionado,
    datosExcel,
    setDatosExcel,
    filasConError,
    setFilasConError,
    estadisticasCarga,
    setEstadisticasCarga,
    resultadosBusqueda,
    setResultadosBusqueda,
    mostrandoResultados,
    setMostrandoResultados,
    busquedaLoading,
    setBusquedaLoading,
    mostrarFormulario,
    setMostrarFormulario,
    infoCliente,
    setInfoCliente,
    infoCarga,
    setInfoCarga,
    loading,
    setLoading,
    error,
    setError,
    guardandoBD,
    setGuardandoBD,
    guardadoExitoso,
    setGuardadoExitoso,
    datosGuardado,
    setDatosGuardado,
    
    // Funciones
    navigate: router,
    limpiarFormulario,
    limpiarBusqueda,
    handleCambioCliente,
    handleCambioCarga,
    prepararFormularioDesdeExcel,
    generarNuevoCodigo,
  };
};
