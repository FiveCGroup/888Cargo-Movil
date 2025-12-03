import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import cotizacionService from '../../services/cotizacionService';
import { useAuth } from '../../hooks/useAuth';

export default function CotizacionesScreen() {
  const { isAuthenticated } = useAuth();
  const [tipoCotizacion, setTipoCotizacion] = useState<'maritimo' | 'aereo'>('maritimo');
  const [largo, setLargo] = useState('');
  const [ancho, setAncho] = useState('');
  const [alto, setAlto] = useState('');
  const [peso, setPeso] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  // Cargar datos guardados al iniciar
  useEffect(() => {
    const cargarDatosGuardados = async () => {
      try {
        const datosGuardados = await cotizacionService.obtenerDatosTemporales();
        
        if (datosGuardados) {
          console.log('📦 Cargando cotización guardada:', datosGuardados);
          
          // Restaurar los datos del formulario
          if (datosGuardados.payload) {
            setLargo(datosGuardados.payload.largo_cm?.toString() || '');
            setAncho(datosGuardados.payload.ancho_cm?.toString() || '');
            setAlto(datosGuardados.payload.alto_cm?.toString() || '');
            setPeso(datosGuardados.payload.peso_kg?.toString() || '');
          }
          
          // Restaurar el tipo de cotización
          if (datosGuardados.tipo) {
            setTipoCotizacion(datosGuardados.tipo);
          }
          
          // Si ya hay un resultado, mostrarlo
          if (datosGuardados.resultado) {
            setResultado(datosGuardados.resultado);
            Alert.alert(
              'Datos restaurados',
              'Hemos recuperado tu cotización anterior.'
            );
          }
        }
      } catch (error) {
        console.error('Error cargando datos guardados:', error);
      }
    };

    cargarDatosGuardados();
  }, []);

  const handleCotizar = async () => {
    // Validar campos
    if (!largo || !ancho || !alto || !peso) {
      Alert.alert('Error', 'Por favor completa todas las dimensiones');
      return;
    }

    const largoNum = parseFloat(largo);
    const anchoNum = parseFloat(ancho);
    const altoNum = parseFloat(alto);
    const pesoNum = parseFloat(peso);

    if (isNaN(largoNum) || isNaN(anchoNum) || isNaN(altoNum) || isNaN(pesoNum)) {
      Alert.alert('Error', 'Por favor ingresa valores numéricos válidos');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        largo_cm: largoNum,
        ancho_cm: anchoNum,
        alto_cm: altoNum,
        peso_kg: pesoNum,
      };

      // ✅ CORREGIDO: Usar cotizarEnvio con el tipo
      const result = await cotizacionService.cotizarEnvio(
        tipoCotizacion, 
        payload, 
        isAuthenticated // ← Pasar estado de autenticación
      );

      if (result.success) {
        setResultado(result.data);
        
        if (result.isStub) {
          Alert.alert(
            'Cotización calculada (modo offline)',
            'No se pudo conectar al servidor, el precio es aproximado.'
          );
        } else {
          Alert.alert('Éxito', 'Cotización calculada correctamente');
        }
      } else {
        Alert.alert('Error', 'Error al calcular cotización');
      }

    } catch (error: any) {
      console.error('Error cotizando:', error);
      Alert.alert('Error', error.message || 'Error al calcular cotización');
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarPDF = async () => {
    if (!resultado) {
      Alert.alert('Error', 'Primero debes realizar una cotización');
      return;
    }

    setLoadingPDF(true);

    try {
      // Generar el PDF usando el servicio
      const pdfResult = await cotizacionService.generarPDF({
        tipo: tipoCotizacion,
        payload: {
          largo_cm: parseFloat(largo),
          ancho_cm: parseFloat(ancho),
          alto_cm: parseFloat(alto),
          peso_kg: parseFloat(peso),
        },
        resultado: resultado
      });

      if (pdfResult.success && pdfResult.pdfUri) {
        // Verificar si se puede compartir
        const canShare = await Sharing.isAvailableAsync();
        
        if (canShare) {
          await Sharing.shareAsync(pdfResult.pdfUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Guardar cotización',
            UTI: 'com.adobe.pdf'
          });
          
          Alert.alert('Éxito', 'PDF generado y listo para compartir');
        } else {
          Alert.alert('Éxito', `PDF generado en: ${pdfResult.pdfUri}`);
        }
      } else {
        Alert.alert('Error', 'No se pudo generar el PDF');
      }
    } catch (error: any) {
      console.error('Error generando PDF:', error);
      Alert.alert('Error', error.message || 'Error al generar el PDF');
    } finally {
      setLoadingPDF(false);
    }
  };

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(precio);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Nueva Cotización</Text>

        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Tipo de envío:</Text>
          <Picker
            selectedValue={tipoCotizacion}
            onValueChange={(value) => setTipoCotizacion(value)}
            style={styles.picker}
          >
            <Picker.Item label="Marítimo" value="maritimo" />
            <Picker.Item label="Aéreo" value="aereo" />
          </Picker>
        </View>

        <Text style={styles.label}>Dimensiones (cm):</Text>
        <View style={styles.row}>
          <TextInput
            style={styles.inputSmall}
            placeholder="Largo"
            value={largo}
            onChangeText={setLargo}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.inputSmall}
            placeholder="Ancho"
            value={ancho}
            onChangeText={setAncho}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.inputSmall}
            placeholder="Alto"
            value={alto}
            onChangeText={setAlto}
            keyboardType="numeric"
          />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Peso (kg)"
          value={peso}
          onChangeText={setPeso}
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleCotizar}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>COTIZAR</Text>
          )}
        </TouchableOpacity>

        {resultado && (
          <>
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Resultado:</Text>
              <Text style={styles.resultText}>
                Tipo: {tipoCotizacion === 'maritimo' ? 'Marítimo' : 'Aéreo'}
              </Text>
              <Text style={styles.resultText}>
                Volumen: {resultado.volumen_m3} m³
              </Text>
              <Text style={styles.resultText}>
                Peso: {resultado.peso_kg} kg
              </Text>
              <Text style={styles.resultPrice}>
                Precio: {formatearPrecio(resultado.valor_cop)}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.btnPDF, loadingPDF && styles.btnDisabled]}
              onPress={handleDescargarPDF}
              disabled={loadingPDF}
            >
              {loadingPDF ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>📄 DESCARGAR PDF</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#0b2032',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0b2032',
    textAlign: 'center',
    marginBottom: 30,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#0b2032',
    marginBottom: 8,
    fontWeight: '600',
  },
  picker: {
    backgroundColor: '#e9ebef',
    borderRadius: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputSmall: {
    backgroundColor: '#e9ebef',
    color: '#0b2032',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    flex: 1,
    marginHorizontal: 4,
  },
  input: {
    backgroundColor: '#e9ebef',
    color: '#0b2032',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  btn: {
    backgroundColor: '#0f77c5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  btnPDF: {
    backgroundColor: '#28a745',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  resultContainer: {
    marginTop: 24,
    padding: 20,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0f77c5',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0b2032',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 16,
    color: '#0b2032',
    marginBottom: 8,
  },
  resultPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f77c5',
    marginTop: 8,
  },
});