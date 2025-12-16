#!/bin/bash

# ✅ SCRIPT DE VERIFICACIÓN - Sistema de Notificaciones

echo "════════════════════════════════════════════════════════════════"
echo "  VERIFICACIÓN DE IMPLEMENTACIÓN - Notificaciones Email + WhatsApp"
echo "════════════════════════════════════════════════════════════════"
echo ""

# VERIFICAR ARCHIVOS NUEVOS
echo "📁 Verificando archivos nuevos..."
echo ""

# Email Service
if [ -f "backend/services/emailService.js" ]; then
    echo "✅ emailService.js existe"
    LINES=$(wc -l < backend/services/emailService.js)
    echo "   └─ $LINES líneas de código"
else
    echo "❌ emailService.js NO EXISTE"
fi

# WhatsApp Service
if [ -f "backend/services/whatsappService.js" ]; then
    echo "✅ whatsappService.js existe"
    LINES=$(wc -l < backend/services/whatsappService.js)
    echo "   └─ $LINES líneas de código"
else
    echo "❌ whatsappService.js NO EXISTE"
fi

echo ""
echo "📄 Verificando documentación..."
echo ""

# Documentación
DOCS=(
    "SETUP_NOTIFICACIONES_10MIN.md"
    "GUIA_NOTIFICACIONES.md"
    "DIAGRAMA_NOTIFICACIONES.md"
    "IMPLEMENTACION_COMPLETADA.md"
    "RESUMEN_NOTIFICACIONES.md"
    "backend/EJEMPLOS_NOTIFICACIONES.js"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo "✅ $doc existe"
    else
        echo "❌ $doc NO EXISTE"
    fi
done

echo ""
echo "🔧 Verificando dependencias instaladas..."
echo ""

# Verificar paquetes en package.json
if grep -q '"nodemailer"' package.json; then
    echo "✅ nodemailer en package.json"
else
    echo "❌ nodemailer NO en package.json"
fi

if grep -q '"twilio"' package.json; then
    echo "✅ twilio en package.json"
else
    echo "❌ twilio NO en package.json"
fi

echo ""
echo "📝 Verificando configuración .env..."
echo ""

# Verificar variables en .env
ENV_VARS=(
    "EMAIL_NOTIFICATIONS"
    "EMAIL_PROVIDER"
    "EMAIL_USER"
    "TWILIO_ACCOUNT_SID"
    "ENABLE_WHATSAPP_NOTIFICATIONS"
)

for var in "${ENV_VARS[@]}"; do
    if grep -q "$var" backend/.env; then
        echo "✅ $var en .env"
    else
        echo "❌ $var NO en .env"
    fi
done

echo ""
echo "🔍 Verificando imports en controlador..."
echo ""

# Verificar imports en auth.controller.simple.js
if grep -q "import emailService" backend/controllers/auth.controller.simple.js; then
    echo "✅ emailService importado"
else
    echo "❌ emailService NO importado"
fi

if grep -q "import whatsappService" backend/controllers/auth.controller.simple.js; then
    echo "✅ whatsappService importado"
else
    echo "❌ whatsappService NO importado"
fi

echo ""
echo "✨ Verificando llamadas en register()..."
echo ""

# Verificar llamadas a servicios
if grep -q "emailService.sendWelcomeEmail" backend/controllers/auth.controller.simple.js; then
    echo "✅ sendWelcomeEmail() llamado"
else
    echo "❌ sendWelcomeEmail() NO llamado"
fi

if grep -q "whatsappService.sendWelcomeWhatsApp" backend/controllers/auth.controller.simple.js; then
    echo "✅ sendWelcomeWhatsApp() llamado"
else
    echo "❌ sendWelcomeWhatsApp() NO llamado"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  ✅ VERIFICACIÓN COMPLETADA"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Próximos pasos:"
echo "1. Configurar Gmail (5 min)"
echo "2. Configurar Twilio (5 min)"
echo "3. Reiniciar servidor"
echo "4. Probar con registro nuevo"
echo ""
echo "📖 Lee: SETUP_NOTIFICACIONES_10MIN.md"
echo ""
