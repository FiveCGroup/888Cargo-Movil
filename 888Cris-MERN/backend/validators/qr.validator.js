// validators/qr.validator.js
// Validador para operaciones de códigos QR
import { z } from "zod";

export class QRValidator {
    
    // Schema para generar QRs de artículo
    static generarQRsArticuloSchema = z.object({
        id_articulo: z.number().positive("ID de artículo debe ser un número positivo"),
        cantidad_cajas: z.number().positive("Cantidad de cajas debe ser mayor a 0")
    });

    // Schema para generar QR específico de caja
    static generarQRCajaSchema = z.object({
        id_articulo: z.number().positive("ID de artículo debe ser un número positivo"),
        numero_caja: z.number().positive("Número de caja debe ser mayor a 0"),
        total_cajas: z.number().positive("Total de cajas debe ser mayor a 0")
    });

    // Schema para obtener QRs de artículo
    static obtenerQRsArticuloSchema = z.object({
        id_articulo: z.number().positive("ID de artículo debe ser un número positivo")
    });

    // Schema para generar PDF de artículo
    static generarPDFArticuloSchema = z.object({
        id_articulo: z.number().positive("ID de artículo debe ser un número positivo")
    });

    // Schema para generar PDF de carga
    static generarPDFCargaSchema = z.object({
        id_carga: z.number().positive("ID de carga debe ser un número positivo")
    });

    /**
     * Validar solicitud para generar QRs de artículo
     * @param {Object} data - Datos a validar
     * @returns {Object} - Datos validados
     * @throws {Error} - Error de validación
     */
    static validarGenerarQRsArticulo(data) {
        try {
            return this.generarQRsArticuloSchema.parse(data);
        } catch (error) {
            throw new Error(this.formatZodError(error));
        }
    }

    /**
     * Validar solicitud para generar QR de caja específica
     * @param {Object} data - Datos a validar
     * @returns {Object} - Datos validados
     * @throws {Error} - Error de validación
     */
    static validarGenerarQRCaja(data) {
        try {
            const validatedData = this.generarQRCajaSchema.parse(data);
            
            // Validación adicional: número de caja no puede ser mayor al total
            if (validatedData.numero_caja > validatedData.total_cajas) {
                throw new Error("El número de caja no puede ser mayor al total de cajas");
            }
            
            return validatedData;
        } catch (error) {
            if (error.message.includes("número de caja")) {
                throw error;
            }
            throw new Error(this.formatZodError(error));
        }
    }

    /**
     * Validar solicitud para obtener QRs de artículo
     * @param {Object} data - Datos a validar
     * @returns {Object} - Datos validados
     * @throws {Error} - Error de validación
     */
    static validarObtenerQRsArticulo(data) {
        try {
            return this.obtenerQRsArticuloSchema.parse(data);
        } catch (error) {
            throw new Error(this.formatZodError(error));
        }
    }

    /**
     * Validar solicitud para generar PDF de artículo
     * @param {Object} data - Datos a validar
     * @returns {Object} - Datos validados
     * @throws {Error} - Error de validación
     */
    static validarGenerarPDFArticulo(data) {
        try {
            return this.generarPDFArticuloSchema.parse(data);
        } catch (error) {
            throw new Error(this.formatZodError(error));
        }
    }

    /**
     * Validar solicitud para generar PDF de carga
     * @param {Object} data - Datos a validar
     * @returns {Object} - Datos validados
     * @throws {Error} - Error de validación
     */
    static validarGenerarPDFCarga(data) {
        try {
            return this.generarPDFCargaSchema.parse(data);
        } catch (error) {
            throw new Error(this.formatZodError(error));
        }
    }

    /**
     * Validar parámetros de URL
     * @param {Object} params - Parámetros de la URL
     * @returns {Object} - Parámetros validados
     * @throws {Error} - Error de validación
     */
    static validarParametrosURL(params) {
        const validParams = {};
        
        // Validar id_articulo si está presente
        if (params.id_articulo) {
            const idArticulo = parseInt(params.id_articulo);
            if (isNaN(idArticulo) || idArticulo <= 0) {
                throw new Error("ID de artículo debe ser un número positivo");
            }
            validParams.id_articulo = idArticulo;
        }

        // Validar id_carga si está presente
        if (params.id_carga) {
            const idCarga = parseInt(params.id_carga);
            if (isNaN(idCarga) || idCarga <= 0) {
                throw new Error("ID de carga debe ser un número positivo");
            }
            validParams.id_carga = idCarga;
        }

        // Validar numero_caja si está presente
        if (params.numero_caja) {
            const numeroCaja = parseInt(params.numero_caja);
            if (isNaN(numeroCaja) || numeroCaja <= 0) {
                throw new Error("Número de caja debe ser un número positivo");
            }
            validParams.numero_caja = numeroCaja;
        }

        // Validar total_cajas si está presente
        if (params.total_cajas) {
            const totalCajas = parseInt(params.total_cajas);
            if (isNaN(totalCajas) || totalCajas <= 0) {
                throw new Error("Total de cajas debe ser un número positivo");
            }
            validParams.total_cajas = totalCajas;
        }

        return validParams;
    }

