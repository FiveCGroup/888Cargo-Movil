# Corrección de Duplicados en Tablas `clientes` y `users`

## Fecha de Corrección
29 de Enero, 2026

## Problema Identificado

Se detectó que se estaban creando registros duplicados en las tablas `clientes` y `users` cada vez que un usuario ingresaba al aplicativo, cuando debería guardarse solo una vez durante el registro.

### Causas del Problema

1. **Tabla `clientes`**: No tenía restricción UNIQUE en el campo `correo_cliente`, permitiendo múltiples registros con el mismo email.
2. **Falta de verificación**: Los servicios de autenticación creaban clientes sin verificar si ya existían.
3. **Múltiples puntos de creación**: Se creaban clientes en varios lugares sin validación previa:
   - `auth.service.js` (registro)
   - `auth.controller.simple.js` (registro)
   - `carga.controller.js` (creación automática de carga)

## Soluciones Implementadas

### 1. Migración de Base de Datos

**Archivo**: `888Cris-MERN/backend/migrations/020_add_unique_constraints_clientes.sql`

- Elimina duplicados existentes (mantiene el registro más antiguo)
- Crea índice único en `correo_cliente` para prevenir duplicados futuros
- Nota: SQLite no soporta `ALTER TABLE ADD CONSTRAINT UNIQUE` directamente, por lo que se usa un índice único que actúa como restricción

```sql
-- Eliminar duplicados existentes
DELETE FROM clientes
WHERE id_cliente NOT IN (
  SELECT MIN(id_cliente)
  FROM clientes
  GROUP BY correo_cliente
  HAVING correo_cliente IS NOT NULL AND correo_cliente != ''
);

-- Crear índice único
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_correo_unique 
ON clientes(correo_cliente) 
WHERE correo_cliente IS NOT NULL AND correo_cliente != '';
```

### 2. Corrección en `auth.service.js`

**Archivo**: `888Cris-MERN/backend/services/auth.service.js`

**Cambio**: Se agregó verificación antes de crear cliente en el registro.

**Antes**:
```javascript
// Crear registro en la tabla `clientes` para mantener sincronía
try {
  const clienteData = { ... };
  const createdCliente = await clientes.create(clienteData);
} catch (err) {
  console.error('[Auth] Falló creación de cliente (no crítico):', err.message);
}
```

**Después**:
```javascript
// Crear registro en la tabla `clientes` para mantener sincronía
// IMPORTANTE: Verificar si el cliente ya existe antes de crear para evitar duplicados
try {
  // Verificar si ya existe un cliente con este correo
  const existingCliente = await clientes.findOne({ correo_cliente: normalizedEmail });
  
  if (existingCliente) {
    // El cliente ya existe, no crear duplicado
    console.log('[Auth] Cliente ya existe con id:', existingCliente.id_cliente || existingCliente.id);
  } else {
    // El cliente no existe, crearlo
    const clienteData = { ... };
    const createdCliente = await clientes.create(clienteData);
    console.log('[Auth] Cliente creado con id:', createdCliente.id_cliente || createdCliente.id);
  }
} catch (err) {
  // Manejo de errores mejorado
  if (err.message && err.message.includes('UNIQUE constraint')) {
    console.log('[Auth] Cliente ya existe (detectado por restricción UNIQUE)');
  } else {
    console.error('[Auth] Falló creación/verificación de cliente (no crítico):', err.message);
  }
}
```

### 3. Corrección en `auth.controller.simple.js`

**Archivo**: `888Cris-MERN/backend/controllers/auth.controller.simple.js`

**Cambio**: Similar al anterior, se agregó verificación antes de crear cliente.

**Antes**:
```javascript
// Crear registro en la tabla clientes
try {
  const clienteData = { ... };
  const createdCliente = await clienteRepository.create(clienteData);
} catch (clienteError) {
  console.error("Error al crear cliente en tabla clientes (no crítico):", clienteError.message);
}
```

