# ⚡ CONFIGURACIÓN RÁPIDA - 10 MINUTOS

## 🎯 Objetivo
Hacer que los usuarios reciban notificaciones por Email y WhatsApp al registrarse.

---

## ✅ PASO 1: Configurar Gmail (5 minutos)

### 1.1 Habilitar contraseña de aplicación

```
1. Abre: https://myaccount.google.com/
2. Menú lateral → "Seguridad"
3. Busca: "Contraseñas de aplicaciones"
4. Selecciona: Correo (Gmail) y Windows
5. Google genera 16 caracteres (ej: xyzwabcd efghijkl)
6. COPIA ESTA CONTRASEÑA
```

### 1.2 Actualizar `.env`

Edita: `backend/.env`

Busca esta sección:
```env
# =====================================================
# CONFIGURACIÓN DE EMAIL (NODEMAILER)
# =====================================================
```

Cambia:
```env
EMAIL_NOTIFICATIONS=false
```

A:
```env
EMAIL_NOTIFICATIONS=true
```

Y completa:
```env
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=xyzwabcd efghijkl
```

**Ejemplo completo:**
```env
EMAIL_PROVIDER=gmail
EMAIL_USER=juan@gmail.com
EMAIL_PASSWORD=xyzwabcd efghijkl
EMAIL_FROM=juan@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_NOTIFICATIONS=true
```

---

## ✅ PASO 2: Configurar Twilio WhatsApp (5 minutos)

### 2.1 Crear cuenta Twilio

```
1. Abre: https://www.twilio.com/
2. Click en "Sign up"
3. Completa formulario (usa teléfono real)
4. Verifica tu email
5. Verifica tu teléfono (recibirás SMS)
6. Completa survey
7. ¡Cuenta creada!
```

### 2.2 Obtener credenciales

```
1. En Dashboard de Twilio
2. Encuentra "Account SID" (comienza con AC)
3. Encuentra "Auth Token" (está debajo del SID)
4. COPIA AMBOS VALORES
```

### 2.3 Configurar WhatsApp Sandbox

```
1. Ve a: Messaging → Try it out → Send a WhatsApp message
2. En la sección de WhatsApp, verás un número de Twilio
3. Copia ese número (ej: +1415xxx)
4. Abre WhatsApp
5. Manda un mensaje al número de Twilio
6. Escribe el código que ves (ej: join morning-light)
7. Twilio responde confirmando Sandbox activo
8. ¡Listo!
```

### 2.4 Actualizar `.env`

Edita: `backend/.env`

Busca esta sección:
```env
# =====================================================
# CONFIGURACIÓN DE WHATSAPP (TWILIO)
# =====================================================
```

Cambia:
```env
ENABLE_WHATSAPP_NOTIFICATIONS=false
```

A:
```env
ENABLE_WHATSAPP_NOTIFICATIONS=true
```