    /**
     * Validar código QR
     * @param {string} codigoQR - Código QR a validar
     * @returns {boolean} - True si es válido
     * @throws {Error} - Error de validación
     */
    static validarCodigoQR(codigoQR) {
        if (!codigoQR || typeof codigoQR !== 'string') {
            throw new Error("Código QR debe ser una cadena de texto válida");
        }

        if (codigoQR.trim().length === 0) {
            throw new Error("Código QR no puede estar vacío");
        }

        // Validar formato esperado del código QR
        const formatoQR = /^QR_\d+_\d+_\d+$/;
        if (!formatoQR.test(codigoQR.trim())) {
            throw new Error("Formato de código QR inválido. Debe ser: QR_ID_CAJA_TIMESTAMP");
        }

        return true;
    }

    /**
     * Validar ruta de imagen
     * @param {string} rutaImagen - Ruta de la imagen
     * @returns {boolean} - True si es válida
     * @throws {Error} - Error de validación
     */
    static validarRutaImagen(rutaImagen) {
        if (!rutaImagen || typeof rutaImagen !== 'string') {
            throw new Error("Ruta de imagen debe ser una cadena de texto válida");
        }

        // Validar extensiones permitidas
        const extensionesPermitidas = ['.png', '.jpg', '.jpeg', '.gif'];
        const extension = rutaImagen.toLowerCase().slice(rutaImagen.lastIndexOf('.'));
        
        if (!extensionesPermitidas.includes(extension)) {
            throw new Error("Extensión de imagen no permitida. Use: png, jpg, jpeg, gif");
        }

        // Validar que no contenga caracteres peligrosos
        const caracteresProhibidos = ['..', '<', '>', '|', '*', '?'];
        if (caracteresProhibidos.some(char => rutaImagen.includes(char))) {
            throw new Error("Ruta de imagen contiene caracteres no permitidos");
        }

        return true;
    }

    /**
     * Validar datos de caja
     * @param {Object} caja - Datos de la caja
     * @returns {boolean} - True si es válida
     * @throws {Error} - Error de validación
     */
    static validarDatosCaja(caja) {
        if (!caja || typeof caja !== 'object') {
            throw new Error("Datos de caja deben ser un objeto válido");
        }

        // Validar campos requeridos
        const camposRequeridos = ['numero_caja', 'total_cajas', 'id_articulo'];
        for (const campo of camposRequeridos) {
            if (!(campo in caja)) {
                throw new Error(`Campo requerido faltante: ${campo}`);
            }
        }

        // Validar tipos y valores
        if (!Number.isInteger(caja.numero_caja) || caja.numero_caja <= 0) {
            throw new Error("Número de caja debe ser un entero positivo");
        }

        if (!Number.isInteger(caja.total_cajas) || caja.total_cajas <= 0) {
            throw new Error("Total de cajas debe ser un entero positivo");
        }

        if (!Number.isInteger(caja.id_articulo) || caja.id_articulo <= 0) {
            throw new Error("ID de artículo debe ser un entero positivo");
        }

        // Validar relación lógica
        if (caja.numero_caja > caja.total_cajas) {
            throw new Error("Número de caja no puede ser mayor al total de cajas");
        }

        return true;
    }

    /**
     * Formatear errores de Zod
     * @param {Object} error - Error de Zod
     * @returns {string} - Mensaje de error formateado
     */
    static formatZodError(error) {
        if (error.errors && Array.isArray(error.errors)) {
            return error.errors.map(err => err.message).join(', ');
        }
        return error.message || "Error de validación";
    }

    /**
     * Validar configuración de QR
     * @param {Object} config - Configuración para generar QR
     * @returns {Object} - Configuración validada
     * @throws {Error} - Error de validación
     */
    static validarConfiguracionQR(config = {}) {
        const configDefault = {
            width: 256,
            height: 256,
            margin: 2,
            errorCorrectionLevel: 'M',
            type: 'png',
            quality: 0.92,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        };

        const configValidada = { ...configDefault, ...config };

        // Validar dimensiones
        if (configValidada.width < 100 || configValidada.width > 1000) {
            throw new Error("Ancho del QR debe estar entre 100 y 1000 píxeles");
        }

        if (configValidada.height < 100 || configValidada.height > 1000) {
            throw new Error("Alto del QR debe estar entre 100 y 1000 píxeles");
        }

        // Validar margen
        if (configValidada.margin < 0 || configValidada.margin > 10) {
            throw new Error("Margen del QR debe estar entre 0 y 10");
        }

        // Validar nivel de corrección de errores
        const nivelesValidos = ['L', 'M', 'Q', 'H'];
        if (!nivelesValidos.includes(configValidada.errorCorrectionLevel)) {
            throw new Error("Nivel de corrección de errores debe ser: L, M, Q, o H");
        }

        // Validar calidad
        if (configValidada.quality < 0.1 || configValidada.quality > 1) {
            throw new Error("Calidad debe estar entre 0.1 y 1");
        }

        return configValidada;
    }
}
