import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { busquedaPackingListStyles as styles } from '../styles/components/BusquedaPackingList.styles';
import { IconSizes, IconColors } from '../constants/Icons';

interface BusquedaPackingListProps {
  codigoCarga: string;
  setCodigoCarga: (codigo: string) => void;
  onBuscar: () => void;
  onLimpiar: () => void;
  onVerDetalles: (idCarga: string) => void;
  busquedaLoading: boolean;
  mostrandoResultados: boolean;
  resultadosBusqueda: any[];
  error?: string; // Agregado para manejo de errores
  botonRegreso?: React.ReactNode;
}

const BusquedaPackingList: React.FC<BusquedaPackingListProps> = ({
  codigoCarga,
  setCodigoCarga,
  onBuscar,
  onLimpiar,
  onVerDetalles,
  busquedaLoading,
  mostrandoResultados,
  resultadosBusqueda,
  error,
  botonRegreso
}) => {
  const renderResultado = ({ item }: { item: any }) => {
    // Manejar diferentes estructuras de datos según venga de la búsqueda mejorada
    const datos = item.articulos ? item : { articulos: item }; // Compatibilidad con estructura antigua
    const cliente = datos.cliente || item;
    const carga = datos.carga || item;
    const estadisticas = datos.estadisticas || {};
    
    return (
      <View style={styles.resultadoItem}>
        <View style={styles.resultadoInfo}>
          <Text style={styles.resultadoCodigo}>
            {carga.codigo_carga || item.codigo_carga || 'N/A'}
          </Text>
          <Text style={styles.resultadoCliente}>
            {cliente.nombre_cliente || item.nombre_cliente || 'Cliente no especificado'}
          </Text>
          <Text style={styles.resultadoFecha}>
            Creado: {new Date(carga.fecha_creacion || item.fecha_creacion || Date.now()).toLocaleDateString('es-CO')}
          </Text>
          <Text style={styles.resultadoItems}>
            {estadisticas.total_articulos || datos.articulos?.length || item.total_items || 0} artículos
          </Text>
          {estadisticas.total_peso_kg && (
            <Text style={styles.resultadoPeso}>
              Peso: {parseFloat(estadisticas.total_peso_kg).toFixed(2)} kg
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.botonVerDetalles}
          onPress={() => onVerDetalles(carga.id || item.id)}
        >
          <Ionicons name="eye" size={IconSizes.md} color={IconColors.white} />
          <Text style={styles.textoBotonVer}>Ver</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header con botón de regreso si se proporciona */}
      {botonRegreso && (
        <View style={styles.headerContainer}>
          {botonRegreso}
        </View>
      )}

      {/* Título */}
      <View style={styles.tituloContainer}>
        <Ionicons name="search" size={IconSizes.lg} color={IconColors.primary} />
        <Text style={styles.titulo}>Buscar Packing List</Text>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.busquedaContainer}>
        <View style={styles.inputContainer}>
          <Ionicons name="document-text" size={IconSizes.md} color={IconColors.secondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Ingresa el código del packing list"
            placeholderTextColor={IconColors.muted}
            value={codigoCarga}
            onChangeText={setCodigoCarga}
            autoCapitalize="characters"
            onSubmitEditing={onBuscar}
          />
        </View>
        
        <View style={styles.botonesContainer}>
          <TouchableOpacity
            style={[styles.boton, styles.botonBuscar]}
            onPress={onBuscar}
            disabled={busquedaLoading || !codigoCarga.trim()}
          >
            {busquedaLoading ? (
              <ActivityIndicator size="small" color={IconColors.white} />
            ) : (
              <>
                <Ionicons name="search" size={IconSizes.base} color={IconColors.white} />
                <Text style={styles.textoBoton}>Buscar</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.boton, styles.botonLimpiar]}
            onPress={onLimpiar}
            disabled={busquedaLoading}
          >
            <Ionicons name="refresh" size={IconSizes.base} color={IconColors.secondary} />
            <Text style={styles.textoBotonLimpiar}>Limpiar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Resultados de búsqueda */}
      {mostrandoResultados && (
        <View style={styles.resultadosContainer}>
          <View style={styles.resultadosHeader}>
            <Ionicons name="list" size={IconSizes.md} color={IconColors.success} />
            <Text style={styles.resultadosTitulo}>
              Resultados ({resultadosBusqueda.length})
            </Text>
          </View>

          {/* Mostrar error si existe */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={IconSizes.md} color={IconColors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {resultadosBusqueda.length > 0 ? (
            <FlatList
              data={resultadosBusqueda}
              renderItem={renderResultado}
              keyExtractor={(item, index) => (item.id || index).toString()}
              showsVerticalScrollIndicator={false}
              style={styles.lista}
            />
          ) : !error && (
            <View style={styles.sinResultados}>
              <Ionicons name="document-outline" size={IconSizes.xxxl} color={IconColors.light} />
              <Text style={styles.textoSinResultados}>
                No se encontraron packing lists con ese código
              </Text>
              <Text style={styles.sugerenciaSinResultados}>
                Verifica el código e intenta nuevamente
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};



export default BusquedaPackingList;
