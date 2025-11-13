import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

// Componentes
import TablasDatos from '../../components/TablasDatos';

// Servicios
import CargaService from '../../services/cargaService.js';

const DetallesCarga: React.FC = () => {
  const { idCarga } = useLocalSearchParams<{ idCarga: string }>();
  
  const [loading, setLoading] = useState(true);
  const [cargaData, setCargaData] = useState<any>(null);
  const [packingListData, setPackingListData] = useState<any[][]>([]);
  const [error, setError] = useState('');

  const cargarDetallesCarga = useCallback(async () => {
    try {
      setLoading(true);
      
      // Cargar metadata de la carga
      const resultadoCarga = await CargaService.obtenerCargaMeta(idCarga!);
      if (resultadoCarga.success) {
        setCargaData(resultadoCarga.data);
      }
      
      // Cargar datos del packing list
      const resultadoPacking = await CargaService.buscarPackingList(idCarga!);
      if (resultadoPacking.success) {
        setPackingListData(resultadoPacking.data || []);
      }
      
    } catch (error) {
      console.error('Error al cargar detalles:', error);
      setError('Error al cargar los detalles de la carga');
    } finally {
      setLoading(false);
    }
  }, [idCarga]);

  useEffect(() => {
    if (idCarga) {
      cargarDetallesCarga();
    }
  }, [idCarga, cargarDetallesCarga]);

  const handleVerQRs = () => {
    router.push(`/visualizar-qr/${idCarga}` as any);
  };

  const volverAtras = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centrado]}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.textoCarga}>Cargando detalles...</Text>
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
        <Text style={styles.headerTitle}>Detalles de Carga</Text>
        <TouchableOpacity onPress={handleVerQRs} style={styles.botonQR}>
          <Ionicons name="qr-code" size={24} color="#6f42c1" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contenido} showsVerticalScrollIndicator={false}>
        {/* Información de la carga */}
        {cargaData && (
          <View style={styles.infoCarga}>
            <View style={styles.infoHeader}>
              <Ionicons name="cube" size={24} color="#007bff" />
              <Text style={styles.infoTitulo}>Información de la Carga</Text>
            </View>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Código:</Text>
                <Text style={styles.infoValor}>{cargaData.codigo_carga}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Cliente:</Text>
                <Text style={styles.infoValor}>{cargaData.nombre_cliente}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Correo:</Text>
                <Text style={styles.infoValor}>{cargaData.correo_cliente}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Teléfono:</Text>
                <Text style={styles.infoValor}>{cargaData.telefono_cliente}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Destino:</Text>
                <Text style={styles.infoValor}>{cargaData.direccion_destino}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Fecha de creación:</Text>
                <Text style={styles.infoValor}>
                  {new Date(cargaData.fecha_creacion).toLocaleString('es-CO')}
                </Text>
              </View>
              
              {cargaData.archivo_original && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Archivo original:</Text>
                  <Text style={styles.infoValor}>{cargaData.archivo_original}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Estadísticas */}
        {cargaData && (
          <View style={styles.estadisticas}>
            <View style={styles.estadisticaItem}>
              <Ionicons name="list" size={20} color="#28a745" />
              <Text style={styles.estadisticaTexto}>
                {cargaData.total_items || 0} items
              </Text>
            </View>
            
            <View style={styles.estadisticaItem}>
              <Ionicons name="qr-code" size={20} color="#6f42c1" />
              <Text style={styles.estadisticaTexto}>
                QRs generados
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.botonVerQRs}
              onPress={handleVerQRs}
            >
              <Ionicons name="eye" size={18} color="#fff" />
              <Text style={styles.textoVerQRs}>Ver QRs</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tabla de datos del packing list */}
        {packingListData.length > 0 && (
          <View style={styles.seccionTabla}>
            <View style={styles.tablaHeader}>
              <Ionicons name="grid" size={20} color="#333" />
              <Text style={styles.tablaTitulo}>Packing List</Text>
            </View>
            
            <TablasDatos 
              datosExcel={packingListData} 
              filasConError={[]} 
            />
          </View>
        )}
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
  botonQR: {
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
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  infoGrid: {
    gap: 15,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  infoValor: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  estadisticas: {
    flexDirection: 'row',
    alignItems: 'center',
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
  estadisticaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  estadisticaTexto: {
    fontSize: 14,
    color: '#333',
    marginLeft: 6,
    fontWeight: '600',
  },
  botonVerQRs: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6f42c1',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  textoVerQRs: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  seccionTabla: {
    flex: 1,
  },
  tablaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  tablaTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
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
});

export default DetallesCarga;
