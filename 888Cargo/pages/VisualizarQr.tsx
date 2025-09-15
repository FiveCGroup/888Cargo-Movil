import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

// Servicios
import CargaService from '../services/cargaService';

const { width: screenWidth } = Dimensions.get('window');

interface QRData {
  id: string;
  qr_code: string;
  descripcion: string;
  item_numero: number;
  url_imagen?: string;
}

const VisualizarQr: React.FC = () => {
  const { idCarga } = useLocalSearchParams<{ idCarga: string }>();
  
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState<QRData[]>([]);
  const [cargaInfo, setCargaInfo] = useState<any>(null);
  const [error, setError] = useState('');
  const [generandoPDF, setGenerandoPDF] = useState(false);

  useEffect(() => {
    if (idCarga) {
      cargarDatosQR();
      cargarInfoCarga();
    }
  }, [idCarga]);

  const cargarDatosQR = async () => {
    try {
      setLoading(true);
      const resultado = await CargaService.obtenerQRDataDeCarga(idCarga!);
      
      if (resultado.success) {
        setQrData(resultado.data || []);
      } else {
        setError(resultado.error || 'Error al cargar códigos QR');
      }
    } catch (error) {
      console.error('Error al cargar QR data:', error);
      setError('Error al cargar códigos QR');
    } finally {
      setLoading(false);
    }
  };

  const cargarInfoCarga = async () => {
    try {
      const resultado = await CargaService.obtenerCargaMeta(idCarga!);
      
      if (resultado.success) {
        setCargaInfo(resultado.data);
      }
    } catch (error) {
      console.error('Error al cargar info de carga:', error);
    }
  };

  const handleGenerarPDF = async () => {
    try {
      setGenerandoPDF(true);
      
      // Generar PDF a través del servicio
      const response = await fetch(`http://10.0.2.2:3102/api/qr/pdf-carga/${idCarga}?useOptimized=true&nocache=${Date.now()}`);
      
      if (!response.ok) {
        throw new Error('Error al generar PDF');
      }

      const blob = await response.blob();
      
      // Guardar en sistema de archivos
      const filename = `QR-Codes-Carga-${idCarga}-${Date.now()}.pdf`;
      const fileUri = FileSystem.documentDirectory + filename;
      
      // Convertir blob a base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // Compartir archivo
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Códigos QR de la Carga',
          });
        } else {
          Alert.alert('Éxito', `PDF guardado en: ${fileUri}`);
        }
      };
      
      reader.readAsDataURL(blob);
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      Alert.alert('Error', 'No se pudo generar el PDF');
    } finally {
      setGenerandoPDF(false);
    }
  };

  const handleCompartirQR = async (qrCode: string, descripcion: string) => {
    try {
      // Crear un QR individual y compartirlo
      const qrUrl = `http://10.0.2.2:3102/api/qr/imagen/${encodeURIComponent(qrCode)}`;
      
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
          {qrData.map((item, index) => (
            <View key={item.id} style={styles.qrCard}>
              {/* Header de la card */}
              <View style={styles.qrCardHeader}>
                <Text style={styles.qrNumero}>#{item.item_numero}</Text>
                <TouchableOpacity
                  onPress={() => handleCompartirQR(item.qr_code, item.descripcion)}
                  style={styles.botonCompartir}
                >
                  <Ionicons name="share" size={16} color="#007bff" />
                </TouchableOpacity>
              </View>

              {/* Imagen QR */}
              <View style={styles.qrImageContainer}>
                <Image
                  source={{ 
                    uri: `http://10.0.2.2:3102/api/qr/imagen/${encodeURIComponent(item.qr_code)}?size=200`
                  }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>

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
          ))}
        </View>

        {/* Espacio adicional al final */}
        <View style={styles.espacioFinal} />
      </ScrollView>
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
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007bff',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
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
  espacioFinal: {
    height: 40,
  },
});

export default VisualizarQr;