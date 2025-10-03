import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image, Dimensions, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

// Servicios
import CargaService from '../services/cargaService';
import { getApiUrl } from '../constants/API';

const { width: screenWidth } = Dimensions.get('window');

interface QRData {
  id: string;
  qr_code: string;
  descripcion: string;
  item_numero: number;
  numero_caja: number;
  total_cajas: number;
  ref_art?: string;
  id_articulo?: number;
  url_imagen?: string;
}

const VisualizarQr: React.FC = () => {
  const { idCarga } = useLocalSearchParams<{ idCarga: string }>();
  
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState<QRData[]>([]);
  const [cargaInfo, setCargaInfo] = useState<any>(null);
  const [error, setError] = useState('');
  const [generandoPDF, setGenerandoPDF] = useState(false);
  
  // Estados para el modal de zoom del QR
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedQR, setSelectedQR] = useState<QRData | null>(null);

  // useEffect will be moved after function declarations

  const cargarDatosQR = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📄 [VisualizarQr] Cargando QR data para carga:', idCarga);
      
      let resultado = await CargaService.obtenerQRDataDeCarga(idCarga!);
      
      // Si falla por autenticación, intentar obtener de otra manera
      if (!resultado.success && resultado.error?.includes('403') || resultado.error?.includes('401') || resultado.error?.includes('token') || resultado.error?.includes('acceso denegado')) {
        console.warn('⚠️ [VisualizarQr] Error de autenticación, requiere login');
        setError('Error de autenticación. Por favor, vuelve a hacer login.');
        return;
      }
      
      console.log('📄 [VisualizarQr] Resultado completo:', JSON.stringify(resultado, null, 2));
      
      if (resultado.success) {
        // Corregir la estructura de datos - el backend devuelve resultado.data.qrs
        const datosQR = resultado.data?.qrs || [];
        console.log('📄 [VisualizarQr] Datos QR procesados:', datosQR.length, 'elementos');
        console.log('📄 [VisualizarQr] Primer elemento:', datosQR[0]);
        console.log('📄 [VisualizarQr] Estructura completa resultado.data:', resultado.data);
        
        if (datosQR.length === 0) {
          console.warn('⚠️ [VisualizarQr] No se encontraron QRs para esta carga');
          setError('No se encontraron códigos QR para esta carga. Verifica que la carga se haya guardado correctamente.');
          return;
        }
        
        // Mapear los datos y asignar números de artículo correctos
        console.log('🔍 [VisualizarQr] Datos QR raw antes del mapeo:', datosQR.map((qr: any) => ({
          id_qr: qr.id_qr,
          id_articulo: qr.id_articulo,
          numero_caja: qr.numero_caja,
          total_cajas: qr.total_cajas,
          descripcion: qr.descripcion_espanol
        })));
        
        // Crear un mapa de id_articulo a número de artículo secuencial
        const articulosUnicos = [...new Set(datosQR.map((qr: any) => qr.id_articulo))];
        console.log('🔍 [VisualizarQr] Artículos únicos encontrados:', articulosUnicos);
        
        const articuloNumeroMap = new Map();
        articulosUnicos.forEach((idArticulo, index) => {
          articuloNumeroMap.set(idArticulo, index + 1);
          console.log(`🔍 [VisualizarQr] Artículo ID ${idArticulo} -> Número ${index + 1}`);
        });
        
        const qrDataMapeada = datosQR.map((qr: any) => ({
          id: qr.id_qr,
          item_numero: articuloNumeroMap.get(qr.id_articulo), // Número del artículo
          qr_code: qr.codigo_qr,
          descripcion: qr.descripcion_espanol || qr.ref_art || `Caja ${qr.numero_caja}`,
          numero_caja: qr.numero_caja,
          total_cajas: qr.total_cajas,
          ref_art: qr.ref_art,
          id_articulo: qr.id_articulo
        }));
        
        console.log('🔍 [VisualizarQr] Datos finales mapeados:', qrDataMapeada.map((item: any) => ({
          id: item.id,
          item_numero: item.item_numero,
          numero_caja: item.numero_caja,
          total_cajas: item.total_cajas,
          id_articulo: item.id_articulo
        })));
        
        console.log('📄 [VisualizarQr] Datos mapeados:', qrDataMapeada.length, 'QRs');
        setQrData(qrDataMapeada);
      } else {
        console.error('📄 [VisualizarQr] Error en resultado:', resultado.error);
        setError(resultado.error || 'Error al cargar códigos QR');
      }
    } catch (error) {
      console.error('📄 [VisualizarQr] Error al cargar QR data:', error);
      setError(`Error al cargar códigos QR: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  }, [idCarga]); // Add idCarga as dependency

  const cargarInfoCarga = useCallback(async () => {
    try {
      const resultado = await CargaService.obtenerCargaMeta(idCarga!);
      
      if (resultado.success) {
        setCargaInfo(resultado.data);
      }
    } catch (error) {
      console.error('Error al cargar info de carga:', error);
    }
  }, [idCarga]); // Add idCarga as dependency

  // Effect to load data when idCarga changes
  useEffect(() => {
    if (idCarga) {
      cargarDatosQR();
      cargarInfoCarga();
    }
  }, [idCarga, cargarDatosQR, cargarInfoCarga]);

  const handleGenerarPDF = async () => {
    try {
      setGenerandoPDF(true);
      console.log('📄 [VisualizarQr] Iniciando descarga de PDF para carga:', idCarga);
      
      // Usar el servicio de carga que tiene la lógica adaptada del proyecto web
      const resultado = await CargaService.descargarPDFQRs(idCarga!, true); // true para versión optimizada
      
      if (!resultado.success) {
        throw new Error('Error al generar PDF');
      }

      // Guardar el PDF en el sistema de archivos móvil
      const fileUri = FileSystem.documentDirectory + resultado.data.filename;
      
      await FileSystem.writeAsStringAsync(fileUri, resultado.data.base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('✅ [VisualizarQr] PDF guardado en:', fileUri);
      
      // Compartir archivo
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Códigos QR de la Carga',
        });
        
        Alert.alert(
          'Éxito', 
          'PDF generado y compartido exitosamente',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Éxito', 
          `PDF guardado exitosamente en:\n${fileUri}`,
          [{ text: 'OK' }]
        );
      }
      
    } catch (error) {
      console.error('❌ [VisualizarQr] Error al generar PDF:', error);
      Alert.alert(
        'Error', 
        `No se pudo generar el PDF: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setGenerandoPDF(false);
    }
  };

  const handleCompartirQR = async (qrCode: string, descripcion: string) => {
    try {
      // Encontrar el item QR para obtener el ID
      const qrItem = qrData?.find(item => item.qr_code === qrCode);
      if (!qrItem) {
        Alert.alert('Error', 'No se pudo encontrar el QR para compartir');
        return;
      }
      
      // Crear un QR individual y compartirlo usando el ID
      const baseUrl = getApiUrl().replace('/api', ''); // Remover /api del final
      const qrUrl = `${baseUrl}/api/qr/image/${qrItem.id}?width=400`;
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(qrUrl, {
          dialogTitle: `QR: ${descripcion}`,
        });
      }
    } catch (error) {
      console.error('Error al compartir QR:', error);
      Alert.alert('Error', 'No se pudo compartir el código QR');
    }
  };

  const volverAtras = () => {
    router.back();
  };

  // Funciones para el modal de zoom
  const handleQRPress = (qrItem: QRData) => {
    setSelectedQR(qrItem);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedQR(null);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centrado]}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.textoCarga}>Cargando códigos QR...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centrado]}>
        <Ionicons name="alert-circle" size={64} color="#dc3545" />
        <Text style={styles.textoError}>{error}</Text>
        <TouchableOpacity style={styles.botonVolver} onPress={volverAtras}>
          <Text style={styles.textoBotonVolver}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={volverAtras} style={styles.botonHeaderVolver}>
          <Ionicons name="arrow-back" size={24} color="#007bff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Códigos QR</Text>
        <TouchableOpacity 
          onPress={handleGenerarPDF} 
          style={styles.botonPDF}
          disabled={generandoPDF}
        >
          {generandoPDF ? (
            <ActivityIndicator size="small" color="#6f42c1" />
          ) : (
            <Ionicons name="download" size={24} color="#6f42c1" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contenido} showsVerticalScrollIndicator={false}>
        {/* Información de la carga */}
        {cargaInfo && (
          <View style={styles.infoCarga}>
            <Text style={styles.codigoCarga}>{cargaInfo.codigo_carga}</Text>
            <Text style={styles.nombreCliente}>{cargaInfo.nombre_cliente}</Text>
            <Text style={styles.fechaCarga}>
              Creado: {new Date(cargaInfo.fecha_creacion).toLocaleDateString('es-CO')}
            </Text>
          </View>
        )}

        {/* Resumen */}
        <View style={styles.resumen}>
          <View style={styles.resumenItem}>
            <Ionicons name="qr-code" size={20} color="#007bff" />
            <Text style={styles.resumenTexto}>
              {qrData.length} códigos QR generados
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.botonDescargarTodos}
            onPress={handleGenerarPDF}
            disabled={generandoPDF}
          >
            {generandoPDF ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-download" size={18} color="#fff" />
                <Text style={styles.textoDescargarTodos}>Descargar PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Grid de códigos QR */}
        <View style={styles.gridContainer}>
          {qrData && qrData.length > 0 ? (
            qrData.map((item, index) => (
              <View key={item.id} style={styles.qrCard}>
                {/* Header de la card */}
                <View style={styles.qrCardHeader}>
                  <Text style={styles.qrNumero}>
                    Item #{item.item_numero} - Caja {item.numero_caja} de {item.total_cajas}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleCompartirQR(item.qr_code, item.descripcion)}
                    style={styles.botonCompartir}
                  >
                    <Ionicons name="share" size={16} color="#007bff" />
                  </TouchableOpacity>
                </View>

                {/* Imagen QR */}
                <TouchableOpacity 
                  style={styles.qrImageContainer}
                  onPress={() => handleQRPress(item)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ 
                      uri: `${getApiUrl().replace('/api', '')}/api/qr/image/${item.id}?width=200`
                    }}
                    style={styles.qrImage}
                    resizeMode="contain"
                    onError={(error) => {
                      console.error('❌ Error cargando imagen QR:', error);
                      console.log('🔍 URL que falló:', `${getApiUrl().replace('/api', '')}/api/qr/image/${item.id}`);
                    }}
                  />
                </TouchableOpacity>

                {/* Descripción */}
                <View style={styles.qrDescripcion}>
                  <Text style={styles.qrTexto} numberOfLines={2} ellipsizeMode="tail">
                    {item.descripcion || `Item ${item.item_numero}`}
                  </Text>
                </View>

                {/* Código QR (texto) */}
                <View style={styles.qrCodigo}>
                  <Text style={styles.qrCodigoTexto} numberOfLines={1} ellipsizeMode="middle">
                    {item.qr_code}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.centrado}>
              <Ionicons name="qr-code-outline" size={64} color="#ccc" />
              <Text style={styles.textoSinDatos}>No hay códigos QR disponibles</Text>
              <Text style={styles.textoSinDatosSubtitulo}>
                Los códigos QR se generan automáticamente al guardar la carga
              </Text>
            </View>
          )}
        </View>

        {/* Espacio adicional al final */}
        <View style={styles.espacioFinal} />
      </ScrollView>

      {/* Modal para zoom del QR */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <View style={styles.modalContainer}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              {selectedQR && (
                <View style={styles.modalContent}>
                  {/* Header del modal */}
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      Item #{selectedQR.item_numero} - Caja {selectedQR.numero_caja} de {selectedQR.total_cajas}
                    </Text>
                    <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton}>
                      <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>

                  {/* Imagen QR ampliada */}
                  <View style={styles.modalQRContainer}>
                    <Image
                      source={{ 
                        uri: `${getApiUrl().replace('/api', '')}/api/qr/image/${selectedQR.id}?width=400`
                      }}
                      style={styles.modalQRImage}
                      resizeMode="contain"
                    />
                  </View>

                  {/* Información del QR */}
                  <View style={styles.modalInfo}>
                    <Text style={styles.modalDescripcion}>
                      {selectedQR.descripcion || `Item ${selectedQR.item_numero}`}
                    </Text>
                    <Text style={styles.modalCodigo}>
                      {selectedQR.qr_code}
                    </Text>
                  </View>

                  {/* Botón de compartir */}
                  <TouchableOpacity
                    style={styles.modalShareButton}
                    onPress={() => {
                      handleCompartirQR(selectedQR.qr_code, selectedQR.descripcion);
                      closeModal();
                    }}
                  >
                    <Ionicons name="share" size={20} color="#fff" />
                    <Text style={styles.modalShareText}>Compartir QR</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centrado: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  botonHeaderVolver: {
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  botonPDF: {
    padding: 5,
  },
  contenido: {
    flex: 1,
  },
  infoCarga: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  codigoCarga: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 5,
  },
  nombreCliente: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  fechaCarga: {
    fontSize: 14,
    color: '#666',
  },
  resumen: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resumenItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resumenTexto: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    fontWeight: '600',
  },
  botonDescargarTodos: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6f42c1',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  textoDescargarTodos: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  qrCard: {
    width: (screenWidth - 60) / 2, // 2 columnas con espaciado
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  qrNumero: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#007bff',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    flex: 1,
    textAlign: 'center',
  },
  botonCompartir: {
    padding: 4,
  },
  qrImageContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  qrImage: {
    width: 120,
    height: 120,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  qrDescripcion: {
    marginBottom: 8,
  },
  qrTexto: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    lineHeight: 16,
  },
  qrCodigo: {
    backgroundColor: '#f8f9fa',
    padding: 6,
    borderRadius: 4,
  },
  qrCodigoTexto: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  textoCarga: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
  },
  textoError: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  botonVolver: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  textoBotonVolver: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  textoSinDatos: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 15,
    fontWeight: '500',
  },
  textoSinDatosSubtitulo: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
  espacioFinal: {
    height: 40,
  },
  
  // Estilos del modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    maxWidth: screenWidth * 0.9,
    maxHeight: screenWidth * 0.9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007bff',
    flex: 1,
    textAlign: 'center',
  },
  modalCloseButton: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  modalQRContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
  },
  modalQRImage: {
    width: screenWidth * 0.6,
    height: screenWidth * 0.6,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  modalInfo: {
    marginBottom: 20,
    alignItems: 'center',
  },
  modalDescripcion: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
  modalCodigo: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    justifyContent: 'center',
    gap: 8,
  },
  modalShareText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VisualizarQr;