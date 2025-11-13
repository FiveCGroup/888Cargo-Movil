// middlewares/fileValidation.middleware.js
// Middleware para validación avanzada de archivos subidos

import path from 'path';
import { fileTypeFromBuffer } from 'file-type';

/**
 * Configuración de tipos de archivos permitidos
 */
const ALLOWED_FILE_TYPES = {
    images: {
        extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'],
        mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'],
        maxSize: 5 * 1024 * 1024, // 5MB
        description: 'Imágenes'
    },
    documents: {
        extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'],
        mimeTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain'
        ],
        maxSize: 10 * 1024 * 1024, // 10MB
        description: 'Documentos'
    },
    csv: {
        extensions: ['.csv'],
        mimeTypes: ['text/csv', 'application/csv', 'text/plain'],
        maxSize: 50 * 1024 * 1024, // 50MB para archivos de datos grandes
        description: 'Archivos CSV'
    }
};

/**
 * Middleware de validación de archivos con detección de tipo real
 */
export const validateFileUpload = (allowedCategory = 'images') => {
    return async (req, res, next) => {
        try {
            // Si no hay archivos, continuar
            if (!req.files || Object.keys(req.files).length === 0) {
                return next();
            }

            const config = ALLOWED_FILE_TYPES[allowedCategory];
            if (!config) {
                return res.status(400).json({
                    success: false,
                    message: `Categoría de archivo no válida: ${allowedCategory}`
                });
            }

            // Validar cada archivo subido
            const fileKeys = Object.keys(req.files);
            const validationResults = [];

            for (const fileKey of fileKeys) {
                const file = req.files[fileKey];
                const validation = await validateSingleFile(file, config);
                
                if (!validation.isValid) {
                    return res.status(400).json({
                        success: false,
                        message: `Error en archivo '${fileKey}': ${validation.error}`,
                        field: fileKey,
                        allowedTypes: config.description,
                        maxSize: `${Math.round(config.maxSize / (1024 * 1024))}MB`
                    });
                }

                validationResults.push({
                    field: fileKey,
                    filename: file.name,
                    size: file.size,
                    detectedType: validation.detectedType,
                    isValid: true
                });
            }

            // Agregar resultados de validación al request
            req.fileValidation = {
                category: allowedCategory,
                results: validationResults,
                timestamp: new Date().toISOString()
            };

            next();
        } catch (error) {
            console.error('Error en validación de archivos:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno en validación de archivos'
            });
        }
    };
};

/**
 * Validar un archivo individual
 */
async function validateSingleFile(file, config) {
    try {
        // Validar tamaño
        if (file.size > config.maxSize) {
            return {
                isValid: false,
                error: `Archivo demasiado grande. Máximo permitido: ${Math.round(config.maxSize / (1024 * 1024))}MB`
            };
        }

        // Validar extensión
        const fileExtension = path.extname(file.name).toLowerCase();
        if (!config.extensions.includes(fileExtension)) {
            return {
                isValid: false,
                error: `Extensión no permitida. Extensiones válidas: ${config.extensions.join(', ')}`
            };
        }

        // Detectar tipo real del archivo (magic number)
        let detectedType = null;
        if (file.data && file.data.length > 0) {
            try {
                const fileTypeResult = await fileTypeFromBuffer(file.data);
                detectedType = fileTypeResult?.mime || 'unknown';
                
                // Verificar que el tipo detectado coincida con los permitidos
                if (fileTypeResult && !config.mimeTypes.includes(fileTypeResult.mime)) {
                    return {
                        isValid: false,
                        error: `Tipo de archivo no coincide. Detectado: ${fileTypeResult.mime}, esperado uno de: ${config.mimeTypes.join(', ')}`
                    };
                }
            } catch (typeError) {
                console.warn('No se pudo detectar el tipo de archivo:', typeError.message);
                // Continuar con validación básica si no se puede detectar el tipo
            }
        }

        // Verificar MIME type declarado
        if (file.mimetype && !config.mimeTypes.includes(file.mimetype)) {
            return {
                isValid: false,
                error: `Tipo MIME no permitido: ${file.mimetype}`
            };
        }

        // Validaciones específicas por categoría
        const categoryValidation = await validateByCategory(file, config, detectedType);
        if (!categoryValidation.isValid) {
            return categoryValidation;
        }

        return {
            isValid: true,
            detectedType,
            declaredType: file.mimetype,
            size: file.size,
            extension: fileExtension
        };
    } catch (error) {
        return {
            isValid: false,
            error: `Error en validación: ${error.message}`
        };
    }
}

