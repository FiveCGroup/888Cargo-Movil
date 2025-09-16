import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { obtenerUrlImagen } from '../utils/cargaUtils';

interface TablasDatosProps {
  datosExcel: any[][];
  filasConError: any[];
}

const TablasDatos: React.FC<TablasDatosProps> = ({ datosExcel, filasConError }) => {
  // Memorizar el procesamiento de datos para optimizar rendimiento
  const datosProcessados = useMemo(() => {
    if (!datosExcel || datosExcel.length <= 1) return { headers: [], rows: [] };
    
    const originalHeaders = datosExcel[0] || [];
    const originalRows = datosExcel.slice(1);
    
    // Detectar si hay celda combinada "MEDIDA DE CAJA" seguida de celdas vacías
    const medidaCajaIndex = originalHeaders.findIndex(header => 
      header && header.toString().toLowerCase().includes('medida de caja')
    );
    
    if (medidaCajaIndex !== -1) {
      // Verificar si las siguientes 2 columnas están vacías (indicando celda combinada)
      const siguienteColumna1 = originalHeaders[medidaCajaIndex + 1];
      const siguienteColumna2 = originalHeaders[medidaCajaIndex + 2];
      
      const esCeldaCombinada = (
        (!siguienteColumna1 || siguienteColumna1.toString().trim() === '') &&
        (!siguienteColumna2 || siguienteColumna2.toString().trim() === '')
      );
      
      if (esCeldaCombinada) {
        // Crear nuevos headers para la celda combinada
        const newHeaders = [...originalHeaders];
        newHeaders[medidaCajaIndex] = 'Largo';
        newHeaders[medidaCajaIndex + 1] = 'Ancho';
        newHeaders[medidaCajaIndex + 2] = 'Alto';
        
        // Los datos ya están en las columnas correctas, solo actualizar headers
        return { headers: newHeaders, rows: originalRows };
      }
    }
    
    // Si no hay celda combinada "MEDIDA DE CAJA", retornar datos originales
    return { headers: originalHeaders, rows: originalRows };
  }, [datosExcel]);

  // Mapeo de anchos fijos por columna para alineación perfecta
  const getColWidth = (header: string) => {
    const h = (header ? header.toString() : '').toLowerCase().trim();
    if (h.includes('descripcion español') || h.includes('descripcion')) return 240;
    if (h.includes('descripcion chino') || h.includes('chino')) return 140;
    if (h === 'fecha' || h === 'unit' || h === 'c/n' || h === 'serial') return 70;
    if (h === 'cbm' || h === 'cbm tt' || h === 'g.w' || h === 'g.w tt') return 80;
    if (h === 'phto') return 90;
    if (h === 'marca cliente' || h === 'marca producto' || h === 'material' || h === 'ref art') return 120;
    if (h === 'medida de caja' || h === 'largo' || h === 'ancho' || h === 'alto') return 75;
    return 100; // ancho por defecto
  };

  const getColStyle = (header: string) => {
    const width = getColWidth(header);
    const h = (header ? header.toString() : '').toLowerCase().trim();
    
    return [
      styles.celda, 
      { width }, 
      h === 'phto' ? styles.celdaImagen : null
    ].filter(Boolean);
  };

  const renderCelda = (valor: any, header: string, index: number) => {
    const headerLower = header?.toString().toLowerCase() || '';
    
    // Si es la columna PHTO, mostrar imagen
    if (headerLower === 'phto') {
      const urlImagen = obtenerUrlImagen(valor);
      return (
        <View key={index} style={getColStyle('phto')}>
          {urlImagen ? (
            <TouchableOpacity onPress={() => {/* TODO: Abrir imagen en modal */}}>
              <Image 
                source={{ uri: urlImagen }} 
                style={styles.imagen}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.sinImagen}>
              <Ionicons name="image-outline" size={20} color="#ccc" />
            </View>
          )}
        </View>
      );
    }
    
    // Para cualquier otra columna, mostrar el contenido normal
    return (
      <View key={index} style={getColStyle(header)}>
        <Text 
          style={styles.textoCelda} 
          numberOfLines={headerLower.includes('descripcion') ? 3 : 2} 
          ellipsizeMode="tail"
          adjustsFontSizeToFit={true}
          minimumFontScale={0.8}
        >
          {valor?.toString() || '-'}
        </Text>
      </View>
    );
  };

  const getHeaderColStyle = (header: string) => {
    const width = getColWidth(header);
    const h = (header ? header.toString() : '').toLowerCase().trim();
    
    return [
      styles.headerCelda, 
      { width },
      h === 'phto' ? styles.celdaImagen : null
    ].filter(Boolean);
  };

  const renderHeaders = () => {
    const headers = [];
    for (let idx = 0; idx < datosProcessados.headers.length; idx++) {
      const header = datosProcessados.headers[idx];
      headers.push(
        <View key={idx} style={getHeaderColStyle(header)}>
          <Text style={styles.textoHeader}>{header}</Text>
        </View>
      );
    }
    return headers;
  };

  return (
    <View style={styles.container}>
      {/* Mostrar tabla de filas con errores */}
      {filasConError.length > 0 && (
        <View style={styles.seccion}>
          <View style={styles.tituloContainer}>
            <Ionicons name="warning" size={20} color="#dc3545" />
            <Text style={[styles.titulo, styles.tituloError]}>
              Filas con errores ({filasConError.length})
            </Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tablaContainer}>
            <View style={styles.tabla}>
              {/* Header de errores */}
              <View style={styles.filaHeader}>
                <View style={[styles.headerCelda, styles.celdaNumero]}>
                  <Text style={styles.textoHeader}>Fila #</Text>
                </View>
                <View style={[styles.headerCelda, styles.celdaErrores]}>
                  <Text style={styles.textoHeader}>Errores</Text>
                </View>
                <View style={[styles.headerCelda, styles.celdaDatos]}>
                  <Text style={styles.textoHeader}>Datos de la fila</Text>
                </View>
              </View>
              
              {/* Filas de errores */}
              {filasConError.map((filaError, idx) => (
                <View key={idx} style={[styles.fila, styles.filaError]}>
                  <View style={[styles.celda, styles.celdaNumero]}>
                    <Text style={styles.textoCelda}>{filaError.numeroFila}</Text>
                  </View>
                  <View style={[styles.celda, styles.celdaErrores]}>
                    <Text style={[styles.textoCelda, styles.textoError]}>
                      {filaError.errores.join(', ')}
                    </Text>
                  </View>
                  <View style={[styles.celda, styles.celdaDatos]}>
                    <Text style={styles.textoCelda} numberOfLines={2}>
                      {filaError.datos.slice(0, 5).map((celda: any, cidx: number) => 
                        `[${cidx}]: ${celda || 'vacío'}`
                      ).join(' | ')}
                      {filaError.datos.length > 5 && '...'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
          
          <Text style={styles.leyenda}>
            ← Desliza horizontalmente para ver más información →
          </Text>
        </View>
      )}

      {/* Mostrar tabla del archivo Excel si hay datos válidos */}
      {datosExcel.length > 0 && (
        <View style={styles.seccion}>
          <View style={styles.tituloContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#28a745" />
            <Text style={[styles.titulo, styles.tituloExito]}>
              Datos cargados exitosamente
            </Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tablaContainer}>
            <View style={styles.tabla}>
              {/* Header */}
              <View style={styles.filaHeader}>
                {renderHeaders()}
              </View>
              
              {/* Filas de datos */}
              {datosProcessados.rows.map((row, idx) => (
                <View key={idx} style={styles.fila}>
                  {row.map((cellValue: any, cidx: number) => {
                    const header = datosProcessados.headers[cidx];
                    return renderCelda(cellValue, header, cidx);
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
          
          <Text style={styles.leyenda}>
            ← Desliza horizontalmente para ver más columnas →
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  seccion: {
    marginVertical: 15,
  },
  tituloContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  titulo: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  tituloError: {
    color: '#dc3545',
  },
  tituloExito: {
    color: '#28a745',
  },
  tablaContainer: {
    marginHorizontal: 20,
  },
  tabla: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  filaHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 2,
    borderBottomColor: '#dee2e6',
  },
  fila: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filaError: {
    backgroundColor: '#fff5f5',
  },
  headerCelda: {
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  celda: {
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  celdaImagen: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  celdaNumero: {
    minWidth: 60,
    alignItems: 'center',
  },
  celdaErrores: {
    minWidth: 200,
    maxWidth: 250,
  },
  celdaDatos: {
    minWidth: 300,
  },
  textoHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#495057',
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  textoCelda: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  textoError: {
    color: '#dc3545',
    fontSize: 11,
  },
  imagen: {
    width: 50,
    height: 50,
    borderRadius: 4,
  },
  sinImagen: {
    width: 50,
    height: 50,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  leyenda: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default TablasDatos;
