# Presentación: Módulo Control de Cargas

**Sistema 888 Cargo**  
**Fecha:** Febrero 2026  
**Alcance:** Backend (Node/Express) + Frontend Web (React) + Frontend Móvil (Expo/React Native)

---

## 1. Introducción

El **Módulo Control de Cargas** permite a los clientes autenticados ver todas sus cargas (packing lists), filtrarlas por estado, ubicación y contenedor, y consultar el historial de estados y los detalles completos de cada carga. El mismo backend sirve a la aplicación web y a la aplicación móvil.

### 1.1 Objetivos del módulo

- **Consultar cargas:** Listar todas las cargas del cliente autenticado.
- **Filtrar:** Por estado, ubicación y contenedor.
- **Ver detalles:** Información general, estadísticas y packing list completo.
- **Seguimiento de estados:** Timeline cronológico del ciclo de vida de la carga (bodega China → tránsito → despacho, etc.).

### 1.2 Usuarios objetivo

- Clientes que ya tienen cuenta y cargas creadas.
- Acceso solo a las cargas propias (por `id_cliente` asociado al usuario).

---

## 2. Arquitectura general

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                         │
├──────────────────────────────┬──────────────────────────────────────────┤
│   Web (React)                │   Móvil (Expo / React Native)            │
│   • ControlCargas.jsx        │   • control-cargas.tsx                   │
│   • controlCargasService.js  │   • controlCargasService.js              │
│   • ControlCargas.css        │   • Mismo backend vía API_CONFIG          │
│   • Ruta: /control-cargas    │   • Tab oculto: control-cargas           │
└──────────────────────────────┴──────────────────────────────────────────┘
                                        │
                                        │ HTTP + JWT
                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Node.js + Express)                      │
├─────────────────────────────────────────────────────────────────────────┤
│   Rutas (routes/index.js)                                               │
│   • GET /control-cargas/cargas          (lista + filtros)                │
│   • GET /control-cargas/carga/:id      (detalle de una carga)           │
│   • GET /control-cargas/carga/:id/estados (estados + packing list)       │
│   • GET /control-cargas/filtros/opciones (opciones para filtros)        │
├─────────────────────────────────────────────────────────────────────────┤
│   Controlador: controlCargas.controller.js                              │
│   Servicio:    controlCargas.service.js                                 │
│   Repositorios: carga, clientes, contenedores, articulos, cajas         │
└─────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BASE DE DATOS (SQLite)                          │
│   Tablas: clientes, carga, carga_contenedor, contenedores,               │
│           articulo_packing_list, caja, qr                               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Backend

### 3.1 Capas

| Capa           | Archivo                         | Responsabilidad                                      |
|----------------|----------------------------------|-------------------------------------------------------|
| Rutas          | `routes/index.js`               | Definir endpoints y middleware `authRequired`        |
| Controlador    | `controllers/controlCargas.controller.js` | Validar request, llamar servicio, responder HTTP   |
| Servicio       | `services/controlCargas.service.js`      | Lógica de negocio y consultas a BD                   |
| Repositorios   | `repositories/`                 | Acceso a tablas (carga, clientes, contenedores, etc.)|

### 3.2 Endpoints

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| GET | `/control-cargas/cargas` | Lista cargas del cliente con filtros opcionales | Sí (JWT) |
| GET | `/control-cargas/carga/:id` | Detalle de una carga (validado por cliente) | Sí |
| GET | `/control-cargas/carga/:id/estados` | Estados detallados + packing list | Sí |
| GET | `/control-cargas/filtros/opciones` | Opciones para filtros (estados, ubicaciones, contenedores) | Sí |

**Query params en listado:**

- `?estado=...` (ej: "En bodega China", "En tránsito")
- `?ubicacion=...` (ej: "China", "Medellín")
- `?contenedor=...` (número de contenedor)

### 3.3 Flujo de autorización

1. El usuario envía el token JWT en `Authorization: Bearer <token>`.
2. El middleware `authRequired` valida el token y deja en `req.user` (p. ej. `email`).
3. El controlador obtiene el cliente con `obtenerClientePorEmail(req.user.email)`.
4. Todas las operaciones usan `id_cliente`; para una carga concreta se comprueba que `carga.id_cliente === clienteId`.

Así se garantiza que un cliente solo vea sus propias cargas.

### 3.4 Funciones del servicio

- **`obtenerClientePorEmail(userEmail)`**  
  Busca en `clientes` por `correo_cliente = userEmail`.

- **`obtenerCargasCliente(clienteId, filtros)`**  
  Lista cargas del cliente con JOIN a `clientes` y filtros opcionales por `estado`, `ubicacion_actual` y `contenedor` (incluyendo relación `carga_contenedor`). Orden: `created_at DESC`.

- **`obtenerEstadosCarga(cargaId, clienteId)`**  
  - Comprueba que la carga pertenezca al cliente.  
  - Devuelve: datos de la carga, contenedor (si existe), estadísticas (artículos, cajas, QRs, peso, volumen), historial de estados construido a partir de `fecha_recepcion`, `fecha_envio`, `fecha_arribo`, y packing list (artículos + cajas).

