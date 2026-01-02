import API from './api';

class CargaService {
    async procesarExcel(archivo) {
        try {
            console.log(`[CargaService] Uploading file: ${archivo.name} (${(archivo.size / (1024 * 1024)).toFixed(2)}MB)`);
            
            const formData = new FormData();
            // El backend espera el campo 'file' en upload.single('file')
            formData.append('file', archivo);
            
            // Configuración con timeout extendido para archivos grandes
            const config = {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 300000, // 5 minutos para archivos grandes
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    console.log(`📊 Progreso de carga: ${progress}%`);
                }
            };
            
            const response = await API.post('/carga/procesar-excel', formData, config);
            console.log('✅ Archivo procesado exitosamente');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('❌ Error al procesar Excel:', error);
            
            let errorMessage = 'Error al procesar el archivo Excel';
            
            if (error.code === 'ECONNABORTED') {
                errorMessage = 'El archivo es muy grande o la conexión es lenta. Por favor, intenta con un archivo más pequeño.';
            } else if (error.response?.status === 413) {
                errorMessage = 'El archivo es demasiado grande. Máximo permitido: 50MB.';
            } else if (error.response?.status === 400) {
                errorMessage = error.response.data?.error || 'Formato de archivo no válido.';
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            }
            
            return { success: false, error: errorMessage };
        }
    }

    async guardarPackingListConQR(datosCompletos) {
        try {
            const response = await API.post('/carga/guardar-con-qr', datosCompletos);
            return response.data;
        } catch (error) {
            console.error('❌ Error al guardar packing list con QR:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Error al guardar el packing list con QR'
            };
        }
    }

    async descargarPDFQRs(idCarga, useOptimized = true) {
        try {
            // Usar versión optimizada por defecto y agregar parámetro aleatorio para evitar caché
            const params = useOptimized ? '?useOptimized=true' : '?useOptimized=false';
            const nocache = `&nocache=${Date.now()}`;
            const response = await API.get(`/qr/pdf-carga/${idCarga}${params}${nocache}`, { responseType: 'blob' });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const versionSuffix = useOptimized ? 'optimized' : 'legacy';
            link.download = `QR-Codes-Carga-${idCarga}-${versionSuffix}-${Date.now()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            return { 
                success: true, 
                message: `PDF ${useOptimized ? 'optimizado' : 'legacy'} descargado exitosamente` 
            };
        } catch (error) {
            console.error('❌ Error al descargar PDF:', error);
            return { success: false, error: error.response?.data?.message || 'Error al descargar PDF de QRs' };
        }
    }

    async buscarPackingList(codigoCarga) {
        try {
            const response = await API.get(`/carga/buscar/${encodeURIComponent(codigoCarga)}`);
            
            if (response.data && response.data.success && response.data.data && response.data.data.length > 0) {
                return { success: true, data: response.data.data, mensaje: response.data.mensaje || `Se encontraron ${response.data.data.length} packing lists` };
            } else {
                return { success: false, data: [], mensaje: response.data.mensaje || 'No se encontraron packing lists con ese código' };
            }
        } catch (error) {
            console.error('Error al buscar packing list:', error);
            if (error.response?.status === 404) {
                return { success: false, data: [], mensaje: 'No se encontraron packing lists con ese código' };
            }
            return { success: false, data: [], error: 'Error al buscar el packing list' };
        }
    }

    async obtenerPackingList(idCarga) {
        try {
            const response = await API.get(`/carga/packing-list/${idCarga}`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error al obtener packing list:', error);
            return { success: false, error: 'Error al obtener el packing list' };
        }
    }

    async obtenerCargaMeta(idCarga) {
        try {
            const response = await API.get(`/carga/carga/${idCarga}`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error al obtener metadata de la carga:', error);
            return { success: false, error: 'Error al obtener metadata de la carga' };
        }
    }

    async descargarFormato() {
        try {
            // Descargar directamente desde public/downloads
            const link = document.createElement('a');
            link.href = '/downloads/FORMATO_PACKING_LIST.xlsx';
            link.download = 'FORMATO_PACKING_LIST.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            return { success: true };
        } catch (error) {
            console.error('Error al descargar formato:', error);
            return {
                success: false,
                error: 'Error al descargar el formato'
            };
        }
    }

    // =====================================
    // NUEVAS FUNCIONES PARA SISTEMA QR OPTIMIZADO
    // =====================================

    /**
     * Generar QRs como datos para una carga (versión optimizada)
     */
    async generarQRDataParaCarga(idCarga) {
        try {
            const response = await API.post(`/api/qr/carga/${idCarga}/generate-data`);
            return { 
                success: true, 
                data: response.data,
                message: 'QRs generados exitosamente como datos' 
            };
        } catch (error) {
            console.error('❌ Error al generar QR data:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Error al generar códigos QR'
            };
        }
    }

    /**
     * Obtener datos QR de una carga
     */
    async obtenerQRDataDeCarga(idCarga) {
        try {
            const response = await API.get(`/api/qr/carga/${idCarga}/data`);
            return { 
                success: true, 
                data: response.data,
                message: 'Datos QR obtenidos exitosamente' 
            };
        } catch (error) {
            console.error('❌ Error al obtener QR data:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Error al obtener datos QR'
            };
        }
    }

    /**
     * Obtener imagen QR dinámica
     */
    async obtenerImagenQRDinamica(qrId, options = {}) {
        try {
            const params = new URLSearchParams();
            if (options.width) params.append('width', options.width);
            if (options.margin) params.append('margin', options.margin);
            if (options.markAsPrinted) params.append('markAsPrinted', 'true');

            const queryString = params.toString();
            const url = `/api/qr/image/${qrId}${queryString ? '?' + queryString : ''}`;
            
            const response = await API.get(url, { responseType: 'blob' });
            const imageUrl = window.URL.createObjectURL(new Blob([response.data]));
            
            return { 
                success: true, 
                imageUrl,
                message: 'Imagen QR generada dinámicamente' 
            };
        } catch (error) {
            console.error('❌ Error al obtener imagen QR dinámica:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Error al generar imagen QR'
            };
        }
    }

    /**
     * Validar QR escaneado con nueva estructura
     */
    async validarQREscaneado(datosEscaneados) {
        try {
            const response = await API.post('/api/qr/validate-scanned', {
                scannedData: datosEscaneados
            });
            return { 
                success: true, 
                data: response.data,
                message: 'QR validado exitosamente' 
            };
        } catch (error) {
            console.error('❌ Error al validar QR:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Error al validar código QR'
            };
        }
    }

    /**
     * Guardar Packing List con QRs optimizados (nueva versión)
     */
    async guardarPackingListConQROptimizado(datosCompletos) {
        try {
            // Guardar el packing list normal primero
            const response = await API.post('/api/carga/guardar-con-qr', datosCompletos);
            
            if (response.data && response.data.success && response.data.data?.carga?.id) {
                const idCarga = response.data.data.carga.id;
                
                // Generar QRs optimizados para la carga
                const qrResult = await this.generarQRDataParaCarga(idCarga);
                
                if (qrResult.success) {
                    return {
                        ...response.data,
                        qr_optimized: true,
                        qr_data: qrResult.data
                    };
                }
            }
            
            return response.data;
        } catch (error) {
            console.error('❌ Error al guardar packing list con QR optimizado:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Error al guardar el packing list optimizado'
            };
        }
    }
}

export default new CargaService();
