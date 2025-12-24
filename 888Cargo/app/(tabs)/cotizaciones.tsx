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
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Share } from 'react-native';
import cotizacionService from '../../services/cotizacionService';
import { useAuthContext } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function CotizacionesScreen() {
  const { isAuthenticated, user } = useAuthContext();
  const router = useRouter();
  const [tipoCotizacion, setTipoCotizacion] = useState<'maritimo' | 'aereo'>('maritimo');
  const [largo, setLargo] = useState('');
  const [ancho, setAncho] = useState('');
  const [alto, setAlto] = useState('');
  const [peso, setPeso] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [pdfResult, setPdfResult] = useState<any>(null);
  const [pendingAutoCotizar, setPendingAutoCotizar] = useState(false);
  const [isAutoTriggered, setIsAutoTriggered] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  // Detectar cambios en el tamaño de pantalla
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });

    return () => subscription?.remove();
  }, []);

  // Cargar datos guardados al iniciar (y preparar autocalcular si el usuario ya tiene token)
  useEffect(() => {
    const cargarDatosGuardados = async () => {
      try {
        const token = await AsyncStorage.getItem('@auth:token');
        const authReal = !!token;

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
          } else {
            // Si hay draft y el usuario ya está autenticado en el dispositivo, disparar cálculo automático
            if (authReal) {
              setPendingAutoCotizar(true);
            }
          }
        }
      } catch (error: any) {
        console.error('Error cargando datos guardados:', error);
      }
    };

    cargarDatosGuardados();
  }, []);

  // Si hay un draft restaurado y se detectó sesión, ejecutar cotizar automáticamente
  useEffect(() => {
    if (pendingAutoCotizar) {
      setIsAutoTriggered(true);
      handleCotizar();
      setPendingAutoCotizar(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAutoCotizar]);

  // Si el usuario inicia sesión mientras estamos en la pantalla y hay draft, disparar auto-cotizar
  useEffect(() => {
    if (isAuthenticated) {
      (async () => {
        try {
          const datosGuardados = await cotizacionService.obtenerDatosTemporales();
          if (datosGuardados && !resultado) {
            console.log('[CotizacionesScreen] Usuario autenticado y existe draft — preparando auto-cotizar');
            if (datosGuardados.payload) {
              const p = datosGuardados.payload;
              setLargo(String(p.largo_cm || ''));
              setAncho(String(p.ancho_cm || ''));
              setAlto(String(p.alto_cm || ''));
              setPeso(String(p.peso_kg || ''));
            }
            if (datosGuardados.tipo) setTipoCotizacion(datosGuardados.tipo);
            setPendingAutoCotizar(true);
          }
        } catch (e) {
          console.warn('[CotizacionesScreen] Error comprobando draft tras login:', e);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

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
      // Comprobar token en AsyncStorage para determinar sesión real
      const token = await AsyncStorage.getItem('@auth:token');
      const authReal = !!token;
      console.log('[CotizacionesScreen] useAuth.isAuthenticated:', isAuthenticated, 'tokenExists:', authReal);
      const payload = {
        largo_cm: largoNum,
        ancho_cm: anchoNum,
        alto_cm: altoNum,
        peso_kg: pesoNum,
      };

      // Si no está autenticado (según token real), guardar borrador y pedir registro inmediatamente
      if (!authReal) {
        try {
          await cotizacionService.guardarDatosTemporales(tipoCotizacion, payload, null);
        } catch (e: any) {
          console.warn('[CotizacionesScreen] No se pudo guardar borrador:', e);
        }
        Alert.alert(
          'Registro requerido',
          'Debes registrarte para ver el total y descargar el PDF. ¿Deseas registrarte ahora?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Registrarse', onPress: () => router.push('/register') }
          ]
        );
        setLoading(false);
        return;
      }

      // ✅ CORREGIDO: Usar cotizarEnvio con el tipo
      const result = await cotizacionService.cotizarEnvio(
        tipoCotizacion,
        payload,
        authReal // ← Pasar estado de autenticación real (token)
      );

      // Si el servicio indica que se requiere registro, avisar y redirigir
      if (result && result.requiereRegistro) {
        setLoading(false);
        Alert.alert(
          'Registro requerido',
          'Debes registrarte para obtener cotizaciones. ¿Deseas registrarte ahora?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Registrarse', onPress: () => router.push('/register') }
          ]
        );
        return;
      }

      if (result && result.success) {
        setResultado(result.data);

        // Si fue un disparo automático (después de login y restauración), generar PDF y enviar por WhatsApp
        if (isAutoTriggered) {
          try {
            setIsAutoTriggered(false);
            const pdfRes = await cotizacionService.generarPDF({
              tipo: tipoCotizacion,
              payload,
              resultado: result.data,
              detalleCalculo: result.data.detalleCalculo,
              user: user
            });
            setPdfResult(pdfRes);
            // intentar enviar por WhatsApp al número del usuario
            try {
              const phone = (user && (user.phone || user.telefono || user.phoneNumber)) || '';
              const phoneSan = (phone || '').replace(/\D/g, '');
              if (phoneSan) {
                const message = 'Te comparto la cotización de 888Cargo.';
                const pdfUri = pdfRes && (pdfRes.pdfUri || (pdfRes.pdfBase64 ? `data:application/pdf;base64,${pdfRes.pdfBase64}` : null));

                if ((Platform.OS as string) === 'web') {
                  const waUrl = `https://wa.me/${phoneSan}?text=${encodeURIComponent(message)}`;
                  try { window.open(waUrl, '_blank'); } catch (e) { console.warn('No se pudo abrir wa.me:', e); }
                } else {
                  // En móvil: preferir abrir el diálogo de compartir con el PDF adjunto (WhatsApp aparecerá como opción)
                  const canShare = await Sharing.isAvailableAsync().catch(() => false);

                  // Asegurar que tenemos una URI válida para compartir. Si sólo tenemos base64, escribir archivo temporal.
                  let shareUri = pdfRes && (pdfRes.pdfUri || null);
                  if (!shareUri && pdfRes && pdfRes.pdfBase64) {
                    try {
                      const tmpName = `cotizacion_${Date.now()}.pdf`;
                      const tmpUri = FileSystem.documentDirectory + tmpName;
                      await FileSystem.writeAsStringAsync(tmpUri, pdfRes.pdfBase64, { encoding: FileSystem.EncodingType.Base64 });
                      shareUri = tmpUri;
                    } catch (writeErr) {
                      console.warn('[CotizacionesScreen] No se pudo escribir PDF temporal:', writeErr);
                    }
                  }

                  if (canShare && shareUri) {
                    try {
                      // Intent: si WhatsApp está instalado, abrir chat primero para mejorar UX
                      const wpScheme = 'whatsapp://send';
                      const canOpenWhatsApp = await Linking.canOpenURL(wpScheme).catch(() => false);
                      if (canOpenWhatsApp && phoneSan) {
                        try {
                          const waChatUrl = `whatsapp://send?phone=${phoneSan}&text=${encodeURIComponent(message)}`;
                          await Linking.openURL(waChatUrl).catch(() => null);
                          // small delay to let WhatsApp open
                          await new Promise(res => setTimeout(res, 700));
                        } catch (waErr) {
                          console.warn('[CotizacionesScreen] No se pudo abrir chat de WhatsApp previo:', waErr);
                        }
                      }

                      // Finalmente abrir diálogo de compartir con el PDF adjunto
                      await Sharing.shareAsync(shareUri, { mimeType: 'application/pdf', dialogTitle: 'Compartir cotización 888Cargo' });
                    } catch (shareErr) {
                      console.warn('[CotizacionesScreen] Error compartiendo PDF:', shareErr);
                      // fallback: abrir WhatsApp sólo con texto
                      const waUrl2 = `whatsapp://send?phone=${phoneSan}&text=${encodeURIComponent(message)}`;
                      if (await Linking.canOpenURL(waUrl2)) await Linking.openURL(waUrl2);
                    }
                  } else {
                    // fallback: intentar abrir WhatsApp con texto (no permite adjuntar archivos desde URL)
                    const waUrl = `whatsapp://send?phone=${phoneSan}&text=${encodeURIComponent(message)}`;
                    if (await Linking.canOpenURL(waUrl)) {
                      await Linking.openURL(waUrl);
                    } else {
                      console.warn('[CotizacionesScreen] No se pudo abrir WhatsApp ni compartir el PDF');
                    }
                  }
                }
              } else {
                console.warn('[CotizacionesScreen] Usuario no tiene número válido para WhatsApp');
              }
            } catch (e) {
              console.warn('[CotizacionesScreen] Error enviando por WhatsApp:', e);
            }
          } catch (pdfErr) {
            console.warn('[CotizacionesScreen] Error generando PDF automático:', pdfErr);
          }
        }

        if (result.isStub) {
          Alert.alert(
            'Cotización calculada (modo offline)',
            'No se pudo conectar al servidor, el precio es aproximado.'
          );
        } else {
          Alert.alert('Éxito', 'Cotización calculada correctamente');
        }
      } else {
        let msg = 'Error al calcular cotización';
        if (result) {
          if ((result as any).error) msg = (result as any).error;
          else if ((result as any).message) msg = (result as any).message;
        }
        Alert.alert('Error', String(msg));
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
      // Para web: solicitar PDF al backend (Puppeteer) para obtener descarga consistente
      if ((Platform.OS as string) === 'web') {
        try {
          const endpoint = (await import('../../constants/API')).getFullURL('/cotizaciones/pdf');
          const resp = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tipo: tipoCotizacion,
              payload: {
                largo_cm: parseFloat(largo),
                ancho_cm: parseFloat(ancho),
                alto_cm: parseFloat(alto),
                peso_kg: parseFloat(peso),
              },
              resultado,
              detalleCalculo: resultado.detalleCalculo,
              user
            }),
          });

          if (!resp.ok) {
            const text = await resp.text();
            throw new Error(text || 'Error generando PDF en el servidor');
          }

          const blob = await resp.blob();
          const fileName = `Cotizacion_${(user && (user.name || user.email) || 'Usuario').replace(/[^a-zA-Z0-9-_ ]/g,'').replace(/\s+/g,'_')}.pdf`;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          Alert.alert('Éxito', 'PDF descargado correctamente');
          return;
        } catch (webErr: any) {
          console.error('Error descargando PDF desde backend:', webErr);
          const webErrMsg = (webErr && (webErr.message || webErr.error)) ? (webErr.message || webErr.error) : String(webErr);
          Alert.alert('Error', webErrMsg || 'No se pudo descargar el PDF desde el servidor');
          return;
        }
      }

      // Generar el PDF usando el servicio (nativo/móvil)
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
        if ((Platform.OS as string) === 'web' && pdfResult.isHtml && pdfResult.pdfUri) {
          try {
            const blobUrl = pdfResult.pdfUri;
            // Intentar convertir HTML a PDF usando jsPDF + html2canvas si está disponible
            const safeUser = (user && (user.name || user.email)) || 'Usuario';
            const fileNamePdf = `Cotizacion_${safeUser.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g,'_')}.pdf`;

            // Cargar dinámicamente las librerías si no están importadas
            let jsPDFModule: any = null;
            let html2canvasModule: any = null;
            try {
              jsPDFModule = (await import('jspdf')).jsPDF || (await import('jspdf'));
              html2canvasModule = (await import('html2canvas')).default || (await import('html2canvas'));
            } catch (libErr: any) {
              console.warn('No se pudo cargar jsPDF/html2canvas dinámicamente, se abrirá HTML en nueva pestaña:', libErr);
              const link = document.createElement('a');
              link.href = blobUrl;
              link.target = '_blank';
              document.body.appendChild(link);
              link.click();
              link.remove();
              Alert.alert('Archivo generado', 'Se ha abierto la cotización en una nueva pestaña. Instala jspdf/html2canvas para descarga automática como PDF.');
              return;
            }

            // Obtener el HTML como texto
            const resp = await fetch(blobUrl);
            const htmlText = await resp.text();

            // Crear un iframe oculto para renderizar el HTML y esperar a que carguen recursos
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.left = '-9999px';
            iframe.style.top = '0';
            iframe.style.width = '800px';
            iframe.style.height = '1120px';
            iframe.style.border = '0';
            document.body.appendChild(iframe);

            const doc = iframe.contentWindow?.document;
            if (!doc) {
              throw new Error('No se pudo acceder al documento del iframe');
            }

            doc.open();
            doc.write(htmlText);
            doc.close();

            // Esperar a que termine de cargar recursos (imágenes, fuentes)
            await new Promise<void>((resolve) => {
              const win = iframe.contentWindow as any;
              if (win && win.document && win.document.readyState === 'complete') return resolve();
              iframe.onload = () => setTimeout(() => resolve(), 300);
              // Fallback timeout
              setTimeout(() => resolve(), 1500);
            });

            const target = iframe.contentDocument?.body || iframe.contentWindow?.document?.body;
            if (!target) {
              document.body.removeChild(iframe);
              throw new Error('No se pudo obtener el body del iframe para renderizar');
            }

            // Renderizar con html2canvas sobre el contenido real renderizado
            const canvas = await html2canvasModule(target, {
              scale: 2,
              useCORS: true,
              allowTaint: false,
              logging: false,
            });

            const imgData = canvas.toDataURL('image/png');

            // Generar PDF con jsPDF
            const pdf = new jsPDFModule({ unit: 'px', format: [canvas.width, canvas.height] });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(fileNamePdf);

            // limpiar
            try { document.body.removeChild(iframe); } catch (e) { /* ignore */ }
            Alert.alert('Éxito', 'PDF generado y descargado');
            } catch (err: any) {
            console.error('Error manejando HTML blob en web:', err);
            Alert.alert('Archivo generado', `Archivo disponible: ${pdfResult.pdfUri || 'ver consola'}`);
          }
          return;
        }

        // Si estamos en web y recibimos base64, forzar descarga para evitar imprimir la página
        if ((Platform.OS as string) === 'web' && pdfResult.isBase64 && pdfResult.pdfBase64) {
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
          } catch (err: any) {
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
          } catch (shareError: any) {
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
      <View style={{ width: '100%', alignItems: 'flex-start', marginBottom: 12 }}>
        <TouchableOpacity onPress={() => router.push('/')} style={localStyles.backButton}>
          <Text style={localStyles.backButtonText}>← Inicio</Text>
        </TouchableOpacity>
      </View>
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

const localStyles = StyleSheet.create({
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#0f77c5',
    fontWeight: '700',
    fontSize: 16,
  }
});