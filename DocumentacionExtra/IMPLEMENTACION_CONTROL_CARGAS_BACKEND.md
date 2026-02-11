# Implementación Backend - Módulo Control de Cargas

## Fecha de Implementación
29 de Enero, 2026

## Descripción General

Este documento detalla la implementación completa del módulo **Control de Cargas** en el backend del sistema 888 Cargo. Este módulo permite a los clientes visualizar todas las cargas (packing lists) que han realizado, con capacidades de filtrado y visualización de estados detallados.

## Contexto del Módulo

El módulo "Control de Cargas" es una funcionalidad crítica que permite:
- Visualizar todas las cargas realizadas por un cliente
- Filtrar cargas por estado, ubicación y contenedor
- Ver el historial detallado de estados de cada carga
- Obtener información completa sobre el estado actual y ubicación de las cargas

### Relación de Datos

La relación entre las entidades es:
- **Un cliente puede tener muchas cargas** (relación 1:N)
- **Una carga pertenece a un solo cliente** (relación N:1)
- La relación se establece mediante `carga.id_cliente` → `clientes.id_cliente`
- El cliente se relaciona con el usuario autenticado mediante `clientes.correo_cliente` = `users.email`

## Estructura de la Base de Datos

### Tabla: `clientes`
```sql
CREATE TABLE IF NOT EXISTS clientes (
  id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_cliente TEXT NOT NULL,
  correo_cliente TEXT,
  telefono_cliente TEXT,
  pais_cliente TEXT,
  ciudad_cliente TEXT,
  direccion_entrega TEXT,
  cliente_shippingMark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: `carga`
```sql
CREATE TABLE IF NOT EXISTS carga (
  id_carga INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo_carga TEXT UNIQUE NOT NULL,
  id_cliente INTEGER NOT NULL,
  shipping_mark TEXT,
  estado TEXT DEFAULT 'En bodega China',
  ubicacion_actual TEXT DEFAULT 'China',
  destino TEXT NOT NULL,
  fecha_recepcion DATETIME,
  fecha_envio DATETIME,
  fecha_arribo DATETIME,
  contenedor_asociado TEXT,
  observaciones TEXT,
  gw_total REAL,
  cbm_total REAL,
  total_cajas INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
);
```

### Tabla: `carga_contenedor` (Relación Many-to-Many)
```sql
CREATE TABLE IF NOT EXISTS carga_contenedor (
  id_carga INTEGER,
  id_contenedor INTEGER,
  fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_carga, id_contenedor),
  FOREIGN KEY (id_carga) REFERENCES carga(id_carga) ON DELETE CASCADE,
  FOREIGN KEY (id_contenedor) REFERENCES contenedores(id_contenedor) ON DELETE CASCADE
);
```

### Verificación de Migraciones

Las migraciones existentes ya establecen correctamente:
1. ✅ La relación `FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)` en la tabla `carga`
2. ✅ Los campos necesarios para el módulo: `estado`, `ubicacion_actual`, `destino`, `contenedor_asociado`
3. ✅ Las fechas de seguimiento: `fecha_recepcion`, `fecha_envio`, `fecha_arribo`
4. ✅ La relación con contenedores mediante la tabla `carga_contenedor`

**No se requieren nuevas migraciones** - La estructura de base de datos existente es suficiente para el módulo.

## Arquitectura de la Implementación

La implementación sigue el patrón de arquitectura en capas del proyecto:

```
┌─────────────────────────────────────┐
│      Routes (routes/index.js)       │
│  - Define endpoints HTTP            │
│  - Aplica middlewares (auth)        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Controllers (controlCargas)       │
│  - Valida requests                   │
│  - Maneja respuestas HTTP            │
│  - Gestiona errores                 │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    Services (controlCargas.service) │
│  - Lógica de negocio                │
│  - Consultas complejas              │
│  - Transformación de datos          │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Repositories (carga, clientes)    │
│  - Acceso a base de datos           │
│  - Operaciones CRUD                 │
└─────────────────────────────────────┘
```

## Archivos Creados

### 1. `services/controlCargas.service.js`

Servicio que contiene toda la lógica de negocio para el módulo Control de Cargas.

#### Funciones Principales:

**`obtenerClientePorEmail(userEmail)`**
- Obtiene el cliente asociado a un usuario autenticado mediante su email
- Utiliza la relación: `clientes.correo_cliente` = `users.email`
- Retorna el objeto cliente completo o null

**`obtenerCargasCliente(clienteId, filtros)`**
- Obtiene todas las cargas de un cliente con filtros opcionales
- Filtros soportados:
  - `estado`: Filtra por estado de la carga (ej: "En bodega China", "En tránsito")
  - `ubicacion`: Filtra por ubicación actual (ej: "China", "Medellín")
  - `contenedor`: Filtra por contenedor asociado (busca en `contenedor_asociado` y tabla `carga_contenedor`)
- Retorna array de cargas con información completa
- Ordena por fecha de creación descendente (más recientes primero)

**`obtenerEstadosCarga(cargaId, clienteId)`**
- Obtiene el historial completo de estados de una carga específica
- Valida que la carga pertenezca al cliente (seguridad)
- Construye historial de estados basado en fechas:
  - `fecha_recepcion` → Estado "En bodega China"
  - `fecha_envio` → Estado "En tránsito"
  - `fecha_arribo` → Estado "En despacho"
- Incluye estadísticas: total artículos, cajas, QRs, peso, volumen
- Incluye información del contenedor si existe
- Retorna objeto con `carga` (info completa) y `historial_estados` (array ordenado)

**`obtenerOpcionesFiltros(clienteId)`**
- Obtiene las opciones disponibles para los filtros del cliente
- Retorna:
  - `estados`: Lista de estados únicos de las cargas del cliente
  - `ubicaciones`: Lista de ubicaciones únicas
  - `contenedores`: Lista de contenedores únicos asociados

### 2. `controllers/controlCargas.controller.js`

Controlador que maneja las peticiones HTTP y respuestas.

#### Endpoints Implementados:

**`listarCargasCliente`**
- **Ruta**: `GET /control-cargas/cargas`
- **Autenticación**: Requerida (`authRequired`)
- **Query Params Opcionales**:
  - `?estado=En%20bodega`
  - `?ubicacion=China`
  - `?contenedor=CONT123`
- **Respuesta**:
```json
{
  "success": true,
  "data": [
    {
      "id_carga": 1,
      "codigo_carga": "888DFF",
      "shipping_mark": "SWOITO29",
      "estado": "En bodega",
      "ubicacion": "China",
      "destino": "Medellin",
      "contenedor_asociado": null,
      "fecha_recepcion": "2026-01-15T10:00:00",
      "fecha_envio": null,
      "fecha_arribo": null,
      "gw_total": 1500.5,
      "cbm_total": 25.3,
      "total_cajas": 50,
      "created_at": "2026-01-15T10:00:00",
      "updated_at": "2026-01-15T10:00:00",
      "nombre_cliente": "Cliente Ejemplo"
    }
  ],
  "total": 1,
  "filtros_aplicados": {
    "estado": "En bodega"
  },
  "cliente": {
    "id_cliente": 1,
    "nombre_cliente": "Cliente Ejemplo"
  }
}
```

**`obtenerCargaPorId`**
- **Ruta**: `GET /control-cargas/carga/:id`
- **Autenticación**: Requerida
- **Parámetros**: `id` (ID de la carga)
- **Validación**: Verifica que la carga pertenezca al cliente autenticado
- **Respuesta**: Objeto con información completa de la carga

**`obtenerEstadosCargaDetallados`**
- **Ruta**: `GET /control-cargas/carga/:id/estados`
- **Autenticación**: Requerida
- **Parámetros**: `id` (ID de la carga)
- **Respuesta**:
```json
{
  "success": true,
  "data": {
    "carga": {
      "id_carga": 1,
      "codigo_carga": "888DFF",
      "shipping_mark": "SWOITO29",
      "estado_actual": "En bodega",
      "ubicacion_actual": "China",
      "destino": "Medellin",
      "contenedor_asociado": null,
      "numero_contenedor": null,
      "estado_contenedor": null,
      "fechas": {
        "recepcion": "2026-01-15T10:00:00",
        "envio": null,
        "arribo": null
      },
      "estadisticas": {
        "total_articulos": 25,
        "total_cajas": 50,
        "total_qrs": 50,
        "qrs_escaneados": 0,
        "peso_total": 1500.5,
        "volumen_total": 25.3
      },
      "cliente": {
        "nombre": "Cliente Ejemplo",
        "correo": "cliente@example.com",
        "telefono": "+57 300 123 4567"
      }
    },
    "historial_estados": [
      {
        "estado": "En bodega China",
        "fecha": "2026-01-15T10:00:00",
        "ubicacion": "China",
        "descripcion": "Carga recibida en bodega de origen"
      }
    ]
  }
}
```

**`obtenerOpcionesFiltrosDisponibles`**
- **Ruta**: `GET /control-cargas/filtros/opciones`
- **Autenticación**: Requerida
- **Respuesta**:
```json
{
  "success": true,
  "data": {
    "estados": ["En bodega China", "En tránsito", "En despacho", "Entregada"],
    "ubicaciones": ["China", "Medellín", "Bogotá"],
    "contenedores": ["CONT-001", "CONT-002"]
  }
}
```

### 3. Modificaciones en `routes/index.js`

Se agregaron las siguientes rutas:

```javascript
// RUTAS CONTROL DE CARGAS (Módulo Control de Cargas)
router.get('/control-cargas/cargas', authRequired, listarCargasCliente);
router.get('/control-cargas/carga/:id', authRequired, obtenerCargaControlCargas);
router.get('/control-cargas/carga/:id/estados', authRequired, obtenerEstadosCargaDetallados);
router.get('/control-cargas/filtros/opciones', authRequired, obtenerOpcionesFiltrosDisponibles);
```

## Flujo de Autenticación y Autorización

1. **Usuario se autentica** → Recibe token JWT
2. **Request con token** → Middleware `authRequired` valida token
3. **Extracción de email** → `req.user.email` contiene el email del usuario
4. **Búsqueda de cliente** → Se busca cliente con `correo_cliente = email`
5. **Validación de acceso** → Todas las operaciones verifican que la carga pertenezca al cliente

### Seguridad Implementada

- ✅ Todas las rutas requieren autenticación (`authRequired`)
- ✅ Validación de pertenencia de carga al cliente
- ✅ Manejo de errores con mensajes apropiados
- ✅ Validación de parámetros (IDs numéricos, etc.)

## Consultas SQL Implementadas

### Consulta Principal: Obtener Cargas con Filtros

```sql
SELECT 
  c.id_carga,
  c.codigo_carga,
  c.shipping_mark,
  c.estado,
  c.ubicacion_actual as ubicacion,
  c.destino,
  c.contenedor_asociado,
  c.fecha_recepcion,
  c.fecha_envio,
  c.fecha_arribo,
  c.gw_total,
  c.cbm_total,
  c.total_cajas,
  c.created_at,
  c.updated_at,
  cl.nombre_cliente
