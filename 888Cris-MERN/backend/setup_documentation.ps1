# Script de Instalación y Configuración del Generador de Documentación con IA
# 888Cargo Backend Documentation Generator v2.0 - AI Enhanced
# ===========================================================

Write-Host "🤖 Configurando Generador de Documentación con IA - 888Cargo" -ForegroundColor Green
Write-Host "=============================================================" -ForegroundColor Blue
Write-Host "🎯 Versión 2.0 - Mejorado con OpenAI GPT-4" -ForegroundColor Cyan

# Verificar si Python está instalado
Write-Host "`n🔍 Verificando instalación de Python..." -ForegroundColor Yellow

try {
    $pythonVersion = python --version 2>$null
    if ($pythonVersion) {
        Write-Host "✅ Python encontrado: $pythonVersion" -ForegroundColor Green
    } else {
        throw "Python no encontrado"
    }
} catch {
    Write-Host "❌ Python no está instalado o no está en el PATH" -ForegroundColor Red
    Write-Host "📥 Por favor, instala Python desde: https://python.org/downloads" -ForegroundColor Yellow
    Write-Host "   Asegúrate de marcar 'Add Python to PATH' durante la instalación" -ForegroundColor Yellow
    exit 1
}

# Verificar si pip está disponible
Write-Host "`n🔍 Verificando pip..." -ForegroundColor Yellow

try {
    $pipVersion = pip --version 2>$null
    if ($pipVersion) {
        Write-Host "✅ pip encontrado: $pipVersion" -ForegroundColor Green
    } else {
        throw "pip no encontrado"
    }
} catch {
    Write-Host "❌ pip no está disponible" -ForegroundColor Red
    Write-Host "📥 Instalando pip..." -ForegroundColor Yellow
    
    # Descargar get-pip.py
    Invoke-WebRequest -Uri "https://bootstrap.pypa.io/get-pip.py" -OutFile "get-pip.py"
    python get-pip.py
    Remove-Item "get-pip.py"
}

# Crear entorno virtual
Write-Host "`n🏗️ Creando entorno virtual..." -ForegroundColor Yellow

if (Test-Path "venv") {
    Write-Host "📁 Entorno virtual ya existe, eliminando el anterior..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "venv"
}

python -m venv venv

if (Test-Path "venv") {
    Write-Host "✅ Entorno virtual creado exitosamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error creando entorno virtual" -ForegroundColor Red
    exit 1
}

# Activar entorno virtual
Write-Host "`n🔌 Activando entorno virtual..." -ForegroundColor Yellow

if ($IsWindows -or $env:OS -eq "Windows_NT") {
    $activateScript = ".\venv\Scripts\Activate.ps1"
} else {
    $activateScript = "./venv/bin/activate"
}

if (Test-Path $activateScript) {
    if ($IsWindows -or $env:OS -eq "Windows_NT") {
        & $activateScript
    } else {
        . $activateScript
    }
    Write-Host "✅ Entorno virtual activado" -ForegroundColor Green
} else {
    Write-Host "❌ Error activando entorno virtual" -ForegroundColor Red
    exit 1
}

# Actualizar pip en el entorno virtual
Write-Host "`n⬆️ Actualizando pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# Instalar dependencias
Write-Host "`n📦 Instalando dependencias Python..." -ForegroundColor Yellow

if (Test-Path "requirements.txt") {
    pip install -r requirements.txt
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencias instaladas exitosamente" -ForegroundColor Green
    } else {
        Write-Host "❌ Error instalando dependencias" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Archivo requirements.txt no encontrado" -ForegroundColor Red
    exit 1
}

# Verificar instalación
Write-Host "`n🧪 Verificando instalación..." -ForegroundColor Yellow

$dependencies = @(
    "docx",
    "pathlib",
    "sqlite3",
    "json",
    "datetime",
    "re",
    "os",
    "sys"
)

$allInstalled = $true

foreach ($dep in $dependencies) {
    try {
        python -c "import $dep" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ $dep" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $dep" -ForegroundColor Red
            $allInstalled = $false
        }
    } catch {
        Write-Host "  ❌ $dep" -ForegroundColor Red
        $allInstalled = $false
    }
}

if ($allInstalled) {
    Write-Host "`n🎉 ¡Instalación completada exitosamente!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️ Algunas dependencias no se instalaron correctamente" -ForegroundColor Yellow
}

