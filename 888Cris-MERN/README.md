# 888Cargo - Sistema Web de Gestión de Listas de Empaque

## 📋 Descripción

Sistema web completo MERN (SQLite, Express.js, React.js, Node.js) para la gestión de listas de empaque con generación automática de códigos QR, autenticación de usuarios y gestión segura de archivos.

## ✨ Características principales

### 🔐 Sistema de Autenticación
- Registro y login de usuarios
- Autenticación JWT con refresh tokens
- Validación y sanitización de datos
- Control de acceso basado en roles

### 📦 Gestión de Listas de Empaque
- CRUD completo de listas de empaque
- Generación automática de códigos QR
- Gestión de archivos con validación avanzada
- Procesamiento de archivos Excel

### 🛡️ Seguridad Avanzada
- Validación de tipos de archivos por magic numbers
- Sanitización automática de datos de entrada
- Protección contra inyección SQL y XSS
- Rate limiting configurable

## 🚀 Instalación y configuración

### Requisitos previos
- Node.js 18.x o superior
- npm 9.x o superior

### Instalación
```bash
# Clonar el repositorio
git clone https://github.com/FiveCGroup/888Cargo-MERN.git
cd 888Cargo-MERN

# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../client
npm install
```

### Configuración
Crear archivo `.env` en el directorio backend:

```env
NODE_ENV=development
PORT=3000
DATABASE_PATH=../db/packing_list.db
TOKEN_SECRET=tu_secreto_jwt_muy_seguro
UPLOAD_PATH=./uploads
```

### Ejecutar la aplicación
```bash
# Backend (desde carpeta backend)
npm start

# Frontend (desde carpeta client)  
npm run dev
```

## 📖 Documentación

- [📘 Guía de Desarrollo](./docs/DEVELOPMENT_GUIDE.md)

## 🏗️ Arquitectura del sistema

### Backend (Node.js/Express)
```
backend/
├── config/              # Configuraciones del sistema
├── controllers/         # Controladores HTTP
├── middlewares/         # Middlewares personalizados
├── models/             # Modelos de datos
├── repositories/       # Acceso a datos
├── routes/             # Rutas de API
├── services/           # Lógica de negocio
└── utils/              # Utilidades
```

### Frontend (React.js/Vite)
```
client/src/
├── components/         # Componentes reutilizables
├── pages/             # Páginas principales
├── services/          # Servicios para comunicación con API
├── hooks/             # Custom hooks
└── utils/             # Utilidades del frontend
```

## 🔧 Tecnologías utilizadas

### Backend
- **Node.js**: Runtime de JavaScript
- **Express.js**: Framework web
- **SQLite**: Base de datos
- **JWT**: Autenticación
- **Multer**: Manejo de archivos
- **QRCode**: Generación de códigos QR

### Frontend
- **React.js**: Library de UI
- **Vite**: Build tool
- **React Router**: Enrutamiento
- **Axios**: Cliente HTTP

## 📊 Endpoints principales de API

### Autenticación
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/register` - Registro de usuario
- `GET /api/auth/verify-token` - Verificar token

### Cargas
- `GET /api/carga` - Obtener cargas
- `POST /api/carga/procesar-excel` - Procesar archivo Excel
- `POST /api/carga/guardar-con-qr` - Guardar con códigos QR

### QR Codes
- `GET /api/qr/pdf-carga/:id` - PDF con códigos QR
- `POST /api/qr/validate-scanned` - Validar QR escaneado

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👥 Equipo

- **Desarrollador**: FiveCGroup
- **Tecnologías**: MERN Stack
- **Contacto**: [GitHub](https://github.com/FiveCGroup)

---

**¡Sistema web 888Cargo listo para usar!** 🚀
