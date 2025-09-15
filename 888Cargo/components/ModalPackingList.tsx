import React from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InfoCliente, InfoCarga } from '../utils/cargaUtils';

interface ModalPackingListProps {
  mostrar: boolean;
  onCerrar: () => void;
  infoCliente: InfoCliente;
  infoCarga: InfoCarga;
  onCambioCliente: (campo: keyof InfoCliente, valor: string) => void;
  onCambioCarga: (campo: keyof InfoCarga, valor: string) => void;
  onGuardar: () => void;
  onGenerarCodigo: () => void;
  guardandoBD: boolean;
  guardadoExitoso: boolean;
  datosGuardado?: any;
  onVisualizarPDF?: () => void;
  bloquearCampos?: boolean;
}

// Componente de carga (spinner)
const LoadingOverlay: React.FC<{ message: string }> = ({ message }) => (
  <View style={styles.loadingOverlay}>
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007bff" />
      <Text style={styles.loadingTitle}>{message}</Text>
      <Text style={styles.loadingSubtitle}>
        Por favor espera, esto puede tomar unos momentos...
      </Text>
    </View>
  </View>
);

const ModalPackingList: React.FC<ModalPackingListProps> = ({
  mostrar,
  onCerrar,
  infoCliente,
  infoCarga,
  onCambioCliente,
  onCambioCarga,
  onGuardar,
  onGenerarCodigo,
  guardandoBD,
  guardadoExitoso,
  datosGuardado,
  onVisualizarPDF,
  bloquearCampos = false
}) => {
  const handleGuardar = () => {
    // Validar campos requeridos
    if (!infoCliente.nombre_cliente.trim()) {
      Alert.alert('Error', 'El nombre del cliente es requerido');
      return;
    }
    if (!infoCliente.correo_cliente.trim()) {
      Alert.alert('Error', 'El correo del cliente es requerido');
      return;
    }
    if (!infoCliente.telefono_cliente.trim()) {
      Alert.alert('Error', 'El teléfono del cliente es requerido');
      return;
    }
    if (!infoCliente.direccion_entrega.trim()) {
      Alert.alert('Error', 'La dirección de entrega es requerida');
      return;
    }
    if (!infoCarga.codigo_carga.trim()) {
      Alert.alert('Error', 'El código del packing list es requerido');
      return;
    }
    if (!infoCarga.direccion_destino.trim()) {
      Alert.alert('Error', 'La dirección de destino es requerida');
      return;
    }

    onGuardar();
  };

  if (!mostrar) return null;

  return (
    <Modal
      visible={mostrar}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCerrar}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCerrar} style={styles.botonCerrar}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.titulo}>Datos del Packing List</Text>
          <View style={styles.espaciador} />
        </View>

        <ScrollView style={styles.contenido} showsVerticalScrollIndicator={false}>
          {/* Sección Cliente */}
          <View style={styles.seccion}>
            <View style={styles.seccionHeader}>
              <Ionicons name="person" size={20} color="#007bff" />
              <Text style={styles.seccionTitulo}>Información del Cliente</Text>
            </View>

            <View style={styles.campo}>
              <Text style={styles.label}>Nombre del Cliente *</Text>
              <TextInput
                style={[styles.input, bloquearCampos && styles.inputBloqueado]}
                value={infoCliente.nombre_cliente}
                onChangeText={(valor) => onCambioCliente('nombre_cliente', valor)}
                placeholder="Nombre completo del cliente"
                placeholderTextColor="#999"
                editable={!bloquearCampos}
              />
            </View>

            <View style={styles.campo}>
              <Text style={styles.label}>Correo Electrónico *</Text>
              <TextInput
                style={[styles.input, bloquearCampos && styles.inputBloqueado]}
                value={infoCliente.correo_cliente}
                onChangeText={(valor) => onCambioCliente('correo_cliente', valor)}
                placeholder="cliente@ejemplo.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!bloquearCampos}
              />
            </View>

            <View style={styles.campo}>
              <Text style={styles.label}>Teléfono *</Text>
              <TextInput
                style={[styles.input, bloquearCampos && styles.inputBloqueado]}
                value={infoCliente.telefono_cliente}
                onChangeText={(valor) => onCambioCliente('telefono_cliente', valor)}
                placeholder="+57 300 123 4567"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                editable={!bloquearCampos}
              />
            </View>

            <View style={styles.campo}>
              <Text style={styles.label}>Dirección de Entrega *</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline, bloquearCampos && styles.inputBloqueado]}
                value={infoCliente.direccion_entrega}
                onChangeText={(valor) => onCambioCliente('direccion_entrega', valor)}
                placeholder="Dirección completa donde se entregará la mercancía"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                editable={!bloquearCampos}
              />
            </View>
          </View>

          {/* Sección Carga */}
          <View style={styles.seccion}>
            <View style={styles.seccionHeader}>
              <Ionicons name="cube" size={20} color="#28a745" />
              <Text style={styles.seccionTitulo}>Información de la Carga</Text>
            </View>

            <View style={styles.campo}>
              <Text style={styles.label}>Código del Packing List *</Text>
              <View style={styles.inputConBoton}>
                <TextInput
                  style={[styles.input, styles.inputCodigo, bloquearCampos && styles.inputBloqueado]}
                  value={infoCarga.codigo_carga}
                  onChangeText={(valor) => onCambioCarga('codigo_carga', valor)}
                  placeholder="PL-2024-..."
                  placeholderTextColor="#999"
                  autoCapitalize="characters"
                  editable={!bloquearCampos}
                />
                <TouchableOpacity 
                  style={[styles.botonGenerar, bloquearCampos && styles.botonBloqueado]}
                  onPress={onGenerarCodigo}
                  disabled={bloquearCampos}
                >
                  <Ionicons name="refresh" size={16} color={bloquearCampos ? "#ccc" : "#007bff"} />
                  <Text style={[styles.textoBotonGenerar, bloquearCampos && styles.textoBloqueado]}>Generar</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.campo}>
              <Text style={styles.label}>Dirección de Destino *</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline, bloquearCampos && styles.inputBloqueado]}
                value={infoCarga.direccion_destino}
                onChangeText={(valor) => onCambioCarga('direccion_destino', valor)}
                placeholder="Ciudad o dirección de destino de la carga"
                placeholderTextColor="#999"
                multiline
                numberOfLines={2}
                editable={!bloquearCampos}
              />
            </View>
          </View>

          {/* Botones de acción */}
          <View style={styles.botonesContainer}>
            {!guardadoExitoso ? (
              <>
                <TouchableOpacity
                  style={[styles.boton, styles.botonCancelar]}
                  onPress={onCerrar}
                  disabled={guardandoBD}
                >
                  <Text style={styles.textoBotonCancelar}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.boton, styles.botonGuardar]}
                  onPress={handleGuardar}
                  disabled={guardandoBD}
                >
                  {guardandoBD ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="save" size={18} color="#fff" />
                      <Text style={styles.textoBotonGuardar}>Guardar</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.boton, styles.botonCerrarExito]}
                  onPress={onCerrar}
                >
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.textoBotonCerrarExito}>Cerrar</Text>
                </TouchableOpacity>

                {onVisualizarPDF && (
                  <TouchableOpacity
                    style={[styles.boton, styles.botonPDF]}
                    onPress={onVisualizarPDF}
                  >
                    <Ionicons name="qr-code" size={18} color="#fff" />
                    <Text style={styles.textoBotonPDF}>Ver QRs</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {/* Mensaje de éxito */}
          {guardadoExitoso && datosGuardado && (
            <View style={styles.exitoContainer}>
              <View style={styles.exitoIcono}>
                <Ionicons name="checkmark-circle" size={48} color="#28a745" />
              </View>
              <Text style={styles.exitoTitulo}>¡Packing List Guardado!</Text>
              <Text style={styles.exitoMensaje}>
                Se ha guardado exitosamente con el código: {datosGuardado.codigo_carga}
              </Text>
              <Text style={styles.exitoDetalle}>
                ID de la carga: {datosGuardado.idCarga}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Overlay de carga */}
        {guardandoBD && (
          <LoadingOverlay message="Guardando Packing List y generando QRs..." />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  botonCerrar: {
    padding: 5,
  },
  titulo: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  espaciador: {
    width: 34, // Mismo ancho que el botón cerrar para centrar el título
  },
  contenido: {
    flex: 1,
    paddingHorizontal: 20,
  },
  seccion: {
    marginVertical: 20,
  },
  seccionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  campo: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputMultiline: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  inputConBoton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputCodigo: {
    flex: 1,
  },
  botonGenerar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 6,
    gap: 4,
  },
  textoBotonGenerar: {
    color: '#007bff',
    fontSize: 12,
    fontWeight: '600',
  },
  botonesContainer: {
    flexDirection: 'row',
    gap: 15,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  boton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 8,
    gap: 8,
  },
  botonCancelar: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  botonGuardar: {
    backgroundColor: '#007bff',
  },
  botonCerrarExito: {
    backgroundColor: '#28a745',
  },
  botonPDF: {
    backgroundColor: '#6f42c1',
  },
  textoBotonCancelar: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  textoBotonGuardar: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  textoBotonCerrarExito: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  textoBotonPDF: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  exitoContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginVertical: 10,
  },
  exitoIcono: {
    marginBottom: 10,
  },
  exitoTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 8,
  },
  exitoMensaje: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  exitoDetalle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 30,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
    marginTop: 15,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  // Estilos para campos bloqueados
  inputBloqueado: {
    backgroundColor: '#f5f5f5',
    color: '#666',
    borderColor: '#e0e0e0',
  },
  botonBloqueado: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  textoBloqueado: {
    color: '#ccc',
  },
});

export default ModalPackingList;
