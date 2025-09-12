# 888 Cargo - Aplicación Móvil

Esta es la aplicación móvil de 888 Cargo desarrollada con React Native y Expo, que conecta con el backend existente y mantiene toda la funcionalidad del sistema web.

## 🏗️ Arquitectura

### Estructura del Proyecto
```
888Cargo/
├── app/                       # Rutas y navegación (Expo Router)
│   ├── (tabs)/               # Rutas protegidas
│   │   ├── index.tsx         # Dashboard principal
│   │   ├── cargas.tsx        # Gestión de cargas
│   │   ├── scanner.tsx       # Escáner QR
│   │   └── profile.tsx       # Perfil de usuario
│   ├── login.tsx             # Pantalla de login
│   └── _layout.tsx           # Layout principal
├── components/               # Componentes reutilizables
│   ├── LoginForm.tsx         # Formulario de login
│   └── Dashboard.tsx         # Dashboard principal
├── hooks/                    # Custom hooks
│   └── useAuth.ts           # Hook de autenticación
├── services/                 # Servicios de API
│   ├── api.js               # Cliente HTTP configurado
│   ├── authService.js       # Servicio de autenticación
│   └── cargaService.js      # Servicio de cargas
└── constants/
    └── API.ts               # Configuración de API
```

## 🔐 Sistema de Autenticación

### Flujo de Autenticación
1. **Login**: Usuario ingresa credenciales
2. **Token**: Backend devuelve JWT token
3. **Almacenamiento**: Token se guarda en AsyncStorage y SecureStore
4. **Verificación**: Cada request incluye el token en headers
5. **Navegación**: Rutas protegidas verifican autenticación

### Componentes de Auth
- `AuthService`: Maneja login, logout, registro y verificación
- `useAuth`: Hook para estado de autenticación
- `useAuthState`: Hook simplificado para verificación
- Guards automáticos en rutas protegidas

## 📱 Navegación

### Sistema de Rutas
- **Login** (`/login`): Pantalla pública de acceso
- **Tabs** (`/(tabs)`): Rutas protegidas con navegación por pestañas
  - Dashboard (`/`)
  - Cargas (`/cargas`)
  - Scanner QR (`/scanner`)
  - Perfil (`/profile`)

### Protección de Rutas
- Verificación automática de autenticación
- Redirección a login si no está autenticado
- Loading states durante verificación

## 🔌 Integración con Backend

### API Configuration
```typescript
BASE_URL: 'http://192.168.1.100:3000/api'
ENDPOINTS: {
  AUTH: '/auth',
  CARGAS: '/cargas',
  QR: '/qr'
}
```

### Servicios Implementados
- **AuthService**: Login, registro, logout, verificación de token
- **CargaService**: CRUD de cargas, procesamiento Excel, generación QR
- **API Client**: Configuración centralizada con interceptors

## 🎨 UI/UX

### Componentes Principales
- **LoginForm**: Formulario completo con validación y manejo de errores
- **Dashboard**: Vista principal con estadísticas y acciones rápidas
- **Navigation**: Tabs con iconos y estados activos

### Temas y Estilos
- Esquema de colores consistente
- Componentes responsivos
- Compatibilidad con modo oscuro/claro
- Iconografía con SF Symbols

## 📦 Gestión de Estado

### Hook de Autenticación
```typescript
const {
  isLoading,
  isAuthenticated,
  token,
  user,
  error,
  login,
  logout,
  register,
  resetPassword,
  clearError,
  refresh
} = useAuth();
```

### Estado Local
- React hooks para estado de componentes
- Persistencia automática de tokens
- Sincronización con backend

## 🔧 Configuración

### Dependencias Principales
- **Expo**: Framework y herramientas
- **React Navigation**: Navegación y routing
- **AsyncStorage**: Almacenamiento local
- **SecureStore**: Almacenamiento seguro de tokens
- **FileSystem**: Gestión de archivos
- **Sharing**: Compartir archivos

### Variables de Entorno
- API_BASE_URL: URL del backend
- API_TIMEOUT: Timeout para requests
- DEBUG_MODE: Modo debug para logs

## 🚀 Funcionalidades Implementadas

### ✅ Completadas
- [x] Configuración del proyecto con Expo
- [x] Servicio de autenticación completo
- [x] Sistema de navegación con protección de rutas
- [x] Componente de login con validación
- [x] Dashboard con estadísticas en tiempo real
- [x] Servicios de API para cargas y QR
- [x] Integración con backend existente
- [x] Gestión de tokens y persistencia

### 🔄 En Desarrollo
- [ ] Escáner QR nativo
- [ ] Lista de cargas con filtros
- [ ] Subida de archivos Excel
- [ ] Generación y descarga de PDFs
- [ ] Notificaciones push
- [ ] Modo offline básico

### 📅 Roadmap
- [ ] Componente de registro
- [ ] Recuperación de contraseña
- [ ] Perfil de usuario editable
- [ ] Configuraciones de aplicación
- [ ] Sincronización en background
- [ ] Optimización de rendimiento

## 🔨 Desarrollo

### Comandos Principales
```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npx expo start

# Compilar para Android
npx expo build:android

# Compilar para iOS
npx expo build:ios
```

### Testing
- Unit tests para servicios
- Integration tests para API
- UI tests para componentes críticos

## 📚 Notas de Implementación

### Diferencias con Web App
- Uso de React Native components en lugar de HTML
- FileSystem API en lugar de browser downloads
- SecureStore para almacenamiento sensible
- Navegación con Expo Router

### Compatibilidad Backend
- Endpoints idénticos al cliente web
- Misma autenticación JWT
- Formato de datos consistente
- Mismas validaciones y errores

### Optimizaciones Móviles
- Lazy loading de componentes
- Gestión de memoria eficiente
- Timeouts ajustados para conexiones móviles
- Compresión de imágenes automática

---

## 🔗 Enlaces Importantes

- [Documentación de Expo](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Backend API Documentation](../backend/README.md)
- [Guía de Desarrollo](../DEVELOPMENT_GUIDE.md)

---

**Versión**: 1.0.0  
**Última actualización**: Diciembre 2024  
**Desarrollado por**: Equipo 888 Cargo