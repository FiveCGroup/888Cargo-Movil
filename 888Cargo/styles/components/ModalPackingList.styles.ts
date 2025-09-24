import { StyleSheet } from 'react-native';
import { BorderRadius, FontSizes, Spacing } from '../../constants/Colors';

/**
 * Estilos para el componente ModalPackingList
 * Separados del componente para mejor organización y mantenibilidad
 */
export const modalPackingListStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    
    botonCerrar: {
        padding: 5,
    },
    
    titulo: {
        flex: 1,
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    
    espaciador: {
        width: 34, // Mismo ancho que el botón cerrar para centrar el título
    },
    
    contenido: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
    },
    
    seccion: {
        marginVertical: Spacing.lg,
    },
    
    seccionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    
    seccionTitulo: {
        fontSize: FontSizes.base,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: Spacing.xs,
    },
    
    campo: {
        marginBottom: Spacing.md,
    },
    
    label: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
    },
    
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        fontSize: FontSizes.base,
        backgroundColor: '#fff',
    },
    
    inputMultiline: {
        textAlignVertical: 'top',
        minHeight: 80,
    },
    
    inputConBoton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    
    inputCodigo: {
        flex: 1,
    },
    
    botonGenerar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderWidth: 1,
        borderColor: '#007bff',
        borderRadius: BorderRadius.sm,
        gap: 4,
    },
    
    textoBotonGenerar: {
        color: '#007bff',
        fontSize: FontSizes.xs,
        fontWeight: '600',
    },
    
    botonesContainer: {
        flexDirection: 'row',
        gap: Spacing.md,
        paddingVertical: Spacing.lg,
        paddingBottom: Spacing.xxl,
    },
    
    boton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        gap: Spacing.xs,
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
        fontSize: FontSizes.base,
        fontWeight: '600',
    },
    
    textoBotonGuardar: {
        color: '#fff',
        fontSize: FontSizes.base,
        fontWeight: '600',
    },
    
    textoBotonCerrarExito: {
        color: '#fff',
        fontSize: FontSizes.base,
        fontWeight: '600',
    },
    
    textoBotonPDF: {
        color: '#fff',
        fontSize: FontSizes.base,
        fontWeight: '600',
    },
    
    exitoContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.lg,
        backgroundColor: '#f8f9fa',
        borderRadius: BorderRadius.xl,
        marginVertical: Spacing.sm,
    },
    
    exitoIcono: {
        marginBottom: Spacing.sm,
    },
    
    exitoTitulo: {
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
        color: '#28a745',
        marginBottom: Spacing.xs,
    },
    
    exitoMensaje: {
        fontSize: FontSizes.sm,
        color: '#333',
        textAlign: 'center',
        marginBottom: 4,
    },
    
    exitoDetalle: {
        fontSize: FontSizes.xs,
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
        fontSize: FontSizes.base,
        fontWeight: 'bold',
        color: '#007bff',
        marginTop: Spacing.md,
        marginBottom: Spacing.xs,
    },
    
    loadingSubtitle: {
        fontSize: FontSizes.sm,
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