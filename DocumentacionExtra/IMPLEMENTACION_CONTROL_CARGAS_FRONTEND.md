# Implementación Frontend - Módulo Control de Cargas

## Fecha de Implementación
29 de Enero, 2026

## Descripción General

Este documento detalla la implementación completa del módulo **Control de Cargas** en el frontend web (React) del sistema 888 Cargo. Este módulo permite a los clientes visualizar todas sus cargas (packing lists) con capacidades de filtrado y visualización de estados detallados.

## Contexto del Módulo

El módulo "Control de Cargas" es la interfaz web que consume los endpoints del backend para:
- Visualizar todas las cargas realizadas por un cliente
- Filtrar cargas por estado, ubicación y contenedor
- Ver el historial detallado de estados de cada carga
- Obtener información completa sobre el estado actual y ubicación de las cargas

## Arquitectura de la Implementación

La implementación sigue la arquitectura del proyecto frontend:

```
┌─────────────────────────────────────┐
│      Pages (ControlCargas.jsx)      │
│  - Componente principal              │
│  - Manejo de estado                 │
│  - Lógica de UI                     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Services (controlCargasService)   │
│  - Llamadas a API                   │
│  - Manejo de respuestas             │
│  - Manejo de errores                │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   API (api.js)                      │
│  - Configuración axios              │
│  - Interceptores                    │
│  - Autenticación                    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Backend API                       │
│  - Endpoints REST                   │
└─────────────────────────────────────┘
```

## Archivos Creados

### 1. `services/controlCargasService.js`

Servicio que encapsula todas las llamadas al backend para el módulo Control de Cargas.

#### Métodos Implementados:

**`obtenerCargas(filtros)`**
- Obtiene todas las cargas del cliente autenticado con filtros opcionales
- Parámetros: `{ estado, ubicacion, contenedor }`
- Retorna: Promesa que resuelve con la respuesta del backend
- Endpoint: `GET /control-cargas/cargas?estado=...&ubicacion=...&contenedor=...`

**`obtenerCargaPorId(cargaId)`**
- Obtiene información de una carga específica
- Parámetros: `cargaId` (número)
- Retorna: Promesa con información de la carga
- Endpoint: `GET /control-cargas/carga/:id`

**`obtenerEstadosCarga(cargaId)`**
- Obtiene estados detallados de una carga (historial completo)
- Parámetros: `cargaId` (número)
- Retorna: Promesa con historial de estados
- Endpoint: `GET /control-cargas/carga/:id/estados`

**`obtenerOpcionesFiltros()`**
- Obtiene opciones disponibles para los filtros
- Retorna: Promesa con `{ estados: [], ubicaciones: [], contenedores: [] }`
- Endpoint: `GET /control-cargas/filtros/opciones`

#### Estructura del Servicio:

```javascript
class ControlCargasService {
  async obtenerCargas(filtros = {}) {
    // Construye query params dinámicamente
    // Llama a API.get()
    // Retorna response.data directamente
  }
  
  // Similar para otros métodos
}

export default new ControlCargasService();
```

**Nota importante**: El servicio retorna directamente `response.data` porque el backend ya envuelve las respuestas en `{ success: true, data: ... }`. Esto evita doble anidación.

### 2. `pages/ControlCargas.jsx`

Componente principal del módulo que renderiza la interfaz completa.

#### Estado del Componente:

```javascript
const [user, setUser] = useState(null);              // Usuario autenticado
const [cargas, setCargas] = useState([]);            // Lista de cargas
const [loading, setLoading] = useState(true);        // Estado de carga
const [filtros, setFiltros] = useState({             // Filtros activos
  estado: '',
  ubicacion: '',
  contenedor: ''
});
const [opcionesFiltros, setOpcionesFiltros] = useState({ // Opciones para filtros
  estados: [],
  ubicaciones: [],
  contenedores: []
});
const [modalTipo, setModalTipo] = useState(null);       // 'estados' | 'detalles'
const [cargaSeleccionada, setCargaSeleccionada] = useState(null);
const [datosModal, setDatosModal] = useState(null);     // Datos para el modal abierto
const [loadingModal, setLoadingModal] = useState(false);
```

#### Funciones Principales:

**`cargarCargas()`**
- Función envuelta en `useCallback` para evitar re-renders innecesarios
- Aplica filtros antes de hacer la llamada
- Maneja estados de carga y errores
- Actualiza el estado `cargas`