# Crear scripts de ejecución
Write-Host "`n📝 Creando scripts de ejecución..." -ForegroundColor Yellow

# Script para Windows
$windowsScript = @"
@echo off
echo 🚀 Generador de Documentación Backend 888Cargo
echo =============================================
cd /d "%~dp0"
call venv\Scripts\activate.bat
python generate_documentation.py
pause
"@

$windowsScript | Out-File -FilePath "run_documentation_generator.bat" -Encoding ASCII

# Script para PowerShell
$powershellScript = @"
# Generador de Documentación Backend 888Cargo
Write-Host "🚀 Generador de Documentación Backend 888Cargo" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Blue

# Cambiar al directorio del script
Set-Location `$PSScriptRoot

# Activar entorno virtual
if (Test-Path "venv\Scripts\Activate.ps1") {
    & .\venv\Scripts\Activate.ps1
    Write-Host "✅ Entorno virtual activado" -ForegroundColor Green
} else {
    Write-Host "❌ Entorno virtual no encontrado. Ejecuta setup_documentation.ps1 primero." -ForegroundColor Red
    exit 1
}

# Ejecutar generador
Write-Host "`n🏃‍♂️ Ejecutando generador de documentación..." -ForegroundColor Yellow
python generate_documentation.py

if (`$LASTEXITCODE -eq 0) {
    Write-Host "`n🎉 ¡Documentación generada exitosamente!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Error generando documentación" -ForegroundColor Red
}

Write-Host "`nPresiona cualquier tecla para continuar..."
`$null = `$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
"@

$powershellScript | Out-File -FilePath "run_documentation_generator.ps1" -Encoding UTF8

Write-Host "✅ Scripts creados:" -ForegroundColor Green
Write-Host "   • run_documentation_generator.bat (Windows)" -ForegroundColor Cyan
Write-Host "   • run_documentation_generator.ps1 (PowerShell)" -ForegroundColor Cyan

# Configurar API Key de OpenAI
Write-Host "`n� Configurando API Key de OpenAI..." -ForegroundColor Magenta

