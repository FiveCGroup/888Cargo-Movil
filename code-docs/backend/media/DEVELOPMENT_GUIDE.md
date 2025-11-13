# Guías de Desarrollo - 888Cargo MERN

## Tabla de contenidos
1. [Configuración del entorno](#configuración-del-entorno)
2. [Estructura del proyecto](#estructura-del-proyecto)
3. [Estándares de código](#estándares-de-código)
4. [Flujo de trabajo](#flujo-de-trabajo)
5. [Testing](#testing)
6. [Deployment](#deployment)

## Configuración del entorno

### Requisitos previos
- Node.js 18.x o superior
- npm 9.x o superior
- Git

### Instalación inicial
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

# Volver al directorio raíz
cd ..
```

### Variables de entorno
Crear un archivo `.env` en el directorio backend:

```env
# Desarrollo
NODE_ENV=development
PORT=4000
HOST=127.0.0.1

# Base de datos
DB_TYPE=sqlite
DB_PATH=./db/packing_list.db

# JWT
JWT_SECRET=tu_secreto_jwt_muy_seguro

# Uploads
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Features
ENABLE_QR_GENERATION=true
ENABLE_PDF_GENERATION=true
ENABLE_WHATSAPP_RECOVERY=true
ENABLE_AUDIT_LOG=true

# Email (opcional)
EMAIL_ENABLED=false
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_contraseña

# WhatsApp (opcional)
WHATSAPP_ENABLED=true
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_TOKEN=tu_token
```

### Comandos de desarrollo
```bash
# Ejecutar backend y frontend simultáneamente
npm run dev

# Ejecutar solo backend
npm run dev:server

# Ejecutar solo frontend  
npm run dev:client

# Ejecutar en producción
npm start
```

## Estructura del proyecto

```
888Cris-MERN/
├── backend/
│   ├── config/           # Configuraciones
│   │   ├── config.js     # Configuración principal
│   │   └── swagger.config.js
│   ├── controllers/      # Controladores HTTP
│   │   ├── auth.controller.js
│   │   └── qr.controller.js
│   ├── middlewares/      # Middlewares
│   │   ├── validateToken.js
│   │   ├── fileValidation.middleware.js
│   │   └── dataSanitization.middleware.js
│   ├── models/           # Modelos de datos
│   ├── repositories/     # Patrón Repository
│   │   ├── base.repository.js
│   │   ├── user.repository.js
│   │   └── index.js
│   ├── routes/           # Rutas de API
│   │   ├── auth.routes.js
│   │   └── qr.routes.js
│   ├── services/         # Lógica de negocio
│   │   ├── base.service.js
│   │   ├── auth.service.js
│   │   └── qr.service.js
│   ├── utils/            # Utilidades
│   ├── validators/       # Validadores
│   ├── uploads/          # Archivos subidos
│   ├── db/              # Base de datos SQLite
│   ├── app.js           # Configuración Express
│   ├── index.js         # Punto de entrada
│   └── package.json
├── client/              # Frontend React
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── pages/       # Páginas
│   │   ├── services/    # Servicios API
│   │   └── assets/      # Recursos estáticos
│   └── package.json
├── docs/               # Documentación
├── .gitignore
├── README.md
└── package.json
```

## Estándares de código

### Backend (Node.js/Express)

#### Nomenclatura
- **Archivos**: kebab-case (`auth.controller.js`)
- **Clases**: PascalCase (`UserRepository`)
- **Funciones**: camelCase (`getUserById`)
- **Variables**: camelCase (`userId`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)

#### Estructura de controladores
```javascript
// controllers/user.controller.js
import { UserService } from '../services/user.service.js';

/**
 * Obtener usuario por ID
 */
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await UserService.getById(id);
        
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
```

#### Estructura de servicios
```javascript
// services/user.service.js
import { userRepository } from '../repositories/index.js';
import { BaseService } from './base.service.js';

export class UserService extends BaseService {
    static async getById(id) {
        this.validateId(id);
        
        const user = await userRepository.findByIdSafe(id);
        if (!user) {
            throw new Error('Usuario no encontrado');
        }
        
        return user;
    }
}
```

#### Manejo de errores
```javascript
// Siempre usar try-catch en controladores
export const controller = async (req, res) => {
    try {
        // Lógica del controlador
    } catch (error) {
        console.error('Error en operación:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor'
        });
    }
};
```

### Frontend (React)

#### Nomenclatura
- **Componentes**: PascalCase (`UserProfile.jsx`)
- **Hooks**: camelCase con prefijo `use` (`useAuth.js`)
- **Funciones**: camelCase (`handleSubmit`)
- **Variables**: camelCase (`isLoading`)

#### Estructura de componentes
```javascript
// components/UserProfile.jsx
import { useState, useEffect } from 'react';
import { userService } from '../services/user.service.js';

const UserProfile = ({ userId }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                setLoading(true);
                const userData = await userService.getById(userId);
                setUser(userData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchUser();
        }
    }, [userId]);

    if (loading) return <div>Cargando...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!user) return <div>Usuario no encontrado</div>;

    return (
        <div className="user-profile">
            <h2>{user.name}</h2>
            <p>{user.email}</p>
        </div>
    );
};

export default UserProfile;
```

## Flujo de trabajo

### Git Workflow
```bash
# Crear nueva rama para feature
git checkout -b feature/nueva-funcionalidad

# Hacer commits descriptivos
git commit -m "feat: agregar validación de archivos"
git commit -m "fix: corregir error en sanitización"
git commit -m "docs: actualizar guía de desarrollo"

# Push y crear Pull Request
git push origin feature/nueva-funcionalidad
```

### Convenciones de commits
- `feat`: nueva funcionalidad
- `fix`: corrección de bugs
- `docs`: documentación
- `style`: formateo, espacios
- `refactor`: refactorización de código
- `test`: agregar o modificar tests
- `chore`: tareas de mantenimiento

### Proceso de desarrollo
1. **Análisis**: Entender el requerimiento
2. **Diseño**: Planificar la implementación
3. **Desarrollo**: Implementar siguiendo estándares
4. **Testing**: Probar funcionalidad
5. **Documentación**: Actualizar docs y comentarios
6. **Review**: Solicitar revisión de código
7. **Deploy**: Desplegar a ambiente correspondiente

## Testing

### Estructura de tests
```javascript
// tests/services/user.service.test.js
import { UserService } from '../../services/user.service.js';
import { userRepository } from '../../repositories/index.js';

jest.mock('../../repositories/index.js');

describe('UserService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getById', () => {
        it('debe retornar usuario cuando existe', async () => {
            // Arrange
            const userId = 1;
            const mockUser = { id: 1, name: 'Test User' };
            userRepository.findByIdSafe.mockResolvedValue(mockUser);

            // Act
            const result = await UserService.getById(userId);

            // Assert
            expect(result).toEqual(mockUser);
            expect(userRepository.findByIdSafe).toHaveBeenCalledWith(userId);
        });

        it('debe lanzar error cuando usuario no existe', async () => {
            // Arrange
            const userId = 999;
            userRepository.findByIdSafe.mockResolvedValue(null);

            // Act & Assert
            await expect(UserService.getById(userId))
                .rejects.toThrow('Usuario no encontrado');
        });
    });
});
```

### Comandos de testing
```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con coverage
npm run test:coverage

