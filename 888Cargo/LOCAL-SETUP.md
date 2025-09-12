# 🏠 Configuración Local para 888Cargo Mobile

Este documento explica cómo ejecutar la aplicación completamente en local sin ngrok.

## 📋 Configuración Según el Entorno

### 1. 📱 Para Dispositivos Físicos (Teléfonos/Tablets)

**Configuración en `.env`:**
```bash
EXPO_PUBLIC_API_URL=http://192.168.58.100:3100/api
```

**Requisitos:**
- Tu dispositivo debe estar en la misma red WiFi que tu computadora
- La IP `192.168.58.100` debe ser la IP local de tu computadora
- Puedes verificar tu IP con: `ipconfig` (Windows) o `ifconfig` (Mac/Linux)

### 2. 🖥️ Para Emulador Android

**Configuración en `.env`:**
```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:3100/api
```

**Nota:** `10.0.2.2` es la IP especial que usa Android Emulator para acceder al localhost de la máquina host.

### 3. 📲 Para iOS Simulator

**Configuración en `.env`:**
```bash
EXPO_PUBLIC_API_URL=http://localhost:3100/api
```

**Nota:** iOS Simulator puede acceder directamente a localhost.

## 🚀 Pasos para Ejecutar

### 1. Iniciar el Backend
```bash
cd 888Cargo-Backend
npm start
```

### 2. Verificar que el Backend esté funcionando
Abre en tu navegador: `http://192.168.58.100:3100/api/health`

### 3. Iniciar la App Mobile
```bash
cd 888Cargo
npx expo start
```

### 4. Cambiar URL según necesidad
Edita el archivo `.env` en la carpeta `888Cargo` y cambia `EXPO_PUBLIC_API_URL` según donde vayas a ejecutar:

- **Dispositivo físico**: `http://192.168.58.100:3100/api`
- **Emulador Android**: `http://10.0.2.2:3100/api`
- **iOS Simulator**: `http://localhost:3100/api`

## 🔧 Cómo Encontrar tu IP Local

### Windows:
```bash
ipconfig
```
Busca "Dirección IPv4" en tu conexión WiFi activa.

### Mac/Linux:
```bash
ifconfig | grep inet
```

### Alternativa rápida:
En el router web, busca dispositivos conectados y encuentra tu computadora.

## ✅ Verificación de Conectividad

1. **Backend funcionando:** `http://192.168.58.100:3100/api/health`
2. **Desde dispositivo:** Abre el navegador de tu teléfono y visita la URL del paso 1
3. **Logs del backend:** Deberías ver las requests en la consola del backend

## 🚨 Solución de Problemas

### Error "Network request failed"
- Verifica que tu dispositivo esté en la misma red WiFi
- Confirma que la IP en `.env` sea correcta
- Asegúrate de que el backend esté ejecutándose

### No se puede conectar desde emulador
- Usa `http://10.0.2.2:3100/api` para Android Emulator
- Usa `http://localhost:3100/api` para iOS Simulator

### Firewall bloqueando conexión
- En Windows, permite Node.js en el firewall
- Verifica que el puerto 3100 esté abierto

## 📝 URLs Disponibles

| Entorno | URL |
|---------|-----|
| Dispositivo físico | `http://192.168.58.100:3100/api` |
| Emulador Android | `http://10.0.2.2:3100/api` |
| iOS Simulator | `http://localhost:3100/api` |
| Web (desarrollo) | `http://localhost:3100/api` |

---
**Nota:** Ya no necesitas ngrok, todo funciona en tu red local. 🎉
