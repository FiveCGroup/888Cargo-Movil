import { useState } from 'react';
import { router } from 'expo-router';
import { InfoCliente, InfoCarga, generarCodigoUnico, prepararDatosFormulario } from '../utils/cargaUtils';

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
  const prepararFormularioDesdeExcel = () => {
    const datosPreprarados = prepararDatosFormulario(datosExcel, archivoSeleccionado);
    
    setInfoCliente(prev => ({
      ...prev,
      ...datosPreprarados.cliente
    }));
    
    setInfoCarga(prev => ({
      ...prev,
      ...datosPreprarados.carga
    }));
  };

  // Función para generar nuevo código
  const generarNuevoCodigo = () => {
    const nuevoCodigo = generarCodigoUnico();
    setInfoCarga(prev => ({
      ...prev,
      codigo_carga: nuevoCodigo
    }));
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
