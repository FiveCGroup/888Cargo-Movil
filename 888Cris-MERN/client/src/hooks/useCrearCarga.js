import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import cargaService from '../services/cargaService';
import API from '../services/api';

export const useCrearCarga = () => {
    // Estados principales
    const [codigoCarga, setCodigoCarga] = useState('');
    const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
    const [datosExcel, setDatosExcel] = useState([]);
    const [filasConError, setFilasConError] = useState([]);
    const [estadisticasCarga, setEstadisticasCarga] = useState({
        filasExitosas: 0,
        filasConError: 0,
        filasVacias: 0,
        totalFilas: 0
    });
    
    // Estados para búsqueda
    const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
    const [mostrandoResultados, setMostrandoResultados] = useState(false);
    const [busquedaLoading, setBusquedaLoading] = useState(false);
    
    // Estados para formulario
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [infoCliente, setInfoCliente] = useState({
        nombre_cliente: '',
        correo_cliente: '',
        telefono_cliente: '',
        direccion_entrega: ''
    });
    const [infoCarga, setInfoCarga] = useState({
        codigo_carga: '',
        direccion_destino: '',
        archivo_original: ''
    });
    
    // Estados de control
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [guardandoBD, setGuardandoBD] = useState(false);
    const [guardadoExitoso, setGuardadoExitoso] = useState(false);
    const [datosGuardado, setDatosGuardado] = useState(null); // Para almacenar respuesta del guardado
    
    // Referencias y navegación
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Efecto para cargar datos completos del usuario logueado
    useEffect(() => {
        const cargarDatosUsuario = async () => {
            try {
                // Primero intentar obtener datos completos del perfil
                const response = await API.get('/api/profile');
                
                if (response.data) {
                    setInfoCliente(prev => ({
                        ...prev,
                        nombre_cliente: response.data.name || '',
                        correo_cliente: response.data.email || '',
                        telefono_cliente: response.data.phone || ''
                    }));
                }
            } catch (error) {
                console.error('❌ Error al obtener perfil del usuario:', error);
                
                // Fallback a localStorage si la API falla
                const userData = localStorage.getItem('user');
                
                if (userData) {
                    try {
                        const user = JSON.parse(userData);
                        setInfoCliente(prev => ({
                            ...prev,
                            nombre_cliente: user.name || '',
                            correo_cliente: user.email || ''
                            // telefono_cliente se mantiene vacío si no está en localStorage
                        }));
                    } catch (parseError) {
                        console.error('❌ Error al parsear datos del usuario desde localStorage:', parseError);
                    }
                }
            }
        };

        cargarDatosUsuario();
    }, []);

    // Efecto para autocompletar datos cuando se muestra el formulario
    useEffect(() => {
        if (mostrarFormulario) {
            // Si los campos están vacíos, cargar datos del usuario
            if (!infoCliente.nombre_cliente || !infoCliente.correo_cliente) {
                
                const cargarDatosFormulario = async () => {
                    try {
                        const response = await API.get('/api/profile');
                        if (response.data) {
                            setInfoCliente(prev => ({
                                ...prev,
                                nombre_cliente: response.data.name || '',
                                correo_cliente: response.data.email || '',
                                telefono_cliente: response.data.phone || ''
                            }));
                        }
                    } catch (error) {
                        const userData = localStorage.getItem('user');
                        if (userData) {
                            const user = JSON.parse(userData);
                            setInfoCliente(prev => ({
                                ...prev,
                                nombre_cliente: user.name || '',
                                correo_cliente: user.email || ''
                            }));
                        }
                    }
                };
                
                cargarDatosFormulario();
            }
        }
    }, [mostrarFormulario]); // Se ejecuta cada vez que mostrarFormulario cambia

    // Funciones de manipulación de estado
    const limpiarFormulario = () => {
        setMostrarFormulario(false);
        setDatosExcel([]);
        setArchivoSeleccionado(null);
        setFilasConError([]);
        setEstadisticasCarga({
            filasExitosas: 0,
            filasConError: 0,
            filasVacias: 0,
            totalFilas: 0
        });
        
        // Los estados de guardado se limpian manualmente cuando se cierra el formulario
        // setGuardadoExitoso(false);
        // setDatosGuardado(null);
        
        // Solo limpiar la dirección de entrega, manteniendo datos del usuario
        setInfoCliente(prev => ({
            ...prev,
            direccion_entrega: ''
            // nombre_cliente, correo_cliente y telefono_cliente se mantienen
        }));
        
        setInfoCarga({
            codigo_carga: '',
            direccion_destino: '',
            archivo_original: ''
        });
    };

    const limpiarBusqueda = () => {
        setResultadosBusqueda([]);
        setMostrandoResultados(false);
        setCodigoCarga('');
        setError(null);
    };

    const handleCambioCliente = (e) => {
        const { name, value } = e.target;
        setInfoCliente(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCambioCarga = (e) => {
        const { name, value } = e.target;
        setInfoCarga(prev => ({
            ...prev,
            [name]: value
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
        
        // Referencias
        navigate,
        fileInputRef,
        
        // Funciones de estado
        limpiarFormulario,
        limpiarBusqueda,
        handleCambioCliente,
        handleCambioCarga
    };
};