$apiKey = $env:OPENAI_API_KEY
if (-not $apiKey) {
    Write-Host "⚠️ API Key de OpenAI no encontrada" -ForegroundColor Yellow
    Write-Host "📝 Para obtener tu API Key:" -ForegroundColor Cyan
    Write-Host "   1. Ve a: https://platform.openai.com/api-keys" -ForegroundColor White
    Write-Host "   2. Crea una nueva API Key" -ForegroundColor White
    Write-Host "   3. Cópiala y pégala a continuación" -ForegroundColor White
    Write-Host ""
    
    $inputApiKey = Read-Host "🔑 Ingresa tu OpenAI API Key (o presiona Enter para configurar después)"
    
    if ($inputApiKey) {
        # Configurar para esta sesión
        $env:OPENAI_API_KEY = $inputApiKey
        
        # Guardar en archivo de configuración
        if (Test-Path ".env.documentation") {
            $envContent = Get-Content ".env.documentation" -Raw
            $envContent = $envContent -replace 'OPENAI_API_KEY=sk-tu-api-key-aqui', "OPENAI_API_KEY=$inputApiKey"
            $envContent | Set-Content ".env.documentation"
        }
        
        Write-Host "✅ API Key configurada exitosamente" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Configuración pendiente. Recuerda configurar OPENAI_API_KEY antes de usar." -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ API Key de OpenAI encontrada" -ForegroundColor Green
}

# Verificar configuración de IA
Write-Host "`n🧪 Verificando configuración de IA..." -ForegroundColor Yellow

# Crear archivo de configuración si no existe
if (-not (Test-Path ".env.documentation")) {
    Write-Host "📝 Creando archivo de configuración..." -ForegroundColor Yellow
    Copy-Item ".env.documentation" ".env.documentation.example" -Force
}

# Mostrar instrucciones finales
Write-Host "`n📋 INSTRUCCIONES DE USO CON IA:" -ForegroundColor Magenta
Write-Host "===============================" -ForegroundColor Blue
Write-Host ""
Write-Host "🚀 GENERADORES DISPONIBLES:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣ Generador Básico (sin IA):" -ForegroundColor Cyan
Write-Host "   python generate_documentation.py" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣ Generador con IA (RECOMENDADO):" -ForegroundColor Cyan
Write-Host "   python generate_documentation_ai.py" -ForegroundColor White
Write-Host ""
Write-Host "📁 UBICACIÓN DE ARCHIVOS:" -ForegroundColor Yellow
Write-Host "   � Documentos: ./docs/888Cargo_Backend_Documentation_*.docx" -ForegroundColor White
Write-Host "   🔧 Configuración: ./.env.documentation" -ForegroundColor White
Write-Host "   💾 Cache de IA: ./ai_cache.json" -ForegroundColor White
Write-Host ""
Write-Host "⚙️ CONFIGURACIÓN AVANZADA:" -ForegroundColor Yellow
Write-Host "   📝 Editar: .env.documentation" -ForegroundColor White
Write-Host "   🔑 API Key: OPENAI_API_KEY=tu-key" -ForegroundColor White
Write-Host "   🧠 Modelo: OPENAI_MODEL=gpt-4" -ForegroundColor White
Write-Host ""
Write-Host "🎯 CARACTERÍSTICAS DE IA:" -ForegroundColor Yellow
Write-Host "   ✅ Análisis inteligente de código" -ForegroundColor White
Write-Host "   ✅ Documentación detallada automática" -ForegroundColor White
Write-Host "   ✅ Detección de patrones de diseño" -ForegroundColor White
Write-Host "   ✅ Recomendaciones de mejora" -ForegroundColor White
Write-Host "   ✅ Cache inteligente para rapidez" -ForegroundColor White
Write-Host ""

Write-Host "🎯 ¡Todo listo! Puedes generar la documentación ahora." -ForegroundColor Green
Write-Host ""

# Preguntar qué tipo de documentación generar
Write-Host "🎯 ¿Qué tipo de documentación deseas generar?" -ForegroundColor Magenta
Write-Host "1. Básica (rápida, sin IA)" -ForegroundColor Yellow
Write-Host "2. Con IA (detallada, recomendada)" -ForegroundColor Green
Write-Host "3. Configurar después" -ForegroundColor Cyan

$docChoice = Read-Host "Elige una opción (1/2/3)"

switch ($docChoice) {
    "1" {
        Write-Host "`n🚀 Generando documentación básica..." -ForegroundColor Green
        python generate_documentation.py
    }
    "2" {
        if ($env:OPENAI_API_KEY) {
            Write-Host "`n🤖 Generando documentación con IA..." -ForegroundColor Green
            Write-Host "⏱️ Esto puede tomar varios minutos..." -ForegroundColor Yellow
            python generate_documentation_ai.py
        } else {
            Write-Host "`n❌ API Key requerida para documentación con IA" -ForegroundColor Red
            Write-Host "Configura OPENAI_API_KEY y ejecuta:" -ForegroundColor Yellow
            Write-Host "python generate_documentation_ai.py" -ForegroundColor White
        }
    }
    "3" {
        Write-Host "`n📋 Para generar después:" -ForegroundColor Cyan
        Write-Host "   Básica: python generate_documentation.py" -ForegroundColor White
        Write-Host "   Con IA: python generate_documentation_ai.py" -ForegroundColor White
    }
    default {
        Write-Host "`n� Para generar después:" -ForegroundColor Cyan
        Write-Host "   Básica: python generate_documentation.py" -ForegroundColor White  
        Write-Host "   Con IA: python generate_documentation_ai.py" -ForegroundColor White
    }
}
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n🎉 ¡Documentación generada exitosamente!" -ForegroundColor Green
        
        # Buscar el archivo generado más reciente
        $docFiles = Get-ChildItem -Path "docs" -Filter "*.docx" | Sort-Object LastWriteTime -Descending
        if ($docFiles) {
            $latestDoc = $docFiles[0]
            Write-Host "📁 Archivo generado: $($latestDoc.FullName)" -ForegroundColor Cyan
            
            # Preguntar si desea abrir el archivo
            $openFile = Read-Host "¿Deseas abrir el documento? (s/N)"
            if ($openFile -eq "s" -or $openFile -eq "S" -or $openFile -eq "y" -or $openFile -eq "Y") {
                Start-Process $latestDoc.FullName
            }
        }
    } else {
        Write-Host "`n❌ Error generando documentación" -ForegroundColor Red
    }
}

Write-Host "`n👋 ¡Configuración completa!" -ForegroundColor Green