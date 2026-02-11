# 📧 Guía de Configuración - Notificaciones por Email y WhatsApp

## Resumen de Cambios

Se ha implementado un sistema de notificaciones que envía automáticamente:
- ✅ Email de bienvenida al registrarse
- ✅ Email de confirmación con datos de acceso
- ✅ Mensajes de WhatsApp de bienvenida
- ✅ Mensajes de WhatsApp de confirmación

---

## 1. Configuración de Email (Gmail recomendado)

### Paso 1: Habilitar contraseña de aplicación en Gmail

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. En el menú lateral, selecciona **"Seguridad"**
3. Busca **"Contraseñas de aplicaciones"** (solo disponible si tienes verificación en dos pasos)
4. Selecciona **"Correo"** y **"Windows"** (o tu dispositivo)
5. Copia la contraseña generada (16 caracteres)

### Paso 2: Actualizar archivo `.env`

Edita `backend/.env` y completa estas variables:

```env
# CONFIGURACIÓN DE EMAIL (NODEMAILER)
EMAIL_PROVIDER=gmail
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=xyzwabcd efghijkl
EMAIL_FROM=tu_email@gmail.com
EMAIL_NOTIFICATIONS=true
```

**Importante:**
- `EMAIL_USER`: Tu email de Gmail completo
- `EMAIL_PASSWORD`: La contraseña de 16 caracteres generada en Google
- `EMAIL_NOTIFICATIONS=true`: Activa las notificaciones por email

### Alternativa: Usar otro proveedor SMTP

Si prefieres Outlook o un SMTP personalizado:

