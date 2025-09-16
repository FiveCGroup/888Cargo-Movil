# Migración de Backend - Proyecto 888Cargo

## ✅ Migración Completada

Este proyecto móvil ahora usa el backend unificado ubicado en `../888Cris-MERN/backend/`.

### Cambios Realizados:

1. **Eliminación del backend duplicado**
   - ❌ Carpeta `888Cargo-Backend` eliminada
   - ✅ Ahora usa `888Cris-MERN/backend` como backend único

2. **Configuración actualizada**
   - ✅ `.env` actualizado para usar puerto 3001 (backend web)
   - ✅ `constants/API.ts` actualizado con nuevas URLs
   - ✅ `services/cargaService.js` actualizado para usar backend web

### URLs actualizadas:

- **Desarrollo local**: `http://192.168.58.100:3001/api`
- **Emulador Android**: `http://10.0.2.2:3001/api`
- **Simulador iOS**: `http://localhost:3001/api`

### Para iniciar el proyecto:

1. **Iniciar el backend web:**
   ```bash
   cd ../888Cris-MERN/backend
   npm start
   ```

2. **Iniciar el móvil:**
   ```bash
   cd 888Cargo
   npx expo start
   ```

### Ventajas de la unificación:

- ✅ Un solo backend para mantener
- ✅ Consistencia entre web y móvil
- ✅ Menos duplicación de código
- ✅ Sincronización automática de funcionalidades
- ✅ Base de datos unificada

### Estructura final:

```
888CRIS-MOVIL/
├── 888Cargo/           # Frontend móvil (React Native)
└── 888Cris-MERN/       # Proyecto web
    ├── client/         # Frontend web (React)
    └── backend/        # Backend unificado (Node.js/Express)
```

### Notas importantes:

- El backend debe estar ejecutándose en el puerto 3001
- Asegúrate de que la base de datos esté configurada en el backend web
- Todas las funcionalidades del móvil ahora dependen del backend web