/**
 * Utilidades para el manejo de cargas y packing lists
 */

// Función para generar códigos únicos
export const generarCodigoUnico = () => {
    const fecha = new Date();
    const timestamp = fecha.getTime();
    const random = Math.floor(Math.random() * 1000);
    return `PL-${fecha.getFullYear()}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}-${random}-${timestamp.toString().slice(-4)}`;
};

// Función para formatear moneda
export const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(valor);
};

// Función para formatear fechas
export const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-CO');
};

// Función para obtener URL de imagen
export const obtenerUrlImagen = (cellValue) => {
    if (!cellValue) return null;
    
    if (typeof cellValue === 'string') {
        // URL de string
        return cellValue.startsWith('http') ? cellValue : `http://localhost:4000${cellValue}`;
    }
    
    return null;
};

// Validaciones para el formulario con nueva estructura
export const validarFormularioCarga = (infoCliente, infoCarga) => {
    const errores = [];

    // Validaciones del cliente (campos obligatorios)
    if (!infoCliente.nombre_cliente?.trim()) {
        errores.push('El nombre del cliente es requerido');
    }
    
    if (!infoCliente.correo_cliente?.trim()) {
        errores.push('El correo electrónico del cliente es requerido');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(infoCliente.correo_cliente)) {
        errores.push('El correo electrónico no tiene un formato válido');
    }
    
    if (!infoCliente.telefono_cliente?.trim()) {
        errores.push('El teléfono del cliente es requerido');
    }
    
    if (!infoCliente.direccion_entrega?.trim()) {
        errores.push('La dirección de entrega de mercancía es requerida');
    }

    // Validaciones de la carga (campos obligatorios)
    if (!infoCarga.codigo_carga?.trim()) {
        errores.push('El código del packing list es requerido');
    }
    
    if (!infoCarga.direccion_destino?.trim()) {
        errores.push('La dirección de destino es requerida');
    }

    return {
        esValido: errores.length === 0,
        errores
    };
};

// Función para preparar datos del formulario con nueva estructura
export const prepararDatosFormulario = (datosExcel, archivoSeleccionado) => {
    if (datosExcel.length <= 1) return { cliente: {}, carga: {} };

    const primeraFila = datosExcel[1];
    
    const datosCliente = {
        nombre_cliente: '',
        correo_cliente: '',
        telefono_cliente: primeraFila[2] || '', // Tel del Excel si está disponible
        direccion_entrega: ''
    };

    const datosCarga = {
        codigo_carga: generarCodigoUnico(),
        direccion_destino: primeraFila[3] || '', // Ciudad destino del Excel si está disponible
        archivo_original: archivoSeleccionado?.name || ''
    };

    return {
        cliente: datosCliente,
        carga: datosCarga
    };
};
