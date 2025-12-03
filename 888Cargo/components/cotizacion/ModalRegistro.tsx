import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  visible: boolean;
  onCerrar: () => void;
  onIrRegistro: () => void;
}

const ModalRegistroRequerido: React.FC<Props> = ({ visible, onCerrar, onIrRegistro }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>

          <Text style={styles.titulo}>Debes registrarte</Text>
          <Text style={styles.texto}>
            Para guardar o descargar tu cotización, inicia sesión o regístrate primero.
          </Text>

          <TouchableOpacity style={styles.btnRegistro} onPress={onIrRegistro}>
            <Text style={styles.btnTexto}>Ir al registro</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnCerrar} onPress={onCerrar}>
            <Text style={styles.btnCerrarTxt}>Cancelar</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modal: {
    marginHorizontal: 25,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 20
  },
  titulo: { fontSize: 17, fontWeight: 'bold', marginBottom: 10 },
  texto: { fontSize: 14, marginBottom: 18 },
  btnRegistro: {
    backgroundColor: '#1b4ea3',
    paddingVertical: 10,
    borderRadius: 20
  },
  btnTexto: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  btnCerrar: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 20
  },
  btnCerrarTxt: {
    textAlign: 'center',
    color: '#666'
  }
});

export default ModalRegistroRequerido;
