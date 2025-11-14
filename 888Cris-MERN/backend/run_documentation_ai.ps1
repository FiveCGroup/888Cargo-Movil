# Script de Ejecución para Generador de Documentación con IA
# 888Cargo Backend Documentation Generator v2.0
# =====================================================

param(
    [switch]$Force,
    [string]$Model = "gpt-4",
    [string]$OutputDir = "docs",
    [switch]$NoCache
)

Write-Host "🤖 Generador de Documentación con IA - 888Cargo" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Blue

# Cambiar al directorio del script
Set-Location $PSScriptRoot

# Verificar entorno virtual
if (-not (Test-Path "venv\Scripts\Activate.ps1")) {
    Write-Host "❌ Entorno virtual no encontrado." -ForegroundColor Red
    Write-Host "📋 Ejecuta primero: .\setup_documentation.ps1" -ForegroundColor Yellow
    exit 1
}

# Activar entorno virtual
Write-Host "🔌 Activando entorno virtual..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error activando entorno virtual" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Entorno virtual activado" -ForegroundColor Green

# Verificar API Key
$apiKey = $env:OPENAI_API_KEY
if (-not $apiKey) {
    Write-Host "`n🔑 API Key de OpenAI no encontrada" -ForegroundColor Yellow
    
    # Buscar en archivo de configuración
    if (Test-Path ".env.documentation") {
        $envContent = Get-Content ".env.documentation" -Raw
        $keyMatch = $envContent | Select-String "OPENAI_API_KEY=(.+)"
        
        if ($keyMatch) {
            $foundKey = $keyMatch.Matches[0].Groups[1].Value
            if ($foundKey -and $foundKey -ne "sk-tu-api-key-aqui") {
                $env:OPENAI_API_KEY = $foundKey
                Write-Host "✅ API Key cargada desde configuración" -ForegroundColor Green
            }
        }
    }
    
    # Si aún no hay API Key
    if (-not $env:OPENAI_API_KEY) {
        Write-Host "❌ API Key requerida para documentación con IA" -ForegroundColor Red
        Write-Host ""
        Write-Host "📝 Para obtener tu API Key:" -ForegroundColor Cyan
        Write-Host "   1. Ve a: https://platform.openai.com/api-keys" -ForegroundColor White
        Write-Host "   2. Crea una nueva API Key" -ForegroundColor White
        Write-Host "   3. Configúrala ejecutando:" -ForegroundColor White
        Write-Host "      `$env:OPENAI_API_KEY='tu-api-key'" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "💡 Alternativamente, ejecuta el generador básico:" -ForegroundColor Cyan
        Write-Host "   python generate_documentation.py" -ForegroundColor White
        
        exit 1
    }
} else {
    $maskedKey = $apiKey.Substring(0, 7) + "..." + $apiKey.Substring($apiKey.Length - 4)
    Write-Host "✅ API Key configurada: $maskedKey" -ForegroundColor Green
}

# Configurar parámetros opcionales
if ($Model -ne "gpt-4") {
    $env:OPENAI_MODEL = $Model
    Write-Host "🧠 Usando modelo: $Model" -ForegroundColor Cyan
}

if ($NoCache) {
    $env:AI_CACHE_ENABLED = "false"
    Write-Host "🚫 Cache deshabilitado" -ForegroundColor Yellow
} else {
    Write-Host "💾 Cache habilitado para mejor rendimiento" -ForegroundColor Green
}

# Crear directorio de salida
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    Write-Host "📁 Directorio creado: $OutputDir" -ForegroundColor Green
}

# Mostrar información del proceso
Write-Host "`n🎯 CONFIGURACIÓN DE GENERACIÓN:" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Blue
Write-Host "🧠 Modelo de IA: $($env:OPENAI_MODEL ?? 'gpt-4')" -ForegroundColor White
Write-Host "💾 Cache: $($env:AI_CACHE_ENABLED ?? 'true')" -ForegroundColor White
Write-Host "📁 Salida: $OutputDir" -ForegroundColor White
Write-Host "⏱️ Tiempo estimado: 3-10 minutos" -ForegroundColor White

