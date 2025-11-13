# Script de Prueba - Generador de Documentacion con IA
# ====================================================

# Verificar instalacion de Python
Write-Host "Verificando Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "OK: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Python no encontrado" -ForegroundColor Red
    exit 1
}

# Verificar entorno virtual
Write-Host "`n📦 Verificando entorno virtual..." -ForegroundColor Yellow
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "✅ Entorno virtual encontrado" -ForegroundColor Green
    
    # Activar entorno
    & .\venv\Scripts\Activate.ps1
    
    # Verificar dependencias
    Write-Host "`n📋 Verificando dependencias..." -ForegroundColor Yellow
    
    $requiredPackages = @("python-docx", "openai", "aiohttp", "rich", "tiktoken")
    
    foreach ($package in $requiredPackages) {
        try {
            $result = pip show $package 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ $package instalado" -ForegroundColor Green
            } else {
                Write-Host "❌ $package no encontrado" -ForegroundColor Red
            }
        } catch {
            Write-Host "❌ Error verificando $package" -ForegroundColor Red
        }
    }
    
} else {
    Write-Host "❌ Entorno virtual no encontrado" -ForegroundColor Red
    Write-Host "💡 Ejecuta: .\setup_documentation.ps1" -ForegroundColor Yellow
}

# Verificar archivos necesarios
Write-Host "`n📄 Verificando archivos..." -ForegroundColor Yellow

$requiredFiles = @(
    "generate_documentation.py",
    "generate_documentation_ai.py",
    "requirements.txt",
    ".env.documentation"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        Write-Host "✅ $file ($size bytes)" -ForegroundColor Green
    } else {
        Write-Host "❌ $file no encontrado" -ForegroundColor Red
    }
}

# Verificar estructura de backend
Write-Host "`n🏗️ Verificando estructura del proyecto..." -ForegroundColor Yellow

$backendDirs = @("controllers", "models", "routes", "services")

foreach ($dir in $backendDirs) {
    if (Test-Path $dir) {
        $fileCount = (Get-ChildItem $dir -Filter "*.js").Count
        Write-Host "✅ $dir ($fileCount archivos JS)" -ForegroundColor Green
    } else {
        Write-Host "⚠️ $dir no encontrado" -ForegroundColor Yellow
    }
}

# Verificar base de datos
Write-Host "`n🗄️ Verificando base de datos..." -ForegroundColor Yellow
if (Test-Path "packing_list.db") {
    $dbSize = [math]::Round((Get-Item "packing_list.db").Length / 1KB, 2)
    Write-Host "✅ packing_list.db ($dbSize KB)" -ForegroundColor Green
} else {
    Write-Host "⚠️ Base de datos no encontrada" -ForegroundColor Yellow
}

# Verificar configuración de OpenAI
Write-Host "`n🤖 Verificando configuración de IA..." -ForegroundColor Yellow

if ($env:OPENAI_API_KEY) {
    $maskedKey = $env:OPENAI_API_KEY.Substring(0, 7) + "..." + $env:OPENAI_API_KEY.Substring($env:OPENAI_API_KEY.Length - 4)
    Write-Host "✅ API Key configurada: $maskedKey" -ForegroundColor Green
} else {
    Write-Host "⚠️ API Key no configurada en variable de entorno" -ForegroundColor Yellow
    
    # Verificar en archivo de configuración
    if (Test-Path ".env.documentation") {
        $envContent = Get-Content ".env.documentation" -Raw
        if ($envContent -match "OPENAI_API_KEY=sk-") {
            Write-Host "ℹ️ API Key encontrada en archivo de configuración" -ForegroundColor Cyan
        } else {
            Write-Host "❌ API Key no configurada" -ForegroundColor Red
        }
    }
}

# Prueba rápida del generador básico
Write-Host "`n⚡ Probando generador básico..." -ForegroundColor Yellow

try {
    python -c "import sys; print('Python OK'); import docx; print('python-docx OK'); import sqlite3; print('sqlite3 OK'); from rich.console import Console; print('rich OK')"
    Write-Host "✅ Todas las dependencias básicas funcionan" -ForegroundColor Green
} catch {
    Write-Host "❌ Error en dependencias básicas" -ForegroundColor Red
    Write-Host "💡 Ejecuta: pip install -r requirements.txt" -ForegroundColor Yellow
}

# Prueba del generador con IA (si hay API key)
if ($env:OPENAI_API_KEY -or (Test-Path ".env.documentation")) {
    Write-Host "`n🧠 Probando imports del generador con IA..." -ForegroundColor Yellow
    
    try {
        python -c "import openai; print('openai OK'); import aiohttp; print('aiohttp OK'); import tiktoken; print('tiktoken OK')"
        Write-Host "✅ Dependencias de IA funcionan" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error en dependencias de IA" -ForegroundColor Red
        Write-Host "💡 Ejecuta: pip install openai aiohttp tiktoken" -ForegroundColor Yellow
    }
}

# Resumen final
Write-Host "`n📊 RESUMEN DE VERIFICACIÓN:" -ForegroundColor Magenta
Write-Host "=============================" -ForegroundColor Blue

Write-Host "🐍 Python: " -NoNewline
if ($pythonVersion) { Write-Host "OK" -ForegroundColor Green } else { Write-Host "ERROR" -ForegroundColor Red }

Write-Host "📦 Entorno Virtual: " -NoNewline
if (Test-Path "venv") { Write-Host "OK" -ForegroundColor Green } else { Write-Host "ERROR" -ForegroundColor Red }

Write-Host "📋 Dependencias: " -NoNewline
Write-Host "Verificar arriba" -ForegroundColor Cyan

Write-Host "🤖 Configuración IA: " -NoNewline
if ($env:OPENAI_API_KEY) { Write-Host "OK" -ForegroundColor Green } else { Write-Host "PENDIENTE" -ForegroundColor Yellow }

Write-Host "`n🚀 PRÓXIMOS PASOS:" -ForegroundColor Magenta
Write-Host "==================" -ForegroundColor Blue

if (-not (Test-Path "venv")) {
    Write-Host "1. Ejecutar: .\setup_documentation.ps1" -ForegroundColor Yellow
}

if (-not $env:OPENAI_API_KEY) {
    Write-Host "2. Configurar API Key de OpenAI:" -ForegroundColor Yellow
    Write-Host "   `$env:OPENAI_API_KEY='tu-api-key'" -ForegroundColor White
}

Write-Host "3. Generar documentación básica:" -ForegroundColor Yellow
Write-Host "   python generate_documentation.py" -ForegroundColor White

Write-Host "4. Generar documentación con IA:" -ForegroundColor Yellow
Write-Host "   .\run_documentation_ai.ps1" -ForegroundColor White

Write-Host "`n✨ Sistema listo para generar documentación!" -ForegroundColor Green