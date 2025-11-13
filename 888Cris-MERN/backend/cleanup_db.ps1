# 🚛 888CARGO - Script de Limpieza de Carpeta DB
# Generado automáticamente
# Fecha: 1762355287.5248706

Write-Host "🚛 888CARGO - Limpieza de Archivos DB" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

$dbPath = "..\db"

# Verificar que existe la carpeta
if (-not (Test-Path $dbPath)) {
    Write-Host "❌ No se encontró la carpeta db en: $dbPath" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Analizando carpeta: $dbPath" -ForegroundColor Yellow

# Archivos a eliminar (redundantes/no necesarios)
$filesToDelete = @(
    "packing_list_clean.sql",
    "packing_list_sqlserver.sql", 
    "sqlite_to_sqlserver.py"
)

$totalSize = 0
$deletedCount = 0

foreach ($file in $filesToDelete) {
    $filePath = Join-Path $dbPath $file
    
    if (Test-Path $filePath) {
        $fileSize = (Get-Item $filePath).Length
        $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
        
        Write-Host "🗑️  Eliminando: $file ($fileSizeMB MB)" -ForegroundColor Red
        
        try {
            Remove-Item $filePath -Force
            $totalSize += $fileSize
            $deletedCount++
            Write-Host "   ✅ Eliminado exitosamente" -ForegroundColor Green
        }
        catch {
            Write-Host "   ❌ Error al eliminar: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    else {
        Write-Host "⏭️  Saltando: $file (no existe)" -ForegroundColor Gray
    }
}

$totalSizeMB = [math]::Round($totalSize / 1MB, 2)

Write-Host ""
Write-Host "📊 RESUMEN DE LIMPIEZA:" -ForegroundColor Cyan
Write-Host "   Archivos eliminados: $deletedCount" -ForegroundColor White
Write-Host "   Espacio liberado: $totalSizeMB MB" -ForegroundColor White

if ($deletedCount -gt 0) {
    Write-Host "✅ Limpieza completada exitosamente" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No había archivos para limpiar" -ForegroundColor Blue
}

Write-Host ""
Write-Host "🔍 Archivos restantes en db/:" -ForegroundColor Yellow
Get-ChildItem $dbPath | ForEach-Object {
    $size = [math]::Round($_.Length / 1MB, 2)
    Write-Host "   📄 $($_.Name) - $size MB" -ForegroundColor White
}

Write-Host ""
Write-Host "🎯 Limpieza finalizada" -ForegroundColor Cyan