- **`obtenerOpcionesFiltros(clienteId)`**  
  Devuelve listas únicas de estados, ubicaciones y contenedores para ese cliente.

### 3.5 Respuestas típicas

**Listado de cargas (GET /control-cargas/cargas):**

```json
{
  "success": true,
  "data": [
    {
      "id_carga": 1,
      "codigo_carga": "888DFF",
      "shipping_mark": "SWOITO29",
      "estado": "En bodega China",
      "ubicacion": "China",
      "destino": "Medellín",
      "contenedor_asociado": null,
      "fecha_recepcion": "...",
      "fecha_envio": null,
      "fecha_arribo": null,
      "gw_total": 1500.5,
      "cbm_total": 25.3,
      "total_cajas": 50,
      "nombre_cliente": "..."
    }
  ],
  "total": 1,
  "filtros_aplicados": { "estado": "En bodega China" },
  "cliente": { "id_cliente": 1, "nombre_cliente": "..." }
}
```

**Estados detallados (GET /control-cargas/carga/:id/estados):**

```json
{
  "success": true,
  "data": {
    "carga": {
      "id_carga": 1,
      "codigo_carga": "888DFF",
      "estado_actual": "En bodega China",
      "ubicacion_actual": "China",
      "destino": "Medellín",
      "numero_contenedor": null,
      "fechas": { "recepcion": "...", "envio": null, "arribo": null },
      "estadisticas": {
        "total_articulos": 25,
        "total_cajas": 50,
        "total_qrs": 50,
        "qrs_escaneados": 0,
        "peso_total": 1500.5,
        "volumen_total": 25.3
      },
      "cliente": { "nombre": "...", "correo": "...", "telefono": "..." }
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
          { "id_caja": 1, "numero_caja": 1, "total_cajas": 3, "cantidad_en_caja": 50, "cbm": 0.106, "gw": 10 }
        ]
      }
    ]
  }
}
```

**Opciones de filtros (GET /control-cargas/filtros/opciones):**

```json
{
  "success": true,
  "data": {
    "estados": ["En bodega China", "En tránsito", "En despacho"],
    "ubicaciones": ["China", "Medellín"],
    "contenedores": ["CONT-001", "CONT-002"]
  }
}
```

### 3.6 Manejo de errores (backend)

- **401:** Usuario no autenticado.
- **404:** Cliente no encontrado, carga no encontrada o acceso denegado (carga de otro cliente).
- **400:** ID de carga inválido.
- **500:** Error interno (BD, etc.).  
Todas las respuestas de error usan `{ "success": false, "message": "..." }`.

---

## 4. Frontend Web (React)

### 4.1 Archivos

| Archivo | Ubicación | Uso |
|---------|-----------|-----|
| `ControlCargas.jsx` | `client/src/pages/` | Página principal del módulo |
| `controlCargasService.js` | `client/src/services/` | Llamadas al API (axios/API) |
| `ControlCargas.css` | `client/src/styles/pages/` | Estilos de la página y modales |

### 4.2 Ruta y acceso

- Ruta: `/control-cargas`.
- En `App.jsx`: `<Route path="/control-cargas" element={<ControlCargas />} />`.
- Desde el Dashboard: el card "Control de carga" navega a `/control-cargas`.

### 4.3 Funcionalidad de la página

- **Cabecera:** Navbar con usuario.
- **Título:** "Control de Cargas".
- **Acción:** Botón "→ Cargar Packing List" que navega a `/crear-carga`.
- **Filtros:** Tres selects (Estado, Ubicación, Contenedor) con opciones cargadas desde `/control-cargas/filtros/opciones` y botón "Limpiar filtros".
- **Tabla:** Columnas Id Carga, Shipping Mark, Estado (badge), Ubicación, Destino, Acciones.
- **Por cada fila:** Botón "Ver detalles" y en fila adicional "→ Estados de cargas".

### 4.4 Modales

**Modal "Ver detalles" (clic en "Ver detalles"):**

- Información de la carga: código, shipping mark, estado, ubicación, destino, contenedor.
- Estadísticas: artículos, cajas, peso total.
- Packing list: tabla de artículos (CN, Ref Art, descripciones, unidad, cantidades, precios, material, marca, CBM, GW) y debajo de cada artículo las cajas como badges "Caja X/Y".

**Modal "Estado de cargas" (clic en "→ Estados de cargas"):**

- Etiqueta (código/shipping mark).
- Badge del estado actual con check.
- Timeline vertical con historial de estados y fechas (formato dd-mm-yyyy).

Ambos modales usan el endpoint `GET /control-cargas/carga/:id/estados`; la página decide qué parte mostrar (solo timeline o detalle + packing list).

### 4.5 Servicio (web)

- `obtenerCargas(filtros)` → GET `/control-cargas/cargas` con query params.
- `obtenerCargaPorId(cargaId)` → GET `/control-cargas/carga/:id`.
- `obtenerEstadosCarga(cargaId)` → GET `/control-cargas/carga/:id/estados`.
- `obtenerOpcionesFiltros()` → GET `/control-cargas/filtros/opciones`.

