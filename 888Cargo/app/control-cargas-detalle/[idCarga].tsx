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

type CargaDetalle = {
  codigo_carga?: string;
  shipping_mark?: string;
  estado_actual?: string;
  ubicacion_actual?: string;
  destino?: string;
  numero_contenedor?: string;
  observaciones?: string;
  estadisticas?: {
    total_articulos?: number;
    total_cajas?: number;
    peso_total?: number;
    volumen_total?: number;
    total_qrs?: number;
    qrs_escaneados?: number;
  };
  fechas?: { recepcion?: string; envio?: string; arribo?: string };
  cliente?: { nombre?: string; correo?: string; telefono?: string };
};

type PackingItem = {
  id_articulo?: number;
  cn?: string;
  ref_art?: string;
  descripcion_espanol?: string;
  descripcion_chino?: string;
  unidad?: string;
  cantidad?: number;
  cant_por_caja?: number;
  precio_unidad?: number;
  precio_total?: number;
  material?: string;
  marca_producto?: string;
  cbm?: number;
  gw?: number;
  cajas?: Array<{ numero_caja?: number; total_cajas?: number }>;
};

function formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) return '—';
  try {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return String(fecha);
  }
}

function FilaInfo({ label, value, colors }: { label: string; value: string | number | undefined; colors: Record<string, string> }) {
  return (
    <View style={styles.filaInfo}>
      <Text style={[styles.filaInfoLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.filaInfoValue, { color: colors.text }]} numberOfLines={2}>{value ?? '—'}</Text>
    </View>
  );
}

export default function ControlCargasDetalleScreen() {
  const { idCarga } = useLocalSearchParams<{ idCarga: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [carga, setCarga] = useState<CargaDetalle | null>(null);
  const [packingList, setPackingList] = useState<PackingItem[]>([]);

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
          setCarga(res.data.carga || null);
          setPackingList(Array.isArray(res.data.packing_list) ? res.data.packing_list : []);
        } else {
          setError('No se pudieron cargar los detalles');
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || 'Error al cargar detalles');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [idCarga]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.msg, { color: colors.textMuted }]}>Cargando detalles...</Text>
      </View>
    );
  }

  if (error || !carga) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={28} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Detalles de la carga</Text>
        </View>
        <MaterialIcons name="error-outline" size={48} color={colors.textMuted} />
        <Text style={[styles.msg, { color: colors.textMuted }]}>{error || 'No se encontró la carga'}</Text>
        <TouchableOpacity style={[styles.btnSecondary, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
          <Text style={styles.btnSecondaryText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stats = carga.estadisticas;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          Detalles: {carga.codigo_carga || idCarga}
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Información de la carga</Text>
          <FilaInfo label="Código" value={carga.codigo_carga} colors={colors} />
          <FilaInfo label="Shipping Mark" value={carga.shipping_mark} colors={colors} />
          <FilaInfo label="Estado" value={carga.estado_actual} colors={colors} />
          <FilaInfo label="Ubicación" value={carga.ubicacion_actual} colors={colors} />
          <FilaInfo label="Destino" value={carga.destino} colors={colors} />
          {carga.numero_contenedor ? (
            <FilaInfo label="Contenedor" value={carga.numero_contenedor} colors={colors} />
          ) : null}
          {carga.observaciones ? (
            <FilaInfo label="Observaciones" value={carga.observaciones} colors={colors} />
          ) : null}
        </View>

        {stats && (stats.total_articulos != null || stats.total_cajas != null || stats.peso_total != null) && (
          <View style={[styles.section, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Estadísticas</Text>
            <View style={styles.statsRow}>
              {stats.total_articulos != null && (
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>{stats.total_articulos}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Artículos</Text>
                </View>
              )}
              {stats.total_cajas != null && (
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>{stats.total_cajas}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Cajas</Text>
                </View>
              )}
              {(stats.peso_total != null && stats.peso_total > 0) && (
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>{stats.peso_total}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>kg</Text>
                </View>
              )}
              {(stats.volumen_total != null && stats.volumen_total > 0) && (
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>{stats.volumen_total}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>CBM</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {carga.fechas && (carga.fechas.recepcion || carga.fechas.envio || carga.fechas.arribo) && (
          <View style={[styles.section, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Fechas</Text>
            <FilaInfo label="Recepción" value={formatearFecha(carga.fechas.recepcion)} colors={colors} />
            <FilaInfo label="Envío" value={formatearFecha(carga.fechas.envio)} colors={colors} />
            <FilaInfo label="Arribo" value={formatearFecha(carga.fechas.arribo)} colors={colors} />
          </View>
        )}

        {packingList.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Packing List</Text>
            {packingList.map((art, idx) => (
              <View key={art.id_articulo ?? idx} style={[styles.artCard, { borderColor: colors.border }]}>
                <Text style={[styles.artRef, { color: colors.primary }]}>
                  {art.ref_art || art.cn || `Artículo ${idx + 1}`}
                </Text>
                <Text style={[styles.artDesc, { color: colors.text }]} numberOfLines={2}>
                  {art.descripcion_espanol || art.descripcion_chino || '—'}
                </Text>
                <View style={styles.artRow}>
                  <Text style={[styles.artMeta, { color: colors.textMuted }]}>
                    Cant: {art.cantidad ?? '—'} · Caja: {art.cant_por_caja ?? '—'}
                  </Text>
                </View>
                {art.cajas && art.cajas.length > 0 && (
                  <View style={styles.cajasWrap}>
                    <Text style={[styles.cajasLabel, { color: colors.textMuted }]}>Cajas: </Text>
                    <Text style={[styles.cajasValue, { color: colors.text }]}>
                      {art.cajas
                        .sort((a, b) => (a.numero_caja ?? 0) - (b.numero_caja ?? 0))
                        .map((c, i) => `Caja ${c.numero_caja ?? i + 1}/${c.total_cajas ?? art.cajas?.length ?? 0}`)
                        .join(', ')}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  title: { fontSize: 18, fontWeight: '700', flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  section: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  filaInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  filaInfoLabel: { fontSize: 13, minWidth: 100 },
  filaInfoValue: { fontSize: 14, flex: 1, textAlign: 'right' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 4 },
  statBox: { alignItems: 'center', minWidth: 64 },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 12, marginTop: 2 },
  artCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  artRef: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  artDesc: { fontSize: 13, marginBottom: 4 },
  artRow: { flexDirection: 'row' },
  artMeta: { fontSize: 12 },
  cajasWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  cajasLabel: { fontSize: 12 },
  cajasValue: { fontSize: 12 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  msg: { fontSize: 16, marginTop: 12, textAlign: 'center' },
  btnSecondary: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  btnSecondaryText: { color: '#fff', fontWeight: '600' },
});
