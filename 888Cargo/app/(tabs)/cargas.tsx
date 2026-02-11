import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import cargasStyles from '../../styles/cargas.styles';
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
    datosExcelObjetos, setDatosExcelObjetos,
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
      
      console.log('[ANALYTICS] [CrearCarga] Resultado de búsqueda:', resultado);
      
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

      console.log('[ANALYTICS] [CrearCarga] Resultado del procesamiento:', resultado);

      if (resultado.success && (resultado.data || (resultado as any).data)) {
        // El servicio devuelve: { success, data: array, estadisticas, filasConError }
        const datosNormalizados = Array.isArray(resultado.data) ? resultado.data : ((resultado as any).data && Array.isArray((resultado as any).data) ? (resultado as any).data : []);
        const estadisticas = (resultado as any).estadisticas ?? null;
        const filasConError = (resultado as any).filasConError ?? [];
        
        console.log('[ANALYTICS] [CrearCarga] Datos procesados:', {
          datosNormalizados: datosNormalizados?.length || 0,
          estadisticas,
          filasConError: filasConError?.length || 0
        });
        
        // Convertir objetos normalizados a formato tabla (array de arrays) para TablasDatos
        // TablasDatos espera: [headers, ...filas] donde headers es array de strings
        let datosParaTabla: any[][] = [];
        if (datosNormalizados && datosNormalizados.length > 0) {
          // Obtener todas las claves únicas de todos los objetos para crear el header
          const todasLasClaves = new Set<string>();
          datosNormalizados.forEach((obj: any) => {
            Object.keys(obj).forEach(key => todasLasClaves.add(key));
          });
          
          // Convertir Set a Array y ordenar para consistencia
          const headers = Array.from(todasLasClaves).sort();
          
          // Crear array de arrays: primera fila = headers, siguientes = datos
          datosParaTabla = [headers];
          
          // Agregar cada fila de datos
          datosNormalizados.forEach((obj: any) => {
            const fila = headers.map(header => {
              const valor = obj[header];
              // Convertir null/undefined a string vacío, mantener otros valores
              if (valor === null || valor === undefined) return '';
              // Si es un objeto, convertirlo a string JSON (para arrays como imagen_embedded_all)
              if (typeof valor === 'object') return JSON.stringify(valor);
              return String(valor);
            });
            datosParaTabla.push(fila);
          });
        }
        
        // Guardar tabla para visualización en TablasDatos
        setDatosExcel(datosParaTabla);
        // IMPORTANTE: Guardar también los objetos originales para preservar arrays intactos al guardar
        // Usaremos estos objetos al guardar en BD para evitar pérdida de datos
        setDatosExcelObjetos(datosNormalizados || []);
        
        setFilasConError(filasConError);
        setEstadisticasCarga(estadisticas || {
          totalFilas: datosNormalizados?.length || 0,
          filasValidas: (datosNormalizados?.length || 1) - 1,
          filasConError: filasConError?.length || 0
        });
        
        // Preparar formulario con datos del Excel (pasar datos recién procesados para evitar estado desactualizado)
        await prepararFormularioDesdeExcel(datosParaTabla);
        
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
    } catch (error: any) {
      console.error('[CrearCarga] Excel processing failed:', error);
      const errorMsg = error?.message || 'Error al procesar el archivo Excel';
      setError(errorMsg);
      showError('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Funciones de formulario
  const handleMostrarFormulario = () => {
    // Verificar tanto tabla como objetos originales
    if (datosExcel.length === 0 && datosExcelObjetos.length === 0) {
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

    // Verificar que hay datos para guardar
    const tieneDatosTabla = datosExcel.length > 1;
    const tieneObjetosOriginales = datosExcelObjetos.length > 0;
    
    if (!tieneDatosTabla && !tieneObjetosOriginales) {
      showError('Error', 'No hay datos válidos para guardar');
      return;
    }

    setGuardandoBD(true);
    setError('');

    try {
      // Preparar datos en el formato correcto para el nuevo endpoint
      const metadata = {
        codigo_carga: infoCarga.codigo_carga,
        id_cliente: 1,
        direccion_destino: infoCarga.direccion_destino || infoCarga.destino || '',
        ciudad_destino: infoCarga.destino || infoCarga.direccion_destino || '',
        archivo_original: archivoSeleccionado?.name || 'archivo.xlsx',
        nombre_cliente: infoCliente.nombre_cliente,
        correo_cliente: infoCliente.correo_cliente,
        telefono_cliente: infoCliente.telefono_cliente,
        direccion_entrega: infoCliente.direccion_entrega,
        destino: infoCarga.destino || infoCarga.direccion_destino || '',
        shipping_mark: infoCarga.shipping_mark || '',
        estado: infoCarga.estado || 'En bodega China',
        ubicacion_actual: infoCarga.ubicacion_actual || 'China',
        fecha_recepcion: infoCarga.fecha_recepcion || null,
        fecha_envio: infoCarga.fecha_envio || null,
        fecha_arribo: infoCarga.fecha_arribo || null,
        contenedor_asociado: infoCarga.contenedor_asociado || null,
        observaciones: infoCarga.observaciones || null
      };

      // PRIORIDAD: Usar objetos originales si están disponibles (preserva arrays como imagen_embedded_all)
      // Si no, reconstruir desde la tabla
      let datosParaGuardar: any[] = [];
      
      if (tieneObjetosOriginales) {
        // Usar objetos originales preservados (evita pérdida de datos)
        datosParaGuardar = datosExcelObjetos;
        console.log('💾 [CrearCarga] Usando objetos originales preservados:', datosParaGuardar.length, 'objetos');
      } else if (tieneDatosTabla) {
        // Reconstruir objetos desde tabla (fallback)
        const headers = datosExcel[0] || [];
        const filas = datosExcel.slice(1);
        datosParaGuardar = filas.map((fila: any[]) => {
          const obj: any = {};
          headers.forEach((header: string, idx: number) => {
            let valor = fila[idx];
            // Intentar parsear strings JSON (para arrays como imagen_embedded_all)
            if (typeof valor === 'string' && valor.trim().startsWith('[') && valor.trim().endsWith(']')) {
              try {
                const parsed = JSON.parse(valor);
                if (Array.isArray(parsed)) {
                  valor = parsed; // Restaurar array
                }
              } catch (e) {
                // Si no es JSON válido, mantener como string
                console.warn(`[CrearCarga] No se pudo parsear JSON para ${header}:`, e);
              }
            }
            obj[header] = valor;
          });
          return obj;
        });
        console.log('⚠️ [CrearCarga] Reconstruyendo objetos desde tabla (fallback):', datosParaGuardar.length, 'objetos');
      }

      console.log('💾 [CrearCarga] Guardando con nuevo formato...');
      console.log('[DATA] [CrearCarga] Datos para guardar:', datosParaGuardar.length, 'objetos');
      console.log('[INFO] [CrearCarga] Metadata:', metadata);
      console.log('[INFO] [CrearCarga] Info Cliente:', infoCliente);
      console.log('[INFO] [CrearCarga] Info Carga:', infoCarga);

      // Usar el nuevo método con formato correcto - enviar objetos, no tabla
      const resultado = await CargaService.guardarPackingListConQR(datosParaGuardar, metadata);

      if (resultado.success) {
        setGuardadoExitoso(true);
        setDatosGuardado(resultado.data);
        
        // Extraer estadísticas de la respuesta del backend (carga, qrs, etc.)
        const data = resultado.data || {};
        const qrsInfo = data.qrs || {};
        const qrs_creados = qrsInfo.generados ?? 0;
        const articulos_creados = data.estadisticas?.articulos_creados ?? 0;
        const cajas_creadas = data.estadisticas?.cajas_generadas ?? 0;
        
        console.log('[ANALYTICS] [CrearCarga] Respuesta guardado:', { data, qrs_creados });
        
        showSuccess(
          'Éxito', 
          `Packing list guardado correctamente!\n\n` +
          (articulos_creados || cajas_creadas ? `• Artículos: ${articulos_creados}\n• Cajas: ${cajas_creadas}\n` : '') +
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
    <View style={cargasStyles.container}>
      {/* Header */}
      <View style={cargasStyles.header}>
        <TouchableOpacity onPress={volverAlDashboard} style={cargasStyles.botonVolver}>
          <Ionicons name="arrow-back" size={24} color="#007bff" />
        </TouchableOpacity>
        <Logo888Cargo size="small" layout="horizontal" showText={true} />
      </View>

      <ScrollView style={cargasStyles.contenido} showsVerticalScrollIndicator={false}>
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
        <View style={cargasStyles.separador}>
          <View style={cargasStyles.lineaSeparador} />
          <Text style={cargasStyles.textoSeparador}>O</Text>
          <View style={cargasStyles.lineaSeparador} />
        </View>

        {/* Sección de crear nueva carga */}
        <View style={cargasStyles.seccion}>
          <View style={cargasStyles.seccionHeader}>
            <Ionicons name="add-circle" size={24} color="#28a745" />
            <Text style={cargasStyles.seccionTitulo}>Crear Nueva Carga</Text>
          </View>

          {/* Botón para cargar archivo */}
          <TouchableOpacity
            style={cargasStyles.botonCargarArchivo}
            onPress={handleFileUpload}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="cloud-upload" size={24} color="#fff" />
            )}
            <Text style={cargasStyles.textoBotonCargar}>
              {loading ? 'Procesando...' : 'Cargar Archivo Excel'}
            </Text>
          </TouchableOpacity>

          {/* Información del archivo seleccionado */}
          {archivoSeleccionado && (
            <View style={cargasStyles.archivoInfo}>
              <Ionicons name="document" size={20} color="#28a745" />
              <View style={cargasStyles.archivoDetalles}>
                <Text style={cargasStyles.archivoNombre}>{archivoSeleccionado.name}</Text>
                <Text style={cargasStyles.archivoTamano}>
                  {((archivoSeleccionado.size || 0) / (1024 * 1024)).toFixed(2)} MB
                </Text>
              </View>
              {(datosExcel.length > 0 || datosExcelObjetos.length > 0) && (
                <TouchableOpacity
                  style={cargasStyles.botonFormulario}
                  onPress={handleMostrarFormulario}
                >
                  <Ionicons name="create" size={16} color="#007bff" />
                  <Text style={cargasStyles.textoBotonFormulario}>Datos</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Mostrar error si existe */}
          {error && (
            <View style={cargasStyles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#dc3545" />
              <Text style={cargasStyles.errorTexto}>{error}</Text>
            </View>
          )}

          {/* Mostrar estadísticas si existen */}
          {estadisticasCarga && (
            <View style={cargasStyles.estadisticasContainer}>
              <Text style={cargasStyles.estadisticasTitulo}>Resumen del archivo:</Text>
              <Text style={cargasStyles.estadisticasTexto}>
                • Total de filas: {estadisticasCarga.totalFilas}
              </Text>
              <Text style={cargasStyles.estadisticasTexto}>
                • Filas válidas: {estadisticasCarga.filasValidas}
              </Text>
              <Text style={cargasStyles.estadisticasTexto}>
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
        {/* Nota: TablasDatos usa datosExcel que es la tabla convertida para visualización */}
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



export default CrearCarga;
