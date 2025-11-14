// config/swagger.config.js
// Configuración de Swagger para documentación de API

import swaggerJsdoc from 'swagger-jsdoc';

/**
 * Configuración principal de Swagger
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '888Cargo MERN API',
      version: '1.0.0',
      description: 'API para sistema de gestión de packing lists con códigos QR',
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      },
      contact: {
        name: 'Equipo de Desarrollo',
        email: 'dev@888cargo.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Servidor de Desarrollo'
      },
      {
        url: 'https://api.888cargo.com',
        description: 'Servidor de Producción'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT para autenticación'
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'Token JWT en cookie httpOnly'
        }
      },
      schemas: {
        // Esquemas de Usuario
        User: {
          type: 'object',
          required: ['id', 'name', 'email'],
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del usuario',
              example: 1
            },
            name: {
              type: 'string',
              description: 'Nombre completo del usuario',
              example: 'Juan Pérez'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Correo electrónico del usuario',
              example: 'juan@ejemplo.com'
            },
            phone: {
              type: 'string',
              description: 'Número de teléfono',
              example: '+573001112233'
            },
            country: {
              type: 'string',
              description: 'País de residencia',
              example: 'Colombia'
            },
            isActive: {
              type: 'boolean',
              description: 'Estado activo del usuario',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación',
              example: '2024-01-15T10:30:00Z'
            }
          }
        },
        UserRegistration: {
          type: 'object',
          required: ['name', 'lastname', 'email', 'password'],
          properties: {
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              pattern: '^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$',
              description: 'Nombre del usuario',
              example: 'Juan'
            },
            lastname: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              pattern: '^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$',
              description: 'Apellido del usuario',
              example: 'Pérez'
            },
            email: {
              type: 'string',
              format: 'email',
              maxLength: 100,
              description: 'Correo electrónico único',
              example: 'juan@ejemplo.com'
            },
            phone: {
              type: 'string',
              pattern: '^\\+?[0-9]{10,15}$',
              description: 'Número de teléfono',
              example: '+573001112233'
            },
            country: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              description: 'País de residencia',
              example: 'Colombia'
            },
            password: {
              type: 'string',
              minLength: 6,
              maxLength: 100,
              description: 'Contraseña (mín. 6 caracteres)',
              example: 'miContraseña123'
            },
            acceptWhatsapp: {
              type: 'boolean',
              description: 'Acepta notificaciones por WhatsApp',
              example: true
            }
          }
        },
        UserLogin: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Correo electrónico',
              example: 'juan@ejemplo.com'
            },
            password: {
              type: 'string',
              description: 'Contraseña',
              example: 'miContraseña123'
            }
          }
        },
        // Esquemas de QR
        QRCode: {
          type: 'object',
          properties: {
            id_qr: {
              type: 'integer',
              description: 'ID único del código QR',
              example: 1
            },
            codigo_qr: {
              type: 'string',
              description: 'Código QR único',
              example: 'QR_CAJA_001_1642680000'
            },
            tipo_qr: {
              type: 'string',
              enum: ['caja', 'articulo', 'carga'],
              description: 'Tipo de QR',
              example: 'caja'
            },
            estado: {
              type: 'string',
              enum: ['generado', 'impreso', 'escaneado'],
              description: 'Estado del QR',
              example: 'generado'
            },
            fecha_generacion: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de generación',
              example: '2024-01-15T10:30:00Z'
            }
          }
        },
        // Esquemas de respuesta
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indica si la operación fue exitosa',
              example: true
            },
            message: {
              type: 'string',
              description: 'Mensaje descriptivo',
              example: 'Operación completada exitosamente'
            },
            data: {
              type: 'object',
              description: 'Datos de respuesta'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Mensaje de error',
              example: 'Error en la operación'
            },
            errors: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Lista de errores específicos',
              example: ['Campo email es requerido', 'Contraseña muy corta']
            }
          }
        },
        // Esquemas de archivo
        FileUpload: {
          type: 'object',
          properties: {
            fieldname: {
              type: 'string',
              description: 'Nombre del campo',
              example: 'imagen'
            },
            originalname: {
              type: 'string',
              description: 'Nombre original del archivo',
              example: 'producto.jpg'
            },
            mimetype: {
              type: 'string',
              description: 'Tipo MIME del archivo',
              example: 'image/jpeg'
            },
            size: {
              type: 'integer',
              description: 'Tamaño en bytes',
              example: 1024000
            }
          }
        }
      },
      responses: {
        Unauthorized: {
          description: 'No autorizado - Token requerido',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                message: 'Token de autenticación requerido'
              }
            }
          }
        },
        Forbidden: {
          description: 'Prohibido - Permisos insuficientes',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        NotFound: {
          description: 'Recurso no encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        ValidationError: {
          description: 'Error de validación',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                message: 'Datos de entrada no válidos',
                errors: ['Email debe ser válido', 'Contraseña muy corta']
              }
            }
          }
        },
        InternalError: {
          description: 'Error interno del servidor',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Autenticación',
        description: 'Operaciones de registro, login y gestión de usuarios'
      },
      {
        name: 'QR Codes',
        description: 'Generación y gestión de códigos QR'
      },
      {
        name: 'Archivos',
        description: 'Subida y gestión de archivos'
      },
      {
        name: 'Sistema',
        description: 'Endpoints de sistema y diagnóstico'
      }
    ]
  },
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './middlewares/*.js'
  ]
};

/**
 * Generar especificación Swagger
 */
export const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Configuración para Swagger UI
 */
export const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #1f2937; }
    .swagger-ui .scheme-container { background: #f8fafc; }
  `,
  customSiteTitle: '888Cargo API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    tryItOutEnabled: true,
    requestInterceptor: (req) => {
      // Agregar headers personalizados si es necesario
      req.headers['X-API-Version'] = '1.0.0';
      return req;
    }
  }
};

/**
 * Esquemas adicionales para validación
 */
export const validationSchemas = {
  userRegistration: {
    type: 'object',
    required: ['name', 'lastname', 'email', 'password'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 50 },
      lastname: { type: 'string', minLength: 2, maxLength: 50 },
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 },
      phone: { type: 'string', pattern: '^\\+?[0-9]{10,15}$' },
      country: { type: 'string', minLength: 2, maxLength: 50 }
    }
  }
};

export default swaggerSpec;