FROM carga c
LEFT JOIN clientes cl ON c.id_cliente = cl.id_cliente
WHERE c.id_cliente = ?
  AND c.estado = ?  -- Si se proporciona filtro
  AND c.ubicacion_actual = ?  -- Si se proporciona filtro
ORDER BY c.created_at DESC
```

### Consulta: Estados Detallados con Estadísticas

```sql
SELECT 
  c.*,
  cl.nombre_cliente,
  cl.correo_cliente,
  cl.telefono_cliente,
  cont.numero_contenedor,
  cont.estado as estado_contenedor,
  COUNT(DISTINCT a.id_articulo) as total_articulos,
  COUNT(DISTINCT ca.id_caja) as total_cajas_real,
  COUNT(DISTINCT q.id_qr) as total_qrs,
  COUNT(DISTINCT CASE WHEN q.estado = 'escaneado' THEN q.id_qr END) as qrs_escaneados
FROM carga c
LEFT JOIN clientes cl ON c.id_cliente = cl.id_cliente
LEFT JOIN carga_contenedor cc ON c.id_carga = cc.id_carga
LEFT JOIN contenedores cont ON cc.id_contenedor = cont.id_contenedor
LEFT JOIN articulo_packing_list a ON c.id_carga = a.id_carga
LEFT JOIN caja ca ON a.id_articulo = ca.id_articulo
LEFT JOIN qr q ON ca.id_caja = q.id_caja
WHERE c.id_carga = ?
GROUP BY c.id_carga
```

## Manejo de Errores

El módulo implementa manejo de errores robusto:

1. **Errores de Autenticación** (401):
   - Usuario no autenticado
   - Token inválido o expirado

2. **Errores de Autorización** (404):
   - Cliente no encontrado
   - Carga no encontrada
   - Acceso denegado (carga no pertenece al cliente)

3. **Errores de Validación** (400):
   - ID de carga inválido
   - Parámetros faltantes

4. **Errores del Servidor** (500):
   - Errores de base de datos
   - Errores inesperados

Todos los errores retornan formato consistente:
```json
{
  "success": false,
  "message": "Mensaje descriptivo del error"
}
```

## Pruebas Recomendadas

### Pruebas Unitarias (Pendientes)

1. **Servicio `controlCargas.service.js`**:
   - `obtenerClientePorEmail`: Cliente existente, cliente no existente
   - `obtenerCargasCliente`: Sin filtros, con cada filtro individual, con múltiples filtros
   - `obtenerEstadosCarga`: Carga con historial completo, carga sin fechas, validación de acceso
   - `obtenerOpcionesFiltros`: Cliente con cargas, cliente sin cargas

2. **Controlador `controlCargas.controller.js`**:
   - Autenticación requerida
   - Validación de parámetros
   - Manejo de errores
   - Respuestas correctas

### Pruebas de Integración

1. **Flujo completo**:
   - Usuario autenticado → Obtener cargas → Filtrar → Ver estados detallados

2. **Casos límite**:
   - Cliente sin cargas
   - Carga sin contenedor
   - Carga sin fechas de seguimiento
   - Filtros que no retornan resultados

## Consideraciones de Rendimiento

1. **Índices Recomendados** (si no existen):
   ```sql
   CREATE INDEX idx_carga_cliente ON carga(id_cliente);
   CREATE INDEX idx_carga_estado ON carga(estado);
   CREATE INDEX idx_carga_ubicacion ON carga(ubicacion_actual);
   CREATE INDEX idx_carga_contenedor ON carga(contenedor_asociado);
   ```

2. **Optimizaciones**:
   - Las consultas usan `LEFT JOIN` para evitar pérdida de datos
   - Se agrupan resultados cuando es necesario
   - Se ordenan resultados en la base de datos (más eficiente)

3. **Paginación** (Futuro):
   - Para clientes con muchas cargas, considerar implementar paginación
   - Agregar parámetros `page` y `limit` en `listarCargasCliente`

## Próximos Pasos (Frontend)

Una vez completado el backend, el frontend debe:

1. **Crear componente de lista de cargas**:
   - Mostrar tabla con columnas: Id Carga, Shipping Mark, Estado, Ubicación, Destino
   - Implementar filtros (dropdowns para Estado, Ubicación, Contenedor)
   - Botón "Estados de cargas" para cada fila

2. **Crear componente de estados detallados**:
   - Mostrar historial de estados con fechas
   - Mostrar estadísticas de la carga
   - Mostrar información del contenedor si existe

3. **Integración con API**:
   - Llamar a `/control-cargas/cargas` para obtener lista
   - Llamar a `/control-cargas/carga/:id/estados` para ver detalles
   - Llamar a `/control-cargas/filtros/opciones` para poblar filtros

## Resumen de Endpoints

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| GET | `/control-cargas/cargas` | Lista todas las cargas del cliente con filtros opcionales | ✅ |
| GET | `/control-cargas/carga/:id` | Obtiene información de una carga específica | ✅ |
| GET | `/control-cargas/carga/:id/estados` | Obtiene historial detallado de estados de una carga | ✅ |
| GET | `/control-cargas/filtros/opciones` | Obtiene opciones disponibles para los filtros | ✅ |

## Conclusión

La implementación del backend para el módulo "Control de Cargas" está completa y lista para ser consumida por el frontend. El módulo:

- ✅ Respeta la arquitectura existente del proyecto
- ✅ Implementa seguridad y validaciones apropiadas
- ✅ Utiliza correctamente las relaciones de base de datos existentes
- ✅ Proporciona endpoints RESTful bien estructurados
- ✅ Incluye manejo de errores robusto
- ✅ Está documentado y listo para pruebas

El siguiente paso es implementar el frontend móvil que consuma estos endpoints para mostrar la interfaz de usuario según el diseño proporcionado.