**`handleFiltroChange(campo, valor)`**
- Actualiza el estado de filtros
- Los cambios en filtros disparan automáticamente `cargarCargas()` mediante `useEffect`

**`verEstadosCarga(carga)`**
- Abre el modal **"Estado de cargas"** (solo timeline de estados)
- Carga historial de estados vía `obtenerEstadosCarga(cargaId)`
- Muestra únicamente: etiqueta, badge del estado actual, timeline cronológico

**`verDetallesCarga(carga)`**
- Abre el modal **"Ver detalles"** (información completa de la carga)
- Usa el mismo endpoint `obtenerEstadosCarga` para obtener datos
- Muestra: información de carga, estadísticas, packing list completo (sin datos de cliente)

**`cerrarModal()`**
- Cierra el modal activo y resetea estado asociado

**`formatearFecha(fecha)`**
- Formatea fechas a dd-mm-yyyy para la UI

**`limpiarFiltros()`**
- Resetea todos los filtros a valores vacíos
- Dispara recarga automática de cargas

#### Estructura del Componente:

1. **Header con Navbar**: Muestra la barra de navegación con el usuario
2. **Título**: "Control de Cargas"
3. **Botones de Acción**:
   - "→ Cargar Packing List" (navega a `/crear-carga`)
4. **Filtros**: Tres dropdowns (Estado, Ubicación, Contenedor) con botón "Limpiar filtros"
5. **Tabla de Cargas**: Muestra las cargas con columnas:
   - Id Carga
   - Shipping Mark
   - Estado (con badge de color)
   - Ubicación
   - Destino
   - Acciones (botón "Ver detalles")
6. **Fila de Estados**: Cada carga tiene una fila adicional con botón "→ Estados de cargas"
8. **Modal "Estado de cargas"** (al hacer clic en "→ Estados de cargas"): Muestra **solo** el timeline de estados:
   - Título: "Estado de cargas"
   - Etiqueta: "Etiqueta #[codigo_carga o shipping_mark]"
   - Badge del estado actual con icono de check
   - Timeline vertical con historial de estados y fechas (sin detalles de la carga)
9. **Modal "Ver detalles"** (al hacer clic en "Ver detalles"): Muestra información completa:
   - Información de la carga (código, shipping mark, estado, ubicación, destino, contenedor)
   - Estadísticas: Artículos, Cajas, Peso Total (sin volumen, CBM ni QRs)
   - Packing List completo con tabla de artículos y detalle de cajas (solo Caja X/Y)

#### Hooks Utilizados:

**`useEffect` para cargar perfil del usuario:**
```javascript
useEffect(() => {
  const fetchUser = async () => {
    try {
      const response = await API.get('/profile');
      setUser(response.data?.user || response.data);
    } catch (error) {
      console.error('Error al obtener perfil:', error);
    }
  };
  fetchUser();
}, []);
```

**`useEffect` para cargar opciones de filtros:**
```javascript
useEffect(() => {
  const cargarOpcionesFiltros = async () => {
    // Carga opciones una sola vez al montar el componente
  };
  cargarOpcionesFiltros();
}, []);
```

**`useEffect` para cargar cargas cuando cambian los filtros:**
```javascript
useEffect(() => {
  cargarCargas();
}, [cargarCargas]); // cargarCargas está en useCallback con dependencia [filtros]
```

### 3. `styles/pages/ControlCargas.css`

Estilos CSS para el módulo Control de Cargas.

#### Secciones de Estilos:

**Layout Principal:**
- `.control-cargas-layout`: Contenedor principal con fondo gris claro
- `.control-cargas-container`: Contenedor con ancho máximo y padding

**Botones de Acción:**
- `.control-cargas-actions`: Flexbox para botones horizontales
- `.btn-primary`: Botón principal (azul oscuro)
- `.btn-secondary`: Botón secundario (gris)
- `.btn-link`: Botón tipo enlace

**Filtros:**
- `.control-cargas-filtros`: Contenedor de filtros con fondo blanco y sombra
- `.filtro-group`: Grupo individual de filtro (label + select)
- Estilos para selects con bordes y padding

**Tabla:**
- `.control-cargas-tabla-container`: Contenedor con scroll horizontal
- `.control-cargas-tabla`: Tabla con estilos de borde
- `.estados-row`: Fila adicional para botón de estados (fondo gris claro)
- Hover effects en filas

**Badges de Estado:**
- `.estado-badge`: Badge base con bordes redondeados
- Variantes por estado:
  - `.estado-en-bodega-china`: Amarillo
  - `.estado-en-tránsito`: Azul claro
  - `.estado-en-despacho`: Azul
  - `.estado-entregada`: Verde

