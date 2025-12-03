import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  resultado: any;
}

const ResultadoCotizacion: React.FC<Props> = ({ resultado }) => {
  if (!resultado) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Resultados de la cotización</Text>

      <Text style={styles.texto}>Volumen: {resultado.volumen_m3} m³</Text>
      <Text style={styles.texto}>Peso: {resultado.peso_kg} kg</Text>

      <Text style={styles.valor}>
        Valor total: {resultado.valor_cop.toLocaleString()} COP
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    backgroundColor: '#e3e6ef',
    padding: 18,
    borderRadius: 18
  },
  titulo: {
    fontWeight: 'bold',
    marginBottom: 14,
    fontSize: 16
  },
  texto: {
    marginBottom: 6,
    fontSize: 14
  },
  valor: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1b4ea3'
  }
});

export default ResultadoCotizacion;
