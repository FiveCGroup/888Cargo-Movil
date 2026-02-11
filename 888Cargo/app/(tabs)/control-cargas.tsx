import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import controlCargasService from '@/services/controlCargasService';

type CargaItem = {
  id_carga: number;
  codigo_carga?: string;
  shipping_mark?: string;
  estado?: string;
  ubicacion?: string;
  destino?: string;
  [key: string]: unknown;
};

function FilaCarga({ label, value, colors }: { label: string; value: string; colors: Record<string, string> }) {
  return (
    <View style={styles.filaCarga}>
      <Text style={[styles.filaCargaLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.filaCargaValue, { color: colors.text }]} numberOfLines={1}>{value || '—'}</Text>
    </View>
  );
}

export default function ControlCargasScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [cargas, setCargas] = useState<CargaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtrosExpandidos, setFiltrosExpandidos] = useState(false);
  const [filtros, setFiltros] = useState({ estado: '', ubicacion: '', contenedor: '' });
  const [opciones, setOpciones] = useState({ estados: [] as string[], ubicaciones: [] as string[], contenedores: [] as string[] });

  const cargarCargas = useCallback(async () => {
    try {
      setError(null);
      const params: Record<string, string> = {};
      if (filtros.estado) params.estado = filtros.estado;
      if (filtros.ubicacion) params.ubicacion = filtros.ubicacion;
      if (filtros.contenedor) params.contenedor = filtros.contenedor;
      const res = await controlCargasService.obtenerCargas(params);
      if (res?.success && Array.isArray(res.data)) {
        setCargas(res.data);
      } else {
        setCargas([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar cargas');
      setCargas([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filtros.estado, filtros.ubicacion, filtros.contenedor]);

  const cargarOpciones = useCallback(async () => {
    try {
      const res = await controlCargasService.obtenerOpcionesFiltros();
      if (res?.success && res.data) {
        setOpciones({
          estados: res.data.estados || [],
          ubicaciones: res.data.ubicaciones || [],
          contenedores: res.data.contenedores || [],
        });
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    cargarOpciones();
  }, [cargarOpciones]);

  useEffect(() => {
    setLoading(true);
    cargarCargas();
  }, [cargarCargas]);

  const onRefresh = () => {
    setRefreshing(true);
    cargarCargas();
  };

  const limpiarFiltros = () => {
    setFiltros({ estado: '', ubicacion: '', contenedor: '' });
  };

  const hayFiltrosActivos = !!(filtros.estado || filtros.ubicacion || filtros.contenedor);

  const verDetalles = (idCarga: number) => {
    router.push(`/control-cargas-detalle/${idCarga}`);
  };

  const verEstadoCarga = (idCarga: number) => {
    router.push(`/control-cargas-estados/${idCarga}`);
  };

  const renderItem = ({ item }: { item: CargaItem }) => (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <FilaCarga label="Id Carga" value={item.codigo_carga || String(item.id_carga)} colors={colors} />
      <FilaCarga label="Shipping Mark" value={item.shipping_mark} colors={colors} />
      <FilaCarga label="Estado" value={item.estado || 'En bodega China'} colors={colors} />
      <FilaCarga label="Ubicación" value={item.ubicacion || 'China'} colors={colors} />
      <FilaCarga label="Destino" value={item.destino} colors={colors} />
      <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.btnAction, { borderColor: colors.primary }]}
          onPress={() => verDetalles(item.id_carga)}
          activeOpacity={0.7}
        >
          <Text style={[styles.btnActionText, { color: colors.primary }]}>Ver detalles</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnAction, { borderColor: colors.primary }]}
          onPress={() => verEstadoCarga(item.id_carga)}
          activeOpacity={0.7}
        >
          <Text style={[styles.btnActionText, { color: colors.primary }]}>→ Ver estado carga</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Control de carga</Text>
      </View>

      <TouchableOpacity
        style={[styles.crearBtn, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/(tabs)/cargas')}
      >
        <MaterialIcons name="add-circle-outline" size={22} color="#fff" />
        <Text style={styles.crearBtnText}>Gestión de cargas</Text>
      </TouchableOpacity>

      {/* Filtros colapsables: no tapan la lista */}
      <View style={[styles.filtrosHeader, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.filtrosHeaderTouch}
          onPress={() => setFiltrosExpandidos((v) => !v)}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name={filtrosExpandidos ? 'expand-less' : 'expand-more'}
            size={24}
            color={colors.text}
          />
          <Text style={[styles.filtrosHeaderTitle, { color: colors.text }]}>Filtros</Text>
          {hayFiltrosActivos && (
            <View style={[styles.filtrosBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.filtrosBadgeText}>Activos</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {filtrosExpandidos && (
        <View style={[styles.filtrosWrap, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.filtrosLabel, { color: colors.textMuted }]}>Estado</Text>
          <Picker
            selectedValue={filtros.estado}
            onValueChange={(v) => setFiltros((f) => ({ ...f, estado: v }))}
            style={[styles.picker, { color: colors.text }]}
            dropdownIconColor={colors.text}
          >
            <Picker.Item label="Todos" value="" />
            {opciones.estados.map((e) => (
              <Picker.Item key={e} label={e} value={e} />
            ))}
          </Picker>
          <Text style={[styles.filtrosLabel, { color: colors.textMuted }]}>Ubicación</Text>
          <Picker
            selectedValue={filtros.ubicacion}
            onValueChange={(v) => setFiltros((f) => ({ ...f, ubicacion: v }))}
            style={[styles.picker, { color: colors.text }]}
            dropdownIconColor={colors.text}
          >
            <Picker.Item label="Todas" value="" />
            {opciones.ubicaciones.map((u) => (
              <Picker.Item key={u} label={u} value={u} />
            ))}
          </Picker>
          <Text style={[styles.filtrosLabel, { color: colors.textMuted }]}>Contenedor</Text>
          <Picker
            selectedValue={filtros.contenedor}
            onValueChange={(v) => setFiltros((f) => ({ ...f, contenedor: v }))}
            style={[styles.picker, { color: colors.text }]}
            dropdownIconColor={colors.text}
          >
            <Picker.Item label="Todos" value="" />
            {opciones.contenedores.map((c) => (
              <Picker.Item key={c} label={c} value={c} />
            ))}
          </Picker>
          {hayFiltrosActivos && (
            <TouchableOpacity onPress={limpiarFiltros} style={styles.limpiarWrap}>
              <Text style={[styles.limpiar, { color: colors.primary }]}>Limpiar filtros</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.msg, { color: colors.textMuted }]}>Cargando cargas...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <MaterialIcons name="error-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.msg, { color: colors.textMuted }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => { setLoading(true); cargarCargas(); }}>
            <Text style={styles.retryBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : cargas.length === 0 ? (
        <View style={styles.centered}>
          <MaterialIcons name="inbox" size={48} color={colors.textMuted} />
          <Text style={[styles.msg, { color: colors.textMuted }]}>
            No hay cargas {hayFiltrosActivos ? 'con los filtros aplicados' : ''}
          </Text>
        </View>
      ) : (
        <FlatList
          data={cargas}
          keyExtractor={(item) => String(item.id_carga)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 56,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  crearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  crearBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  filtrosHeader: {
    borderBottomWidth: 1,
    marginHorizontal: 16,
    marginTop: 8,
  },
  filtrosHeaderTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 6,
  },
  filtrosHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  filtrosBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  filtrosBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  filtrosWrap: {
    marginHorizontal: 16,
    marginTop: 4,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  filtrosLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  picker: {
    height: 44,
    marginBottom: 12,
  },
  limpiarWrap: {
    marginTop: 4,
  },
  limpiar: {
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  filaCarga: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  filaCargaLabel: {
    fontSize: 12,
    minWidth: 90,
  },
  filaCargaValue: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  btnAction: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  btnActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  msg: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
