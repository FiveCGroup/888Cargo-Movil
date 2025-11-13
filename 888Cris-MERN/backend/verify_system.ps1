# Script de Verificacion - Sistema de Documentacion
# ================================================

Write-Host "VERIFICACION DEL SISTEMA DE DOCUMENTACION" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Blue

# Verificar Python
Write-Host "`nVerificando Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "OK: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Python no encontrado" -ForegroundColor Red
    exit 1
}

# Verificar entorno virtual
Write-Host "`nVerificando entorno virtual..." -ForegroundColor Yellow
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "OK: Entorno virtual encontrado" -ForegroundColor Green
    
    # Activar entorno
    & .\venv\Scripts\Activate.ps1
    
    # Verificar dependencias principales
    Write-Host "`nVerificando dependencias..." -ForegroundColor Yellow
    
    $packages = @("python-docx", "openai", "rich")
    
    foreach ($package in $packages) {
        try {
            pip show $package > $null 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "OK: $package instalado" -ForegroundColor Green
            } else {
                Write-Host "ERROR: $package no encontrado" -ForegroundColor Red
            }
        } catch {
            Write-Host "ERROR: verificando $package" -ForegroundColor Red
        }
    }
    
} else {
    Write-Host "ERROR: Entorno virtual no encontrado" -ForegroundColor Red
    Write-Host "Ejecuta: .\setup_documentation.ps1" -ForegroundColor Yellow
}

# Verificar archivos del sistema
Write-Host "`nVerificando archivos del sistema..." -ForegroundColor Yellow

$files = @(
    "generate_documentation.py",
    "generate_documentation_ai.py",
    "requirements.txt"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "OK: $file" -ForegroundColor Green
    } else {
        Write-Host "ERROR: $file no encontrado" -ForegroundColor Red
    }
}

# Verificar estructura del backend
Write-Host "`nVerificando estructura del proyecto..." -ForegroundColor Yellow

$dirs = @("controllers", "models", "routes")

foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        $count = (Get-ChildItem $dir -Filter "*.js" -ErrorAction SilentlyContinue).Count
        Write-Host "OK: $dir ($count archivos JS)" -ForegroundColor Green
    } else {
        Write-Host "WARNING: $dir no encontrado" -ForegroundColor Yellow
    }
}

# Verificar configuracion de OpenAI
Write-Host "`nVerificando configuracion de IA..." -ForegroundColor Yellow

if ($env:OPENAI_API_KEY) {
    $masked = $env:OPENAI_API_KEY.Substring(0, 7) + "..."
    Write-Host "OK: API Key configurada ($masked)" -ForegroundColor Green
} else {
    Write-Host "WARNING: API Key no configurada" -ForegroundColor Yellow
    Write-Host "Para configurar: `$env:OPENAI_API_KEY='tu-api-key'" -ForegroundColor Cyan
}

# Test rapido de imports
Write-Host "`nProbando imports basicos..." -ForegroundColor Yellow

try {
    python -c "import docx; import sqlite3; from rich.console import Console; print('Imports basicos OK')" 2>$null
    Write-Host "OK: Dependencias basicas funcionan" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Problema con dependencias basicas" -ForegroundColor Red
}

# Test de imports de IA
if ($env:OPENAI_API_KEY) {
    Write-Host "`nProbando imports de IA..." -ForegroundColor Yellow
    
    try {
        python -c "import openai; import aiohttp; print('Imports IA OK')" 2>$null
        Write-Host "OK: Dependencias de IA funcionan" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Problema con dependencias de IA" -ForegroundColor Red
    }
}

# Resumen final
Write-Host "`n========================================" -ForegroundColor Blue
Write-Host "RESUMEN DE VERIFICACION" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Blue

Write-Host "`nPara generar documentacion basica:" -ForegroundColor Cyan
Write-Host "python generate_documentation.py" -ForegroundColor White

if ($env:OPENAI_API_KEY) {
    Write-Host "`nPara generar documentacion con IA:" -ForegroundColor Cyan
    Write-Host ".\run_documentation_ai.ps1" -ForegroundColor White
} else {
    Write-Host "`nPara usar IA, configura primero:" -ForegroundColor Yellow
    Write-Host "`$env:OPENAI_API_KEY='sk-tu-api-key'" -ForegroundColor White
    Write-Host "Luego: .\run_documentation_ai.ps1" -ForegroundColor White
}

Write-Host "`nSistema verificado!" -ForegroundColor Green