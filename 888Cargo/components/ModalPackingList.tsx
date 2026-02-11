import React from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { InfoCliente, InfoCarga } from '../utils/cargaUtils';
import { modalPackingListStyles as styles } from '../styles/components/ModalPackingList.styles';
import { IconSizes, IconColors } from '../constants/Icons';

const ESTADOS_CARGA = ['En bodega China', 'En tránsito', 'En despacho', 'Entregada', 'Pendiente'];

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
      <ActivityIndicator size="large" color={IconColors.primary} />
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
    const destinoObligatorio = (infoCarga.direccion_destino?.trim() || infoCarga.destino?.trim());
    if (!destinoObligatorio) {
      Alert.alert('Error', 'La dirección o ciudad de destino es requerida');
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
            <Ionicons name="close" size={IconSizes.lg} color={IconColors.secondary} />
          </TouchableOpacity>
          <Text style={styles.titulo}>Datos del Packing List</Text>
          <View style={styles.espaciador} />
        </View>

        <ScrollView style={styles.contenido} showsVerticalScrollIndicator={false}>
          {/* Sección Cliente */}
          <View style={styles.seccion}>
            <View style={styles.seccionHeader}>
              <Ionicons name="person" size={IconSizes.md} color={IconColors.primary} />
              <Text style={styles.seccionTitulo}>Información del Cliente</Text>
            </View>

            <View style={styles.campo}>
              <Text style={styles.label}>Nombre del Cliente *</Text>
              <TextInput
                style={[styles.input, bloquearCampos && styles.inputBloqueado]}
                value={infoCliente.nombre_cliente}
                onChangeText={(valor) => onCambioCliente('nombre_cliente', valor)}
                placeholder="Nombre completo del cliente"
                placeholderTextColor={IconColors.muted}
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
                placeholderTextColor={IconColors.muted}
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
                placeholderTextColor={IconColors.muted}
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
                placeholderTextColor={IconColors.muted}
                multiline
                numberOfLines={3}
                editable={!bloquearCampos}
              />
            </View>
          </View>

          {/* Sección Carga */}
          <View style={styles.seccion}>
            <View style={styles.seccionHeader}>
              <Ionicons name="cube" size={20} color={IconColors.success} />
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
                  placeholderTextColor={IconColors.muted}
                  autoCapitalize="characters"
                  editable={!bloquearCampos}
                />
                <TouchableOpacity 
                  style={[styles.botonGenerar, bloquearCampos && styles.botonBloqueado]}
                  onPress={onGenerarCodigo}
                  disabled={bloquearCampos}
                >
                  <Ionicons name="refresh" size={IconSizes.sm} color={bloquearCampos ? IconColors.light : IconColors.primary} />
                  <Text style={[styles.textoBotonGenerar, bloquearCampos && styles.textoBloqueado]}>Generar</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.campo}>
              <Text style={styles.label}>Destino (Ciudad) *</Text>
              <TextInput
                style={[styles.input, bloquearCampos && styles.inputBloqueado]}
                value={infoCarga.destino ?? ''}
                onChangeText={(valor) => onCambioCarga('destino', valor)}
                placeholder="Ej: Medellín, Bogotá, Cali"
                placeholderTextColor={IconColors.muted}
                editable={!bloquearCampos}
              />
            </View>

            <View style={styles.campo}>
              <Text style={styles.label}>Dirección de Destino *</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline, bloquearCampos && styles.inputBloqueado]}
                value={infoCarga.direccion_destino}
                onChangeText={(valor) => onCambioCarga('direccion_destino', valor)}
                placeholder="Dirección completa donde se entregará la mercancía"
                placeholderTextColor={IconColors.muted}
                multiline
                numberOfLines={2}
                editable={!bloquearCampos}
              />
            </View>

            <View style={styles.campo}>
              <Text style={styles.label}>Shipping Mark</Text>
              <TextInput
                style={[styles.input, bloquearCampos && styles.inputBloqueado]}
                value={infoCarga.shipping_mark ?? ''}
                onChangeText={(valor) => onCambioCarga('shipping_mark', valor)}
                placeholder="Ej: 888ABC"
                placeholderTextColor={IconColors.muted}
                editable={!bloquearCampos}
              />
            </View>

            <View style={styles.campo}>
              <Text style={styles.label}>Estado</Text>
              <View style={[styles.input, { minHeight: Platform.OS === 'ios' ? 36 : 48, justifyContent: 'center' }]}>
                <Picker
                  selectedValue={infoCarga.estado ?? 'En bodega China'}
                  onValueChange={(valor) => onCambioCarga('estado', valor)}
                  enabled={!bloquearCampos}
                  style={{ color: IconColors.primary }}
                  mode="dropdown"
                >
                  {ESTADOS_CARGA.map((e) => (
                    <Picker.Item key={e} label={e} value={e} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.campo}>
              <Text style={styles.label}>Ubicación Actual</Text>
              <TextInput
                style={[styles.input, bloquearCampos && styles.inputBloqueado]}
                value={infoCarga.ubicacion_actual ?? ''}
                onChangeText={(valor) => onCambioCarga('ubicacion_actual', valor)}
                placeholder="Ej: China, Puerto de Cartagena"
                placeholderTextColor={IconColors.muted}
                editable={!bloquearCampos}
              />
            </View>

            <View style={styles.campo}>
              <Text style={styles.label}>Fecha de Recepción</Text>
              <TextInput
                style={[styles.input, bloquearCampos && styles.inputBloqueado]}
                value={infoCarga.fecha_recepcion ?? ''}
                onChangeText={(valor) => onCambioCarga('fecha_recepcion', valor)}
                placeholder="YYYY-MM-DD HH:mm"
                placeholderTextColor={IconColors.muted}
                editable={!bloquearCampos}
              />
            </View>

            <View style={styles.campo}>
              <Text style={styles.label}>Fecha de Envío</Text>
              <TextInput
                style={[styles.input, bloquearCampos && styles.inputBloqueado]}
                value={infoCarga.fecha_envio ?? ''}
                onChangeText={(valor) => onCambioCarga('fecha_envio', valor)}
                placeholder="YYYY-MM-DD HH:mm"
                placeholderTextColor={IconColors.muted}
                editable={!bloquearCampos}
              />
            </View>

            <View style={styles.campo}>
              <Text style={styles.label}>Fecha de Arribo</Text>
              <TextInput
                style={[styles.input, bloquearCampos && styles.inputBloqueado]}
                value={infoCarga.fecha_arribo ?? ''}
                onChangeText={(valor) => onCambioCarga('fecha_arribo', valor)}
                placeholder="YYYY-MM-DD HH:mm"
                placeholderTextColor={IconColors.muted}
                editable={!bloquearCampos}
              />
            </View>

            <View style={styles.campo}>
              <Text style={styles.label}>Contenedor Asociado</Text>
              <TextInput
                style={[styles.input, bloquearCampos && styles.inputBloqueado]}
                value={infoCarga.contenedor_asociado ?? ''}
                onChangeText={(valor) => onCambioCarga('contenedor_asociado', valor)}
                placeholder="Número de contenedor"
                placeholderTextColor={IconColors.muted}
                editable={!bloquearCampos}
              />
            </View>

            <View style={styles.campo}>
              <Text style={styles.label}>Observaciones</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline, bloquearCampos && styles.inputBloqueado]}
                value={infoCarga.observaciones ?? ''}
                onChangeText={(valor) => onCambioCarga('observaciones', valor)}
                placeholder="Notas adicionales sobre la carga"
                placeholderTextColor={IconColors.muted}
                multiline
                numberOfLines={3}
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
                    <ActivityIndicator size="small" color={IconColors.white} />
                  ) : (
                    <>
                      <Ionicons name="save" size={18} color={IconColors.white} />
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
                  <Ionicons name="checkmark" size={18} color={IconColors.white} />
                  <Text style={styles.textoBotonCerrarExito}>Cerrar</Text>
                </TouchableOpacity>

                {onVisualizarPDF && (
                  <TouchableOpacity
                    style={[styles.boton, styles.botonPDF]}
                    onPress={onVisualizarPDF}
                  >
                    <Ionicons name="qr-code" size={18} color={IconColors.white} />
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
                <Ionicons name="checkmark-circle" size={48} color={IconColors.success} />
              </View>
              <Text style={styles.exitoTitulo}>¡Packing List Guardado!</Text>
              <Text style={styles.exitoMensaje}>
                Se ha guardado exitosamente con el código: {datosGuardado.carga?.codigo ?? datosGuardado.codigo_carga ?? '—'}
              </Text>
              <Text style={styles.exitoDetalle}>
                ID de la carga: {datosGuardado.carga?.id ?? datosGuardado.idCarga ?? '—'}
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



export default ModalPackingList;
