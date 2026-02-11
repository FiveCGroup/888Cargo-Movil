import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/API';
import { InfoCliente, InfoCarga, generarCodigoUnico, prepararDatosFormulario } from '../utils/cargaUtils';
import CargaService from '../services/cargaService.js';

export const useCrearCarga = () => {
  // Estados principales
  const [codigoCarga, setCodigoCarga] = useState('');
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<any>(null);
  const [datosExcel, setDatosExcel] = useState<any[][]>([]);
  const [datosExcelObjetos, setDatosExcelObjetos] = useState<any[]>([]); // Objetos originales preservados para guardar
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
    archivo_original: '',
    destino: '',
    shipping_mark: '',
    estado: 'En bodega China',
    ubicacion_actual: 'China',
    fecha_recepcion: '',
    fecha_envio: '',
    fecha_arribo: '',
    contenedor_asociado: '',
    observaciones: ''
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
    setDatosExcelObjetos([]); // Limpiar objetos originales también
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
      archivo_original: '',
      destino: '',
      shipping_mark: '',
      estado: 'En bodega China',
      ubicacion_actual: 'China',
      fecha_recepcion: '',
      fecha_envio: '',
      fecha_arribo: '',
      contenedor_asociado: '',
      observaciones: ''
    });
  };

  // Autocompletar datos del cliente desde perfil (como en la web)
  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const token = await AsyncStorage.getItem('@auth:token');
        if (!token) return;
        const res = await fetch(`${API_CONFIG.BASE_URL}/profile`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (!res.ok) return;
        const data = await res.json();
        const user = data.user || data;
        if (!user) return;
        setInfoCliente(prev => ({
          ...prev,
          nombre_cliente: user.full_name || user.name || user.username || prev.nombre_cliente || '',
          correo_cliente: user.email || prev.correo_cliente || '',
          telefono_cliente: user.phone || prev.telefono_cliente || ''
        }));
        setInfoCarga(prev => ({
          ...prev,
          ...(user.shippingMark && { shipping_mark: user.shippingMark }),
          ...(user.ciudad && { destino: user.ciudad, direccion_destino: prev.direccion_destino || user.ciudad })
        }));
      } catch {
        // Ignorar si falla (usuario no logueado o red)
      }
    };
    cargarPerfil();
  }, []);

  // Al abrir el formulario, rellenar vacíos con perfil si hace falta
  useEffect(() => {
    if (!mostrarFormulario) return;
    const rellenarSiVacio = async () => {
      try {
        const token = await AsyncStorage.getItem('@auth:token');
        if (!token) return;
        const res = await fetch(`${API_CONFIG.BASE_URL}/profile`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (!res.ok) return;
        const data = await res.json();
        const user = data.user || data;
        if (!user) return;
        setInfoCliente(prev => ({
          ...prev,
          nombre_cliente: prev.nombre_cliente || user.full_name || user.name || user.username || '',
          correo_cliente: prev.correo_cliente || user.email || '',
          telefono_cliente: prev.telefono_cliente || user.phone || ''
        }));
        setInfoCarga(prev => ({
          ...prev,
          shipping_mark: prev.shipping_mark || user.shippingMark || prev.shipping_mark,
          destino: prev.destino || user.ciudad || prev.destino,
          direccion_destino: prev.direccion_destino || user.ciudad || prev.direccion_destino
        }));
      } catch {
        // Ignorar
      }
    };
    rellenarSiVacio();
  }, [mostrarFormulario]);

  // Función para limpiar búsquedas - Mejorada con lógica de la web
  const limpiarBusqueda = () => {
    console.log('🧹 [useCrearCarga] Limpiando búsqueda completa...');
    
    // Limpiar todos los estados relacionados con búsqueda
    setCodigoCarga('');
    setResultadosBusqueda([]);
    setMostrandoResultados(false);
    setBusquedaLoading(false);
    setError('');
    
    console.log('[useCrearCarga] Search state cleared');
    
    // Mostrar confirmación como en la web
    // Alert no está disponible en hooks, se maneja en el componente si es necesario
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

  // Función para preparar datos cuando se carga un Excel (opcional: pasar datos recién procesados para evitar estado desactualizado)
  const prepararFormularioDesdeExcel = async (datosExcelOverride?: any[][]) => {
    const datosParaPreparar = datosExcelOverride ?? datosExcel;
    const datosPreprarados = prepararDatosFormulario(datosParaPreparar, archivoSeleccionado);
    
    setInfoCliente(prev => ({
      ...prev,
      ...datosPreprarados.cliente
    }));
    
    // Generar código automáticamente al preparar el formulario
    let codigoGenerado = '';
    try {
      codigoGenerado = await generarNuevoCodigo();
    } catch {
      console.warn('[useCrearCarga] Automatic code generation failed');
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
        console.log(`[useCrearCarga] Code generated: ${nuevoCodigo}`);
        
        setInfoCarga(prev => ({
          ...prev,
          codigo_carga: nuevoCodigo
        }));
        
        return nuevoCodigo;
      } else {
        console.warn('[useCrearCarga] Backend error, using local fallback code');
        throw new Error('Error al generar código desde backend');
      }
    } catch (error) {
      console.warn('[useCrearCarga] Fallback to local code generation:', error);
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
    datosExcelObjetos,
    setDatosExcelObjetos,
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
