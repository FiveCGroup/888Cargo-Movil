import { StyleSheet } from 'react-native';
import { FontSizes, Spacing, BorderRadius } from '../../constants/Colors';

/**
 * Estilos para el componente TablasDatos
 * Separados del componente para mejor organización y mantenibilidad
 */
export const tablasDatosStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    
    seccion: {
        marginVertical: Spacing.md,
    },
    
    tituloContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    
    titulo: {
        fontSize: FontSizes.base,
        fontWeight: 'bold',
        marginLeft: Spacing.xs,
    },
    
    tituloError: {
        color: '#dc3545',
    },
    
    tituloExito: {
        color: '#28a745',
    },
    
    tablaContainer: {
        marginHorizontal: Spacing.lg,
    },
    
    tabla: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: BorderRadius.lg,
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
        padding: Spacing.md,
        borderRightWidth: 1,
        borderRightColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
    },
    
    celda: {
        padding: Spacing.md,
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
        fontSize: FontSizes.xs,
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
        fontSize: FontSizes.xs,
        color: '#6c757d',
        textAlign: 'center',
        marginTop: Spacing.xs,
        fontStyle: 'italic',
    },
});