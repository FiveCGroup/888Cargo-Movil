# 📱 CORRECCIONES IMPLEMENTADAS EN APP MÓVIL

## 🔍 PROBLEMA IDENTIFICADO

La app móvil (`888Cargo`) tenía el mismo problema que la web:
- El backend devuelve **objetos normalizados** (array de objetos) con campos como `precio_unidad`, `imagen_embedded`, etc.
- La app móvil guardaba estos objetos directamente en `datosExcel`
- Pero `TablasDatos` espera **tabla** (array de arrays) donde `datosExcel[0]` son los headers
- Al guardar, se enviaban objetos directamente al backend (correcto), pero no había preservación de arrays como `imagen_embedded_all`

---

## ✅ SOLUCIONES IMPLEMENTADAS

### **1. Conversión a Tabla para Visualización**

**Archivo:** `app/(tabs)/cargas.tsx` - Función `procesarArchivoExcel`

**Cambio:**
- Ahora convierte los objetos normalizados a formato tabla para `TablasDatos`
- Preserva los objetos originales en un estado separado

**Código implementado:**

```typescript
// Convertir objetos normalizados a formato tabla (array de arrays) para TablasDatos
let datosParaTabla: any[][] = [];
if (datosNormalizados && Array.isArray(datosNormalizados) && datosNormalizados.length > 0) {
  // Obtener todas las claves únicas para crear el header
  const todasLasClaves = new Set<string>();
  datosNormalizados.forEach((obj: any) => {
    Object.keys(obj).forEach(key => todasLasClaves.add(key));
  });
  
  const headers = Array.from(todasLasClaves).sort();
  datosParaTabla = [headers];
  
  // Agregar cada fila de datos
  datosNormalizados.forEach((obj: any) => {
    const fila = headers.map(header => {
      const valor = obj[header];
      if (valor === null || valor === undefined) return '';
      if (typeof valor === 'object') return JSON.stringify(valor); // Arrays a JSON
      return String(valor);
    });
    datosParaTabla.push(fila);
  });
}

// Guardar tabla para visualización
setDatosExcel(datosParaTabla);
// Guardar objetos originales para preservar arrays intactos al guardar
setDatosExcelObjetos(datosNormalizados || []);
```

---

### **2. Preservación de Objetos Originales**

**Archivo:** `hooks/useCrearCarga.ts`

**Cambio:**
- Agregado estado `datosExcelObjetos` para preservar objetos originales
- Exportado en el hook para uso en componentes

**Código implementado:**

```typescript
const [datosExcelObjetos, setDatosExcelObjetos] = useState<any[]>([]);

// En limpiarFormulario
setDatosExcelObjetos([]); // Limpiar objetos originales también

// Exportar en return
datosExcelObjetos,
setDatosExcelObjetos,
```

---

### **3. Uso de Objetos Originales al Guardar**

**Archivo:** `app/(tabs)/cargas.tsx` - Función `handleGuardarEnBD`

**Cambio:**
- Prioriza usar objetos originales preservados
- Fallback a reconstrucción desde tabla con parsing de JSON

**Código implementado:**

```typescript
// PRIORIDAD: Usar objetos originales si están disponibles
let datosParaGuardar: any[] = [];

if (datosExcelObjetos.length > 0) {
  // Usar objetos originales preservados (evita pérdida de datos)
  datosParaGuardar = datosExcelObjetos;
  console.log('💾 Usando objetos originales preservados:', datosParaGuardar.length, 'objetos');
} else if (datosExcel.length > 1) {
  // Reconstruir objetos desde tabla (fallback con parsing JSON)
  const headers = datosExcel[0] || [];
  const filas = datosExcel.slice(1);
  datosParaGuardar = filas.map((fila: any[]) => {
    const obj: any = {};
    headers.forEach((header: string, idx: number) => {
      let valor = fila[idx];
      // Intentar parsear strings JSON (para arrays como imagen_embedded_all)
      if (typeof valor === 'string' && valor.trim().startsWith('[') && valor.trim().endsWith(']')) {
        try {
          const parsed = JSON.parse(valor);
          if (Array.isArray(parsed)) {
            valor = parsed; // Restaurar array
          }
        } catch (e) {
          console.warn(`No se pudo parsear JSON para ${header}:`, e);
        }
      }
      obj[header] = valor;
    });
    return obj;
  });
  console.log('⚠️ Reconstruyendo objetos desde tabla (fallback):', datosParaGuardar.length, 'objetos');
}

// Enviar objetos al backend
const resultado = await CargaService.guardarPackingListConQR(datosParaGuardar, metadata);
```