# Confirmar ejecución
if (-not $Force) {
    Write-Host ""
    $confirm = Read-Host "¿Continuar con la generación? (s/N)"
    if ($confirm -notmatch '^[sySY]') {
        Write-Host "❌ Generación cancelada" -ForegroundColor Yellow
        exit 0
    }
}

# Ejecutar generador con IA
Write-Host "`n🚀 Iniciando generación con IA..." -ForegroundColor Green
Write-Host "⚡ Procesando..." -ForegroundColor Yellow

$startTime = Get-Date

try {
    python generate_documentation_ai.py
    
    if ($LASTEXITCODE -eq 0) {
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMinutes
        
        Write-Host "`n🎉 ¡Documentación generada exitosamente!" -ForegroundColor Green
        Write-Host "⏱️ Tiempo transcurrido: $([math]::Round($duration, 2)) minutos" -ForegroundColor Cyan
        
        # Buscar archivo generado más reciente
        $docFiles = Get-ChildItem -Path $OutputDir -Filter "*AI_Enhanced*.docx" | Sort-Object LastWriteTime -Descending
        
        if ($docFiles) {
            $latestDoc = $docFiles[0]
            $sizeKB = [math]::Round($latestDoc.Length / 1024, 2)
            
            Write-Host "📁 Archivo: $($latestDoc.Name)" -ForegroundColor Cyan
            Write-Host "📊 Tamaño: $sizeKB KB" -ForegroundColor Cyan
            Write-Host "🤖 Mejorado con IA: ✅" -ForegroundColor Green
            
            # Preguntar si desea abrir
            Write-Host ""
            $openFile = Read-Host "¿Abrir documento? (s/N)"
            if ($openFile -match '^[sySY]') {
                Start-Process $latestDoc.FullName
                Write-Host "📖 Abriendo documento..." -ForegroundColor Green
            }
            
            # Mostrar estadísticas de cache
            if (Test-Path "ai_cache.json") {
                $cacheSize = (Get-Item "ai_cache.json").Length
                Write-Host "💾 Cache generado: $([math]::Round($cacheSize / 1024, 2)) KB" -ForegroundColor Cyan
            }
            
        } else {
            Write-Host "⚠️ Documento generado pero no encontrado en $OutputDir" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "`n❌ Error durante la generación" -ForegroundColor Red
        Write-Host "💡 Posibles soluciones:" -ForegroundColor Yellow
        Write-Host "   • Verificar conexión a internet" -ForegroundColor White
        Write-Host "   • Verificar API Key de OpenAI" -ForegroundColor White
        Write-Host "   • Verificar créditos en cuenta OpenAI" -ForegroundColor White
        Write-Host "   • Ejecutar generador básico: python generate_documentation.py" -ForegroundColor White
        exit 1
    }
    
} catch {
    Write-Host "`n❌ Error inesperado: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Intenta ejecutar el generador básico:" -ForegroundColor Yellow
    Write-Host "   python generate_documentation.py" -ForegroundColor White
    exit 1
}

Write-Host "`n🎯 OPCIONES ADICIONALES:" -ForegroundColor Magenta
Write-Host "========================" -ForegroundColor Blue
Write-Host "🔧 Personalizar modelo:" -ForegroundColor Yellow
Write-Host "   .\run_documentation_ai.ps1 -Model gpt-3.5-turbo" -ForegroundColor White
Write-Host ""
Write-Host "🚫 Deshabilitar cache:" -ForegroundColor Yellow
Write-Host "   .\run_documentation_ai.ps1 -NoCache" -ForegroundColor White
Write-Host ""
Write-Host "⚡ Forzar sin confirmar:" -ForegroundColor Yellow
Write-Host "   .\run_documentation_ai.ps1 -Force" -ForegroundColor White
Write-Host ""
Write-Host "📁 Directorio personalizado:" -ForegroundColor Yellow
Write-Host "   .\run_documentation_ai.ps1 -OutputDir custom_docs" -ForegroundColor White

Write-Host "`n👋 ¡Generación completada!" -ForegroundColor Green