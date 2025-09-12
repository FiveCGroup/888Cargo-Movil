import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';

// Componentes
import BusquedaPackingList from '../../components/BusquedaPackingList';
import TablasDatos from '../../components/TablasDatos';
import ModalPackingList from '../../components/ModalPackingList';
import Logo888Cargo from '../../components/Logo888Cargo';
import TestExcelProcessor from '../../components/TestExcelProcessor';

// Hooks y servicios
import { useCrearCarga } from '../../hooks/useCrearCarga';
import CargaService from '../../services/cargaService.js';
import { validarArchivoExcel, validarFormularioCarga } from '../../utils/cargaUtils';

const CrearCarga = () => {
  // Estado para modo debug
  const [modoDebug, setModoDebug] = useState(false);
  
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

  // =============== FUNCIONES DE MANEJO ===============

  // Funciones de navegación
  const volverAlDashboard = () => {
    router.push('/');
  };

  // Funciones de búsqueda
  const handleBuscarPackingList = async () => {
    if (!codigoCarga.trim()) {
      Alert.alert('Error', 'Por favor ingresa un código de packing list');
      return;
    }

    setBusquedaLoading(true);
    setError('');

    try {
      const resultado = await CargaService.buscarPackingList(codigoCarga);
      
      if (resultado.success) {
        setResultadosBusqueda(resultado.data);
        setMostrandoResultados(true);
      } else {
        setError(resultado.error || 'No se encontraron resultados');
        setResultadosBusqueda([]);
        setMostrandoResultados(true);
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setError('Error al buscar el packing list');
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
          Alert.alert('Error', validacion.error);
          return;
        }

        setArchivoSeleccionado(archivo);
        await procesarArchivoExcel(archivo);
      }
    } catch (error) {
      console.error('Error al seleccionar archivo:', error);
      Alert.alert('Error', 'Error al seleccionar el archivo');
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
        const { datosExcel, estadisticas } = resultado.data;
        
        setDatosExcel(datosExcel || []);
        setFilasConError([]);
        setEstadisticasCarga(estadisticas || {
          totalFilas: datosExcel?.length || 0,
          filasValidas: (datosExcel?.length || 1) - 1,
          filasConError: 0
        });
        
        // Preparar formulario con datos del Excel
        prepararFormularioDesdeExcel();
        
        Alert.alert(
          'Éxito', 
          `Archivo procesado correctamente!\n\n` +
          `Total filas: ${(datosExcel?.length || 1)}\n` +
          `Productos: ${(estadisticas?.filasValidas || 0)}\n` +
          `Columnas: ${(estadisticas?.columnas || 0)}\n` +
          `${estadisticas?.filasEncabezado ? `Encabezados: ${estadisticas.filasEncabezado} filas` : ''}`,
          [{ text: 'OK', onPress: () => setMostrarFormulario(true) }]
        );
      } else {
        const errorMsg = resultado.error || 'Error al procesar el archivo';
        setError(errorMsg);
        Alert.alert('Error', errorMsg);
      }
    } catch (error) {
      console.error('❌ [CrearCarga] Error al procesar Excel:', error);
      const errorMsg = 'Error al procesar el archivo Excel';
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Funciones de formulario
  const handleMostrarFormulario = () => {
    if (datosExcel.length === 0) {
      Alert.alert('Error', 'Primero debes cargar un archivo Excel');
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

  const handleGenerarNuevoCodigo = () => {
    generarNuevoCodigo();
  };

  // Función para visualizar QRs
  const handleVisualizarQR = () => {
    if (datosGuardado?.idCarga) {
      router.push(`/visualizar-qr/${datosGuardado.idCarga}` as any);
    }
  };

  // Función para probar conectividad
  const probarConectividad = async () => {
    try {
      const resultado = await CargaService.testConectividad();
      if (resultado.success) {
        Alert.alert('Conectividad OK', 'Servidor respondiendo correctamente');
      } else {
        Alert.alert('Error de Conectividad', resultado.error || 'No se puede conectar al servidor');
      }
    } catch (error) {
      Alert.alert('Error', 'Error al probar conectividad');
    }
  };

  // Funciones de guardado
  const handleGuardarEnBD = async () => {
    // Validar formulario
    const validacion = validarFormularioCarga(infoCliente, infoCarga);
    
    if (!validacion.esValido) {
      Alert.alert('Error de validación', validacion.errores.join('\n'));
      return;
    }

    if (datosExcel.length <= 1) {
      Alert.alert('Error', 'No hay datos válidos para guardar');
      return;
    }

    setGuardandoBD(true);
    setError('');

    try {
      const datosCompletos = {
        codigo_carga: infoCarga.codigo_carga,
        cliente: infoCliente,
        carga: {
          ...infoCarga,
          archivo_original: archivoSeleccionado?.name || ''
        },
        items: datosExcel.slice(1), // Excluir headers
        estadisticas: estadisticasCarga
      };

      const resultado = await CargaService.guardarPackingListConQR(datosCompletos);

      if (resultado.success) {
        setGuardadoExitoso(true);
        setDatosGuardado(resultado.data);
        Alert.alert('Éxito', 'Packing list guardado correctamente con códigos QR generados');
      } else {
        setError(resultado.error || 'Error al guardar');
        Alert.alert('Error', resultado.error || 'Error al guardar el packing list');
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      setError('Error al guardar en base de datos');
      Alert.alert('Error', 'Error al guardar en base de datos');
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
        <TouchableOpacity onPress={() => setModoDebug(!modoDebug)} style={styles.botonDebug}>
          <Ionicons name="bug" size={20} color={modoDebug ? "#ff6b6b" : "#999"} />
        </TouchableOpacity>
      </View>

      {/* Modo Debug */}
      {modoDebug && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>🧪 Modo Debug</Text>
          <TestExcelProcessor />
        </View>
      )}

      {/* Contenido normal */}
      {!modoDebug && (

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
        />

        {/* Separador */}
        <View style={styles.separador}>
          <View style={styles.lineaSeparador} />
          <Text style={styles.textoSeparador}>O</Text>
          <View style={styles.lineaSeparador} />
        </View>

        {/* Botón de test de conectividad */}
        <TouchableOpacity style={styles.botonTest} onPress={probarConectividad}>
          <Ionicons name="wifi" size={20} color="#007bff" />
          <Text style={styles.textoBotonTest}>Probar Conexión</Text>
        </TouchableOpacity>

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
                • Filas con errores: {estadisticasCarga.filasConErrores}
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
      )}

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
  botonDebug: {
    padding: 8,
    borderRadius: 6,
  },
  debugContainer: {
    flex: 1,
    backgroundColor: '#f0f8ff',
    margin: 10,
    borderRadius: 10,
    padding: 15,
  },
  debugTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
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
  botonTest: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f4f8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 15,
    gap: 8,
  },
  textoBotonTest: {
    color: '#007bff',
    fontSize: 14,
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