---

## 📋 ARCHIVOS MODIFICADOS

1. **`hooks/useCrearCarga.ts`**
   - ✅ Agregado estado `datosExcelObjetos`
   - ✅ Exportado en el hook
   - ✅ Limpieza en `limpiarFormulario`

2. **`app/(tabs)/cargas.tsx`**
   - ✅ Conversión de objetos a tabla en `procesarArchivoExcel`
   - ✅ Preservación de objetos originales
   - ✅ Uso de objetos originales al guardar en `handleGuardarEnBD`
   - ✅ Fallback con parsing JSON si no hay objetos originales
   - ✅ Validaciones actualizadas para considerar ambos formatos

---

## 🎯 RESULTADO

**La app móvil ahora funciona correctamente:**

1. ✅ **Visualización:** `TablasDatos` recibe tabla (array de arrays) y muestra correctamente
2. ✅ **Preservación:** Objetos originales se preservan intactos (arrays como `imagen_embedded_all` no se pierden)
3. ✅ **Guardado:** Se envían objetos originales al backend (preserva todos los datos)
4. ✅ **Fallback:** Si no hay objetos originales, reconstruye desde tabla con parsing JSON
5. ✅ **Compatibilidad:** Funciona con el mismo backend que la web

---

## 🔄 FLUJO COMPLETO CORREGIDO

```
1. Usuario sube Excel → Backend procesa → Devuelve objetos normalizados ✅
2. App móvil recibe objetos → Convierte a tabla para visualización ✅
3. App móvil preserva objetos originales en estado separado ✅
4. Usuario ve tabla correctamente en TablasDatos ✅
5. Usuario guarda → App móvil usa objetos originales ✅
6. Backend recibe objetos → Guarda correctamente en BD ✅
```

---

## ✅ VERIFICACIONES

- ✅ `precio_unidad` se preserva correctamente
- ✅ `imagen_embedded` se preserva correctamente
- ✅ `imagen_embedded_all` (array) se preserva correctamente
- ✅ Visualización en `TablasDatos` funciona correctamente
- ✅ Guardado en BD funciona correctamente
- ✅ Compatible con el mismo backend que la web

---

## 📝 NOTAS

- La app móvil ahora sigue el mismo patrón que la web
- Los objetos originales se preservan para evitar pérdida de datos
- El fallback con parsing JSON asegura robustez
- Todo funciona con el mismo backend unificado


# 🔧 SOLUCIÓN: Error "No se ha subido ningún archivo" en App Móvil

## 🔴 PROBLEMA IDENTIFICADO

**Error:** `"success":false,"message":"No se ha subido ningún archivo"}`  
**Código HTTP:** `400`  
**Endpoint:** `POST /api/carga/procesar-excel`

---

## 🔍 CAUSA RAÍZ

El problema está en cómo se configura el header `Content-Type` al enviar FormData con axios en React Native.

### **Error en el código anterior:**

```javascript
const response = await axios.post(`${baseUrl}/carga/procesar-excel`, formData, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'  // ❌ ERROR: Header establecido manualmente
  }
});
```

### **Por qué falla:**

1. **Axios necesita calcular el boundary automáticamente:**
   - Cuando usas FormData, axios debe calcular un `boundary` único para separar las partes del multipart
   - El header completo debe ser: `Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW`
   - Si estableces `Content-Type: multipart/form-data` manualmente, axios NO puede agregar el boundary

2. **El servidor no puede parsear el archivo:**
   - Sin el boundary correcto, multer (en el backend) no puede identificar dónde empieza y termina el archivo
   - El resultado es que `req.file` es `undefined`
   - El backend responde: `"No se ha subido ningún archivo"`

3. **Comportamiento específico de React Native:**
   - En React Native, axios tiene un comportamiento diferente que en navegadores
   - Si estableces `Content-Type` manualmente, puede causar que el request se envíe como `text/plain` en lugar de `multipart/form-data`

