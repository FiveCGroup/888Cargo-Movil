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
  Linking,
  Dimensions,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import cotizacionService from '../../services/cotizacionService';
import { useAuth } from '../../hooks/useAuth';

export default function CotizacionesScreen() {
  const { isAuthenticated, user } = useAuth();
  const [tipoCotizacion, setTipoCotizacion] = useState<'maritimo' | 'aereo'>('maritimo');
  const [largo, setLargo] = useState('');
  const [ancho, setAncho] = useState('');
  const [alto, setAlto] = useState('');
  const [peso, setPeso] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  // Detectar cambios en el tamaño de pantalla
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });

    return () => subscription?.remove();
  }, []);

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
        resultado: resultado,
        detalleCalculo: resultado.detalleCalculo,
        user: user
      });

      if (pdfResult.success && pdfResult.pdfUri) {
        // Determinar el tipo de archivo y MIME type
        const isPDF = pdfResult.pdfUri.toLowerCase().endsWith('.pdf');
        const mimeType = isPDF ? 'application/pdf' : 'text/html';
        const fileName = isPDF ? 'cotizacion_888cargo.pdf' : 'cotizacion_888cargo.html';
        
        // Verificar si se puede compartir
        // Si estamos en web y recibimos HTML (blob), abrir nueva pestaña o forzar descarga
        if (Platform.OS === 'web' && pdfResult.isHtml && pdfResult.pdfUri) {
          try {
            const blobUrl = pdfResult.pdfUri;
            const safeUser = (user && (user.name || user.email)) || 'Usuario';
            const fileNameHtml = `Cotizacion_${safeUser.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g,'_')}.html`;
            // Intentar forzar descarga
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileNameHtml;
            document.body.appendChild(link);
            link.click();
            link.remove();
            // además abrir en nueva pestaña para que el usuario pueda imprimir/guardar como PDF si lo desea
            window.open(blobUrl, '_blank');
            Alert.alert('Archivo generado', 'Se ha abierto una nueva pestaña con la cotización. Puedes guardarla o imprimirla desde allí.');
          } catch (err) {
            console.error('Error manejando HTML blob en web:', err);
            Alert.alert('Archivo generado', `Archivo disponible: ${pdfResult.pdfUri || 'ver consola'}`);
          }
          return;
        }

        // Si estamos en web y recibimos base64, forzar descarga para evitar imprimir la página
        if (Platform.OS === 'web' && pdfResult.isBase64 && pdfResult.pdfBase64) {
          try {
            const byteCharacters = atob(pdfResult.pdfBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: 'application/pdf' });
              const blobUrl = URL.createObjectURL(blob);
              const safeUser = (user && (user.name || user.email)) || 'Usuario';
              const fileName = `Cotizacion_${safeUser.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g,'_')}.pdf`;
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(blobUrl);
            Alert.alert('Éxito', 'PDF descargado correctamente');
          } catch (err) {
            console.error('Error descargando PDF en web:', err);
            Alert.alert('Archivo generado', `Archivo disponible: ${pdfResult.pdfUri || 'ver consola'}`);
          }
          return;
        }

        const canShare = await Sharing.isAvailableAsync();

        // A partir de aquí trabajamos con una URI no-nula
        const uri = pdfResult.pdfUri as string;

        if (canShare) {
          try {
            await Sharing.shareAsync(uri, {
              mimeType: mimeType,
              dialogTitle: 'Compartir cotización 888 Cargo',
              UTI: isPDF ? 'com.adobe.pdf' : 'public.html'
            });

            Alert.alert(
              'Éxito', 
              `${isPDF ? 'PDF' : 'Documento'} generado y listo para compartir`,
              [
                { text: 'OK' },
                {
                  text: 'Ver archivo',
                  onPress: () => {
                    // Abrir el archivo con la app predeterminada
                    Linking.openURL(uri);
                  }
                }
              ]
            );
          } catch (shareError) {
            console.warn('Error compartiendo:', shareError);
            Alert.alert(
              'Archivo generado',
              `Guardado en: ${uri}`,
              [
                { text: 'OK' },
                {
                  text: 'Abrir archivo',
                  onPress: () => Linking.openURL(uri)
                }
              ]
            );
          }
        } else {
          Alert.alert(
            'Archivo generado',
            `Guardado en: ${uri}`,
            [
              { text: 'OK' },
              {
                text: 'Abrir archivo',
                onPress: () => Linking.openURL(uri)
              }
            ]
          );
        }
      } else {
        Alert.alert('Error', pdfResult.error || 'No se pudo generar el documento');
      }
    } catch (error: any) {
      console.error('Error generando documento:', error);
      Alert.alert('Error', error.message || 'Error al generar el documento de cotización');
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

  // Función para generar estilos responsive
  const getStyles = (width: number) => StyleSheet.create({
    container: {
      flexGrow: 1,
      padding: width < 600 ? 16 : 20,
      backgroundColor: '#f5f5f5',
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: 20,
      padding: width < 600 ? 20 : 24,
      shadowColor: '#0b2032',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
      maxWidth: 800,
      alignSelf: 'center',
      width: '100%',
    },
    title: {
      fontSize: width < 600 ? 22 : 24,
      fontWeight: 'bold',
      color: '#0b2032',
      textAlign: 'center',
      marginBottom: width < 600 ? 24 : 30,
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
    dimensionsContainer: {
      marginBottom: 16,
    },
    dimensionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    dimensionLabel: {
      fontSize: 16,
      color: '#0b2032',
      fontWeight: '600',
      width: width < 600 ? 70 : 80,
      marginRight: 12,
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
      minWidth: width < 600 ? 60 : 80,
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
      fontSize: width < 600 ? 16 : 18,
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
      padding: width < 600 ? 16 : 20,
      backgroundColor: '#f0f8ff',
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#0f77c5',
    },
    resultTitle: {
      fontSize: width < 600 ? 18 : 20,
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
      fontSize: width < 600 ? 20 : 22,
      fontWeight: 'bold',
      color: '#0f77c5',
      marginTop: 8,
    },
  });

  const styles = getStyles(screenWidth);

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
        {screenWidth < 600 ? (
          // Layout vertical para móviles
          <View style={styles.dimensionsContainer}>
            <View style={styles.dimensionRow}>
              <Text style={styles.dimensionLabel}>Largo:</Text>
              <TextInput
                style={styles.inputSmall}
                placeholder="Largo"
                value={largo}
                onChangeText={setLargo}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.dimensionRow}>
              <Text style={styles.dimensionLabel}>Ancho:</Text>
              <TextInput
                style={styles.inputSmall}
                placeholder="Ancho"
                value={ancho}
                onChangeText={setAncho}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.dimensionRow}>
              <Text style={styles.dimensionLabel}>Alto:</Text>
              <TextInput
                style={styles.inputSmall}
                placeholder="Alto"
                value={alto}
                onChangeText={setAlto}
                keyboardType="numeric"
              />
            </View>
          </View>
        ) : (
          // Layout horizontal para tablets/desktop
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
        )}

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