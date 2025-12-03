import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  onPress: () => void;
}

const BotonDescargarCotizacion: React.FC<Props> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.btn} onPress={onPress}>
      <Text style={styles.texto}>Descargar tu cotización aquí</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 16
  },
  texto: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold'
  }
});

export default BotonDescargarCotizacion;
