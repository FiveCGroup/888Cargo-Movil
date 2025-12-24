// src/pages/CotizadorScreen.tsx
import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform, // MOVER AQUÍ
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import cotizacionService from '../services/cotizacionService';
import ResultadoCotizacion from '../components/cotizacion/ResultCotizacion';
import BotonDescargarCotizacion from '../components/cotizacion/DescargarCoti';
import ModalRegistroRequerido from '../components/cotizacion/ModalRegistro';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

type ShipmentType = 'Marítimo' | 'Aéreo';
type Destino = 'China' | 'Miami' | 'Europa';

// ============================================
// CONSTANTES DE LOGÍSTICA REAL (ACTUALIZADAS 2025)
// CHINA → BUENAVENTURA (COLOMBIA)
// ============================================
const LOGISTICA_CONFIG = {
  // Factores de peso volumétrico (estándar internacional)
  FACTOR_VOLUMETRICO: {
    MARITIMO: 1000, // 1 m³ = 1000 kg (estándar marítimo LCL)
    AEREO: 167,     // 1 m³ = 167 kg (estándar IATA: 6000 cm³/kg)
  },
  
  // Tarifas REALES 2025 para China → Buenaventura en USD
  TARIFAS_USD: {
    MARITIMO_LCL: {
      // Marítimo se cobra POR METRO CÚBICO, no por kg
      China: {
        min: 38,  // USD por m³
        max: 45,  // USD por m³
        promedio: 41.5
      },
      Miami: { min: 35, max: 42, promedio: 38.5 },
      Europa: { min: 55, max: 65, promedio: 60 }
    },
    AEREO_KG: {
      // Aéreo se cobra POR KG COBRABLE
      China: {
        min: 4.8,  // USD por kg cobrable
        max: 5.5,
        promedio: 5.15
      },
      Miami: { min: 2.8, max: 3.2, promedio: 3.0 },
      Europa: { min: 4.2, max: 4.8, promedio: 4.5 }
    }
  },
  
  // TRM (Tasa Representativa del Mercado) - Diciembre 2024
  TRM_COP_USD: 4250,
  
  // Mínimos cobrables
  MINIMO_MARITIMO_M3: 1,      // Mínimo 1 m³ para marítimo LCL
  MINIMO_AEREO_KG: 10,        // Mínimo 10 kg para aéreo
  
  // Capacidad contenedor estándar 40' HC
  CAPACIDAD_CONTENEDOR_M3: 68,
};

