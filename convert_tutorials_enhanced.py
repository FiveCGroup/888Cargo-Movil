#!/usr/bin/env python3
"""
Script mejorado para convertir tutoriales de Word a Markdown con extracción de imágenes
888Cris - Sistema de documentación
Fecha: 12 de noviembre de 2025
"""

import os
import subprocess
import sys
from pathlib import Path
import re
import shutil

def extract_images_from_docx(docx_path, output_dir):
    """Extrae imágenes de un archivo DOCX usando Pandoc"""
    try:
        images_dir = output_dir / "images"
        images_dir.mkdir(exist_ok=True)
        
        cmd = [
            'pandoc',
            str(docx_path),
            f'--extract-media={images_dir}',
            '--to=html'  # Solo para extraer imágenes
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=output_dir)
        
        if result.returncode == 0:
            return True
        else:
            print(f"⚠️ No se pudieron extraer imágenes de {docx_path.name}: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"⚠️ Error extrayendo imágenes de {docx_path}: {e}")
        return False

def convert_docx_to_md_with_images(input_path, output_path):
    """Convierte un archivo DOCX a Markdown y extrae imágenes"""
    try:
        # Primero extraer imágenes
        output_dir = output_path.parent
        extract_images_from_docx(input_path, output_dir)
        
        # Luego convertir a Markdown
        cmd = [
            'pandoc',
            str(input_path),
            '-f', 'docx',
            '-t', 'gfm',  # GitHub Flavored Markdown
            '--extract-media=.',  # Extraer en el directorio actual
            '-o', str(output_path),
            '--wrap=none'
        ]
        
        print(f"🔄 Convirtiendo: {input_path.name} -> {output_path.name}")
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=output_dir)
        
        if result.returncode == 0:
            print(f"✅ Éxito: {output_path.name}")
            return True
        else:
            print(f"❌ Error: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error al convertir {input_path}: {e}")
        return False

def fix_image_paths_in_markdown(file_path):
    """Corrige las rutas de las imágenes en el Markdown"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Buscar y corregir rutas de imágenes
        # Patrón para ![alt](./images/media/image.png){attributes}
        image_pattern = r'!\[(.*?)\]\((\.\/images\/.*?)\)(\{.*?\})?'
        
        def fix_image_path(match):
            alt_text = match.group(1)
            image_path = match.group(2)
            attributes = match.group(3) if match.group(3) else ""
            
            # Simplificar atributos si existen
            if attributes:
                # Remover atributos complejos y mantener solo width si es necesario
                attributes = ""
            
            return f"![{alt_text}]({image_path})"
        
        content = re.sub(image_pattern, fix_image_path, content)
        
        # Otras mejoras al contenido
        # Limpiar líneas vacías múltiples
        content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
        
        # Asegurar que los títulos tengan espacio después del #
        content = re.sub(r'^(#{1,6})([^\s])', r'\1 \2', content, flags=re.MULTILINE)
        
        # Limpiar espacios al final de líneas
        content = re.sub(r' +$', '', content, flags=re.MULTILINE)
        
        # Corregir títulos duplicados
        content = re.sub(r'^# # ', '# ', content, flags=re.MULTILINE)
        content = re.sub(r'^## # ', '## ', content, flags=re.MULTILINE)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
            
        print(f"🧹 Limpiado: {file_path.name}")
        
    except Exception as e:
        print(f"⚠️ Warning: No se pudo limpiar {file_path}: {e}")

def main():
    """Función principal del script mejorado"""
    print("🚀 Iniciando conversión mejorada de tutoriales Word a Markdown")
    print("=" * 70)
    
    # Configurar rutas
    base_dir = Path(__file__).parent
    tutorials_dir = base_dir / "code-docs" / "tutoriales"
    output_dir = tutorials_dir / "markdown"
    
    # Limpiar y recrear directorio de salida
    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True)
    print(f"📁 Directorio de salida limpio: {output_dir}")
    
    # Buscar archivos DOCX
    docx_files = list(tutorials_dir.glob("*.docx"))
    
    if not docx_files:
        print("❌ No se encontraron archivos .docx en el directorio de tutoriales")
        return
    
    print(f"📄 Encontrados {len(docx_files)} archivos para convertir")
    print("-" * 50)
    
    # Convertir cada archivo
    success_count = 0
    failed_files = []
    
    for docx_file in docx_files:
        # Generar nombre del archivo de salida
        md_filename = docx_file.stem.lower().replace(' ', '-').replace('--', '-') + '.md'
        # Limpiar caracteres especiales
        md_filename = re.sub(r'[^\w\s-]', '', md_filename).strip('-')
        
        output_file = output_dir / md_filename
        
        # Convertir archivo con imágenes
        if convert_docx_to_md_with_images(docx_file, output_file):
            fix_image_paths_in_markdown(output_file)
            success_count += 1
        else:
            failed_files.append(docx_file.name)
    
    # Crear archivo índice mejorado
    create_enhanced_index(output_dir)
    
    # Resumen final
    print("\n" + "=" * 70)
    print("📊 RESUMEN DE CONVERSIÓN MEJORADA")
    print(f"✅ Convertidos exitosamente: {success_count}/{len(docx_files)}")
    
    if failed_files:
        print(f"❌ Archivos con errores: {len(failed_files)}")
        for file in failed_files:
            print(f"   - {file}")
    
    print(f"📁 Archivos generados en: {output_dir}")
    
    # Verificar si hay imágenes
    images_dir = output_dir / "images"
    if images_dir.exists():
        image_count = len(list(images_dir.rglob("*.*")))
        print(f"🖼️ Imágenes extraídas: {image_count}")
    
    print("🎉 ¡Conversión mejorada completada!")

def create_enhanced_index(output_dir):
    """Crea un índice mejorado basado en los archivos realmente convertidos"""
    
    md_files = list(output_dir.glob("*.md"))
    md_files = [f for f in md_files if f.name != "README.md"]  # Excluir el README
    
    index_content = """# 📚 Tutoriales del Sistema 888Cris