**Modal:**
- `.modal-overlay`: Overlay oscuro con posición fija
- `.modal-content`: Contenedor del modal con scroll
- `.modal-header`: Header con título y botón cerrar
- `.modal-body`: Cuerpo del modal con padding
- `.modal-footer`: Footer con botones

**Información de Carga:**
- `.estados-info-carga`: Sección de información
- `.info-grid`: Grid responsive para items de información
- `.info-item`: Item individual con fondo gris claro

**Estadísticas:**
- `.estados-estadisticas`: Sección de estadísticas
- `.stats-grid`: Grid para estadísticas
- `.stat-item`: Item de estadística con fondo azul claro

**Modal "Estado de cargas" (timeline):**
- `.modal-estados`: Modal con ancho máximo 560px
- `.estados-etiqueta`: Etiqueta (ej. "Etiqueta #888DFF")
- `.estados-badge-actual`: Badge del estado actual + icono check
- `.estado-check`: Icono de check verde
- `.estados-timeline`: Contenedor con línea vertical (::before azul)
- `.estados-timeline-item`: Cada item del historial
- `.estados-timeline-node`: Círculo azul indicador
- `.estados-timeline-estado` / `.estados-timeline-fecha`: Texto
- `.estados-sin-historial`: Mensaje cuando no hay historial

**Packing List:**
- `.estados-packing-list`: Sección del packing list
- `.packing-list-scroll`: Contenedor con scroll horizontal/vertical (max-height 400px)
- `.packing-list-tabla`: Tabla de artículos
- `.packing-cajas-row`: Fila de detalle de cajas por artículo
- `.packing-cajas-detalle`: Contenedor flex para badges de cajas
- `.caja-badge`: Badge "Caja X/Y" (fondo azul claro)

**Historial (referencia anterior):**
- `.estados-historial`: Sección de historial
- `.historial-timeline`: Timeline visual con línea vertical
- `.historial-item`: Item del historial con punto indicador
- `.historial-fecha`: Fecha formateada
- `.historial-contenido`: Contenido con fondo gris claro

#### Características de Diseño:

- **Responsive**: Grids y flexbox para adaptarse a diferentes tamaños de pantalla
- **Colores**: Paleta consistente con el resto de la aplicación
- **Espaciado**: Padding y margins consistentes
- **Tipografía**: Tamaños de fuente escalados apropiadamente
- **Interactividad**: Hover effects y transiciones suaves

### 4. Modificaciones en Archivos Existentes

#### `App.jsx`

**Agregado:**
```javascript
import ControlCargas from './pages/ControlCargas.jsx';

// En las rutas protegidas:
<Route path="/control-cargas" element={<ControlCargas />} />
```

#### `components/Dashboard.jsx`

**Modificado:**
```javascript
// Antes:
<div className="dashboard-card" /*onClick={goToCrearCarga}*/>

// Después:
<div className="dashboard-card" onClick={() => navigate("/control-cargas")}>
```

El card "Control de carga" ahora navega correctamente a `/control-cargas`.

## Flujo de Datos

### 1. Carga Inicial de la Página

```
Usuario navega a /control-cargas
    ↓
Componente se monta
    ↓
useEffect: Cargar perfil del usuario
    ↓
useEffect: Cargar opciones de filtros
    ↓
useEffect: Cargar cargas (sin filtros)
    ↓
Renderizar tabla con cargas
```

### 2. Aplicar Filtros

```
Usuario selecciona filtro (ej: Estado = "En bodega")
    ↓
handleFiltroChange actualiza estado filtros
    ↓
useEffect detecta cambio en filtros
    ↓
cargarCargas() se ejecuta con nuevos filtros
    ↓
Llamada a API con query params
    ↓
Actualizar estado cargas con resultados filtrados
    ↓
Re-renderizar tabla
```

### 3. Ver Estados de Cargas (Modal "Estado de cargas")

```
Usuario hace clic en "→ Estados de cargas"
    ↓
verEstadosCarga(carga) se ejecuta
    ↓
setModalTipo('estados'), setCargaSeleccionada(carga)
    ↓
Llamada a API: obtenerEstadosCarga(cargaId)
    ↓
Actualizar datosModal con { carga, historial_estados }
    ↓
Renderizar modal con SOLO:
    - Etiqueta #codigo
    - Badge estado actual + check
    - Timeline de historial_estados (estado + fecha)
```