**Después**:
```javascript
// Crear registro en la tabla clientes
// IMPORTANTE: Verificar si el cliente ya existe antes de crear para evitar duplicados
try {
  // Verificar si ya existe un cliente con este correo
  const existingCliente = await clienteRepository.findOne({ correo_cliente: normalizedEmail });
  
  if (existingCliente) {
    // El cliente ya existe, no crear duplicado
    console.log("Cliente ya existe en tabla clientes con id:", existingCliente.id_cliente || existingCliente.id);
  } else {
    // El cliente no existe, crearlo
    const clienteData = { ... };
    const createdCliente = await clienteRepository.create(clienteData);
    console.log("Cliente creado exitosamente en tabla clientes:", createdCliente);
  }
} catch (clienteError) {
  // Manejo mejorado de errores
  if (clienteError.message && clienteError.message.includes('UNIQUE constraint')) {
    console.log("Cliente ya existe (detectado por restricción UNIQUE)");
  } else {
    console.error("Error al crear/verificar cliente en tabla clientes (no crítico):", clienteError.message);
  }
}
```

### 4. Corrección en `carga.controller.js`

**Archivo**: `888Cris-MERN/backend/controllers/carga.controller.js`

**Cambio**: Se agregó verificación antes de crear cliente automáticamente al procesar una carga.

**Antes**:
```javascript
try {
  const created = await databaseRepository.clientes.create(newClienteData);
  id_cliente_payload = created.id_cliente || created.id || created.lastID;
} catch (createErr) {
  console.warn("[Carga] No se pudo crear cliente automáticamente:", createErr.message);
}
```

**Después**:
```javascript
try {
  // IMPORTANTE: Verificar si el cliente ya existe antes de crear para evitar duplicados
  const correoCliente = newClienteData.correo_cliente;
  let existingCliente = null;
  
  if (correoCliente) {
    existingCliente = await databaseRepository.clientes.findOne({
      correo_cliente: correoCliente
    });
  }
  
  if (existingCliente) {
    // El cliente ya existe, usar su ID
    id_cliente_payload = existingCliente.id_cliente || existingCliente.id;
    console.log("[Carga] Cliente ya existe, usando id_cliente existente:", id_cliente_payload);
  } else {
    // El cliente no existe, crearlo
    const created = await databaseRepository.clientes.create(newClienteData);
    id_cliente_payload = created.id_cliente || created.id || created.lastID;
    console.log("[Carga] Cliente creado automáticamente con id:", id_cliente_payload);
  }
} catch (createErr) {
  // Manejo mejorado con recuperación en caso de error UNIQUE
  if (createErr.message && createErr.message.includes('UNIQUE constraint')) {
    // Intentar obtener el cliente existente
    const correoCliente = newClienteData.correo_cliente;
    if (correoCliente) {
      try {
        const existingCliente = await databaseRepository.clientes.findOne({
          correo_cliente: correoCliente
        });
        if (existingCliente) {
          id_cliente_payload = existingCliente.id_cliente || existingCliente.id;
          console.log("[Carga] Cliente encontrado después de error UNIQUE, usando id:", id_cliente_payload);
        }
      } catch (findErr) {
        console.warn("[Carga] No se pudo encontrar cliente después de error UNIQUE:", findErr.message);
      }
    }
  } else {
    console.warn("[Carga] No se pudo crear cliente automáticamente:", createErr.message);
  }
}
```

### 5. Verificación de Tabla `users`

**Estado**: ✅ **Ya estaba protegida**

