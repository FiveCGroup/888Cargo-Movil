#!/usr/bin/env python3
"""
Script para convertir tutoriales de Word a Markdown usando Pandoc
888Cris - Sistema de documentación
Fecha: 12 de noviembre de 2025
"""

import os
import subprocess
import sys
from pathlib import Path
import re

def sanitize_filename(filename):
    """Convierte el nombre del archivo a un formato amigable para URLs y archivos"""
    # Remover la extensión
    name = filename.replace('.docx', '')
    
    # Convertir a minúsculas y reemplazar espacios y caracteres especiales
    name = re.sub(r'[^\w\s-]', '', name.lower())
    name = re.sub(r'[-\s]+', '-', name)
    
    # Remover guiones al inicio y final
    name = name.strip('-')
    
    return f"{name}.md"

def convert_docx_to_md(input_path, output_path):
    """Convierte un archivo DOCX a Markdown usando Pandoc"""
    try:
        cmd = [
            'pandoc',
            str(input_path),
            '-f', 'docx',
            '-t', 'markdown',
            '--extract-media=./images',  # Extraer imágenes a carpeta images
            '-o', str(output_path),
            '--wrap=none'  # No hacer wrap de líneas
        ]
        
        print(f"🔄 Convirtiendo: {input_path.name} -> {output_path.name}")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ Éxito: {output_path.name}")
            return True
        else:
            print(f"❌ Error: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error al convertir {input_path}: {e}")
        return False

def clean_markdown_content(file_path):
    """Limpia y mejora el contenido del Markdown generado"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Mejoras al contenido
        # Limpiar líneas vacías múltiples
        content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
        
        # Asegurar que los títulos tengan espacio después del #
        content = re.sub(r'^(#{1,6})([^\s])', r'\1 \2', content, flags=re.MULTILINE)
        
        # Limpiar espacios al final de líneas
        content = re.sub(r' +$', '', content, flags=re.MULTILINE)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
            
        print(f"🧹 Limpiado: {file_path.name}")
        
    except Exception as e:
        print(f"⚠️ Warning: No se pudo limpiar {file_path}: {e}")

def create_tutorial_index():
    """Crea un archivo index.md para los tutoriales"""
    index_content = """# 📚 Tutoriales del Sistema 888Cris

Esta sección contiene tutoriales completos para el desarrollo y uso del sistema 888Cris.

## 🎯 Tutoriales Disponibles

### Frontend Web
- [Tutorial 1: Registro, Inicio de Sesión y Recuperación de Contraseña](./tutorial-1-frontend-web-registro-inicio-de-sesion-y-recuperacion-de-contrasena.md)

### Frontend Móvil  
- [Tutorial 5: Registro, Inicio de Sesión y Recuperación de Contraseña](./tutorial-5-frontend-movil-registro-inicio-de-sesion-y-recuperacion-de-contrasena.md)

### Backend y Base de Datos
- [Tutorial 4: Backend](./tutorial-4-backend.md)
- [Tutorial 3: Base de Datos](./tutorial-3-base-de-datos.md)

### Funcionalidades Específicas
- [Tutorial 2: Creación de Carga y Etiquetas QR](./tutorial-2-creacion-de-carga-y-etiquetas-qr.md)

## 🚀 Cómo usar estos tutoriales

1. **Para desarrolladores nuevos**: Comienza con Tutorial 3 (Base de Datos) y Tutorial 4 (Backend)
2. **Para desarrollo web**: Tutorial 1 (Frontend Web)
3. **Para desarrollo móvil**: Tutorial 5 (Frontend Móvil)
4. **Para funcionalidades QR**: Tutorial 2 (Creación de Carga y QR)

## 📝 Estructura de cada tutorial

Cada tutorial incluye:
- ✅ Objetivos de aprendizaje
- 🛠️ Herramientas necesarias
- 📋 Pasos detallados
- 💡 Tips y mejores prácticas
- 🐛 Solución de problemas comunes

---
*Documentación generada automáticamente - 888Cris System*
"""
    
    return index_content

def main():
    """Función principal del script"""
    print("🚀 Iniciando conversión de tutoriales Word a Markdown")
    print("=" * 60)
    
    # Configurar rutas
    base_dir = Path(__file__).parent
    tutorials_dir = base_dir / "code-docs" / "tutoriales"
    output_dir = tutorials_dir / "markdown"
    
    # Crear directorio de salida
    output_dir.mkdir(exist_ok=True)
    print(f"📁 Directorio de salida: {output_dir}")
    
    # Buscar archivos DOCX
    docx_files = list(tutorials_dir.glob("*.docx"))
    
    if not docx_files:
        print("❌ No se encontraron archivos .docx en el directorio de tutoriales")
        return
    
    print(f"📄 Encontrados {len(docx_files)} archivos para convertir")
    print("-" * 40)
    
    # Convertir cada archivo
    success_count = 0
    failed_files = []
    
    for docx_file in docx_files:
        # Generar nombre del archivo de salida
        md_filename = sanitize_filename(docx_file.name)
        output_file = output_dir / md_filename
        
        # Convertir archivo
        if convert_docx_to_md(docx_file, output_file):
            clean_markdown_content(output_file)
            success_count += 1
        else:
            failed_files.append(docx_file.name)
    
    # Crear archivo índice
    index_file = output_dir / "README.md"
    with open(index_file, 'w', encoding='utf-8') as f:
        f.write(create_tutorial_index())
    print(f"📋 Creado índice: {index_file.name}")
    
    # Resumen final
    print("\n" + "=" * 60)
    print("📊 RESUMEN DE CONVERSIÓN")
    print(f"✅ Convertidos exitosamente: {success_count}/{len(docx_files)}")
    
    if failed_files:
        print(f"❌ Archivos con errores: {len(failed_files)}")
        for file in failed_files:
            print(f"   - {file}")
    
    print(f"📁 Archivos generados en: {output_dir}")
    print("🎉 ¡Conversión completada!")

if __name__ == "__main__":
    main()