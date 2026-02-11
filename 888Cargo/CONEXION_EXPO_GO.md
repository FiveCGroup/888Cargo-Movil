# Conectar el celular (Expo Go) al backend en tu PC

Si ves: **"No se pudo conectar al servidor (http://192.168.58.112:4000/api)"**, el celular no alcanza tu PC. Sigue estos pasos.

---

## 1. Usar la IP correcta de tu PC (no 192.168.58.x)

La IP **192.168.58.112** suele ser de **WSL2** o de un adaptador virtual. El celular está en la red **WiFi** y no puede acceder a esa red virtual.

### En Windows (PowerShell o CMD)

```bash
ipconfig
```

Busca el **Adaptador de LAN inalámbrica Wi-Fi** (o "Wireless LAN adapter Wi-Fi"). Anota la **Dirección IPv4**, por ejemplo:

- `192.168.1.105`
- `192.168.0.50`
- `10.0.0.25`

**No uses** la IP de "Ethernet adapter vEthernet (WSL)" ni "Docker" ni "VirtualBox" (esas suelen ser 172.x o 192.168.58.x).

---

## 2. Poner esa IP en el .env de 888Cargo

En la carpeta **888Cargo**, edita el archivo **`.env`** y deja una sola línea con tu IP real (la del Wi-Fi):

```env
# Reemplaza 192.168.1.XXX por la IPv4 de tu "Wi-Fi" (ipconfig)
EXPO_PUBLIC_API_URL=http://192.168.1.XXX:4000/api
```

Si ya tienes otras variables, manténlas y solo cambia la parte de la URL para que use esa IP.

Ejemplo si tu IPv4 del Wi-Fi es **192.168.1.105**:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.105:4000/api
```

Guarda el archivo.

---

## 3. Permitir el puerto 4000 en el Firewall de Windows

Si el backend está en marcha pero el celular sigue sin conectar, el Firewall puede estar bloqueando.

### Opción A – Regla rápida (PowerShell como Administrador)

```powershell
New-NetFirewallRule -DisplayName "Backend 888Cargo" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow
```

### Opción B – Interfaz gráfica

1. Busca **"Firewall de Windows Defender con seguridad avanzada"**.
2. **Reglas de entrada** → **Nueva regla**.
3. **Puerto** → Siguiente → **TCP**, **Puertos locales concretos**: `4000` → Siguiente.
4. **Permitir la conexión** → Siguiente → Marcar Dominio, Privada, Pública → Siguiente.
5. Nombre: por ejemplo **Backend 888Cargo** → Finalizar.

---

## 4. Comprobar que el backend escucha en tu PC

En la carpeta del backend (888Cris-MERN):

```bash
cd backend
node index.js
# o: npm run dev
```

Debe decir algo como: `Servidor corriendo en http://localhost:4000`.

Desde el **mismo PC**, en el navegador abre:

- `http://localhost:4000`  
- `http://TU_IP_WIFI:4000`   (ej. http://192.168.1.105:4000)

Si en el PC funciona con la IP del Wi-Fi pero en el celular no, casi siempre es el Firewall (paso 3).

---

## 5. Misma red WiFi

El celular debe estar conectado a la **misma red WiFi** que el PC (no datos móviles ni otra red).

---

## 6. Reiniciar Expo

Después de cambiar el `.env`:

1. Detén el servidor de Expo (Ctrl+C).
2. Vuelve a iniciar: `npx expo start`.
3. Escanea de nuevo el QR o abre la app en Expo Go.

---

## Resumen

| Paso | Acción |
|------|--------|
| 1 | `ipconfig` → anotar **IPv4** del adaptador **Wi-Fi** (no WSL/Docker). |
| 2 | En **888Cargo/.env** → `EXPO_PUBLIC_API_URL=http://ESA_IP:4000/api` |
| 3 | Firewall Windows: permitir **TCP 4000** (entrada). |
| 4 | Backend en marcha en la PC. |
| 5 | Celular en la **misma WiFi**. |
| 6 | Reiniciar Expo tras cambiar `.env`. |

Cuando todo esté bien, el mensaje de "No se pudo conectar al servidor" dejará de salir y la app podrá hablar con el backend.
