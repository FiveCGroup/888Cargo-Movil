import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  botonVolver: {
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  espaciador: {
    width: 34,
  },
  contenido: {
    flex: 1,
  },
  separador: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  lineaSeparador: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  textoSeparador: {
    paddingHorizontal: 15,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  seccion: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  seccionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  seccionTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  botonCargarArchivo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 10,
  },
  textoBotonCargar: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  archivoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  archivoDetalles: {
    flex: 1,
    marginLeft: 10,
  },
  archivoNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  archivoTamano: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  botonFormulario: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  textoBotonFormulario: {
    color: '#007bff',
    fontSize: 12,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8d7da',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  errorTexto: {
    color: '#721c24',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  estadisticasContainer: {
    backgroundColor: '#d4edda',
    padding: 15,
    borderRadius: 12,
    marginTop: 15,
  },
  estadisticasTitulo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#155724',
    marginBottom: 8,
  },
  estadisticasTexto: {
    fontSize: 13,
    color: '#155724',
    marginBottom: 2,
  },
});

export default styles;