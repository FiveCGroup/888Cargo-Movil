import { StyleSheet } from 'react-native';
import { BorderRadius, FontSizes, Spacing } from '../../constants/Colors';

/**
 * Estilos para el componente BusquedaPackingList
 * Separados del componente para mejor organización y mantenibilidad
 */
export const busquedaPackingListStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    
    headerContainer: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.sm,
    },
    
    tituloContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    
    titulo: {
        fontSize: FontSizes.xl,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: Spacing.sm,
    },
    
    busquedaContainer: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    
    inputIcon: {
        marginRight: Spacing.sm,
    },
    
    input: {
        flex: 1,
        height: 50,
        fontSize: FontSizes.base,
        color: '#333',
    },
    
    botonesContainer: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    
    boton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.lg,
        gap: Spacing.xs,
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
        fontSize: FontSizes.base,
        fontWeight: '600',
    },
    
    textoBotonLimpiar: {
        color: '#666',
        fontSize: FontSizes.base,
        fontWeight: '600',
    },
    
    resultadosContainer: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
    },
    
    resultadosHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    
    resultadosTitulo: {
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
        color: '#28a745',
        marginLeft: Spacing.xs,
    },
    
    lista: {
        flex: 1,
    },
    
    resultadoItem: {
        backgroundColor: '#fff',
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
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
        fontSize: FontSizes.base,
        fontWeight: 'bold',
        color: '#007bff',
        marginBottom: 4,
    },
    
    resultadoCliente: {
        fontSize: FontSizes.sm,
        color: '#333',
        marginBottom: 2,
    },
    
    resultadoFecha: {
        fontSize: FontSizes.xs,
        color: '#666',
        marginBottom: 2,
    },
    
    resultadoItems: {
        fontSize: FontSizes.xs,
        color: '#28a745',
        fontWeight: '600',
    },
    
    resultadoPeso: {
        fontSize: FontSizes.xs,
        color: '#6c757d',
        fontWeight: '500',
    },
    
    botonVerDetalles: {
        backgroundColor: '#28a745',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    
    textoBotonVer: {
        color: '#fff',
        fontSize: FontSizes.xs,
        fontWeight: '600',
    },
    
    sinResultados: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: Spacing.xxl,
    },
    
    textoSinResultados: {
        fontSize: FontSizes.base,
        color: '#666',
        textAlign: 'center',
        marginTop: Spacing.md,
        marginBottom: 5,
    },
    
    sugerenciaSinResultados: {
        fontSize: FontSizes.sm,
        color: '#999',
        textAlign: 'center',
    },
    
    errorContainer: {
        backgroundColor: '#f8d7da',
        borderColor: '#f5c6cb',
        borderWidth: 1,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
    },
    
    errorText: {
        color: '#721c24',
        fontSize: FontSizes.sm,
        marginLeft: Spacing.sm,
        flex: 1,
    },
});