### 4. Ver Detalles (Modal "Ver detalles")

```
Usuario hace clic en "Ver detalles"
    ↓
verDetallesCarga(carga) se ejecuta
    ↓
setModalTipo('detalles'), setCargaSeleccionada(carga)
    ↓
Llamada a API: obtenerEstadosCarga(cargaId)
    ↓
Actualizar datosModal con { carga, historial_estados, packing_list }
    ↓
Renderizar modal con:
    - Información de carga (sin datos de cliente)
    - Estadísticas: Artículos, Cajas, Peso Total
    - Packing List completo (artículos + cajas Caja X/Y)
```

## Manejo de Errores

### Errores de Red

El servicio lanza excepciones que son capturadas en el componente:

```javascript
try {
  const result = await controlCargasService.obtenerCargas(filtrosAplicar);
  // Procesar resultado
} catch (error) {
  console.error('Error al cargar cargas:', error);
  setCargas([]); // Mostrar lista vacía
}
```

### Errores de Autenticación

Si el token expira o es inválido, el interceptor de API en `api.js` maneja el error. El componente muestra un estado vacío o mensaje de error.

### Validación de Datos

- Se valida que `result.success` sea `true` antes de procesar datos
- Se valida que los arrays sean realmente arrays antes de mapear
- Se usan valores por defecto para evitar errores de acceso a propiedades undefined

## Integración con Backend

### Endpoints Consumidos

| Método | Endpoint | Uso |
|--------|----------|-----|
| GET | `/control-cargas/cargas` | Lista de cargas con filtros |
| GET | `/control-cargas/carga/:id` | Información de una carga |
| GET | `/control-cargas/carga/:id/estados` | Estados detallados |
| GET | `/control-cargas/filtros/opciones` | Opciones para filtros |
| GET | `/profile` | Perfil del usuario (para Navbar) |

### Estructura de Respuestas Esperadas

