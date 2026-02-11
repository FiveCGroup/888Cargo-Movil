import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import controlCargasService from '@/services/controlCargasService';

type HistorialItem = { estado: string; fecha: string; ubicacion?: string; descripcion?: string };

function formatearFecha(fecha: string | null): string {
  if (!fecha) return '—';
  try {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return String(fecha);
  }
}

export default function ControlCargasEstadosScreen() {
  const { idCarga } = useLocalSearchParams<{ idCarga: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cargaCodigo, setCargaCodigo] = useState<string>('');
  const [estadoActual, setEstadoActual] = useState<string>('');
  const [historial, setHistorial] = useState<HistorialItem[]>([]);

  useEffect(() => {
    if (!idCarga) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    controlCargasService
      .obtenerEstadosCarga(Number(idCarga))
      .then((res) => {
        if (cancelled) return;
        if (res?.success && res.data) {
          const { carga, historial_estados } = res.data;
          setCargaCodigo(carga?.codigo_carga || idCarga);
          setEstadoActual(carga?.estado_actual || 'En bodega China');
          setHistorial(Array.isArray(historial_estados) ? historial_estados : []);
        } else {
          setError('No se pudieron cargar los estados');
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || 'Error al cargar estados');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [idCarga]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Estado de carga</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.msg, { color: colors.textMuted }]}>Cargando estados...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <MaterialIcons name="error-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.msg, { color: colors.textMuted }]}>{error}</Text>
          <TouchableOpacity style={[styles.btnSecondary, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
            <Text style={styles.btnSecondaryText}>Volver</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.etiqueta, { color: colors.textMuted }]}>
            Etiqueta #{cargaCodigo}
          </Text>
          <View style={[styles.badgeActual, { backgroundColor: colors.primary + '25' }]}>
            <Text style={[styles.badgeActualText, { color: colors.primary }]}>{estadoActual}</Text>
            <MaterialIcons name="check-circle" size={20} color={colors.primary} />
          </View>

          <Text style={[styles.timelineTitle, { color: colors.text }]}>Línea de tiempo</Text>
          {historial.length === 0 ? (
            <Text style={[styles.sinHistorial, { color: colors.textMuted }]}>
              No hay historial de estados disponible
            </Text>
          ) : (
            <View style={styles.timeline}>
              {historial.map((item, idx) => (
                <View key={idx} style={styles.timelineItem}>
                  <View style={[styles.timelineNode, { backgroundColor: colors.primary }]} />
                  {idx < historial.length - 1 && (
                    <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
                  )}
                  <View style={[styles.timelineContent, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <Text style={[styles.timelineEstado, { color: colors.text }]}>{item.estado}</Text>
                    <Text style={[styles.timelineFecha, { color: colors.textMuted }]}>
                      {formatearFecha(item.fecha)}
                    </Text>
                    {item.ubicacion ? (
                      <Text style={[styles.timelineUbicacion, { color: colors.textMuted }]}>{item.ubicacion}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8, marginRight: 8 },
  title: { fontSize: 20, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  etiqueta: { fontSize: 14, marginBottom: 8 },
  badgeActual: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
    marginBottom: 24,
  },
  badgeActualText: { fontSize: 16, fontWeight: '600' },
  timelineTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  sinHistorial: { fontSize: 14, fontStyle: 'italic' },
  timeline: { marginLeft: 8 },
  timelineItem: { position: 'relative', marginBottom: 4 },
  timelineNode: {
    position: 'absolute',
    left: 0,
    top: 12,
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 1,
  },
  timelineLine: {
    position: 'absolute',
    left: 5,
    top: 26,
    bottom: -4,
    width: 2,
  },
  timelineContent: {
    marginLeft: 24,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  timelineEstado: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  timelineFecha: { fontSize: 13 },
  timelineUbicacion: { fontSize: 12, marginTop: 2 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  msg: { fontSize: 16, marginTop: 12, textAlign: 'center' },
  btnSecondary: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  btnSecondaryText: { color: '#fff', fontWeight: '600' },
});