---

## ✅ SOLUCIÓN IMPLEMENTADA

### **Código corregido:**

```javascript
// Crear FormData correctamente
const formData = new FormData();
const fileObject = {
  uri: archivo.uri,  // Ruta local del archivo en React Native
  type: archivo.mimeType || archivo.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  name: archivo.name || 'archivo.xlsx'
};

formData.append('file', fileObject as any);

// CRÍTICO: NO establecer 'Content-Type' manualmente
const response = await axios.post(`${baseUrl}/carga/procesar-excel`, formData, {
  headers: {
    'Authorization': `Bearer ${token}`,
    // ✅ NO incluir 'Content-Type': axios lo calcula automáticamente con el boundary correcto
    'Accept': 'application/json'
  },
  timeout: timeoutMs,
  maxContentLength: Infinity,
  maxBodyLength: Infinity
});
```

---

## 📋 CAMBIOS REALIZADOS

### **Archivo:** `888Cargo/services/cargaService.js`

#### **1. Función `procesarExcel` (líneas 61-91)**

**Antes:**
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'multipart/form-data'  // ❌
}
```

**Después:**
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  // ✅ NO incluir 'Content-Type': axios lo calcula automáticamente
  'Accept': 'application/json'
}
```

#### **2. Función `uploadPackingList` (líneas 402-428)**

**Antes:**
```javascript
headers: { 
  'Content-Type': 'multipart/form-data',  // ❌
  'Authorization': `Bearer ${token}`
}
```

**Después:**
```javascript
headers: { 
  // ✅ NO incluir 'Content-Type': axios lo calcula automáticamente
  'Authorization': `Bearer ${token}`,
  'Accept': 'application/json'
}
```

---

## 🔬 EXPLICACIÓN TÉCNICA

### **Cómo funciona FormData con axios:**

1. **Cuando NO estableces Content-Type manualmente:**
   ```
   axios detecta que es FormData
   → Calcula boundary automáticamente
   → Establece header: Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
   → Servidor puede parsear correctamente
   → req.file está disponible ✅
   ```

2. **Cuando estableces Content-Type manualmente:**
   ```
   axios ve Content-Type ya establecido
   → NO calcula boundary
   → Envía: Content-Type: multipart/form-data (sin boundary)
   → Servidor no puede parsear
   → req.file es undefined ❌
   ```

### **Estructura del objeto archivo en React Native:**

Cuando usas `expo-document-picker`, el objeto archivo tiene:
```javascript
{
  uri: "file:///path/to/file.xlsx",  // Ruta local del archivo
  name: "archivo.xlsx",              // Nombre del archivo
  mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  size: 123456                        // Tamaño en bytes
}
```

Para FormData en React Native, necesitas:
```javascript
{
  uri: archivo.uri,      // Requerido: ruta local
  type: archivo.mimeType, // Requerido: MIME type
  name: archivo.name     // Requerido: nombre del archivo
}
```

---

## ✅ VERIFICACIÓN

### **Lo que ahora funciona:**

1. ✅ Axios calcula automáticamente el boundary
2. ✅ El header Content-Type se establece correctamente con el boundary
3. ✅ Multer puede parsear el archivo correctamente
4. ✅ `req.file` está disponible en el backend
5. ✅ El archivo se procesa correctamente

### **Logs esperados en el backend:**

```
[Carga] procesarExcel - file received: {
  originalname: 'archivo.xlsx',
  size: 123456,
  mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
}
```

---

## 🎯 RESUMEN

**Problema:** Header `Content-Type: 'multipart/form-data'` establecido manualmente  
**Causa:** Axios no puede calcular el boundary necesario para multipart  
**Solución:** Eliminar el header `Content-Type` y dejar que axios lo calcule automáticamente  
**Resultado:** El archivo se envía correctamente y el backend puede parsearlo

---

## 📝 NOTAS ADICIONALES

- Este es un problema común en React Native con axios
- La misma solución aplica para cualquier upload de archivos con FormData
- En navegadores web, a veces funciona establecer Content-Type manualmente, pero en React Native NO
- Siempre dejar que axios maneje automáticamente los headers de FormData