Esta sección contiene tutoriales completos para el desarrollo y uso del sistema 888Cris.

## 🎯 Tutoriales Disponibles

"""
    
    # Organizar tutoriales por categoría
    categories = {
        "Frontend Web": [],
        "Frontend Móvil": [],
        "Backend y Base de Datos": [],
        "Funcionalidades Específicas": []
    }
    
    for md_file in sorted(md_files):
        name = md_file.stem
        display_name = name.replace('-', ' ').title()
        
        if 'frontend-web' in name or 'web' in name:
            categories["Frontend Web"].append((display_name, md_file.name))
        elif 'frontend-movil' in name or 'movil' in name:
            categories["Frontend Móvil"].append((display_name, md_file.name))
        elif 'backend' in name or 'base-de-datos' in name:
            categories["Backend y Base de Datos"].append((display_name, md_file.name))
        else:
            categories["Funcionalidades Específicas"].append((display_name, md_file.name))
    
    for category, files in categories.items():
        if files:
            index_content += f"### {category}\n"
            for display_name, filename in files:
                index_content += f"- [{display_name}](./{filename})\n"
            index_content += "\n"
    
    index_content += """## 🚀 Cómo usar estos tutoriales

1. **Para desarrolladores nuevos**: Comienza con los tutoriales de Backend y Base de Datos
2. **Para desarrollo web**: Revisa los tutoriales de Frontend Web
3. **Para desarrollo móvil**: Consulta los tutoriales de Frontend Móvil
4. **Para funcionalidades específicas**: Explora los tutoriales de características avanzadas

## 📝 Estructura de cada tutorial

Cada tutorial incluye:
- ✅ Objetivos de aprendizaje
- 🛠️ Herramientas necesarias
- 📋 Pasos detallados con capturas de pantalla
- 💡 Tips y mejores prácticas
- 🐛 Solución de problemas comunes

## 📸 Imágenes y Capturas

Los tutoriales incluyen capturas de pantalla y diagramas ubicados en la carpeta `images/`. Las imágenes son esenciales para seguir los pasos correctamente.

---
*Documentación generada automáticamente - 888Cris System*
*Fecha: """ + "12 de noviembre de 2025" + """*
"""
    
    index_file = output_dir / "README.md"
    with open(index_file, 'w', encoding='utf-8') as f:
        f.write(index_content)
    print(f"📋 Creado índice mejorado: {index_file.name}")

if __name__ == "__main__":
    main()