/**
 * Validaciones específicas por categoría de archivo
 */
async function validateByCategory(file, config, detectedType) {
    // Validaciones para imágenes
    if (config === ALLOWED_FILE_TYPES.images) {
        return validateImageFile(file, detectedType);
    }

    // Validaciones para documentos
    if (config === ALLOWED_FILE_TYPES.documents) {
        return validateDocumentFile(file, detectedType);
    }

    // Validaciones para CSV
    if (config === ALLOWED_FILE_TYPES.csv) {
        return validateCsvFile(file);
    }

    return { isValid: true };
}

/**
 * Validaciones específicas para imágenes
 */
function validateImageFile(file, detectedType) {
    // Verificar dimensiones mínimas si es posible
    // Por ahora validación básica
    
    // Verificar que no sea un archivo ejecutable disfrazado
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.com', '.pif'];
    const originalName = file.name.toLowerCase();
    
    for (const ext of suspiciousExtensions) {
        if (originalName.includes(ext)) {
            return {
                isValid: false,
                error: 'Archivo sospechoso detectado'
            };
        }
    }

    return { isValid: true };
}

/**
 * Validaciones específicas para documentos
 */
function validateDocumentFile(file, detectedType) {
    // Validación básica de documentos
    // Se puede expandir para verificar estructura de archivos específicos
    
    return { isValid: true };
}

/**
 * Validaciones específicas para CSV
 */
function validateCsvFile(file) {
    try {
        // Verificar que el contenido parezca CSV válido
        const content = file.data.toString('utf8', 0, Math.min(1024, file.data.length));
        
        // Verificar que tenga al menos una coma o punto y coma
        if (!content.includes(',') && !content.includes(';')) {
            return {
                isValid: false,
                error: 'El archivo no parece ser un CSV válido'
            };
        }

        // Verificar que no contenga caracteres sospechosos
        const suspiciousPatterns = [/<script/i, /javascript/i, /eval\(/i, /exec\(/i];
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(content)) {
                return {
                    isValid: false,
                    error: 'Contenido potencialmente peligroso detectado en CSV'
                };
            }
        }

        return { isValid: true };
    } catch (error) {
        return {
            isValid: false,
            error: 'Error al validar contenido CSV'
        };
    }
}

/**
 * Middleware para generar nombre de archivo seguro
 */
export const generateSafeFilename = (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return next();
    }

    const timestamp = Date.now();
    const safeFilenames = {};

    Object.keys(req.files).forEach(fileKey => {
        const file = req.files[fileKey];
        const extension = path.extname(file.name).toLowerCase();
        const baseName = path.basename(file.name, extension);
        
        // Sanitizar nombre base
        const safeName = baseName
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .replace(/_+/g, '_')
            .substring(0, 50);

        // Generar nombre único
        const safeFilename = `${safeName}_${timestamp}_${Math.random().toString(36).substring(2, 8)}${extension}`;
        
        safeFilenames[fileKey] = {
            original: file.name,
            safe: safeFilename,
            path: safeFilename
        };
    });

    req.safeFilenames = safeFilenames;
    next();
};

/**
 * Middleware para logging de archivos subidos
 */
export const logFileUpload = (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return next();
    }

    const uploadInfo = {
        timestamp: new Date().toISOString(),
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        files: {}
    };

    Object.keys(req.files).forEach(fileKey => {
        const file = req.files[fileKey];
        uploadInfo.files[fileKey] = {
            originalName: file.name,
            size: file.size,
            mimetype: file.mimetype,
            safeName: req.safeFilenames?.[fileKey]?.safe || 'unknown'
        };
    });

    console.log('📎 File Upload:', JSON.stringify(uploadInfo, null, 2));
    next();
};

/**
 * Obtener configuración de tipos de archivos (para endpoints de info)
 */
export const getFileTypeConfig = () => {
    return Object.keys(ALLOWED_FILE_TYPES).reduce((config, category) => {
        const { maxSize, extensions, description } = ALLOWED_FILE_TYPES[category];
        config[category] = {
            description,
            maxSizeMB: Math.round(maxSize / (1024 * 1024)),
            allowedExtensions: extensions,
            maxSizeBytes: maxSize
        };
        return config;
    }, {});
};