function numberOrZero(v: string) {
  const s = (v || '').toString().trim();
  if (s === '') return 0;
  const n = parseFloat(s.replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

export default function CotizadorScreen() {
  const router = useRouter();
  const [type, setType] = useState<ShipmentType>('Marítimo');
  const [destino, setDestino] = useState<Destino>('Miami');

  // Campos de entrada
  const [largoCm, setLargoCm] = useState('');
  const [anchoCm, setAnchoCm] = useState('');
  const [altoCm, setAltoCm] = useState('');
  const [largoMt, setLargoMt] = useState('');
  const [anchoMt, setAnchoMt] = useState('');
  const [altoMt, setAltoMt] = useState('');
  const [pesoKg, setPesoKg] = useState('');
  const [volumenM3Manual, setVolumenM3Manual] = useState<string>('');

  const [resultado, setResultado] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mostrarModalRegistro, setMostrarModalRegistro] = useState(false);
  const [detalleCalculo, setDetalleCalculo] = useState<any>(null);

  // ============================================
  // CÁLCULO DE VOLUMEN (prioridad: manual > metros > cm)
  // ============================================
  const volumenCalculado = useMemo(() => {
    // 1. Si hay volumen manual, usarlo
    if (volumenM3Manual.trim() !== '') {
      const vol = numberOrZero(volumenM3Manual);
      if (vol > 0) return vol;
    }

    // 2. Si hay dimensiones en metros, usarlas
    const lm = numberOrZero(largoMt);
    const am = numberOrZero(anchoMt);
    const hm = numberOrZero(altoMt);
    if (lm > 0 && am > 0 && hm > 0) {
      return lm * am * hm;
    }

    // 3. Si hay dimensiones en cm, convertir a metros y calcular
    const lcm = numberOrZero(largoCm);
    const acm = numberOrZero(anchoCm);
    const hcm = numberOrZero(altoCm);
    if (lcm > 0 && acm > 0 && hcm > 0) {
      return (lcm / 100) * (acm / 100) * (hcm / 100);
    }

    return 0;
  }, [largoCm, anchoCm, altoCm, largoMt, anchoMt, altoMt, volumenM3Manual]);

  // ============================================
  // CÁLCULO DE PESO COBRABLE (LÓGICA REAL CORREGIDA)
  // ============================================
  const calcularPesoCobrable = (pesoReal: number, volumen: number, tipoEnvio: ShipmentType) => {
    const factorVolumetrico = tipoEnvio === 'Marítimo' 
      ? LOGISTICA_CONFIG.FACTOR_VOLUMETRICO.MARITIMO 
      : LOGISTICA_CONFIG.FACTOR_VOLUMETRICO.AEREO;

    // Paso 1: Calcular peso volumétrico = volumen (m³) × factor
    const pesoVolumetrico = volumen * factorVolumetrico;

    // Paso 2: SOLO para aéreo usamos peso cobrable
    // Para marítimo, se cobra SIEMPRE por volumen en m³
    const pesoCobrable = tipoEnvio === 'Aéreo' 
      ? Math.max(pesoReal, pesoVolumetrico)
      : pesoVolumetrico; // Para marítimo, solo referencia

    // Paso 3: Aplicar mínimos
    const pesoFinal = tipoEnvio === 'Aéreo'
      ? Math.max(pesoCobrable, LOGISTICA_CONFIG.MINIMO_AEREO_KG)
      : pesoCobrable;

    // Determinar cuál ganó (solo relevante para aéreo)
    const gana = tipoEnvio === 'Marítimo' 
      ? 'volumen (m³)'
      : pesoReal > pesoVolumetrico ? 'peso real' : 'peso volumétrico';

    return {
      pesoReal,
      pesoVolumetrico,
      pesoCobrable: pesoFinal,
      factorUsado: factorVolumetrico,
      gana,
    };
  };

  // ============================================
  // CALCULAR COSTO EN USD Y COP (CORREGIDO)
  // ============================================
  const calcularCosto = (
    pesoReal: number,
    volumen: number, 
    pesoCobrable: number, 
    tipoEnvio: ShipmentType, 
    destinoSeleccionado: Destino
  ) => {
    let costoTotalUSD = 0;
    let tarifaUSD = 0;
    let tipoTarifa = '';
    let volumenCobrable = volumen;

    if (tipoEnvio === 'Marítimo') {
      // MARÍTIMO: Se cobra POR METRO CÚBICO (mínimo 1 m³)
      volumenCobrable = Math.max(volumen, LOGISTICA_CONFIG.MINIMO_MARITIMO_M3);
      const tarifaDestino = LOGISTICA_CONFIG.TARIFAS_USD.MARITIMO_LCL[destinoSeleccionado];
      tarifaUSD = tarifaDestino.promedio;
      costoTotalUSD = volumenCobrable * tarifaUSD;
      tipoTarifa = 'USD/m³';
    } else {
      // AÉREO: Se cobra POR KG COBRABLE
      const tarifaDestino = LOGISTICA_CONFIG.TARIFAS_USD.AEREO_KG[destinoSeleccionado];
      tarifaUSD = tarifaDestino.promedio;
      costoTotalUSD = pesoCobrable * tarifaUSD;
      tipoTarifa = 'USD/kg';
    }

    // Convertir a COP usando TRM
    const costoTotalCOP = costoTotalUSD * LOGISTICA_CONFIG.TRM_COP_USD;

    return {
      tarifaUSD,
      tipoTarifa,
      costoTotalUSD,
      costoTotalCOP,
      volumenCobrable,
      trm: LOGISTICA_CONFIG.TRM_COP_USD,
    };
  };

  // ============================================
  // VERIFICAR SESIÓN Y CARGAR DRAFT
  // ============================================
  useEffect(() => {
    async function init() {
      const token = await AsyncStorage.getItem('@auth:token');
      setIsLoggedIn(!!token);

      if (!token) return;

      const draft = await cotizacionService.obtenerDatosTemporales();
      if (draft) {
        setType(draft.tipo === 'maritimo' ? 'Marítimo' : 'Aéreo');
        const p = draft.payload || {};
        setLargoCm(String(p.largo_cm || ''));
        setAnchoCm(String(p.ancho_cm || ''));
        setAltoCm(String(p.alto_cm || ''));
        setPesoKg(String(p.peso_kg || ''));
        setResultado(draft.resultado);
        // Limpiar draft post-carga
        await AsyncStorage.removeItem('@cotizacion_temp');
      }
    }
    init();
  }, []);

  // ============================================
  // MANEJAR COTIZACIÓN (ACTUALIZADO)
  // ============================================
  const handleSubmit = async () => {
    const peso = numberOrZero(pesoKg);
    const volumen = volumenCalculado;

    // Validaciones
    if (peso <= 0) {
      Alert.alert('Error', 'Por favor ingresa un peso válido mayor a 0 kg.');
      return;
    }

    if (volumen <= 0) {
      Alert.alert('Error', 'Por favor ingresa dimensiones válidas o un volumen manual.');
      return;
    }

    if (volumen > LOGISTICA_CONFIG.CAPACIDAD_CONTENEDOR_M3) {
      Alert.alert(
        'Advertencia', 
        `El volumen (${volumen.toFixed(3)} m³) excede la capacidad del contenedor estándar (${LOGISTICA_CONFIG.CAPACIDAD_CONTENEDOR_M3} m³). Se requiere cotización de contenedor completo (FCL).`
      );
    }

    setIsSubmitting(true);

    try {
      // Paso 1: Calcular peso cobrable según tipo de envío
      const detalle = calcularPesoCobrable(peso, volumen, type);
      
      // Paso 2: Calcular costos (diferente para marítimo y aéreo)
      const costos = calcularCosto(peso, volumen, detalle.pesoCobrable, type, destino);

      // Preparar payload para el backend
      const payload = {
        largo_cm: numberOrZero(largoCm) || (numberOrZero(largoMt) * 100),
        ancho_cm: numberOrZero(anchoCm) || (numberOrZero(anchoMt) * 100),
        alto_cm: numberOrZero(altoCm) || (numberOrZero(altoMt) * 100),
        peso_kg: peso,
        volumen_m3: volumen,
      };

      const tipo = type === 'Marítimo' ? 'maritimo' : 'aereo';

      // Si no está logueado, guardar borrador y pedir registro inmediatamente
      if (!isLoggedIn) {
        try {
          await cotizacionService.guardarDatosTemporales(tipo, payload, null);
        } catch (e) {
          console.warn('[CotizadorScreen] No se pudo guardar borrador:', e);
          // como fallback, usar AsyncStorage directo
          try {
            await AsyncStorage.setItem('@cotizacion_temp', JSON.stringify({
              tipo,
              payload,
              detalleCalculo: detalle,
              costos,
              destino,
            }));
          } catch (e2) {
            console.warn('[CotizadorScreen] Fallback guardar borrador falló:', e2);
          }
        }

        setMostrarModalRegistro(true);
        return;
      }

      // Intentar cotización con el backend
      const resp = await cotizacionService.cotizarEnvio(tipo, payload, isLoggedIn);

      if (resp.requiereRegistro) {
        // Guardar datos temporalmente antes de pedir registro
        await AsyncStorage.setItem('@cotizacion_temp', JSON.stringify({
          tipo,
          payload,
          detalleCalculo: detalle,
          costos,
          destino,
        }));
        setMostrarModalRegistro(true);
        return;
      }

      // Resultado final
      const resultadoFinal = {
        tipo: tipo,
        destino: destino,
        peso_kg: peso,
        volumen_m3: volumen.toFixed(3),
        volumen_cobrable: costos.volumenCobrable.toFixed(3),
        valor_usd: costos.costoTotalUSD.toFixed(2),
        valor_cop: Math.round(costos.costoTotalCOP),
        detalleCalculo: detalle,
        costos: costos,
        isCalculoLocal: !resp.success,
        timestamp: new Date().toISOString(),
      };

      setResultado(resultadoFinal);
      setDetalleCalculo(detalle);

      // Mensaje diferenciado según tipo de envío
      const mensajeDetalle = type === 'Marítimo'
        ? `🚢 MARÍTIMO LCL (China → Buenaventura)\n\n` +
          `📦 Volumen Real: ${volumen.toFixed(3)} m³\n` +
          `📦 Volumen Cobrable: ${costos.volumenCobrable.toFixed(3)} m³ (mín. ${LOGISTICA_CONFIG.MINIMO_MARITIMO_M3} m³)\n` +
          `⚖️ Peso Real: ${peso} kg (solo referencia)\n` +
          `⚖️ Peso Volumétrico: ${detalle.pesoVolumetrico.toFixed(2)} kg (solo referencia)\n\n` +
          `💰 Se cobra por VOLUMEN en marítimo LCL\n` +
          `Tarifa: $${costos.tarifaUSD} ${costos.tipoTarifa}\n` +
          `TRM: $${costos.trm.toLocaleString('es-CO')} COP/USD`
        : `✈️ AÉREO (China → Colombia)\n\n` +
          `📦 Volumen: ${volumen.toFixed(3)} m³\n` +
          `⚖️ Peso Real: ${peso} kg\n` +
          `📊 Peso Volumétrico: ${detalle.pesoVolumetrico.toFixed(2)} kg\n` +
          `💰 Peso Cobrable: ${detalle.pesoCobrable.toFixed(2)} kg (gana ${detalle.gana})\n\n` +
          `Factor usado: ${detalle.factorUsado} kg/m³\n` +
          `Tarifa: $${costos.tarifaUSD} ${costos.tipoTarifa}\n` +
          `TRM: $${costos.trm.toLocaleString('es-CO')} COP/USD`;

      Alert.alert(
        '✅ Cotización Calculada',
        mensajeDetalle + 
        `\n\n💵 Total USD: $${costos.costoTotalUSD.toFixed(2)}` +
        `\n💵 Total COP: $${Math.round(costos.costoTotalCOP).toLocaleString('es-CO')}`,
        [{ text: 'OK' }]
      );

    } catch (err: any) {
      console.error('Error en cotización:', err);
      Alert.alert('Error', err.message || 'Error inesperado al cotizar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // DESCARGAR PDF DE COTIZACIÓN
  // ============================================
  const handleDescargar = async () => {
    if (!resultado) {
      Alert.alert('Error', 'No hay cotización para descargar');
      return;
    }

    try {
      setIsSubmitting(true);

      // Preparar datos completos para el PDF
      const cotizacionCompleta = {
        tipo: type === 'Marítimo' ? 'maritimo' : 'aereo',
        destino: destino,
        payload: {
          largo_cm: numberOrZero(largoCm) || (numberOrZero(largoMt) * 100),
          ancho_cm: numberOrZero(anchoCm) || (numberOrZero(anchoMt) * 100),
          alto_cm: numberOrZero(altoCm) || (numberOrZero(altoMt) * 100),
          peso_kg: numberOrZero(pesoKg),
        },
        resultado: resultado,
        detalleCalculo: detalleCalculo,
      };

      console.log('📄 Generando PDF...');
      const response = await cotizacionService.generarPDF(cotizacionCompleta);

      if (!response.success || !response.pdfUri) {
        throw new Error(response.error || 'Error generando PDF');
      }

      const pdfUri = response.pdfUri; // Extraer el URI aquí
      console.log('✅ PDF generado:', pdfUri);

      // Verificar si el dispositivo soporta compartir
      const isSharingAvailable = await Sharing.isAvailableAsync();

      if (!isSharingAvailable) {
        Alert.alert(
          'PDF Generado',
          `El PDF se guardó en: ${pdfUri}\n\nPuedes encontrarlo en la carpeta de documentos de tu dispositivo.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Compartir el PDF
      Alert.alert(
        '✅ PDF Generado',
        '¿Deseas compartir la cotización?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => {
              Alert.alert(
                'PDF Guardado',
                `La cotización se guardó en tu dispositivo.\n\nRuta: ${pdfUri}`,
                [{ text: 'OK' }]
              );
            }
          },
          {
            text: 'Compartir',
            onPress: async () => {
              try {
                await Sharing.shareAsync(pdfUri, {
                  mimeType: 'application/pdf',
                  dialogTitle: `Cotización ${type} - 888 Cargo`,
                  UTI: 'com.adobe.pdf'
                });
              } catch (shareError) {
                console.error('Error compartiendo PDF:', shareError);
                Alert.alert(
                  'Error',
                  'No se pudo compartir el PDF, pero está guardado en tu dispositivo.'
                );
              }
            }
          }
        ]
      );

    } catch (error) {
      console.error('❌ Error descargando PDF:', error);
      Alert.alert(
        'Error',
        'No se pudo generar el PDF. Por favor intenta nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIrRegistro = () => {
    setMostrarModalRegistro(false);
    router.push('/register');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Cotizador China → Colombia 🇨🇴</Text>
          <Text style={styles.capacity}>
            Puerto destino: Buenaventura | TRM: ${LOGISTICA_CONFIG.TRM_COP_USD.toLocaleString('es-CO')} COP/USD
          </Text>
          <Text style={styles.subtitle}>
            {type === 'Marítimo' 
              ? `⚠️ Marítimo LCL se cobra por VOLUMEN (m³): $${LOGISTICA_CONFIG.TARIFAS_USD.MARITIMO_LCL[destino].promedio} USD/m³`
              : `✈️ Aéreo se cobra por PESO COBRABLE: $${LOGISTICA_CONFIG.TARIFAS_USD.AEREO_KG[destino].promedio} USD/kg`
            }
          </Text>
        </View>

        {/* Tipo Envío */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Tipo de Envío</Text>
          </View>
          <View style={styles.segment}>
            <TouchableOpacity
              style={[styles.segmentBtn, type === 'Marítimo' && styles.segmentBtnActive]}
              onPress={() => setType('Marítimo')}
            >
              <Text style={[styles.segmentText, type === 'Marítimo' && styles.segmentTextActive]}>
                🚢 Marítimo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentBtn, type === 'Aéreo' && styles.segmentBtnActive]}
              onPress={() => setType('Aéreo')}
            >
              <Text style={[styles.segmentText, type === 'Aéreo' && styles.segmentTextActive]}>
                ✈️ Aéreo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Selector de Destino */}
          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Destino:</Text>
            <Picker
              selectedValue={destino}
              onValueChange={(value) => setDestino(value)}
              style={styles.picker}
            >
              <Picker.Item label="Miami / USA" value="Miami" />
              <Picker.Item label="Europa" value="Europa" />
              <Picker.Item label="China / Asia" value="China" />
            </Picker>
          </View>

          {/* Dimensiones */}
          <Text style={styles.sectionTitle}>
            Dimensiones (prioridad: manual {'>'} metros {'>'} centímetros)
          </Text>
          
          <View style={styles.dimRow}>
            <View style={styles.dimCol}>
              <Text style={styles.colTitle}>Largo</Text>
              <Field label="cm" value={largoCm} onChange={setLargoCm} keyboardType="numeric" />
              <Field label="m" value={largoMt} onChange={setLargoMt} keyboardType="decimal-pad" />
            </View>
            <View style={styles.dimCol}>
              <Text style={styles.colTitle}>Ancho</Text>
              <Field label="cm" value={anchoCm} onChange={setAnchoCm} keyboardType="numeric" />
              <Field label="m" value={anchoMt} onChange={setAnchoMt} keyboardType="decimal-pad" />
            </View>
          </View>

          <View style={styles.dimRow}>
            <View style={styles.dimCol}>
              <Text style={styles.colTitle}>Alto</Text>
              <Field label="cm" value={altoCm} onChange={setAltoCm} keyboardType="numeric" />
              <Field label="m" value={altoMt} onChange={setAltoMt} keyboardType="decimal-pad" />
            </View>
            <View style={styles.dimCol}>
              <Text style={styles.colTitle}>Peso *</Text>
              <Field label="kg" value={pesoKg} onChange={setPesoKg} keyboardType="numeric" />
            </View>
          </View>

          {/* Volumen Manual (opcional) */}
          <View style={styles.manualVolumen}>
            <Text style={styles.colTitle}>Volumen Manual (opcional)</Text>
            <Field 
              label="m³" 
              value={volumenM3Manual} 
              onChange={setVolumenM3Manual} 
              keyboardType="decimal-pad" 
            />
          </View>

          {/* Volumen Computado */}
          <View style={styles.resultadoCalculo}>
            <Text style={styles.resultadoLabel}>📦 Volumen Calculado:</Text>
            <Text style={styles.resultadoValor}>{volumenCalculado.toFixed(3)} m³</Text>
          </View>

          {/* Botón Cotizar */}
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionBtnText}>💰 Cotizar Envío</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Resultados */}
        {resultado && (
          <>
            {detalleCalculo && (
              <View style={styles.detalleCard}>
                <Text style={styles.detalleTitle}>
                  📊 Detalle del Cálculo - {type} → {resultado.destino} 🇨🇴
                </Text>
                
                {type === 'Marítimo' ? (
                  // Vista para MARÍTIMO (se cobra por volumen)
                  <>
                    <View style={styles.detalleRow}>
                      <Text style={styles.detalleLabel}>📦 Volumen Real:</Text>
                      <Text style={styles.detalleValor}>{resultado.volumen_m3} m³</Text>
                    </View>
                    <View style={styles.detalleRow}>
                      <Text style={styles.detalleLabel}>📦 Volumen Cobrable:</Text>
                      <Text style={[styles.detalleValor, styles.destacado]}>
                        {resultado.volumen_cobrable} m³
                      </Text>
                    </View>
                    <View style={styles.detalleRow}>
                      <Text style={styles.detalleLabel}>⚖️ Peso Real (referencia):</Text>
                      <Text style={styles.detalleValor}>{detalleCalculo.pesoReal} kg</Text>
                    </View>
                    <View style={styles.detalleRow}>
                      <Text style={styles.detalleLabel}>⚖️ Peso Volumétrico (ref):</Text>
                      <Text style={styles.detalleValor}>{detalleCalculo.pesoVolumetrico.toFixed(2)} kg</Text>
                    </View>
                    <View style={styles.infoBanner}>
                      <Text style={styles.infoBannerText}>
                        💡 En marítimo LCL se cobra SIEMPRE por volumen (m³), no por peso. Mínimo: {LOGISTICA_CONFIG.MINIMO_MARITIMO_M3} m³
                      </Text>
                    </View>
                    <View style={styles.detalleRow}>
                      <Text style={styles.detalleLabel}>Tarifa Base:</Text>
                      <Text style={styles.detalleValor}>
                        ${resultado.costos?.tarifaUSD || 'N/A'} {resultado.costos?.tipoTarifa || ''}
                      </Text>
                    </View>
                  </>
                ) : (
                  // Vista para AÉREO (se cobra por peso cobrable)
                  <>
                    <View style={styles.detalleRow}>
                      <Text style={styles.detalleLabel}>📦 Volumen:</Text>
                      <Text style={styles.detalleValor}>{resultado.volumen_m3} m³</Text>
                    </View>
                    <View style={styles.detalleRow}>
                      <Text style={styles.detalleLabel}>⚖️ Peso Real:</Text>
                      <Text style={styles.detalleValor}>{detalleCalculo.pesoReal} kg</Text>
                    </View>
                    <View style={styles.detalleRow}>
                      <Text style={styles.detalleLabel}>📊 Peso Volumétrico:</Text>
                      <Text style={styles.detalleValor}>{detalleCalculo.pesoVolumetrico.toFixed(2)} kg</Text>
                    </View>
                    <View style={styles.detalleRow}>
                      <Text style={styles.detalleLabel}>💰 Peso Cobrable (gana {detalleCalculo.gana}):</Text>
                      <Text style={[styles.detalleValor, styles.destacado]}>
                        {detalleCalculo.pesoCobrable.toFixed(2)} kg
                      </Text>
                    </View>
                    <View style={styles.detalleRow}>
                      <Text style={styles.detalleLabel}>Factor Usado:</Text>
                      <Text style={styles.detalleValor}>{detalleCalculo.factorUsado} kg/m³</Text>
                    </View>
                    <View style={styles.detalleRow}>
                      <Text style={styles.detalleLabel}>Tarifa Base:</Text>
                      <Text style={styles.detalleValor}>
                        ${resultado.costos?.tarifaUSD || 'N/A'} {resultado.costos?.tipoTarifa || ''}
                      </Text>
                    </View>
                  </>
                )}
                
                <View style={styles.separador} />
                <View style={styles.detalleRow}>
                  <Text style={[styles.detalleLabel, styles.totalLabel]}>💵 Total USD:</Text>
                  <Text style={[styles.detalleValor, styles.totalValor]}>${resultado.valor_usd}</Text>
                </View>
                <View style={styles.detalleRow}>
                  <Text style={[styles.detalleLabel, styles.totalLabel]}>💵 Total COP:</Text>
                  <Text style={[styles.detalleValor, styles.totalValor]}>
                    ${parseInt(resultado.valor_cop).toLocaleString('es-CO')}
                  </Text>
                </View>
              </View>
            )}

            {resultado.isCalculoLocal && (
              <Text style={styles.avisoLocal}>
                ⚠️ Cálculo realizado localmente (aproximado)
              </Text>
            )}
            
            <BotonDescargarCotizacion onPress={handleDescargar} />
          </>
        )}

        {/* Modal Registro */}
        <ModalRegistroRequerido
          visible={mostrarModalRegistro}
          onCerrar={() => setMostrarModalRegistro(false)}
          onIrRegistro={handleIrRegistro}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// COMPONENTE FIELD
// ============================================
function Field({ label, value, onChange, keyboardType = 'numeric' }: any) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        style={styles.input}
        placeholder={`Ingresa ${label}`}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );
}

// ============================================
// ESTILOS
// ============================================
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7FB' },
  container: { padding: 14, alignItems: 'center' },
  header: { width: '100%', alignItems: 'center', marginBottom: 20, backgroundColor: '#0f77c5', padding: 16, borderRadius: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  capacity: { color: '#e9ebef', fontSize: 11, marginTop: 6, textAlign: 'center' },
  subtitle: { color: '#e9ebef', fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  card: { width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 16, fontWeight: '700', color: '#0b2032', marginTop: 12, marginBottom: 8 },
  segment: { flexDirection: 'row', backgroundColor: '#e6eef8', borderRadius: 24, padding: 4, marginTop: 12 },
  segmentBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 20, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: '#0f77c5' },
  segmentText: { fontWeight: '700', color: '#0b2032', fontSize: 14 },
  segmentTextActive: { color: '#fff' },
  pickerContainer: { marginTop: 12 },
  picker: { backgroundColor: '#f3f4f6', borderRadius: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginTop: 16, marginBottom: 8 },
  dimRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  dimCol: { width: '48%' },
  colTitle: { fontSize: 14, fontWeight: '700', color: '#0b2032', marginBottom: 8 },
  fieldLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: '600' },
  input: { backgroundColor: '#f3f4f6', color: '#0b2032', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, fontWeight: '500', fontSize: 14 },
  manualVolumen: { marginTop: 12 },
  resultadoCalculo: { backgroundColor: '#f0f8ff', padding: 12, borderRadius: 8, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 4, borderLeftColor: '#0f77c5' },
  resultadoLabel: { fontSize: 14, fontWeight: '700', color: '#0b2032' },
  resultadoValor: { fontSize: 18, fontWeight: '800', color: '#0f77c5' },
  actionBtn: { backgroundColor: '#0f77c5', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16, shadowColor: '#0f77c5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  detalleCard: { width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: '#28a745' },
  detalleTitle: { fontSize: 16, fontWeight: '700', color: '#0b2032', marginBottom: 12 },
  detalleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e9ebef' },
  detalleLabel: { fontSize: 14, color: '#6b7280', fontWeight: '600', flex: 1 },
  detalleValor: { fontSize: 14, color: '#0b2032', fontWeight: '700', textAlign: 'right' },
  destacado: { color: '#0f77c5', fontSize: 16 },
  separador: { height: 2, backgroundColor: '#0f77c5', marginVertical: 12 },
  totalLabel: { fontSize: 16, color: '#0b2032', fontWeight: '800' },
  totalValor: { fontSize: 18, color: '#28a745', fontWeight: '800' },
  avisoLocal: { textAlign: 'center', color: '#ff9800', fontSize: 13, fontWeight: '600', marginBottom: 12, backgroundColor: '#fff3cd', padding: 8, borderRadius: 8 },
  infoBanner: { 
    backgroundColor: '#e3f2fd', 
    padding: 12, 
    borderRadius: 8, 
    marginVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3'
  },
  infoBannerText: { 
    fontSize: 13, 
    color: '#0d47a1', 
    fontWeight: '600',
    lineHeight: 18
  },
});