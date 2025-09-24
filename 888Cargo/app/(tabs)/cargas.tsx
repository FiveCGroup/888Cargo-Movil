import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';

// Componentes
import BusquedaPackingList from '../../components/BusquedaPackingList';
import TablasDatos from '../../components/TablasDatos';
import ModalPackingList from '../../components/ModalPackingList';
import Logo888Cargo from '../../components/Logo888Cargo';
import CustomAlert from '../../components/CustomAlert';

// Hooks y servicios
import { useCrearCarga } from '../../hooks/useCrearCarga';
import useCustomAlert from '../../hooks/useCustomAlert';
import CargaService from '../../services/cargaService.js';
import { validarArchivoExcel, validarFormularioCarga } from '../../utils/cargaUtils';

const CrearCarga = () => {
  // Usar el custom hook para manejar el estado
  const {
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
    limpiarFormulario, limpiarBusqueda,
    handleCambioCliente, handleCambioCarga,
    prepararFormularioDesdeExcel, generarNuevoCodigo
  } = useCrearCarga();

  // Hook para alertas personalizados
  const { alertState, hideAlert, showError, showSuccess, showInfo, showWarning } = useCustomAlert();

  // =============== FUNCIONES DE MANEJO ===============

  // Funciones de navegación
  const volverAlDashboard = () => {
    router.push('/');
  };

  // Funciones de búsqueda - Mejorada con lógica de la web
  const handleBuscarPackingList = async () => {
    // Validación de entrada
    if (!codigoCarga.trim()) {
      showError('Error', 'Por favor ingresa un código de packing list');
      return;
    }

    console.log(`[CrearCarga] Searching packing list for code: ${codigoCarga}`);
    
    // Limpiar estados previos
    setError('');
    setResultadosBusqueda([]);
    setMostrandoResultados(false);
    setBusquedaLoading(true);

    try {
      const resultado = await CargaService.buscarPackingList(codigoCarga.trim());
      
      console.log('📊 [CrearCarga] Resultado de búsqueda:', resultado);
      
      if (resultado.success && resultado.data) {
        // El backend devuelve un array de resultados en resultado.data
        const datos = Array.isArray(resultado.data) ? resultado.data : [resultado.data];
        
        if (datos.length > 0) {
          console.log(`[CrearCarga] Found ${datos.length} packing list(s)`);
          
          // Formatear datos para compatibilidad con el componente
          const datosFormateados = datos.map((item: any) => ({
            // Datos básicos de la carga
            id: item.id_carga,
            codigo_carga: item.codigo_carga,
            fecha_creacion: item.fecha_inicio,
            ciudad_destino: item.ciudad_destino,
            archivo_original: item.archivo_original,
            
            // Información del cliente
            nombre_cliente: item.cliente?.nombre_cliente || 'Cliente no especificado',
            id_cliente: item.cliente?.id_cliente,
            correo_cliente: item.cliente?.correo_cliente,
            telefono_cliente: item.cliente?.telefono_cliente,
            
            // Estadísticas
            total_items: item.estadisticas?.total_articulos || item.estadisticas?.articulos_creados || 0,
            peso_total_kg: item.estadisticas?.peso_total || 0,
            volumen_total_m3: item.estadisticas?.cbm_total || 0,
            precio_total: item.estadisticas?.precio_total_carga || 0,
            total_cajas: item.estadisticas?.total_cajas || 0,
            
            // Estructura completa para compatibilidad
            carga: {
              id: item.id_carga,
              codigo_carga: item.codigo_carga,
              fecha_creacion: item.fecha_inicio,
              ciudad_destino: item.ciudad_destino
            },
            cliente: item.cliente,
            estadisticas: {
              total_articulos: item.estadisticas?.total_articulos || item.estadisticas?.articulos_creados || 0,
              total_peso_kg: item.estadisticas?.peso_total || 0,
              total_volumen_m3: item.estadisticas?.cbm_total || 0
            }
          }));
          
          setResultadosBusqueda(datosFormateados);
          setMostrandoResultados(true);
          
          // Mensaje de éxito
          const totalArticulos = datosFormateados.reduce((sum: number, item: any) => sum + (item.total_items || 0), 0);
          showSuccess(
            'Búsqueda exitosa', 
            `Se encontraron ${datosFormateados.length} packing list(s) con ${totalArticulos} artículos en total`
          );
        } else {
          console.log('[CrearCarga] Search successful but no results found');
          setError('No se encontraron packing lists con ese código');
          setResultadosBusqueda([]);
          setMostrandoResultados(true);
        }
      } else {
        // Manejar caso de no encontrado como en la web
        const mensajeError = resultado.message || resultado.error || 'No se encontró el packing list especificado';
        console.log('[CrearCarga] Packing list not found:', mensajeError);
        
        setError(mensajeError);
        setResultadosBusqueda([]);
        setMostrandoResultados(true);
        
        showWarning('No encontrado', mensajeError);
      }
    } catch (error: any) {
      console.error('[CrearCarga] Search operation failed:', error);
      
      // Manejo de errores más detallado como en la web
      let mensajeError = 'Error al buscar el packing list';
      
      if (error.message) {
        if (error.message.includes('Network')) {
          mensajeError = 'Error de conexión. Verifica tu conexión a internet';
        } else if (error.message.includes('404')) {
          mensajeError = 'Packing list no encontrado';
        } else if (error.message.includes('500')) {
          mensajeError = 'Error del servidor. Intenta nuevamente';
        } else {
          mensajeError = error.message;
        }
      }
      
      setError(mensajeError);
      setResultadosBusqueda([]);
      setMostrandoResultados(true);
      
      showError('Error', mensajeError);
    } finally {
      setBusquedaLoading(false);
    }
  };

  const handleVerDetallesPackingList = (idCarga: string) => {
    router.push(`/detalles-carga/${idCarga}` as any);
  };

  // Funciones de archivo
  const handleFileUpload = async () => {
    try {
      const resultado = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel'
        ],
        copyToCacheDirectory: true,
      });

      if (!resultado.canceled && resultado.assets && resultado.assets.length > 0) {
        const archivo = resultado.assets[0];
        
        // Validar archivo
        const validacion = validarArchivoExcel({
          name: archivo.name,
          type: archivo.mimeType || '',
          size: archivo.size || 0
        });

        if (!validacion.esValido) {
          showError('Error', validacion.error || 'Error de validación');
          return;
        }

        setArchivoSeleccionado(archivo);
        await procesarArchivoExcel(archivo);
      }
    } catch (error) {
      console.error('Error al seleccionar archivo:', error);
      showError('Error', 'Error al seleccionar el archivo');
    }
  };

  const procesarArchivoExcel = async (archivo: any) => {
    console.log('📂 [CrearCarga] Procesando archivo:', archivo);
    setLoading(true);
    setError('');

    try {
      // Usar directamente el archivo seleccionado
      const resultado = await CargaService.procesarExcel(archivo);

      console.log('📊 [CrearCarga] Resultado del procesamiento:', resultado);

      if (resultado.success && resultado.data) {
        // Los datos vienen directamente en resultado.data, estadísticas están en resultado.estadisticas
        const datosExcel = resultado.data;
        const estadisticas = (resultado as any).estadisticas;
        const filasConError = (resultado as any).filasConError || [];
        
        console.log('📊 [CrearCarga] Datos procesados:', {
          datosExcel: datosExcel?.length || 0,
          estadisticas,
          filasConError: filasConError?.length || 0
        });
        
        setDatosExcel(datosExcel || []);
        setFilasConError(filasConError);
        setEstadisticasCarga(estadisticas || {
          totalFilas: datosExcel?.length || 0,
          filasValidas: (datosExcel?.length || 1) - 1,
          filasConError: filasConError?.length || 0
        });
        
        // Preparar formulario con datos del Excel
        await prepararFormularioDesdeExcel();
        
        showSuccess(
          'Éxito', 
          `Archivo procesado correctamente!\n\nLos datos están listos para guardar. Revisa las estadísticas en la sección "Resumen del archivo".`,
          [{ text: 'OK', onPress: () => setMostrarFormulario(true) }]
        );
      } else {
        const errorMsg = (resultado as any).error || 'Error al procesar el archivo';
        setError(errorMsg);
        showError('Error', errorMsg);
      }
    } catch (error) {
      console.error('[CrearCarga] Excel processing failed:', error);
      const errorMsg = 'Error al procesar el archivo Excel';
      setError(errorMsg);
      showError('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Funciones de formulario
  const handleMostrarFormulario = () => {
    if (datosExcel.length === 0) {
      showError('Error', 'Primero debes cargar un archivo Excel');
      return;
    }
    setMostrarFormulario(true);
  };

  const handleCerrarFormulario = () => {
    setMostrarFormulario(false);
    if (guardadoExitoso) {
      limpiarFormulario();
    }
  };

  const handleGenerarNuevoCodigo = async () => {
    try {
      await generarNuevoCodigo();
    } catch (error) {
      console.warn('[CrearCarga] Code generation failed:', error);
    }
  };

  // Función para visualizar QRs
  const handleVisualizarQR = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[CrearCarga] Save response data:', { hasData: !!datosGuardado, keys: Object.keys(datosGuardado || {}) });
    }
    const idCarga = datosGuardado?.carga?.id || datosGuardado?.carga?.id_carga || datosGuardado?.idCarga;
    console.log(`[CrearCarga] Extracted cargo ID: ${idCarga}`);
    if (idCarga) {
      console.log('[CrearCarga] Navigating to QR visualization');
      router.push(`/visualizar-qr/${idCarga}` as any);
    } else {
      console.warn('[CrearCarga] No cargo ID available for QR visualization');
      showError('Error', 'No se pudo obtener el ID de la carga para visualizar los QRs');
    }
  };

  // Funciones de guardado
  const handleGuardarEnBD = async () => {
    // Validar formulario
    const validacion = validarFormularioCarga(infoCliente, infoCarga);
    
    if (!validacion.esValido) {
      showError('Error de validación', validacion.errores.join('\n'));
      return;
    }

    if (datosExcel.length <= 1) {
      showError('Error', 'No hay datos válidos para guardar');
      return;
    }

    setGuardandoBD(true);
    setError('');

    try {
      // Preparar datos en el formato correcto para el nuevo endpoint
      const metadata = {
        codigo_carga: infoCarga.codigo_carga,
        id_cliente: 1, // Por defecto, ajustar según tu lógica
        direccion_destino: infoCarga.direccion_destino || '',
        ciudad_destino: infoCarga.direccion_destino || '', // Usar dirección destino como ciudad por ahora
        archivo_original: archivoSeleccionado?.name || 'archivo.xlsx'
      };

      console.log('💾 [CrearCarga] Guardando con nuevo formato...');
      console.log('📦 [CrearCarga] Datos Excel:', datosExcel.length, 'filas');
      console.log('📋 [CrearCarga] Metadata:', metadata);

      // Usar el nuevo método con formato correcto
      const resultado = await CargaService.guardarPackingListConQR(datosExcel, metadata);

      if (resultado.success) {
        setGuardadoExitoso(true);
        setDatosGuardado(resultado.data);
        
        // Extraer estadísticas correctas del backend
        const estadisticas = resultado.data.estadisticas || {};
        const articulos_creados = estadisticas.articulos_creados || 0;
        const cajas_creadas = estadisticas.cajas_generadas || 0;
        const qrs_creados = estadisticas.qrs_generados || 0;
        
        console.log('📊 [CrearCarga] Estadísticas procesadas:', {
          articulos_creados,
          cajas_creadas,
          qrs_creados,
          estadisticas_completas: estadisticas
        });
        
        showSuccess(
          'Éxito', 
          `Packing list guardado correctamente!\n\n` +
          `✅ Artículos: ${articulos_creados}\n` +
          `📦 Cajas: ${cajas_creadas}\n` +
          `🏷️ QRs generados: ${qrs_creados}`,
          [
            { text: 'Ver QRs', onPress: handleVisualizarQR },
            { text: 'OK', style: 'default' }
          ]
        );
      } else {
        setError(resultado.error || 'Error al guardar');
        showError('Error', resultado.error || 'Error al guardar el packing list');
      }
    } catch (error: any) {
      console.error('[CrearCarga] Save operation failed:', error);
      setError('Error al guardar en base de datos');
      showError('Error', `Error al guardar: ${error?.message || 'Error desconocido'}`);
    } finally {
      setGuardandoBD(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={volverAlDashboard} style={styles.botonVolver}>
          <Ionicons name="arrow-back" size={24} color="#007bff" />
        </TouchableOpacity>
        <Logo888Cargo size="small" layout="horizontal" showText={true} />
      </View>

      <ScrollView style={styles.contenido} showsVerticalScrollIndicator={false}>
        {/* Sección de búsqueda */}
        <BusquedaPackingList
          codigoCarga={codigoCarga}
          setCodigoCarga={setCodigoCarga}
          onBuscar={handleBuscarPackingList}
          onLimpiar={limpiarBusqueda}
          onVerDetalles={handleVerDetallesPackingList}
          busquedaLoading={busquedaLoading}
          mostrandoResultados={mostrandoResultados}
          resultadosBusqueda={resultadosBusqueda}
          error={error}
        />

        {/* Separador */}
        <View style={styles.separador}>
          <View style={styles.lineaSeparador} />
          <Text style={styles.textoSeparador}>O</Text>
          <View style={styles.lineaSeparador} />
        </View>

        {/* Sección de crear nueva carga */}
        <View style={styles.seccion}>
          <View style={styles.seccionHeader}>
            <Ionicons name="add-circle" size={24} color="#28a745" />
            <Text style={styles.seccionTitulo}>Crear Nueva Carga</Text>
          </View>

          {/* Botón para cargar archivo */}
          <TouchableOpacity
            style={styles.botonCargarArchivo}
            onPress={handleFileUpload}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="cloud-upload" size={24} color="#fff" />
            )}
            <Text style={styles.textoBotonCargar}>
              {loading ? 'Procesando...' : 'Cargar Archivo Excel'}
            </Text>
          </TouchableOpacity>

          {/* Información del archivo seleccionado */}
          {archivoSeleccionado && (
            <View style={styles.archivoInfo}>
              <Ionicons name="document" size={20} color="#28a745" />
              <View style={styles.archivoDetalles}>
                <Text style={styles.archivoNombre}>{archivoSeleccionado.name}</Text>
                <Text style={styles.archivoTamano}>
                  {((archivoSeleccionado.size || 0) / (1024 * 1024)).toFixed(2)} MB
                </Text>
              </View>
              {datosExcel.length > 0 && (
                <TouchableOpacity
                  style={styles.botonFormulario}
                  onPress={handleMostrarFormulario}
                >
                  <Ionicons name="create" size={16} color="#007bff" />
                  <Text style={styles.textoBotonFormulario}>Datos</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Mostrar error si existe */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#dc3545" />
              <Text style={styles.errorTexto}>{error}</Text>
            </View>
          )}

          {/* Mostrar estadísticas si existen */}
          {estadisticasCarga && (
            <View style={styles.estadisticasContainer}>
              <Text style={styles.estadisticasTitulo}>Resumen del archivo:</Text>
              <Text style={styles.estadisticasTexto}>
                • Total de filas: {estadisticasCarga.totalFilas}
              </Text>
              <Text style={styles.estadisticasTexto}>
                • Filas válidas: {estadisticasCarga.filasValidas}
              </Text>
              <Text style={styles.estadisticasTexto}>
                • Filas con errores: {estadisticasCarga.filasConError || 0}
              </Text>
            </View>
          )}
        </View>

        {/* Mostrar tablas de datos */}
        {(datosExcel.length > 0 || filasConError.length > 0) && (
          <TablasDatos 
            datosExcel={datosExcel} 
            filasConError={filasConError} 
          />
        )}
      </ScrollView>

      {/* Modal de datos del packing list */}
      <ModalPackingList
        mostrar={mostrarFormulario}
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
        onVisualizarPDF={handleVisualizarQR}
        bloquearCampos={guardadoExitoso}
      />
      
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        buttons={alertState.buttons}
        onClose={hideAlert}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  botonVolver: {
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  espaciador: {
    width: 34,
  },
  contenido: {
    flex: 1,
  },
  separador: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  lineaSeparador: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  textoSeparador: {
    paddingHorizontal: 15,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  seccion: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  seccionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  seccionTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  botonCargarArchivo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 10,
  },
  textoBotonCargar: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  archivoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  archivoDetalles: {
    flex: 1,
    marginLeft: 10,
  },
  archivoNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  archivoTamano: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  botonFormulario: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  textoBotonFormulario: {
    color: '#007bff',
    fontSize: 12,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8d7da',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  errorTexto: {
    color: '#721c24',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  estadisticasContainer: {
    backgroundColor: '#d4edda',
    padding: 15,
    borderRadius: 12,
    marginTop: 15,
  },
  estadisticasTitulo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#155724',
    marginBottom: 8,
  },
  estadisticasTexto: {
    fontSize: 13,
    color: '#155724',
    marginBottom: 2,
  },
});

export default CrearCarga;