**Lista de Cargas:**
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
      ...
    }
  ],
  "total": 1
}
```

**Estados Detallados (usado por ambos modales):**
```json
{
  "success": true,
  "data": {
    "carga": {
      "id_carga": 1,
      "codigo_carga": "888DFF",
      "estado_actual": "En bodega",
      "ubicacion_actual": "China",
      "destino": "Medellín",
      "estadisticas": {
        "total_articulos": 25,
        "total_cajas": 50,
        "peso_total": 1500
      }
    },
    "historial_estados": [
      {
        "estado": "En bodega China",
        "fecha": "2026-01-15T10:00:00",
        "ubicacion": "China",
        "descripcion": "Carga recibida en bodega de origen"
      }
    ],
    "packing_list": [
      {
        "id_articulo": 1,
        "cn": "...",
        "ref_art": "...",
        "descripcion_espanol": "...",
        "descripcion_chino": "...",
        "unidad": "...",
        "cantidad": 150,
        "cant_por_caja": 50,
        "precio_unidad": 10,
        "precio_total": 1500,
        "material": "...",
        "marca_producto": "...",
        "cbm": 0.5,
        "gw": 30,
        "cajas": [
          { "id_caja": 1, "numero_caja": 1, "total_cajas": 3, "cantidad_en_caja": 50, "cbm": 0.106, "gw": 10 },
          { "id_caja": 2, "numero_caja": 2, "total_cajas": 3, "cantidad_en_caja": 50, "cbm": 0.106, "gw": 10 },
          { "id_caja": 3, "numero_caja": 3, "total_cajas": 3, "cantidad_en_caja": 50, "cbm": 0.106, "gw": 10 }
        ]
      }
    ]
  }
}
```

**Opciones de Filtros:**
```json
{
  "success": true,
  "data": {
    "estados": ["En bodega China", "En tránsito", ...],
    "ubicaciones": ["China", "Medellín", ...],
    "contenedores": ["CONT-001", "CONT-002", ...]
  }
}
```

## Optimizaciones Implementadas

### 1. useCallback para cargarCargas

Evita recrear la función en cada render y permite usarla como dependencia en `useEffect`:

```javascript
const cargarCargas = React.useCallback(async () => {
  // ...
}, [filtros]);
```

### 2. Carga Lazy de Estados

Los estados detallados solo se cargan cuando el usuario hace clic en "Ver detalles", no al cargar la página.

### 3. Validación de Datos

Se valida que los datos sean del tipo esperado antes de renderizar:

```javascript
if (result && result.success && Array.isArray(result.data)) {
  setCargas(result.data);
}
```

### 4. Manejo de Estados Vacíos

Se muestran mensajes apropiados cuando:
- No hay cargas
- No hay cargas con los filtros aplicados
- No se pueden cargar los datos

## Pruebas Recomendadas

### Pruebas Manuales

1. **Carga Inicial**:
   - Navegar a `/control-cargas`
   - Verificar que se carguen las cargas
   - Verificar que se carguen las opciones de filtros

2. **Filtros**:
   - Aplicar filtro por estado
   - Aplicar filtro por ubicación
   - Aplicar filtro por contenedor
   - Aplicar múltiples filtros
   - Limpiar filtros

3. **Modal "Estado de cargas"**:
   - Hacer clic en "→ Estados de cargas"
   - Verificar que se abra el modal con solo timeline
   - Verificar etiqueta, badge actual y historial de estados
   - Cerrar el modal

4. **Modal "Ver detalles"**:
   - Hacer clic en "Ver detalles"
   - Verificar información de carga, estadísticas y packing list
   - Verificar que las cajas muestren correctamente "Caja X/Y" (ej. 1/3, 2/3, 3/3)
   - Verificar que no se muestre información del cliente
   - Cerrar el modal

5. **Navegación**:
   - Hacer clic en "Cargar Packing List" (debe navegar a `/crear-carga`)

6. **Errores**:
   - Simular error de red (desconectar internet)
   - Verificar que se muestre mensaje apropiado
   - Verificar que no se rompa la aplicación

### Casos Límite

1. **Cliente sin cargas**: Debe mostrar mensaje "No se encontraron cargas"
2. **Filtros sin resultados**: Debe mostrar mensaje apropiado
3. **Carga sin historial**: Debe mostrar "No hay historial de estados disponible" en el modal de Estados
4. **Carga sin packing list**: Si `packing_list` está vacío, no se muestra la sección de Packing List
5. **Artículo sin cajas**: Si un artículo no tiene cajas, no se muestra la fila de detalle "Cajas:"
6. **Datos incompletos**: Debe manejar campos opcionales con valores por defecto (guion "-")

## Mejoras Futuras (Opcionales)

1. **Paginación**: Para clientes con muchas cargas
2. **Búsqueda**: Por código de carga o shipping mark
3. **Ordenamiento**: Por fecha, estado, etc.
4. **Exportar**: Exportar lista de cargas a Excel/PDF
5. **Notificaciones**: Notificar cambios de estado en tiempo real
6. **Gráficos**: Visualización de estadísticas de cargas
7. **Filtros avanzados**: Por rango de fechas, peso, volumen, etc.

## Dependencias

El módulo utiliza las siguientes dependencias del proyecto:

- **React**: Framework base
- **react-router-dom**: Para navegación
- **axios**: Para llamadas HTTP (a través de `api.js`)
- **CSS**: Estilos personalizados

## Conclusión

La implementación del frontend del módulo "Control de Cargas" está completa y funcional. El módulo:

- ✅ Se integra correctamente con el backend
- ✅ Maneja estados y errores apropiadamente
- ✅ Proporciona una interfaz de usuario clara y funcional
- ✅ Sigue las convenciones del proyecto
- ✅ Está listo para uso en producción

El siguiente paso sería implementar la versión móvil (React Native) que consuma los mismos endpoints del backend.

---

## Actualizaciones Posteriores (Enero 2026)

### 1. Activación de los botones "Ver detalles" y "→ Estados de cargas"

Los botones que anteriormente estaban deshabilitados fueron reactivados. Ahora cumplen funciones diferenciadas:

| Botón | Acción |
|-------|--------|
| **Ver detalles** | Abre un modal con la información completa de la carga (información general, estadísticas y packing list) |
| **→ Estados de cargas** | Abre un modal que muestra únicamente el timeline de estados de la carga |

### 2. Modal "Estado de cargas" (solo timeline)

Al hacer clic en "→ Estados de cargas" se abre un modal que muestra exclusivamente el seguimiento de estados:

- **Título**: "Estado de cargas"
- **Etiqueta**: "Etiqueta #[codigo_carga o shipping_mark o id_carga]"
- **Badge de estado actual**: Muestra el estado actual con un icono de check verde
- **Timeline vertical**: Lista cronológica de estados con sus fechas (formato dd-mm-yyyy)

**Estilos específicos** (en `ControlCargas.css`):
- `.modal-estados`: Modal de ancho máximo 560px
- `.estados-etiqueta`: Texto de la etiqueta
- `.estados-badge-actual`: Contenedor del badge y check
- `.estados-timeline`: Línea vertical azul (#0f3d6e) con nodos circulares
- `.estados-timeline-item`: Cada item del historial
- `.estados-timeline-node`: Círculo azul por estado
- `.estados-timeline-estado` / `.estados-timeline-fecha`: Texto del estado y fecha

### 3. Modal "Ver detalles" (información completa)

Al hacer clic en "Ver detalles" se abre un modal con:

#### 3.1 Información de la Carga
- Código, Shipping Mark, Estado, Ubicación, Destino, Contenedor (si aplica)
- **No se muestra** información del cliente (eliminada por redundancia)

#### 3.2 Estadísticas (simplificadas)
- **Artículos**: Total de artículos del packing list
- **Cajas**: Total de cajas
- **Peso Total**: En kg

**Datos eliminados de estadísticas** (por redundancia): Volumen total (CBM), QRs escaneados.

#### 3.3 Packing List completo

Tabla con todos los datos del packing list por artículo:

| Columna | Descripción |
|---------|-------------|
| CN | Código/número del artículo |
| Ref Art | Referencia del artículo |
| Descripción (ES) | Descripción en español |
| Descripción (CN) | Descripción en chino |
| Unidad | Unidad de medida |
| Cantidad | Cantidad total |
| Cant/Caja | Cantidad por caja |
| Precio/U | Precio unitario |
| Precio Total | Precio total |
| Material | Material |
| Marca | Marca del producto |
| CBM | Metros cúbicos |
| GW | Peso bruto |

**Detalle de cajas por artículo**:
- Debajo de cada fila de artículo se muestra la sección "Cajas:" con badges
- Cada badge muestra **solo** "Caja X/Y" (número de caja / total de cajas)
- **No se muestran** Cant, GW ni CBM en los badges (ya están en la tabla principal)

### 4. Corrección del conteo de cajas

**Problema**: En algunos casos se mostraba "Caja 1/1" para todas las cajas cuando había varias (ej. 3 cajas deberían ser 1/3, 2/3, 3/3).

**Solución**:
- El total de cajas (Y) se obtiene de `art.cajas.length` (número real de registros de caja del artículo)
- El número de caja (X) viene de `c.numero_caja`, con fallback a `(i + 1)` si no existe
- Las cajas se ordenan por `numero_caja` antes de renderizar: `.sort((a, b) => (a.numero_caja ?? 0) - (b.numero_caja ?? 0))`

```javascript
// Fragmento relevante en ControlCargas.jsx
{art.cajas
  .sort((a, b) => (a.numero_caja ?? 0) - (b.numero_caja ?? 0))
  .map((c, i) => {
    const totalCajas = art.cajas.length;
    const numCaja = c.numero_caja ?? (i + 1);
    return (
      <span key={c.id_caja || i} className="caja-badge">
        Caja {numCaja}/{totalCajas}
      </span>
    );
  })}
