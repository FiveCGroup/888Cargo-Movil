import cargaService from '../services/cargaService';
import { validarFormularioCarga, prepararDatosFormulario, generarCodigoUnico } from '../utils/cargaUtils';

/**
 * Lógica de negocio para el manejo de cargas
 */
export class CargaLogic {
    
    // =============== FUNCIONES DE BÚSQUEDA ===============
    
    static async buscarPackingList(codigoCarga, setters) {
        const { setBusquedaLoading, setError, setResultadosBusqueda, setMostrandoResultados } = setters;
        
        if (!codigoCarga.trim()) {
            setError('Ingrese un código de carga para buscar');
            return;
        }

        setBusquedaLoading(true);
        setError(null);
        
        try {
            const resultado = await cargaService.buscarPackingList(codigoCarga.trim());
            
            if (resultado.success && resultado.data && resultado.data.length > 0) {
                setResultadosBusqueda(resultado.data);
                setMostrandoResultados(true);
            } else {
                setError(resultado.mensaje || 'No se encontraron packing lists con ese código');
                setResultadosBusqueda([]);
                setMostrandoResultados(false);
            }
        } catch (error) {
            console.error('Error en búsqueda:', error);
            setError('Error al buscar packing lists');
            setResultadosBusqueda([]);
            setMostrandoResultados(false);
        }
        
        setBusquedaLoading(false);
    }

    static async verDetallesPackingList(idCarga, setError) {
        try {
            const resultado = await cargaService.obtenerPackingList(idCarga);
            
            if (resultado.success) {
                alert(`Packing List cargado:\n\nCódigo: ${resultado.data.codigo_carga}\nArtículos: ${resultado.data.articulos?.length || 0}\nTotal: $${resultado.data.precio_total || 0}`);
            } else {
                setError('Error al obtener detalles del packing list');
            }
        } catch (error) {
            console.error('Error al obtener detalles:', error);
            setError('Error al cargar detalles del packing list');
        }
    }

    // =============== FUNCIONES DE ARCHIVO ===============
    
    static async procesarArchivo(file, setters) {
        const { setArchivoSeleccionado, setLoading, setError, setDatosExcel, setFilasConError, setEstadisticasCarga } = setters;
        
        if (!file) return;

        // Validar tamaño del archivo antes de procesar
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            setError(`El archivo es demasiado grande. Máximo permitido: ${Math.round(maxSize / (1024 * 1024))}MB`);
            return;
        }

        // Validar tipo de archivo
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel' // .xls
        ];
        
        if (!allowedTypes.includes(file.type)) {
            setError('Por favor, selecciona un archivo Excel válido (.xlsx o .xls)');
            return;
        }

        setArchivoSeleccionado(file);
        setLoading(true);
        setError(null);

        console.log(`[CargaLogic] Processing file: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);

        try {
            const resultado = await cargaService.procesarExcel(file);

            if (resultado.success) {
                setDatosExcel(resultado.data.data);
                setFilasConError(resultado.data.filasConError || []);
                setEstadisticasCarga(resultado.data.estadisticas);
                console.log(`✅ Archivo procesado exitosamente: ${resultado.data.data.length} filas`);
            } else {
                setError(resultado.error);
                console.error(`❌ Error procesando archivo: ${resultado.error}`);
            }
        } catch (error) {
            console.error('❌ Error inesperado:', error);
            setError('Error inesperado al procesar el archivo. Por favor, intenta nuevamente.');
        }

        setLoading(false);
    }

    static async descargarFormato(setters) {
        const { setLoading, setError } = setters;
        
        setLoading(true);
        const resultado = await cargaService.descargarFormato();
        
        if (!resultado.success) {
            setError(resultado.error);
        }
        
        setLoading(false);
    }

    // =============== FUNCIONES DE FORMULARIO ===============
    
    static prepararFormulario(datosExcel, archivoSeleccionado, setters) {
        const { setError, setInfoCliente, setInfoCarga, setMostrarFormulario } = setters;
        
        if (datosExcel.length === 0) {
            setError('Primero debe cargar y procesar un archivo Excel');
            return;
        }
        
        // Prellenar campos basándose en los datos del Excel
        const { cliente, carga } = prepararDatosFormulario(datosExcel, archivoSeleccionado);
        
        setInfoCliente(prev => ({
            ...prev,
            ...cliente
        }));
        
        setInfoCarga(prev => ({
            ...prev,
            ...carga
        }));
        
        setMostrarFormulario(true);
    }

    static generarNuevoCodigo(setInfoCarga) {
        setInfoCarga(prev => ({
            ...prev,
            codigo_carga: generarCodigoUnico()
        }));
    }

    // =============== FUNCIONES DE GUARDADO ===============
    
    static async guardarEnBD(datosExcel, infoCliente, infoCarga, setters) {
        const { setGuardandoBD, setError, setGuardadoExitoso, setDatosGuardado } = setters;
        
        // Validar formulario
        const validacion = validarFormularioCarga(infoCliente, infoCarga);
        if (!validacion.esValido) {
            setError(validacion.errores[0]);
            return;
        }

        setGuardandoBD(true);
        setError(null);
        setGuardadoExitoso(false);
        setDatosGuardado(null);

        try {
            const datosCompletos = {
                datosExcel: datosExcel,
                infoCliente: infoCliente,
                infoCarga: infoCarga
            };

            const resultado = await cargaService.guardarPackingListConQR(datosCompletos);

            if (resultado.success) {
                const { data } = resultado;
                
                // Preparar datos para el estado
                const datosParaEstado = {
                    cliente: data.cliente,
                    carga: data.carga,
                    estadisticas: data.estadisticas,
                    totalQRs: data.estadisticas?.qrs_generados || 0,
                    pdfUrl: data.pdfUrl || `/api/qr/pdf-carga/${data.carga?.id}` // URL del PDF
                };

                // Actualizar estados
                setDatosGuardado(datosParaEstado);
                setGuardadoExitoso(true);
                
                return { success: true };
                
            } else {
                console.error('❌ El guardado no fue exitoso. Detalles:', resultado);
                const errorMsg = resultado.error || resultado.message || 'Error desconocido al guardar';
                
                if (errorMsg.includes('código de carga ya existe') || errorMsg.includes('ya existe')) {
                    setError(`${errorMsg}. Presiona "Generar Código" para crear uno automáticamente.`);
                } else {
                    setError(errorMsg);
                }
                return { success: false };
            }
        } catch (error) {
            console.error('Error al guardar:', error);
            setError('Error inesperado al guardar en la base de datos');
            return { success: false };
        } finally {
            setGuardandoBD(false);
        }
    }

    static async guardarCarga(datosExcel, estadisticasCarga, codigoCarga, archivoSeleccionado, setters) {
        const { setLoading, setError } = setters;
        
        if (datosExcel.length === 0) {
            setError('No hay datos para guardar');
            return;
        }

        setLoading(true);

        const datosCarga = {
            codigoCarga,
            datosExcel,
            estadisticas: estadisticasCarga,
            archivoNombre: archivoSeleccionado?.name
        };

        const resultado = await cargaService.guardarCarga(datosCarga);

        if (resultado.success) {
            alert('Carga guardada exitosamente');
            return { success: true };
        } else {
            setError(resultado.error);
            return { success: false };
        }

        setLoading(false);
    }
}
