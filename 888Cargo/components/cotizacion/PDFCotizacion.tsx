// components/cotizacion/CotizacionPDF.tsx
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';

interface Props {
  resultado: any;
  tipoEnvio: 'Marítimo' | 'Aéreo';
  dimensiones: { largo: number; ancho: number; alto: number; unidad: 'cm' | 'm' };
  peso: number;
  volumen: number;
}

const CotizacionPDF: React.FC<Props> = ({
  resultado,
  tipoEnvio,
  dimensiones,
  peso,
  volumen,
}) => {
  const fecha = format(new Date(), 'dd/MM/yyyy HH:mm');

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/image/888cargo-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Cotización de Envío</Text>
        <Text style={styles.subtitle}>888Cargo - China → Colombia</Text>
      </View>

      {/* Info Cliente */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datos del Envío</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Tipo de envío:</Text>
          <Text style={styles.value}>{tipoEnvio}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Fecha:</Text>
          <Text style={styles.value}>{fecha}</Text>
        </View>
      </View>

      {/* Dimensiones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dimensiones de la Carga</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableHeader}>Concepto</Text>
            <Text style={styles.tableHeader}>Valor</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Largo</Text>
            <Text style={styles.tableCell}>{dimensiones.largo} {dimensiones.unidad}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Ancho</Text>
            <Text style={styles.tableCell}>{dimensiones.ancho} {dimensiones.unidad}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Alto</Text>
            <Text style={styles.tableCell}>{dimensiones.alto} {dimensiones.unidad}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Peso</Text>
            <Text style={styles.tableCell}>{peso} kg</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellBold}>Volumen</Text>
            <Text style={styles.tableCellBold}>{volumen.toFixed(3)} m³</Text>
          </View>
        </View>
      </View>

      {/* Resultado Final */}
      <View style={styles.resultBox}>
        <Text style={styles.resultText}>Valor estimado del envío</Text>
        <Text style={styles.price}>${resultado.valor_cop.toLocaleString('es-CO')} COP</Text>
        {resultado.isStub && <Text style={styles.stubNote}>(Cálculo aproximado - sin conexión)</Text>}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Cotización válida por 48 horas</Text>
        <Text style={styles.footerText}>www.888cargo.com | +57 300 123 4567</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#fff', fontFamily: 'Helvetica' },
  header: { alignItems: 'center', marginBottom: 30 },
  logo: { width: 180, height: 80, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0b2032' },
  subtitle: { fontSize: 14, color: '#6b7280' },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#0f77c5' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 14, color: '#374151' },
  value: { fontSize: 14, fontWeight: 'bold', color: '#0b2032' },
  table: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e5e7eb', paddingVertical: 10, paddingHorizontal: 12 },
  tableHeader: { fontSize: 13, fontWeight: 'bold', flex: 1, textAlign: 'center', color: '#0f77c5' },
  tableCell: { fontSize: 13, flex: 1, textAlign: 'center' },
  tableCellBold: { fontSize: 14, fontWeight: 'bold', flex: 1, textAlign: 'center', color: '#0b2032' },
  resultBox: { 
    backgroundColor: '#f0fdf4', 
    borderRadius: 12, 
    alignItems: 'center',
    marginTop: 30 
  },
  resultText: { fontSize: 16, color: '#166534', marginBottom: 8 },
  price: { fontSize: 32, fontWeight: 'bold', color: '#166534' },
  stubNote: { fontSize: 11, color: '#dc2626', marginTop: 6 },
  footer: { marginTop: 50, alignItems: 'center' },
  footerText: { fontSize: 11, color: '#6b7280' },
});

export default CotizacionPDF;