```

### 5. Cambios en el Backend (para referencia)

El endpoint `GET /control-cargas/carga/:id/estados` (servicio `obtenerEstadosCarga`) fue ampliado para incluir:

- **packing_list**: Array con todos los artículos de la carga
- Cada artículo incluye sus cajas con: id_caja, numero_caja, total_cajas, cantidad_en_caja, cbm, gw, descripcion_contenido, observaciones, estado

### 6. Cómo se realizan los filtrados

1. **Parámetros**: Los filtros (Estado, Ubicación, Contenedor) se envían como query params: `GET /control-cargas/cargas?estado=...&ubicacion=...&contenedor=...`. Solo se envían los que tienen valor.

2. **Flujo**: Al cambiar un select, `handleFiltroChange` actualiza el estado `filtros`. El `useEffect` que depende de `[cargarCargas]` se ejecuta porque `cargarCargas` depende de `[filtros]`; se llama `cargarCargas()`, se construye el objeto de filtros y `controlCargasService.obtenerCargas(filtros)` realiza la petición.

3. **Opciones de los selects**: Provienen de `GET /control-cargas/filtros/opciones`. El backend devuelve `{ estados: [], ubicaciones: [], contenedores: [] }` con los valores únicos de las cargas del cliente. Se cargan una vez al montar.

4. **Limpiar filtros**: Resetea estado, ubicacion y contenedor a `''`. Eso dispara de nuevo `cargarCargas()` sin filtros y se listan todas las cargas.
