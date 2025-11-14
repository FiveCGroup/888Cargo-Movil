# 📋 Documentación Completa del Backend - 888Cargo

## 🎯 Índice de Documentación

Esta documentación está dividida en las siguientes partes para facilitar su lectura:

1. **[Parte 1: Introducción y Configuración](#parte-1-introducción-y-configuración)** *(Este archivo)*
2. **[Parte 2: Arquitectura y Estructura](./ARCHITECTURE.md)**
3. **[Parte 3: API Endpoints y Rutas](./API_ENDPOINTS.md)**
4. **[Parte 4: Base de Datos y Modelos](./DATABASE.md)**
5. **[Parte 5: Servicios y Lógica de Negocio](./SERVICES.md)**
6. **[Parte 6: Middlewares y Seguridad](./SECURITY.md)**
7. **[Parte 7: Utilidades y Herramientas](./UTILITIES.md)**
8. **[Parte 8: Despliegue y Producción](./DEPLOYMENT.md)**

---

# Parte 1: Introducción y Configuración

## 🚀 Introducción

El backend de **888Cargo** es una aplicación robusta construida con **Node.js** y **Express.js** que proporciona una API RESTful completa para la gestión de listas de empaque (packing lists) con generación automática de códigos QR, autenticación JWT, y gestión segura de archivos.

### 🎯 Características Principales

- **🔐 Autenticación JWT** con refresh tokens y recuperación de contraseñas
- **📦 Gestión Completa de Listas de Empaque** (CRUD + QR generation)
- **🔒 Seguridad Avanzada** con validación, sanitización y rate limiting
- **📊 Base de Datos SQLite** con repositories pattern
- **📱 Integración WhatsApp** para recuperación de contraseñas
- **🖼️ Procesamiento de Imágenes** con Sharp y Canvas
- **📄 Generación de PDFs** con QRs incluidos
- **📈 Sistema de Auditoría** completo
- **🛡️ Validación de Archivos** por magic numbers

## ⚙️ Requisitos del Sistema

### Requisitos Mínimos
```bash
Node.js: >= 18.0.0
npm: >= 9.0.0
Python: >= 3.8 (para node-canvas dependencies)
Sistema Operativo: Windows 10/11, macOS 10.15+, Ubuntu 20.04+
RAM: >= 4GB
Espacio en Disco: >= 2GB
```

### Dependencias del Sistema
```bash
# Windows (con chocolatey)
choco install nodejs python3 git

# macOS (con homebrew)
brew install node python3 git

# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm python3 python3-pip git build-essential
```

## 📁 Estructura del Proyecto

```
888Cris-MERN/backend/
├── 📄 app.js                    # Configuración principal de Express
├── 📄 index.js                  # Punto de entrada del servidor
├── 📄 config.js                 # Configuraciones centralizadas
├── 📄 db.js                     # Conexión y utilidades de base de datos
├── 📄 .env                      # Variables de entorno
├── 📄 tsconfig.json             # Configuración TypeScript
├── 📄 packing_list.db           # Base de datos SQLite
├── 📄 cleanup_db.ps1            # Script de limpieza de BD
│
├── 📂 config/                   # Configuraciones específicas
│   ├── environments.js          # Configuraciones por ambiente
│   └── swagger.config.js        # Configuración de documentación API
│
├── 📂 controllers/              # Controladores HTTP
│   ├── auth.controller.js       # Autenticación y usuarios
│   ├── carga.controller.js      # Gestión de cargas
│   ├── qr.controller.js         # Generación y validación QR
│   └── recuperacion.controller.js # Recuperación de contraseñas
│
├── 📂 middlewares/              # Middlewares personalizados
│   ├── auth.middleware.js       # Autenticación JWT
│   ├── fileValidation.middleware.js # Validación de archivos
│   ├── dataSanitization.middleware.js # Sanitización de datos
│   └── rateLimiting.middleware.js # Rate limiting
│
├── 📂 models/                   # Modelos de datos
│   ├── user.model.js           # Modelo de usuario
│   ├── carga.model.js          # Modelo de carga
│   └── qr.model.js             # Modelo de QR
│
├── 📂 repositories/             # Acceso a datos (Repository Pattern)
│   ├── base.repository.js      # Repository base
│   ├── user.repository.js      # Repository de usuarios
│   ├── carga.repository.js     # Repository de cargas
│   └── qr.repository.js        # Repository de QRs
│
├── 📂 routes/                   # Rutas de la API
│   ├── auth.routes.js          # Rutas de autenticación
│   ├── carga.routes.js         # Rutas de cargas
│   ├── qr.routes.js            # Rutas de QR
│   ├── recuperacion.routes.js  # Rutas de recuperación
│   └── debug.routes.js         # Rutas de depuración
│
├── 📂 services/                 # Lógica de negocio
│   ├── auth.service.js         # Servicios de autenticación
│   ├── carga.service.js        # Servicios de cargas
│   ├── qr.service.js           # Servicios de QR
│   ├── whatsapp.service.js     # Integración WhatsApp
│   ├── recuperacion.service.js # Servicios de recuperación
│   └── audit.service.js        # Servicios de auditoría
│
├── 📂 utils/                    # Utilidades
│   ├── auth.utils.js           # Utilidades de autenticación
│   ├── file.utils.js           # Utilidades de archivos
│   └── qrLogoGenerator.js      # Generador de QR con logo
│
├── 📂 validators/               # Validadores de datos
│   ├── auth.validator.js       # Validadores de auth
│   ├── carga.validator.js      # Validadores de carga
│   └── qr.validator.js         # Validadores de QR
│
├── 📂 uploads/                  # Archivos subidos
│   ├── images/                 # Imágenes
│   └── qr-codes/              # Códigos QR generados
│
├── 📂 assets/                   # Recursos estáticos
│   └── logo/                   # Logos para QRs
│
├── 📂 migrations/               # Migraciones de base de datos
├── 📂 tasks/                    # Tareas programadas
└── 📂 docs/                     # Documentación
    ├── README.md               # Este archivo
    ├── ARCHITECTURE.md         # Documentación de arquitectura
    ├── API_ENDPOINTS.md        # Documentación de endpoints
    └── ...                     # Otros archivos de documentación
```

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio
```bash
# Clonar el repositorio completo
git clone https://github.com/FiveCGroup/888Cargo-Movil.git
cd 888Cargo-Movil/888Cris-MERN
```

### 2. Instalar Dependencias
```bash
# Instalar dependencias del proyecto completo
npm run install:all

# O instalar solo las del backend
npm install
```

### 3. Configurar Variables de Entorno
```bash
# Copiar el archivo de ejemplo
cp backend/.env.example backend/.env

# Editar las variables de entorno
code backend/.env
```

#### Variables de Entorno Requeridas
```bash
# .env
# ====================
# CONFIGURACIÓN DEL SERVIDOR
# ====================
NODE_ENV=development                    # development | production | test
PORT=3000                              # Puerto del servidor
HOST=localhost                         # Host del servidor

# ====================
# BASE DE DATOS
# ====================
DATABASE_PATH=./packing_list.db        # Ruta de la base de datos SQLite
DATABASE_BACKUP_PATH=./backups/        # Ruta de respaldos

# ====================
# SEGURIDAD Y AUTENTICACIÓN
# ====================
JWT_SECRET=tu_secreto_jwt_super_seguro_aqui_cambiar_en_produccion
JWT_REFRESH_SECRET=otro_secreto_para_refresh_tokens_cambiar_tambien
JWT_EXPIRATION=24h                     # Expiración del token principal
JWT_REFRESH_EXPIRATION=7d              # Expiración del refresh token

# ====================
# ARCHIVOS Y UPLOADS
# ====================
UPLOAD_PATH=./uploads                  # Ruta de archivos subidos
MAX_FILE_SIZE=50                       # Tamaño máximo en MB
ALLOWED_IMAGE_TYPES=jpeg,jpg,png,webp  # Tipos de imagen permitidos

# ====================
# INTEGRACIÓN WHATSAPP
# ====================
WHATSAPP_ACCESS_TOKEN=tu_token_de_whatsapp_business_api
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
WHATSAPP_VERIFY_TOKEN=tu_verify_token_personalizado

# ====================
# CONFIGURACIÓN DE QR
# ====================
QR_LOGO_PATH=./assets/logo/888cargo-logo.png
QR_SIZE=300                            # Tamaño del QR en pixels
QR_ERROR_CORRECTION=M                  # L, M, Q, H

# ====================
# CORS Y SEGURIDAD
# ====================
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
RATE_LIMIT_WINDOW=15                   # Ventana de rate limit en minutos
RATE_LIMIT_MAX=100                     # Máximo de requests por ventana

# ====================
# CONFIGURACIÓN DE LOGS
# ====================
LOG_LEVEL=info                         # error, warn, info, debug
LOG_TO_FILE=true                       # Guardar logs en archivo
LOG_FILE_PATH=./logs/app.log           # Ruta del archivo de logs

# ====================
# CONFIGURACIÓN DE AUDITORÍA
# ====================
AUDIT_ENABLED=true                     # Habilitar auditoría
AUDIT_LOG_PATH=./logs/audit.log        # Ruta del log de auditoría
AUDIT_RETENTION_DAYS=90                # Días de retención de logs

# ====================
# CONFIGURACIÓN DE DESARROLLO
# ====================
DEBUG_MODE=true                        # Solo para development
SWAGGER_ENABLED=true                   # Habilitar documentación Swagger
```

### 4. Configurar Base de Datos
```bash
# La base de datos SQLite se crea automáticamente al iniciar
# Si necesitas recrearla, elimina el archivo y reinicia
rm backend/packing_list.db
npm run dev:server
```

### 5. Comandos de Ejecución

#### Comandos Principales
```bash
# Desarrollo (con auto-reload)
npm run dev:server              # Solo backend
npm run dev:client              # Solo frontend  
npm run dev                     # Backend + Frontend simultáneamente

# Producción
npm start                       # Backend en producción
npm run build                   # Build del frontend
npm run start:client            # Frontend en producción

# Instalación
npm run install:all             # Instalar todas las dependencias
```

#### Comandos de Utilidad
```bash
# Verificar estado del servidor
curl http://localhost:3000/api/health

# Ver logs en tiempo real (PowerShell)
Get-Content backend/logs/app.log -Wait -Tail 50

# Limpiar base de datos (Windows)
.\backend\cleanup_db.ps1

# Verificar dependencias
npm audit
npm audit fix
```

### 6. Verificación de Instalación

#### Test de Conectividad
```bash
# Test básico del servidor
curl -X GET http://localhost:3000/api/health

# Test de documentación API
curl -X GET http://localhost:3000/api-docs

# Test de base de datos
curl -X GET http://localhost:3000/api/debug/tables
```

#### Respuesta Esperada del Health Check
```json
{
  "status": "ok",
  "message": "Servidor funcionando correctamente",
  "timestamp": "2025-11-06T10:30:00.000Z",
  "database": "SQLite",
  "features": {
    "authentication": true,
    "tasks": true,
    "qr": true,
    "whatsapp": true,
    "audit": true
  },
  "version": "1.0.0",
  "uptime": 125.456
}
```

## 🔧 Scripts Disponibles

### Scripts de NPM
```json
{
  "dev:server": "nodemon backend/index.js",      // Desarrollo con auto-reload
  "dev:client": "cd client && npm run dev",     // Cliente en desarrollo
  "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"", // Ambos
  "start": "node backend/index.js",             // Producción
  "install:all": "npm install && cd client && npm install", // Instalar todo
  "build": "cd client && npm run build",        // Build del cliente
  "test": "echo \"No tests specified\" && exit 0" // Tests (pendiente)
}
```

### Scripts de Sistema (PowerShell)
```powershell
# Limpiar base de datos
.\backend\cleanup_db.ps1

# Generar backup
.\backend\scripts\backup.ps1

# Verificar logs
.\backend\scripts\check-logs.ps1
```

## 🐛 Troubleshooting

### Problemas Comunes

#### 1. Error: Puerto en Uso
```bash
Error: listen EADDRINUSE: address already in use :::3000
```
**Solución:**
```bash
# Encontrar proceso usando el puerto
netstat -ano | findstr :3000

# Terminar el proceso
taskkill /PID <process_id> /F

# O cambiar el puerto en .env
PORT=3001
```

#### 2. Error de Base de Datos
```bash
Error: SQLITE_CANTOPEN: unable to open database file
```
**Solución:**
```bash
# Verificar permisos de escritura
mkdir -p backend/
touch backend/packing_list.db

# O recrear la base de datos
rm backend/packing_list.db
npm run dev:server
```

#### 3. Error de Dependencias de Canvas
```bash
Error: Canvas dependencies not found
```
**Solución:**
```bash
# Windows
npm install --global windows-build-tools
npm rebuild canvas

# Ubuntu/Debian
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# macOS
xcode-select --install
```

#### 4. Error de WhatsApp API
```bash
Error: WhatsApp API authentication failed
```
**Solución:**
```bash
# Verificar variables de entorno
echo $WHATSAPP_ACCESS_TOKEN
echo $WHATSAPP_PHONE_NUMBER_ID

# Regenerar tokens en Meta Developer Console
# https://developers.facebook.com/apps/
```

## 📋 Siguientes Pasos

Una vez completada la configuración inicial, puedes continuar con:

1. **[Parte 2: Arquitectura y Estructura](./ARCHITECTURE.md)** - Comprende la arquitectura del sistema
2. **[Parte 3: API Endpoints](./API_ENDPOINTS.md)** - Explora todos los endpoints disponibles
3. **[Parte 4: Base de Datos](./DATABASE.md)** - Entiende el modelo de datos

---

## 📞 Soporte

Para reportar bugs o solicitar features:
- **GitHub Issues**: [888Cargo Issues](https://github.com/FiveCGroup/888Cargo-Movil/issues)
- **Email**: soporte@888cargo.com
- **Documentación**: [Documentación Completa](./README.md)

---

*Documentación generada para 888Cargo Backend v1.0.0*
*Última actualización: 6 de noviembre de 2025*