Y completa:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token_aqui
TWILIO_WHATSAPP_NUMBER=+1415xxxxxxx
```

**Ejemplo completo:**
```env
TWILIO_ACCOUNT_SID=ACa1234567890abcdef1234567890abc
TWILIO_AUTH_TOKEN=abcdef1234567890abcdef123456789
TWILIO_WHATSAPP_NUMBER=+14155552671
ENABLE_WHATSAPP_NOTIFICATIONS=true
```

---

## ✅ PASO 3: Reiniciar servidor (1 minuto)

En la terminal del servidor:
```bash
# 1. Presiona Ctrl+C (termina el servidor actual)
# 2. Ejecuta:
npm run dev:server
```

Deberías ver:
```
> nodemon backend/index.js
[nodemon] restarting due to changes...
[nodemon] starting `node backend/index.js`
Server running on port 4000
```

---

## ✅ PASO 4: Probar (3 minutos)

### En la aplicación móvil o web:

1. **Registro nuevo usuario**
   - Email: `tutest@gmail.com`
   - Contraseña: `Test123!`
   - Teléfono: `+56912345678` (tu número real)
   - Nombre: `Test User`

2. **Click en Registrarse**

3. **Revisa tu email** (5-10 segundos)
   - Deberías recibir 2 emails de 888Cargo
   - Bandeja de entrada o Spam

4. **Revisa tu WhatsApp** (5-10 segundos)
   - Deberías recibir 2 mensajes de Twilio

---

## 📊 Checklist de Verificación

| Paso | Completado | Archivo |
|------|-----------|---------|
| [ ] Crear contraseña de app en Gmail | | `.env` LINE 115 |
| [ ] Configurar EMAIL_USER | | `.env` LINE 118 |
| [ ] Configurar EMAIL_PASSWORD | | `.env` LINE 121 |
| [ ] Habilitar EMAIL_NOTIFICATIONS=true | | `.env` LINE 137 |
| [ ] Crear cuenta Twilio | | twilio.com |
| [ ] Obtener Account SID | | `.env` LINE 144 |
| [ ] Obtener Auth Token | | `.env` LINE 147 |
| [ ] Configurar WhatsApp Sandbox | | WhatsApp |
| [ ] Obtener número de Twilio | | `.env` LINE 150 |
| [ ] Habilitar ENABLE_WHATSAPP_NOTIFICATIONS=true | | `.env` LINE 153 |
| [ ] Reiniciar servidor | | Terminal |
| [ ] Probar registro | | App Móvil |

---

## 🆘 Si algo falla

### Email no llega

```bash
# 1. Revisar .env tiene EMAIL_NOTIFICATIONS=true
# 2. Revisar credenciales son correctas
# 3. Ver en terminal del servidor: "✅ Email sent" o "❌ Error"
# 4. Si dice "Error auth failed":
#    - Contraseña de app es incorrecta
#    - Gmail requiere verificación de 2 pasos
#    - Intenta generar nueva contraseña
```

### WhatsApp no llega

```bash
# 1. Revisar .env tiene ENABLE_WHATSAPP_NOTIFICATIONS=true
# 2. Revisar credenciales son correctas
# 3. Revisar que respondiste al mensaje de Twilio
# 4. Ver en terminal: "✅ WhatsApp sent" o "❌ Error"
# 5. Si dice "Invalid phone number":
#    - Teléfono debe incluir +56 (para Chile)
#    - Debe ser un móvil (comienza con 9)
#    - Que hayas confirmado en Sandbox
```

### Servidor no inicia

```bash
# 1. Presiona Ctrl+C
# 2. Ejecuta: npm install (para instalar nodemailer y twilio)
# 3. Ejecuta: npm run dev:server
# 4. Si sigue fallando, copia el error y manda a soporte
```

---

## 🎓 Archivos importantes

| Archivo | Qué hace |
|---------|----------|
| `backend/services/emailService.js` | Envía emails |
| `backend/services/whatsappService.js` | Envía WhatsApp |
| `backend/controllers/auth.controller.simple.js` | Llama a los servicios al registrarse |
| `backend/.env` | Contiene credenciales |
| `GUIA_NOTIFICACIONES.md` | Guía detallada (si tienes dudas) |
| `backend/EJEMPLOS_NOTIFICACIONES.js` | Ejemplos de código |

---

## 📈 Después de configurar

### Ahora puedes:

1. ✅ Enviar notificaciones automáticas al registrar
2. ✅ Enviar notificaciones manuales desde otros controladores:
   ```javascript
   import emailService from "../services/emailService.js";
   await emailService.sendWelcomeEmail('email@example.com', 'Juan');
   ```
3. ✅ Personalizar mensajes editando los templates
4. ✅ Agregar notificaciones a otros eventos (cambio de estado, etc)

---

## ✨ Casos de uso adicionales

**Ya está configurado para:**
- Notificación cuando se crea nueva carga
- Notificación cuando carga cambia de estado
- Notificación cuando carga se entrega
- Notificación de recordatorio de seguimiento
- Notificación de problema en carga

Solo necesitas agregar 2 líneas de código en esos eventos.

---

**¡Listo en 10 minutos! 🚀**

Si tienes problemas, revisa `GUIA_NOTIFICACIONES.md` para solucionar.
