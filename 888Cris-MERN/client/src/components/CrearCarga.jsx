import React, { useState, useEffect } from 'react';
import { useCrearCarga } from '../hooks/useCrearCarga';
import { CargaLogic } from '../logic/cargaLogic';
import cargaService from '../services/cargaService';
import BusquedaPackingList from './BusquedaPackingList';
import CreacionNuevaCarga from './CreacionNuevaCarga';
import TablasDatos from './TablasDatos';
import ModalPackingList from './ModalPackingList';
import Navbar from './Navbar';
import '../styles/CrearCarga.css';

const CrearCarga = () => {
    const [user, setUser] = useState(null);
    const [mostrarModalTest, setMostrarModalTest] = useState(false);

    // Obtener información del usuario desde localStorage
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);
    // Usar el custom hook para manejar el estado
    const {
        // Estados
        codigoCarga, setCodigoCarga,
        archivoSeleccionado, setArchivoSeleccionado,
        datosExcel, setDatosExcel,
        filasConError, setFilasConError,
        estadisticasCarga, setEstadisticasCarga,
        resultadosBusqueda, setResultadosBusqueda,
        mostrandoResultados, setMostrandoResultados,
        busquedaLoading, setBusquedaLoading,
        mostrarFormulario, setMostrarFormulario,
        infoCliente, setInfoCliente,
        infoCarga, setInfoCarga,
        loading, setLoading,
        error, setError,
        guardandoBD, setGuardandoBD,
        guardadoExitoso, setGuardadoExitoso,
        datosGuardado, setDatosGuardado,
        
        // Referencias y funciones
        navigate, fileInputRef,
        limpiarFormulario, limpiarBusqueda,
        handleCambioCliente, handleCambioCarga
    } = useCrearCarga();

    // =============== FUNCIONES DE MANEJO ===============
    
    // Crear objetos de setters para pasar a CargaLogic
    const busquedaSetters = {
        setBusquedaLoading,
        setError,
        setResultadosBusqueda,
        setMostrandoResultados
    };
    
    const archivoSetters = {
        setArchivoSeleccionado,
        setLoading,
        setError,
        setDatosExcel,
        setFilasConError,
        setEstadisticasCarga
    };
    
    const formularioSetters = {
        setError,
        setInfoCliente,
        setInfoCarga,
        setMostrarFormulario
    };
    
    const guardadoSetters = {
        setGuardandoBD,
        setError,
        setGuardadoExitoso,
        setDatosGuardado
    };

    // Funciones de navegación
    const volverAlDashboard = () => {
        navigate('/dashboard');
    };

    // Funciones de búsqueda
    const handleBuscarPackingList = () => {
        CargaLogic.buscarPackingList(codigoCarga, busquedaSetters);
    };

    const handleVerDetallesPackingList = (idCarga) => {
        CargaLogic.verDetallesPackingList(idCarga, setError);
    };

    // Funciones de archivo
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        CargaLogic.procesarArchivo(file, archivoSetters);
    };

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleDescargarFormato = () => {
        CargaLogic.descargarFormato({ setLoading, setError });
    };

    // Funciones de formulario
    const handleMostrarFormulario = () => {
        console.log('🔄 handleMostrarFormulario llamado - USANDO MODAL DE PRUEBA');
        console.log('📊 datosExcel:', datosExcel.length);
        console.log('📁 archivoSeleccionado:', archivoSeleccionado);
        
        // Abrir el modal de prueba que funciona
        setMostrarModalTest(true);
        console.log('✅ setMostrarModalTest(true) ejecutado');
        
        // Luego preparar los datos
        CargaLogic.prepararFormulario(datosExcel, archivoSeleccionado, formularioSetters);
    };

    const handleCerrarFormulario = () => {
        // Cerrar el modal
        setMostrarModalTest(false);
        // Limpiar estados de guardado exitoso cuando se cierra el formulario
        setGuardadoExitoso(false);
        setDatosGuardado(null);
        // Opcional: también limpiar completamente el formulario para un nuevo packing list
        limpiarFormulario();
    };

    const handleGenerarNuevoCodigo = () => {
        CargaLogic.generarNuevoCodigo(setInfoCarga);
    };

    // Función para visualizar PDF de QRs (nueva página)
    const handleVisualizarPDF = () => {
        if (datosGuardado && (datosGuardado.carga?.id || datosGuardado.data?.carga?.id)) {
            const idCarga = datosGuardado.carga?.id || datosGuardado.data?.carga?.id;
            navigate(`/visualizar-qr/${idCarga}`);
        } else {
            setError('No se pudo obtener el ID de la carga para visualizar los códigos QR.');
        }
    };

    // Funciones de guardado
    const handleGuardarEnBD = async () => {
        const resultado = await CargaLogic.guardarEnBD(
            datosExcel, 
            infoCliente, 
            infoCarga, 
            guardadoSetters
        );
        
        // No limpiar el formulario automáticamente para permitir ver el mensaje de éxito
        // y el botón de descarga del PDF
        if (resultado && resultado.success) {
            console.log('✅ Guardado exitoso, manteniendo formulario visible para descarga de PDF');
        }
    };

    const handleGuardarCarga = async () => {
        const resultado = await CargaLogic.guardarCarga(
            datosExcel,
            estadisticasCarga,
            codigoCarga,
            archivoSeleccionado,
            { setLoading, setError }
        );
        
        if (resultado && resultado.success) {
            // Limpiar datos después del guardado exitoso
            setCodigoCarga('');
            setArchivoSeleccionado(null);
            setDatosExcel([]);
            setFilasConError([]);
            setEstadisticasCarga({
                filasExitosas: 0,
                filasConError: 0,
                filasVacias: 0,
                totalFilas: 0
            });
        }
    };

    return (
        <div className="dashboard-layout">
            <Navbar user={user} />

            {/* CONTENIDO PRINCIPAL */}
            <div className="dashboard-main-content">
                {/* Header con botón de regreso y título */}
                <div className="crear-carga-header">
                    <button 
                        className="crear-carga-btn-back" 
                        onClick={volverAlDashboard}
                        title="Volver al Dashboard"
                    >
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    
                    <h1 className="crear-carga-title-main">
                        Crear Carga
                    </h1>
                </div>

                <div>
                    {/* Sección de búsqueda */}
                    <div className="crear-carga-search-section">
                        <BusquedaPackingList
                            codigoCarga={codigoCarga}
                            setCodigoCarga={setCodigoCarga}
                            onBuscar={handleBuscarPackingList}
                            onLimpiar={limpiarBusqueda}
                            onVerDetalles={handleVerDetallesPackingList}
                            busquedaLoading={busquedaLoading}
                            mostrandoResultados={mostrandoResultados}
                            resultadosBusqueda={resultadosBusqueda}
                        />
                    </div>

                    {/* Sección de creación de nueva carga */}
                    <CreacionNuevaCarga
                        onDescargarFormato={handleDescargarFormato}
                        onSubirArchivo={handleUploadClick}
                        onGuardarCarga={handleGuardarCarga}
                        onGuardarPackingList={handleMostrarFormulario}
                        loading={loading}
                        datosExcel={datosExcel}
                        codigoCarga={codigoCarga}
                    />
                    
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".xlsx,.xls"
                        style={{ display: 'none' }}
                    />
                    
                    {/* Mensajes de error */}
                    {error && (
                        <div className="crear-carga-error-container">
                            Error: {error}
                        </div>
                    )}

                    {/* Información del archivo seleccionado */}
                    {archivoSeleccionado && (
                        <div className="crear-carga-file-info">
                            <p className="crear-carga-file-name">
                                <strong>Archivo seleccionado:</strong> {archivoSeleccionado.name}
                                {estadisticasCarga.filasExitosas > 0 && (
                                    <span className="crear-carga-success-text">
                                        ✓ {estadisticasCarga.filasExitosas} filas cargadas exitosamente
                                    </span>
                                )}
                            </p>
                            {estadisticasCarga.totalFilas > 0 && (
                                <div className="crear-carga-statistics">
                                    <strong>Total:</strong> {estadisticasCarga.totalFilas} | 
                                    <strong> Exitosas:</strong> {estadisticasCarga.filasExitosas} | 
                                    <strong> Errores:</strong> {estadisticasCarga.filasConError} | 
                                    <strong> Vacías:</strong> {estadisticasCarga.filasVacias}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Tablas de datos */}
                <TablasDatos
                    datosExcel={datosExcel}
                    filasConError={filasConError}
                />
            </div>

            {/* Modal de packing list */}
            <ModalPackingList 
                mostrar={mostrarModalTest}
                onCerrar={handleCerrarFormulario}
                infoCliente={infoCliente}
                infoCarga={infoCarga}
                onCambioCliente={handleCambioCliente}
                onCambioCarga={handleCambioCarga}
                onGuardar={handleGuardarEnBD}
                onGenerarCodigo={handleGenerarNuevoCodigo}
                guardandoBD={guardandoBD}
                guardadoExitoso={guardadoExitoso}
                datosGuardado={datosGuardado}
                onVisualizarPDF={handleVisualizarPDF}
            />
        </div>
    );
};

export default CrearCarga;