Usa el cliente `API` (axios) del proyecto, que ya envía el token y retorna `response.data`.

### 4.6 Estilos (CSS)

- Layout: `.control-cargas-layout`, `.control-cargas-container`.
- Botones: `.btn-primary`, `.btn-secondary`, `.btn-link`, `.btn-info`, `.btn-sm`.
- Filtros: `.control-cargas-filtros`, `.filtro-group`.
- Tabla: `.control-cargas-tabla`, `.estados-row`, badges por estado (bodega China, tránsito, despacho, entregada).
- Modales: overlay, header, body, footer, timeline (`.estados-timeline`, nodos, fechas), packing list con scroll y badges de cajas.

---

## 5. Frontend Móvil (Expo / React Native)

### 5.1 Archivos

| Archivo | Ubicación | Uso |
|---------|-----------|-----|
| `control-cargas.tsx` | `888Cargo/app/(tabs)/` | Pantalla Control de Cargas |
| `controlCargasService.js` | `888Cargo/services/` | Llamadas al mismo backend con token en AsyncStorage |

### 5.2 Navegación

- Tab **oculto** en el layout de tabs (`href: null`), accesible por nombre de ruta: `/(tabs)/control-cargas`.
- Sin icono en la barra de tabs; se llega desde Home u otra pantalla que navegue a esta ruta.

### 5.3 Funcionalidad de la pantalla

- **Cabecera:** Botón atrás y título "Control de carga".
- **Botón:** "Gestión de cargas" (icono + texto) que lleva a `/(tabs)/cargas`.
- **Filtros:** Sección colapsable "Filtros" con Picker para Estado, Ubicación y Contenedor; badge "Activos" cuando hay filtros; "Limpiar filtros".
- **Lista:** Cards con Id Carga, Shipping Mark, Estado, Ubicación, Destino. Por ahora los botones "Ver detalles" y "→ Ver estado carga" están deshabilitados (placeholders).
- **Estados:** Loading, error con "Reintentar", lista vacía ("No hay cargas" o "No hay cargas con los filtros aplicados"), pull-to-refresh.

### 5.4 Servicio (móvil)

- Lee el token con `AsyncStorage.getItem('@auth:token')`.
- `obtenerCargas(filtros)` → GET `${API_BASE_URL}/control-cargas/cargas` con query params y header `Authorization: Bearer <token>`.
- `obtenerOpcionesFiltros()` → GET `${API_BASE_URL}/control-cargas/filtros/opciones`.
- `obtenerCargaPorId(cargaId)` → GET `${API_BASE_URL}/control-cargas/carga/:id`.

La base URL viene de `API_CONFIG.BASE_URL` en `constants/API.ts`. Si no hay token, se lanza error para que la UI pida iniciar sesión.

### 5.5 Posible ampliación en móvil

- Conectar "Ver detalles" y "→ Ver estado carga" a pantallas o modales que llamen a `obtenerCargaPorId` y `obtenerEstadosCarga` (endpoint `/control-cargas/carga/:id/estados`) y muestren la misma información que en web (detalle + packing list y timeline de estados).

---

## 6. Resumen de archivos por entorno

### Backend (888Cris-MERN/backend)

- `controllers/controlCargas.controller.js` — Handlers HTTP.
- `services/controlCargas.service.js` — Lógica y consultas.
- `routes/index.js` — Rutas y uso de `controlCargas.controller.js`.

### Frontend Web (888Cris-MERN/client)

- `src/pages/ControlCargas.jsx` — Página.
- `src/services/controlCargasService.js` — Cliente API.
- `src/styles/pages/ControlCargas.css` — Estilos.
- `App.jsx` — Ruta `/control-cargas`.
- `components/Dashboard.jsx` — Navegación al módulo.

### Frontend Móvil (888Cargo)

- `app/(tabs)/control-cargas.tsx` — Pantalla.
- `app/(tabs)/_layout.tsx` — Tab oculto `control-cargas`.
- `services/controlCargasService.js` — Cliente API con token.

---

## 7. Seguridad y buenas prácticas

- Todas las rutas del módulo requieren JWT (`authRequired`).
- El cliente se resuelve por `correo_cliente = email` del usuario; solo se exponen cargas de ese `id_cliente`.
- En detalle y estados se valida que la carga pertenezca al cliente antes de devolver datos.
- IDs numéricos validados; mensajes de error genéricos en producción para no filtrar información sensible.

---

## 8. Conclusión

El **Módulo Control de Cargas** está implementado de punta a punta:

- **Backend:** Cuatro endpoints REST documentados, servicio reutilizable y control de acceso por cliente.
- **Web:** Página con filtros, tabla, dos modales (detalles + packing list y timeline de estados) y estilos dedicados.
- **Móvil:** Pantalla con listado, filtros colapsables y servicio listo para ampliar con detalle y estados usando los mismos endpoints.

La presentación técnica del módulo queda recogida en este documento para uso interno o para exponer el alcance back y front del Control de Cargas.
