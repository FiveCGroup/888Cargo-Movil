#!/usr/bin/env python3
"""
Script para limpiar los nombres de archivos de los tutoriales
"""

import os
from pathlib import Path
import shutil

def main():
    # Configurar rutas
    base_dir = Path(__file__).parent
    tutorials_dir = base_dir / "code-docs" / "tutoriales" / "markdown"
    
    print("🧹 Limpiando nombres de archivos...")
    
    # Mapeo de nombres antiguos a nuevos
    rename_map = {
        "tutorial-1--frontend-web--registro-inicio-de-sesion-y-recuperacion-de-contrasenamd.md": "tutorial-1-frontend-web.md",
        "tutorial-2--creacion-de-carga-y-etiquetas-qrmd.md": "tutorial-2-carga-y-qr.md",
        "tutorial-3--base-de-datosmd.md": "tutorial-3-base-de-datos.md",
        "tutorial-4--backendmd.md": "tutorial-4-backend.md",
        "tutorial-5--frontend-movil--registro-inicio-de-sesion-y-recuperacion-de-contrasenamd.md": "tutorial-5-frontend-movil.md"
    }
    
    for old_name, new_name in rename_map.items():
        old_path = tutorials_dir / old_name
        new_path = tutorials_dir / new_name
        
        if old_path.exists():
            old_path.rename(new_path)
            print(f"✅ Renombrado: {old_name} -> {new_name}")
        else:
            print(f"⚠️ No encontrado: {old_name}")
    
    # Actualizar README.md
    create_final_readme(tutorials_dir)
    
    print("🎉 ¡Limpieza completada!")

def create_final_readme(tutorials_dir):
    """Crea el README final con los nombres correctos"""
    
    readme_content = """# 📚 Tutoriales del Sistema 888Cris

Esta sección contiene tutoriales completos para el desarrollo y uso del sistema 888Cris.

## 🎯 Tutoriales Disponibles

### Frontend Web
- [Tutorial 1: Frontend Web - Registro, Inicio de Sesión y Recuperación](./tutorial-1-frontend-web.md)

### Frontend Móvil  
- [Tutorial 5: Frontend Móvil - Registro, Inicio de Sesión y Recuperación](./tutorial-5-frontend-movil.md)

### Backend y Base de Datos
- [Tutorial 4: Backend - Configuración y API](./tutorial-4-backend.md)
- [Tutorial 3: Base de Datos - Estructura y Configuración](./tutorial-3-base-de-datos.md)

### Funcionalidades Específicas
- [Tutorial 2: Creación de Cargas y Etiquetas QR](./tutorial-2-carga-y-qr.md)

## 🚀 Cómo usar estos tutoriales

1. **Para desarrolladores nuevos**: Comienza con Tutorial 3 (Base de Datos) y Tutorial 4 (Backend)
2. **Para desarrollo web**: Tutorial 1 (Frontend Web)
3. **Para desarrollo móvil**: Tutorial 5 (Frontend Móvil)
4. **Para funcionalidades QR**: Tutorial 2 (Creación de Cargas y QR)

## 📝 Estructura de cada tutorial

Cada tutorial incluye:
- ✅ Objetivos de aprendizaje claros
- 🛠️ Herramientas y requisitos necesarios
- 📋 Pasos detallados con capturas de pantalla
- 💡 Tips y mejores prácticas
- 🐛 Solución de problemas comunes
- 📸 Imágenes y diagramas explicativos

## 📸 Imágenes y Capturas

Los tutoriales incluyen **29 imágenes** ubicadas en la carpeta `images/media/`. Las capturas de pantalla son esenciales para seguir los pasos correctamente.

### Estructura de imágenes:
```
images/
└── media/
    ├── image1.png    # Logos y elementos de interfaz
    ├── image2.png    # Pantallas de registro
    ├── image3.png    # Configuraciones
    └── ...          # Más capturas de pantalla
```

## 🔗 Integración con JSDoc

Estos tutoriales están preparados para integrarse con el sistema de documentación JSDoc del proyecto. Para incluirlos en la documentación principal, ver la guía de integración.

---
*Documentación generada automáticamente - 888Cris System*  
*Fecha: 12 de noviembre de 2025*  
*Tutoriales convertidos exitosamente de Word a Markdown usando Pandoc*
"""
    
    readme_file = tutorials_dir / "README.md"
    with open(readme_file, 'w', encoding='utf-8') as f:
        f.write(readme_content)
    print(f"📋 README final actualizado: {readme_file.name}")

if __name__ == "__main__":
    main()