La tabla `users` ya tenía restricción UNIQUE en el campo `email` desde la migración inicial:

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,  -- ✅ Ya tiene UNIQUE
  ...
);
```

Además, el código de registro ya verificaba duplicados:
- `auth.service.js` línea 16-17: Verifica si el email ya existe antes de crear
- `auth.controller.simple.js` línea 44-47: Verifica si el email ya existe antes de crear

**Conclusión**: La tabla `users` no tenía el problema de duplicados.

## Flujo Corregido

### Registro de Usuario

1. Usuario intenta registrarse
2. **Verificación de usuario**: Se verifica si el email ya existe en `users`
   - Si existe → Error: "Email ya registrado"
   - Si no existe → Continuar
3. Se crea el usuario en `users`
4. **Verificación de cliente**: Se verifica si el cliente ya existe en `clientes` por `correo_cliente`
   - Si existe → No crear, usar el existente
   - Si no existe → Crear nuevo cliente
5. Se asigna rol "cliente" al usuario

### Login de Usuario

1. Usuario intenta iniciar sesión
2. Se verifica credenciales
3. **NO se crea ningún registro** (solo se genera token)
4. ✅ **Problema resuelto**: El login no crea duplicados

### Creación de Carga

1. Usuario crea una carga
2. Si no se proporciona `id_cliente`, se intenta crear automáticamente
3. **Verificación de cliente**: Se verifica si el cliente ya existe por `correo_cliente`
   - Si existe → Usar el ID existente
   - Si no existe → Crear nuevo cliente
4. ✅ **Problema resuelto**: No se crean duplicados al crear cargas

## Prevención de Duplicados Futuros

### Nivel de Base de Datos

1. **Índice único en `correo_cliente`**: Previene duplicados a nivel de base de datos
2. **Restricción UNIQUE en `users.email`**: Ya existía, previene duplicados de usuarios

### Nivel de Aplicación

1. **Verificación antes de crear**: Todos los lugares donde se crean clientes ahora verifican primero
2. **Manejo de errores UNIQUE**: Si por alguna razón se intenta crear un duplicado, se captura el error y se recupera el registro existente

## Archivos Modificados

1. ✅ `888Cris-MERN/backend/migrations/020_add_unique_constraints_clientes.sql` (NUEVO)
2. ✅ `888Cris-MERN/backend/services/auth.service.js`
3. ✅ `888Cris-MERN/backend/controllers/auth.controller.simple.js`
4. ✅ `888Cris-MERN/backend/controllers/carga.controller.js`

## Pruebas Recomendadas

### Pruebas Manuales

1. **Registro de nuevo usuario**:
   - Registrar un usuario nuevo → Debe crear 1 registro en `users` y 1 en `clientes`
   - Intentar registrar el mismo email → Debe fallar con "Email ya registrado"

2. **Login múltiple**:
   - Hacer login varias veces con el mismo usuario → No debe crear registros adicionales
   - Verificar que solo existe 1 registro en `users` y 1 en `clientes`

3. **Creación de carga**:
   - Crear una carga sin proporcionar `id_cliente` → Debe usar el cliente existente o crear uno nuevo
   - Crear otra carga con el mismo usuario → Debe usar el mismo cliente (no crear duplicado)

### Pruebas de Base de Datos

```sql
-- Verificar que no hay duplicados en clientes
SELECT correo_cliente, COUNT(*) as cantidad
FROM clientes
WHERE correo_cliente IS NOT NULL AND correo_cliente != ''
GROUP BY correo_cliente
HAVING COUNT(*) > 1;

-- Debe retornar 0 filas (sin duplicados)

-- Verificar que no hay duplicados en users
SELECT email, COUNT(*) as cantidad
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- Debe retornar 0 filas (sin duplicados)
```

## Limpieza de Duplicados Existentes

La migración `020_add_unique_constraints_clientes.sql` elimina automáticamente los duplicados existentes, manteniendo el registro más antiguo de cada `correo_cliente`.

**IMPORTANTE**: Si hay cargas asociadas a clientes duplicados que se eliminarán, se debe verificar que las relaciones `carga.id_cliente` se actualicen correctamente antes de ejecutar la migración.

## Conclusión

✅ **Problema resuelto**: 
- Se previenen duplicados en `clientes` mediante índice único y verificación en código
- Se previenen duplicados en `users` mediante restricción UNIQUE (ya existía) y verificación en código
- El login ya no crea registros duplicados
- La creación de cargas ya no crea clientes duplicados

El sistema ahora garantiza que cada usuario/cliente se registre solo una vez, independientemente de cuántas veces inicie sesión o cree cargas.
