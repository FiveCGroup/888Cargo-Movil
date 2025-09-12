import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BusquedaPackingListProps {
  codigoCarga: string;
  setCodigoCarga: (codigo: string) => void;
  onBuscar: () => void;
  onLimpiar: () => void;
  onVerDetalles: (idCarga: string) => void;
  busquedaLoading: boolean;
  mostrandoResultados: boolean;
  resultadosBusqueda: any[];
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
  botonRegreso
}) => {
  const renderResultado = ({ item }: { item: any }) => (
    <View style={styles.resultadoItem}>
      <View style={styles.resultadoInfo}>
        <Text style={styles.resultadoCodigo}>{item.codigo_carga}</Text>
        <Text style={styles.resultadoCliente}>{item.nombre_cliente}</Text>
        <Text style={styles.resultadoFecha}>
          Creado: {new Date(item.fecha_creacion).toLocaleDateString('es-CO')}
        </Text>
        <Text style={styles.resultadoItems}>
          {item.total_items || 0} items
        </Text>
      </View>
      <TouchableOpacity
        style={styles.botonVerDetalles}
        onPress={() => onVerDetalles(item.id)}
      >
        <Ionicons name="eye" size={20} color="#fff" />
        <Text style={styles.textoBotonVer}>Ver</Text>
      </TouchableOpacity>
    </View>
  );

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
        <Ionicons name="search" size={24} color="#007bff" />
        <Text style={styles.titulo}>Buscar Packing List</Text>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.busquedaContainer}>
        <View style={styles.inputContainer}>
          <Ionicons name="document-text" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Ingresa el código del packing list"
            placeholderTextColor="#999"
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
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="search" size={18} color="#fff" />
                <Text style={styles.textoBoton}>Buscar</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.boton, styles.botonLimpiar]}
            onPress={onLimpiar}
            disabled={busquedaLoading}
          >
            <Ionicons name="refresh" size={18} color="#666" />
            <Text style={styles.textoBotonLimpiar}>Limpiar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Resultados de búsqueda */}
      {mostrandoResultados && (
        <View style={styles.resultadosContainer}>
          <View style={styles.resultadosHeader}>
            <Ionicons name="list" size={20} color="#28a745" />
            <Text style={styles.resultadosTitulo}>
              Resultados ({resultadosBusqueda.length})
            </Text>
          </View>

          {resultadosBusqueda.length > 0 ? (
            <FlatList
              data={resultadosBusqueda}
              renderItem={renderResultado}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              style={styles.lista}
            />
          ) : (
            <View style={styles.sinResultados}>
              <Ionicons name="document-outline" size={48} color="#ccc" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  tituloContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  busquedaContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  botonesContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  boton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  botonBuscar: {
    backgroundColor: '#007bff',
  },
  botonLimpiar: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textoBoton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  textoBotonLimpiar: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  resultadosContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultadosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  resultadosTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
    marginLeft: 8,
  },
  lista: {
    flex: 1,
  },
  resultadoItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultadoInfo: {
    flex: 1,
  },
  resultadoCodigo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 4,
  },
  resultadoCliente: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  resultadoFecha: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  resultadoItems: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '600',
  },
  botonVerDetalles: {
    backgroundColor: '#28a745',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  textoBotonVer: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  sinResultados: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  textoSinResultados: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 5,
  },
  sugerenciaSinResultados: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default BusquedaPackingList;