```env
EMAIL_PROVIDER=outlook  # O 'custom-smtp'
EMAIL_USER=tu_email@outlook.com
EMAIL_PASSWORD=tu_contraseña
SMTP_HOST=smtp.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

---

## 2. Configuración de WhatsApp (Twilio)

### Paso 1: Crear cuenta en Twilio

1. Ve a https://www.twilio.com
2. Crea una cuenta gratuita
3. Verifica tu número de teléfono
4. Una vez logeado, ve al Dashboard

### Paso 2: Obtener credenciales de Twilio

1. En el Dashboard, encuentra tu **Account SID** (comienza con AC)
2. Copia tu **Auth Token** (bajo el Account SID)
3. Guarda ambos valores

### Paso 3: Configurar WhatsApp Sandbox en Twilio

1. Ve a **Messaging** → **Try it out** → **Send a WhatsApp message**
2. En la sección de WhatsApp, encontrarás un número de Twilio (ej: +1415xxx)
3. Sigue las instrucciones para vincular tu número personal
4. Twilio te enviará un mensaje de WhatsApp - responde con el código mostrado

### Paso 4: Actualizar archivo `.env`

Edita `backend/.env` y completa:

```env
# CONFIGURACIÓN DE WHATSAPP (TWILIO)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token_aqui
TWILIO_WHATSAPP_NUMBER=+1415xxxxxxx
ENABLE_WHATSAPP_NOTIFICATIONS=true
```

**Importante:**
- `TWILIO_ACCOUNT_SID`: Tu Account SID completo
- `TWILIO_AUTH_TOKEN`: Tu Auth Token
- `TWILIO_WHATSAPP_NUMBER`: El número de WhatsApp de Twilio
- `ENABLE_WHATSAPP_NOTIFICATIONS=true`: Activa las notificaciones por WhatsApp

---

## 3. Archivos Creados/Modificados

### Nuevos Servicios:
- ✅ `backend/services/emailService.js` - Servicio para envío de emails
- ✅ `backend/services/whatsappService.js` - Servicio para WhatsApp

### Archivos Modificados:
- ✅ `backend/controllers/auth.controller.simple.js` - Ahora envía notificaciones al registrarse
- ✅ `package.json` - Agregadas dependencias `nodemailer` y `twilio`
- ✅ `backend/.env` - Variables de configuración agregadas

---

## 4. Flujo de Registro Actualizado

Cuando un usuario se registra, ahora ocurre:

1. ✅ Usuario completa formulario de registro
2. ✅ Datos se validan y usuario se crea en base de datos
3. ✅ Se genera token JWT automáticamente
4. ✅ **Se envía email de bienvenida** (fondo)
5. ✅ **Se envía email de confirmación** con datos de acceso (fondo)
6. ✅ **Se envía WhatsApp de bienvenida** (si tiene teléfono) (fondo)
7. ✅ **Se envía WhatsApp de confirmación** (fondo)
8. ✅ Usuario recibe respuesta de registro exitoso
9. ✅ Usuario es redirigido automáticamente a Dashboard

**Nota:** Los emails y WhatsApp se envían en segundo plano (no bloquean el registro)

---

## 5. Prueba del Sistema

### Para Probar Email:

1. Registra un usuario con un email válido
2. Revisa tu bandeja de entrada
3. Deberías recibir 2 emails de 888Cargo

### Para Probar WhatsApp:

1. Registra un usuario con su número de teléfono
2. Verifica en WhatsApp que recibiste mensajes de 888Cargo
3. Si no recibes, verifica:
   - Que el número incluya código de país (+56 para Chile)
   - Que hayas completado el setup de Twilio WhatsApp Sandbox

---

## 6. Solución de Problemas

### Email no se envía:

```bash
# Revisa los logs del servidor
# Busca mensajes que comienzan con:
# ✅ Welcome email sent successfully
# ❌ Error sending welcome email
```

**Causas comunes:**
- `EMAIL_NOTIFICATIONS=false` - Cambiar a `true`
- Contraseña de aplicación incorrecta
- Email no tiene verificación de 2 pasos (para Gmail)
- Firewall bloqueando puerto 587

### WhatsApp no se envía:

```bash
# Busca en logs:
# ✅ Welcome WhatsApp message sent
# ❌ Error sending welcome WhatsApp
```

**Causas comunes:**
- `ENABLE_WHATSAPP_NOTIFICATIONS=false` - Cambiar a `true`
- Credenciales de Twilio incorrectas
- Número de teléfono no vinculado al Sandbox
- Número en formato incorrecto (debe ser E.164: +XXXXXXXXXXX)

---

## 7. Seguridad

⚠️ **IMPORTANTE:**

1. ❌ NO commiteches tu `.env` a Git (ya está en `.gitignore`)
2. ❌ NO compartas tus credenciales de Twilio o contraseña de app
3. ✅ En producción, usar secretos en variables de entorno
4. ✅ Cambiar `NODE_ENV` a `production` en producción

---

## 8. Personalización de Mensajes

Los templates de email y mensajes de WhatsApp se pueden personalizar en:

- **Emails:** `backend/services/emailService.js` (líneas 50-110)
- **WhatsApp:** `backend/services/whatsappService.js` (líneas 50-80)

Edita el contenido HTML o texto según tus necesidades.

---

## 9. API de Servicios

### Servicio de Email:

```javascript
// Enviar email de bienvenida
await emailService.sendWelcomeEmail(email, name);

// Enviar email de confirmación
await emailService.sendRegistrationConfirmation(email, name, username);
```

### Servicio de WhatsApp:

```javascript
// Enviar WhatsApp de bienvenida
await whatsappService.sendWelcomeWhatsApp(phone, name);

// Enviar WhatsApp de confirmación
await whatsappService.sendRegistrationConfirmationWhatsApp(phone, name, username);

// Enviar mensaje personalizado
await whatsappService.sendWhatsAppMessage(phone, "Tu mensaje aquí");
```

---

## 10. Próximos Pasos

- [ ] Configurar credenciales de Gmail
- [ ] Configurar credenciales de Twilio
- [ ] Actualizar `.env` con las nuevas variables
- [ ] Reiniciar servidor backend (`npm run dev:server`)
- [ ] Probar registro con email y teléfono
- [ ] Verificar que emails y WhatsApp se reciben

¡Listo! El sistema de notificaciones está completamente integrado. 🎉
