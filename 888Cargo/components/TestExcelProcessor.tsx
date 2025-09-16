import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import CargaService from '../services/cargaService.js';

interface Estadisticas {
  totalFilas: number;
  filasValidas: number;
  filasConError: number;
}

const TestExcelProcessor = () => {
  const [loading, setLoading] = useState(false);
  const [datos, setDatos] = useState<any[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);

  const probarProcesarExcel = async () => {
    try {
      // Seleccionar archivo
      const resultado = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv'
        ],
        copyToCacheDirectory: true,
      });

      if (resultado.canceled) {
        return;
      }

      const archivo = resultado.assets[0];
      console.log('📂 [TestComponent] Archivo seleccionado:', archivo);

      setLoading(true);

      // Procesar con nuestro servicio
      const response = await CargaService.procesarExcel(archivo as any);

      if (response.success) {
        setDatos(response.data.datosExcel || []);
        setEstadisticas(response.data.estadisticas);
        Alert.alert(
          'Éxito',
          `Archivo procesado correctamente!\n\nFilas: ${response.data.estadisticas?.totalFilas || 0}\nProductos: ${response.data.estadisticas?.filasValidas || 0}`
        );
      } else {
        Alert.alert('Error', (response as any).error || 'Error al procesar archivo');
      }
    } catch (error) {
      console.error('❌ [TestComponent] Error:', error);
      Alert.alert('Error', 'Error inesperado al procesar archivo');
    } finally {
      setLoading(false);
    }
  };

  const probarConectividad = async () => {
    try {
      const resultado = await CargaService.testConectividad();
      if (resultado.success) {
        Alert.alert('Conectividad OK', 'Servidor respondiendo correctamente');
      } else {
        Alert.alert('Sin Conexión', 'Usando modo offline con datos de prueba');
      }
    } catch (error) {
      Alert.alert('Sin Conexión', 'Usando modo offline con datos de prueba');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Test Processor Excel</Text>
        <Text style={styles.subtitle}>Prueba del servicio de cargas</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={probarProcesarExcel}
          disabled={loading}
        >
          <Ionicons name="document-text" size={20} color="#fff" />
          <Text style={styles.buttonText}>
            {loading ? 'Procesando...' : 'Probar Procesar Excel'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={probarConectividad}
        >
          <Ionicons name="wifi" size={20} color="#007bff" />
          <Text style={styles.secondaryButtonText}>Probar Conectividad</Text>
        </TouchableOpacity>
      </View>

      {estadisticas && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>📊 Estadísticas</Text>
          <Text style={styles.statsText}>Total filas: {estadisticas.totalFilas}</Text>
          <Text style={styles.statsText}>Filas válidas: {estadisticas.filasValidas}</Text>
          <Text style={styles.statsText}>Filas con error: {estadisticas.filasConError}</Text>
        </View>
      )}

      {datos.length > 0 && (
        <View style={styles.dataContainer}>
          <Text style={styles.dataTitle}>📋 Datos Procesados (primeras 5 filas)</Text>
          {datos.slice(0, 5).map((fila, index) => (
            <View key={index} style={styles.row}>
              <Text style={styles.rowText}>
                {Array.isArray(fila) ? fila.slice(0, 3).join(' | ') : JSON.stringify(fila)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 15,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#007bff',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007bff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    backgroundColor: '#d4edda',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#155724',
    marginBottom: 10,
  },
  statsText: {
    fontSize: 14,
    color: '#155724',
    marginBottom: 5,
  },
  dataContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  dataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  row: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f8f9fa',
    marginBottom: 5,
    borderRadius: 5,
  },
  rowText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
});

export default TestExcelProcessor;