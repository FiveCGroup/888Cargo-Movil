/**
 * Utilidades para el manejo de cargas y packing lists - Versión React Native
 */

// Función para generar códigos únicos
export const generarCodigoUnico = (): string => {
  const fecha = new Date();
  const timestamp = fecha.getTime();
  const random = Math.floor(Math.random() * 1000);
  return `PL-${fecha.getFullYear()}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}-${random}-${timestamp.toString().slice(-4)}`;
};

// Función para formatear moneda
export const formatearMoneda = (valor: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(valor);
};

// Función para formatear fechas
export const formatearFecha = (fecha: string | Date): string => {
  if (!fecha) return 'N/A';
  return new Date(fecha).toLocaleDateString('es-CO');
};

// Función para obtener URL de imagen
export const obtenerUrlImagen = (cellValue: any): string | null => {
  if (!cellValue) return null;
  
  if (typeof cellValue === 'string') {
    // URL de string - ajustar para móvil
    return cellValue.startsWith('http') ? cellValue : `http://192.168.58.100:3100${cellValue}`;
  }
  
  return null;
};

// Tipos para validación
export interface InfoCliente {
  nombre_cliente: string;
  correo_cliente: string;
  telefono_cliente: string;
  direccion_entrega: string;
}

export interface InfoCarga {
  codigo_carga: string;
  direccion_destino: string;
  archivo_original?: string;
}

export interface ValidacionResult {
  esValido: boolean;
  errores: string[];
}

// Validaciones para el formulario con nueva estructura
export const validarFormularioCarga = (infoCliente: InfoCliente, infoCarga: InfoCarga): ValidacionResult => {
  const errores: string[] = [];

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
export const prepararDatosFormulario = (datosExcel: any[][], archivoSeleccionado?: { name: string }) => {
  if (datosExcel.length <= 1) return { cliente: {}, carga: {} };

  const primeraFila = datosExcel[1];
  
  const datosCliente: Partial<InfoCliente> = {
    nombre_cliente: '',
    correo_cliente: '',
    telefono_cliente: primeraFila[2] || '', // Tel del Excel si está disponible
    direccion_entrega: ''
  };

  const datosCarga: Partial<InfoCarga> = {
    codigo_carga: generarCodigoUnico(),
    direccion_destino: primeraFila[3] || '', // Ciudad destino del Excel si está disponible
    archivo_original: archivoSeleccionado?.name || ''
  };

  return {
    cliente: datosCliente,
    carga: datosCarga
  };
};

// Función para validar formato de archivo
export const validarArchivoExcel = (archivo: { name: string; type: string; size: number }): { esValido: boolean; error?: string } => {
  const tiposPermitidos = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ];
  
  const extensionesPermitidas = ['.xlsx', '.xls'];
  
  // Verificar tipo
  if (!tiposPermitidos.includes(archivo.type)) {
    const extension = archivo.name.toLowerCase().substring(archivo.name.lastIndexOf('.'));
    if (!extensionesPermitidas.includes(extension)) {
      return {
        esValido: false,
        error: 'Solo se permiten archivos Excel (.xlsx, .xls)'
      };
    }
  }
  
  // Verificar tamaño (10MB máximo)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (archivo.size > maxSize) {
    return {
      esValido: false,
      error: `El archivo es muy grande. Tamaño máximo: 10MB. Tamaño actual: ${(archivo.size / (1024 * 1024)).toFixed(2)}MB`
    };
  }
  
  return { esValido: true };
};

// Función para parsear medidas (mantiene compatibilidad con web)
export const parsearMedidas = (medidaString: string): { largo: number; ancho: number; alto: number } => {
  if (!medidaString) return { largo: 0, ancho: 0, alto: 0 };
  
  const medidas = medidaString.toString().split('x').map(m => parseFloat(m.trim()) || 0);
  
  return {
    largo: medidas[0] || 0,
    ancho: medidas[1] || 0,
    alto: medidas[2] || 0
  };
};