# Ejecutar tests específicos
npm test -- --testNamePattern="UserService"
```

## Deployment

### Preparación para producción
```bash
# 1. Instalar dependencias de producción
npm ci --only=production

# 2. Compilar frontend
cd client && npm run build

# 3. Configurar variables de entorno
cp .env.example .env.production

# 4. Ejecutar migrations si hay
npm run migrate:production
```

### Variables de entorno de producción
```env
NODE_ENV=production
PORT=4000
HOST=0.0.0.0

# Base de datos de producción
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cargo_prod
DB_USER=cargo_user
DB_PASS=contraseña_segura

# JWT con secreto fuerte
JWT_SECRET=secreto_muy_seguro_y_largo_para_produccion

# SSL/HTTPS
HTTPS_ENABLED=true
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/private-key.pem

# Logging
LOG_LEVEL=error
LOG_FILE=/var/log/cargo/app.log
```

### Checklist de producción
- [ ] Variables de entorno configuradas
- [ ] Base de datos migrada
- [ ] SSL/HTTPS habilitado
- [ ] Logging configurado
- [ ] Monitoreo configurado
- [ ] Backup automático configurado
- [ ] Rate limiting habilitado
- [ ] Compression habilitado
- [ ] Security headers configurados

## Mejores prácticas

### Seguridad
- Nunca hardcodear credenciales
- Usar HTTPS en producción
- Validar y sanitizar todas las entradas
- Implementar rate limiting
- Usar headers de seguridad
- Mantener dependencias actualizadas

### Performance
- Usar compresión gzip
- Optimizar consultas de base de datos
- Implementar caching estratégico
- Minimizar y comprimir archivos estáticos
- Usar CDN para recursos públicos

### Mantenimiento
- Mantener documentación actualizada
- Escribir tests para nueva funcionalidad
- Realizar code reviews
- Monitorear logs y métricas
- Realizar backups regulares

## Recursos adicionales

- [Documentación de API (Swagger)](/api-docs)
- [Repositorio en GitHub](https://github.com/FiveCGroup/888Cargo-MERN)
- [Arquitectura del sistema](./ARCHITECTURE.md)
- [Changelog](./CHANGELOG.md)
