# 🚀 Guía Completa: Desarrollo de Nuevas Funcionalidades en 888Cargo Web

## 📋 Arquitectura Actual del Sistema

### 🏗️ **Estructura del Proyecto**
```
client/src/
├── components/          # Componentes reutilizables (UI/Funcionales)
├── pages/              # Páginas principales (rutas completas)
├── hooks/              # Custom hooks para lógica reutilizable
├── services/           # Servicios de API y lógica de negocio
├── styles/             # Archivos CSS organizados por tipo
├── utils/              # Utilidades generales
├── assets/             # Recursos estáticos
└── logic/              # Lógica de negocio adicional
```

### ⚙️ **Stack Tecnológico Detectado**
- **Frontend**: React 19.1.0 con Vite
- **Routing**: React Router DOM 7.6.0
- **HTTP Client**: Axios 1.9.0
- **QR Processing**: html5-qrcode 2.3.8
- **Alerts**: SweetAlert2 11.22.5
- **PDF Generation**: PDFKit 0.17.1

---

## 🎯 **EJEMPLO PRÁCTICO: Página de Aterrizaje para Código QR**

Vamos a crear una página de aterrizaje que se muestre cuando alguien escanea o accede a un código QR específico.

Ejemplo completo del flujo:

Generas QR → Contiene https://888cargo.com/qr-landing/ART-001
Usuario escanea → Se abre la URL en el navegador
React Router → Captura la ruta y renderiza <QRLanding />
Hook → Extrae "QR-001" y busca información en la API
Página → Muestra información del artículo QR-001

---

## 📝 **PASO 1: DEFINIR LA ESTRUCTURA Y FUNCIONALIDAD**

### 🎨 **Especificaciones de la Página de Aterrizaje QR:**

#### 🌐 **URL y Rutas:**
- **Ruta React Router**: `/qr-landing/:qrCode` 
- Esta será la ruta del landing page para la lectura de codigos QR, la definiremos en el transcurso del proceso y se integrará en el archivo App.jsx como una ruta publica sin autenticacion.
- **URL Completa Desarrollo**: `http://localhost:5173/qr-landing/:qrCode`
- **URL Completa Producción**: `https://tu-dominio.com/qr-landing/:qrCode`
- **Ejemplo Real**: `https://888cargo.com/qr-landing/ART-2024-001`

#### ⚙️ **Configuración:**
- **Funcionalidad**: Mostrar información del artículo/carga basada en código QR
- **Público**: Accesible sin autenticación (ruta pública)
- **Parámetro URL**: `:qrCode` - Código único del artículo/carga
- **Características**:
  - Información del producto/carga
  - Detalles del cliente
  - Estado del envío
  - Información de contacto
  - Botón para rastrear en tiempo real

---

## 🛠️ **PASO 2: CREAR EL SERVICIO (API)**

> **📝 Explicación del Paso**: Los servicios en React actúan como la capa de comunicación entre el frontend y el backend. Este archivo centraliza todas las llamadas a la API relacionadas con códigos QR, siguiendo el patrón de separación de responsabilidades.

### 📂 **Archivo**: `src/services/qrLandingService.js`

```javascript
// 📦 Importamos la instancia de Axios configurada desde nuestro archivo base de API
// Este API ya tiene configurado el baseURL, interceptors y manejo de autenticación
import API from './api';

// 🏗️ Creamos un objeto que contiene todos los métodos relacionados con QR Landing
// Patrón: Cada servicio agrupa funcionalidades relacionadas para mantener el código organizado
const qrLandingService = {
    /**
     * 🎯 MÉTODO PRINCIPAL: Obtiene información completa de un artículo por su código QR
     * 
     * @param {string} qrCode - Código QR único del artículo (ej: "ART-2024-001")
     * @returns {Promise<Object>} Objeto con success, data/error y metadata
     * 
     * 🔄 Flujo: Frontend → Service → API → Backend → Database
     */
    async obtenerInformacionPorQR(qrCode) {
        try {
            // 🔍 Log para debugging - ayuda a rastrear qué QR se está procesando
            console.log('🔍 Obteniendo información para QR:', qrCode);
            
            // 🌐 Llamada GET al endpoint del backend usando template literals
            // El endpoint completo será: /api/qr/landing/ART-2024-001
            // API.get() usa la instancia de Axios configurada con interceptors
            const response = await API.get(\`/api/qr/landing/\${qrCode}\`);
            
            // ✅ CASO ÉXITO: El backend respondió correctamente con datos válidos
            if (response.data.success) {
                return {
                    success: true,
                    data: response.data.data  // Contiene: { articulo: {...}, carga: {...} }
                };
            } else {
                // ⚠️ CASO ERROR CONTROLADO: El backend respondió pero sin datos válidos
                return {
                    success: false,
                    error: response.data.message || 'Error al obtener información del QR'
                };
            }
        } catch (error) {
            // 🚨 MANEJO DE ERRORES: Capturamos todos los errores de red/servidor
            console.error('❌ Error en obtenerInformacionPorQR:', error);
            
            // 🔍 ERROR ESPECÍFICO 404: QR no encontrado en la base de datos
            if (error.response?.status === 404) {
                return {
                    success: false,
                    error: 'Código QR no encontrado',
                    notFound: true  // Flag especial para manejar UI de "no encontrado"
                };
            }
            
            // 🌐 OTROS ERRORES: Problemas de red, servidor caído, etc.
            return {
                success: false,
                error: error.response?.data?.message || 'Error de conexión'
            };
        }
    },

    /**
     * 📊 ANALYTICS: Registra cada visualización del QR para estadísticas y seguimiento
     * 
     * @param {string} qrCode - Código QR que fue visualizado
     * @param {Object} metadata - Datos adicionales del contexto (navegador, referrer, etc.)
     * 
     * 🎯 Propósito: Recopilar datos sobre cuándo y cómo se accede a cada QR
     * 💡 Casos de uso: Reportes de engagement, análisis de uso, detección de patrones
     */
    async registrarVisualizacion(qrCode, metadata = {}) {
        try {
            // 📡 POST request para enviar datos de analytics al backend
            await API.post(\`/api/qr/analytics/view\`, {
                qrCode,                                    // Identificador del QR
                timestamp: new Date().toISOString(),      // Momento exacto de la visualización
                ...metadata                               // Spread de metadata adicional
                // Ejemplo de metadata: { userAgent: "...", referrer: "...", ip: "..." }
            });
        } catch (error) {
            // ⚠️ MANEJO SILENCIOSO: Si falla el analytics, no afectamos la UX
            console.warn('⚠️ No se pudo registrar la visualización:', error);
            // 🔄 Patrón: Las funciones de tracking nunca deben romper la funcionalidad principal
        }
    },

    /**
     * 📦 SEGUIMIENTO: Obtiene el estado actual y historial de una carga específica
     * 
     * @param {string} idCarga - ID único de la carga en la base de datos
     * @returns {Promise<Object>} Estados de la carga con timeline de seguimiento
     * 
     * 🚚 Funcionalidad: Permite rastrear el progreso de envío en tiempo real
     * 📍 Estados típicos: "Preparando", "En tránsito", "En destino", "Entregado"
     */
    async obtenerEstadoSeguimiento(idCarga) {
        try {
            // 🛣️ GET request al endpoint de seguimiento específico de la carga
            // Endpoint: /api/cargas/12345/seguimiento
            const response = await API.get(\`/api/cargas/\${idCarga}/seguimiento\`);
            
            // 📤 Retornamos directamente la respuesta del servidor
            // La respuesta contiene: { success: true, data: { estados: [...] } }
            return response.data;
        } catch (error) {
            // 🚨 ERROR: Problemas al obtener el seguimiento
            console.error('❌ Error obteniendo seguimiento:', error);
            
            // 🔄 Retornamos un objeto de error estandarizado para manejo consistente
            return {
                success: false,
                error: 'No se pudo obtener el estado de seguimiento'
            };
        }
    }
};

// 📤 EXPORTACIÓN: Hacemos disponible el servicio para otros componentes
// Patrón ES6: export default permite importar con cualquier nombre
export default qrLandingService;
```

---

## 🎣 **PASO 3: CREAR EL CUSTOM HOOK**

> **📝 Explicación del Paso**: Los Custom Hooks encapsulan lógica de estado y efectos que puede ser reutilizada entre múltiples componentes. Este hook maneja toda la lógica de la página QR Landing: estado, efectos, y acciones.

### 📂 **Archivo**: `src/hooks/useQRLanding.js`

```javascript
// ⚛️ HOOKS DE REACT: Importamos los hooks fundamentales para estado y efectos
import { useState, useEffect } from 'react';

// 🛣️ ROUTER HOOKS: Para manejar parámetros de URL y navegación
import { useParams, useNavigate } from 'react-router-dom';

// 📡 SERVICIO: Importamos nuestro servicio de API para comunicación con backend
import qrLandingService from '../services/qrLandingService';

// 🎣 CUSTOM HOOK: Función que encapsula toda la lógica del QR Landing
export const useQRLanding = () => {
    
    // 🔗 EXTRACCIÓN DE PARÁMETROS: Obtenemos el qrCode de la URL
    // Si la URL es "/qr-landing/ART-001", qrCode será "ART-001"
    const { qrCode } = useParams();
    
    // 🧭 NAVEGACIÓN: Hook para redireccionar programáticamente
    const navigate = useNavigate();
    
    // 🗂️ ESTADOS PRINCIPALES: Datos core de la aplicación
    
    // 📦 Información del artículo obtenida del QR
    const [articuloData, setArticuloData] = useState(null);
    
    // 🚚 Información de la carga/envío asociada al artículo
    const [cargaData, setCargaData] = useState(null);
    
    // 📍 Datos de seguimiento con estados del envío
    const [seguimientoData, setSeguimientoData] = useState(null);
    
    // ⏳ Estado de carga inicial (true mientras obtenemos datos)
    const [loading, setLoading] = useState(true);
    
    // ❌ Mensaje de error general (null si no hay errores)
    const [error, setError] = useState(null);
    
    // 🔍 Flag específico para QR no encontrado (manejo especial de UI)
    const [notFound, setNotFound] = useState(false);
    
    // 🗂️ ESTADOS SECUNDARIOS: Para funcionalidades auxiliares
    
    // 👁️ Control del modal de seguimiento (true = modal visible)
    const [mostrandoSeguimiento, setMostrandoSeguimiento] = useState(false);
    
    // ⏳ Estado de carga específico para seguimiento (independiente del loading principal)
    const [loadingSeguimiento, setLoadingSeguimiento] = useState(false);

    /**
     * 🚀 FUNCIÓN PRINCIPAL: Carga toda la información inicial del QR
     * 
     * 🔄 Flujo:
     * 1. Valida que tenemos un qrCode válido
     * 2. Llama al servicio para obtener datos del backend
     * 3. Procesa la respuesta y actualiza los estados
     * 4. Registra la visualización para analytics
     */
    const cargarInformacionQR = async () => {
        // 🚫 VALIDACIÓN: Si no hay qrCode, no podemos continuar
        if (!qrCode) {
            setError('Código QR no válido');
            setLoading(false);
            return;
        }

        try {
            // 🔄 INICIO DE CARGA: Activamos loading y limpiamos errores previos
            setLoading(true);
            setError(null);

            // 📡 LLAMADA AL SERVICIO: Obtenemos datos del backend
            const resultado = await qrLandingService.obtenerInformacionPorQR(qrCode);
            
            // ✅ CASO ÉXITO: Procesamos los datos recibidos
            if (resultado.success) {
                // 📦 DESTRUCTURING: Extraemos articulo y carga del resultado
                const { articulo, carga } = resultado.data;
                
                // 🔄 ACTUALIZACIÓN DE ESTADO: Guardamos los datos en el estado local
                setArticuloData(articulo);
                setCargaData(carga);
                
                // 📊 ANALYTICS: Registramos la visualización en segundo plano
                // No esperamos la respuesta (fire-and-forget) para no bloquear la UI
                await qrLandingService.registrarVisualizacion(qrCode, {
                    userAgent: navigator.userAgent,    // Información del navegador
                    referrer: document.referrer        // Página desde donde llegó el usuario
                });
                
            } else {
                // ❌ CASOS DE ERROR: Manejamos diferentes tipos de fallos
                
                if (resultado.notFound) {
                    // 🔍 QR NO ENCONTRADO: Activamos flag específico para UI especializada
                    setNotFound(true);
                } else {
                    // ⚠️ OTROS ERRORES: Errores generales de servidor o conexión
                    setError(resultado.error);
                }
            }
        } catch (error) {
            // 🚨 MANEJO DE ERRORES INESPERADOS: Cualquier error no previsto
            console.error('❌ Error cargando información del QR:', error);
            setError('Error inesperado al cargar la información');
        } finally {
            // 🏁 FINALIZACIÓN: Siempre desactivamos loading, sin importar el resultado
            setLoading(false);
        }
    };

    /**
     * 📦 FUNCIÓN DE SEGUIMIENTO: Carga y muestra el estado detallado de la carga
     * 
     * 🎯 Activada por: Click en botón "Ver Seguimiento"
     * 📍 Resultado: Abre modal con timeline de estados del envío
     */
    const cargarSeguimiento = async () => {
        // 🚫 GUARD CLAUSE: Solo ejecutamos si tenemos ID de carga válido
        if (!cargaData?.id) return;

        try {
            // ⏳ LOADING ESPECÍFICO: Usamos estado separado para no afectar la UI principal
            setLoadingSeguimiento(true);
            
            // 📡 LLAMADA AL SERVICIO: Obtenemos timeline de seguimiento
            const resultado = await qrLandingService.obtenerEstadoSeguimiento(cargaData.id);
            
            // ✅ CASO ÉXITO: Guardamos datos y mostramos el modal
            if (resultado.success) {
                setSeguimientoData(resultado.data);      // Datos del timeline
                setMostrandoSeguimiento(true);           // Activa la visualización del modal
            } else {
                // ⚠️ ERROR SILENCIOSO: Logueamos pero no mostramos error al usuario
                // Decisión de UX: el seguimiento es funcionalidad secundaria
                console.error('Error obteniendo seguimiento:', resultado.error);
            }
        } catch (error) {
            // 🚨 MANEJO DE ERRORES: Log para debugging
            console.error('❌ Error cargando seguimiento:', error);
        } finally {
            // 🏁 LIMPIEZA: Siempre desactivamos el loading específico
            setLoadingSeguimiento(false);
        }
    };

    /**
     * 🔐 FUNCIÓN DE NAVEGACIÓN: Redirige a la vista completa protegida
     * 
     * 🎯 Propósito: Permite acceder a información detallada que requiere autenticación
     * 🛣️ Destino: Página de packing list con todos los detalles de la carga
     */
    const verVistaCompleta = () => {
        // ✅ VALIDACIÓN: Solo navegamos si tenemos ID de carga
        if (cargaData?.id) {
            // 🧭 NAVEGACIÓN PROGRAMÁTICA: Usamos React Router para cambiar de página
            // La ruta /packing-list/:id está protegida y requiere autenticación
            navigate(\`/packing-list/\${cargaData.id}\`);
        }
    };

    /**
     * 📤 FUNCIÓN DE COMPARTIR: Permite compartir el enlace del QR
     * 
     * 🔄 Flujo:
     * 1. Intenta usar Web Share API (nativo en móviles)
     * 2. Si falla, copia el enlace al portapapeles como fallback
     */
    const compartirQR = async () => {
        // 🔍 DETECCIÓN DE CAPACIDADES: Verificamos si el navegador soporta Web Share API
        if (navigator.share && articuloData) {
            try {
                // 📱 WEB SHARE API: Interfaz nativa para compartir (especialmente en móviles)
                await navigator.share({
                    title: \`Artículo: \${articuloData.descripcion}\`,
                    text: \`Información del artículo \${articuloData.descripcion} - Carga \${cargaData?.codigo_carga}\`,
                    url: window.location.href  // URL actual de la página
                });
            } catch (error) {
                // 📋 FALLBACK: Si el usuario cancela o hay error, copiamos al portapapeles
                await navigator.clipboard.writeText(window.location.href);
                // 💡 TODO: Aquí se podría mostrar una notificación de "Enlace copiado"
            }
        }
    };

    // ⚡ EFFECT HOOK: Se ejecuta cuando el componente se monta o cambia el qrCode
    useEffect(() => {
        // 🔄 DEPENDENCIA: Este efecto se ejecuta cada vez que cambia qrCode
        // Casos: carga inicial, navegación a otro QR, actualización de URL
        cargarInformacionQR();
    }, [qrCode]); // 📌 Array de dependencias: solo qrCode

    // 📤 RETORNO DEL HOOK: Exponemos estados y funciones para usar en componentes
    return {
        // 🗂️ ESTADOS PRINCIPALES: Datos core que el componente necesita renderizar
        qrCode,              // Código QR de la URL
        articuloData,        // Información del artículo
        cargaData,           // Información de la carga
        seguimientoData,     // Timeline de seguimiento
        loading,             // Estado de carga principal
        error,               // Mensaje de error general
        notFound,            // Flag para QR no encontrado
        
        // 🎛️ ESTADOS SECUNDARIOS: Para funcionalidades auxiliares de UI
        mostrandoSeguimiento,    // Control del modal de seguimiento
        loadingSeguimiento,      // Loading específico del seguimiento
        
        // 🎬 ACCIONES: Funciones que el componente puede ejecutar
        cargarInformacionQR,     // Recargar datos del QR
        cargarSeguimiento,       // Obtener y mostrar seguimiento
        verVistaCompleta,        // Navegar a vista protegida
        compartirQR,             // Compartir enlace del QR
        navigate,                // Función de navegación de React Router
        
        // 🎨 FUNCIONES DE UI: Para manejar estado de interfaz
        setMostrandoSeguimiento  // Controlar visibilidad del modal
    };
};
```

---

## 🎨 **PASO 4: CREAR EL COMPONENTE DE LA PÁGINA**

> **📝 Explicación del Paso**: Este es el componente React que renderiza la interfaz de usuario. Usa el custom hook para obtener datos y estados, y se encarga únicamente de la presentación y manejo de eventos de UI.

### 📂 **Archivo**: `src/pages/QRLanding.jsx`

```jsx
// ⚛️ REACT IMPORT: Biblioteca principal para crear componentes
import React from 'react';

// 🎣 CUSTOM HOOK: Nuestro hook personalizado con toda la lógica de negocio
import { useQRLanding } from '../hooks/useQRLanding';

// 🧩 COMPONENTES REUTILIZABLES: Componentes auxiliares para UI consistente
import LoadingSpinner from '../components/LoadingSpinner';  // Spinner de carga
import ErrorMessage from '../components/ErrorMessage';      // Mensajes de error

// 🎨 ESTILOS: Importamos los estilos específicos de esta página
import '../styles/pages/QRLanding.css';

// 📄 COMPONENTE PRINCIPAL: Función que define la página completa del QR Landing
const QRLanding = () => {
    // 📦 DESTRUCTURING: Extraemos todos los estados y funciones de nuestro custom hook
    // Patrón de separación: El componente solo maneja UI, el hook maneja lógica
    const {
        qrCode,                     // Código QR de la URL
        articuloData,              // Datos del artículo obtenidos de la API
        cargaData,                 // Datos de la carga asociada
        seguimientoData,           // Timeline de seguimiento de la carga
        loading,                   // Estado de carga inicial
        error,                     // Mensaje de error general
        notFound,                  // Flag para QR no encontrado
        mostrandoSeguimiento,      // Control de visibilidad del modal
        loadingSeguimiento,        // Estado de carga del seguimiento
        cargarSeguimiento,         // Función para cargar seguimiento
        verVistaCompleta,          // Función para navegar a vista protegida
        compartirQR,               // Función para compartir QR
        setMostrandoSeguimiento    // Función para controlar modal
    } = useQRLanding();

    // 🔄 RENDER CONDICIONAL 1: Estado de carga inicial
    // Mientras cargamos los datos del QR, mostramos spinner
    if (loading) {
        return (
            <div className="qr-landing-container">
                {/* 🎡 COMPONENTE LOADING: Spinner reutilizable con mensaje personalizado */}
                <LoadingSpinner message="Cargando información del artículo..." />
            </div>
        );
    }

    // 🔍 RENDER CONDICIONAL 2: QR no encontrado (404)
    // Estado específico cuando el QR no existe en la base de datos
    if (notFound) {
        return (
            <div className="qr-landing-container qr-landing-error">
                <div className="error-content">
                    {/* 📦 ICONO VISUAL: Emoji descriptivo para mejor UX */}
                    <div className="error-icon">📦</div>
                    
                    {/* 📝 MENSAJE CLARO: Explicación específica del problema */}
                    <h2>Artículo no encontrado</h2>
                    <p>El código QR escaneado no corresponde a ningún artículo registrado en nuestro sistema.</p>
                    
                    {/* 🎬 ACCIÓN DE RECUPERACIÓN: Botón para volver atrás */}
                    <div className="error-actions">
                        <button 
                            className="btn-primary"
                            onClick={() => window.history.back()}  // API del navegador para volver
                        >
                            Volver
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ⚠️ RENDER CONDICIONAL 3: Error general
    // Para errores de conexión, servidor, etc. (no 404)
    if (error) {
        return (
            <div className="qr-landing-container">
                {/* 🧩 COMPONENTE ERROR: Componente reutilizable para mostrar errores */}
                <ErrorMessage 
                    message={error}                           // Mensaje de error del estado
                    onRetry={() => window.location.reload()} // Función para recargar la página
                />
            </div>
        );
    }

    // ✅ RENDER PRINCIPAL: Contenido cuando todo está correcto
    // Solo llegamos aquí si tenemos datos válidos del artículo
    return (
        <div className="qr-landing-container">
            
            {/* 🏢 HEADER: Encabezado con branding de la empresa */}
            <div className="qr-landing-header">
                {/* 🖼️ LOGO: Imagen corporativa desde la carpeta public */}
                <img src="/logo-888cargo.png" alt="888Cargo" className="logo" />
                
                {/* 📋 TÍTULO PRINCIPAL: Descripción clara del propósito de la página */}
                <h1>Información del Artículo</h1>
            </div>

            {/* 📦 TARJETA PRINCIPAL: Información detallada del artículo */}
            <div className="articulo-card">
                
                {/* 🎨 HEADER DE TARJETA: Título destacado con badge del QR */}
                <div className="articulo-header">
                    {/* 📝 NOMBRE DEL ARTÍCULO: Descripción principal del producto */}
                    <h2>{articuloData.descripcion}</h2>
                    
                    {/* 🏷️ BADGE QR: Identificador visual del código escaneado */}
                    <span className="qr-code-badge">QR: {qrCode}</span>
                </div>
                
                {/* 📋 DETALLES: Lista de propiedades del artículo */}
                <div className="articulo-details">
                    
                    {/* 🔢 CÓDIGO: Identificador interno del artículo */}
                    <div className="detail-group">
                        <label>Código del Artículo:</label>
                        <span>{articuloData.codigo_articulo}</span>
                    </div>
                    
                    {/* 📊 CANTIDAD: Número de unidades con su medida */}
                    <div className="detail-group">
                        <label>Cantidad:</label>
                        <span>{articuloData.cantidad} {articuloData.unidad || 'unidades'}</span>
                    </div>
                    
                    {/* ⚖️ PESO: Peso total del artículo */}
                    <div className="detail-group">
                        <label>Peso:</label>
                        <span>{articuloData.peso} kg</span>
                    </div>
                    
                    {/* 📏 DIMENSIONES: Solo se muestra si existe el dato */}
                    {articuloData.dimensiones && (
                        <div className="detail-group">
                            <label>Dimensiones:</label>
                            <span>{articuloData.dimensiones}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 🚚 TARJETA DE CARGA: Información del envío (condicional) */}
            {cargaData && (
                <div className="carga-card">
                    {/* 📦 TÍTULO DE SECCIÓN: Identifica la información de envío */}
                    <h3>Información del Envío</h3>
                    
                    {/* 📋 DETALLES DE CARGA: Datos específicos del envío */}
                    <div className="carga-details">
                        
                        {/* 🔖 CÓDIGO DE CARGA: Identificador único del envío */}
                        <div className="detail-group">
                            <label>Código de Carga:</label>
                            <span className="codigo-carga">{cargaData.codigo_carga}</span>
                        </div>
                        
                        {/* 👤 CLIENTE: Nombre del destinatario o cliente */}
                        <div className="detail-group">
                            <label>Cliente:</label>
                            <span>{cargaData.nombre_cliente}</span>
                        </div>
                        
                        {/* 📍 DESTINO: Dirección de entrega */}
                        <div className="detail-group">
                            <label>Destino:</label>
                            <span>{cargaData.direccion_destino}</span>
                        </div>
                        
                        {/* 📅 FECHA: Cuándo se creó/envió la carga */}
                        <div className="detail-group">
                            <label>Fecha de Envío:</label>
                            {/* 🌍 FORMATEO DE FECHA: Convertimos ISO a formato legible español */}
                            <span>{new Date(cargaData.fecha_creacion).toLocaleDateString('es-ES')}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 🎬 BOTONES DE ACCIÓN: Acciones principales que el usuario puede ejecutar */}
            <div className="action-buttons">
                
                {/* 📍 BOTÓN DE SEGUIMIENTO: Abre modal con timeline del envío */}
                <button 
                    className="btn-secondary"
                    onClick={cargarSeguimiento}           // Ejecuta función del hook
                    disabled={loadingSeguimiento}        // Se desactiva mientras carga
                >
                    {/* 🔄 TEXTO DINÁMICO: Cambia según el estado de loading */}
                    {loadingSeguimiento ? 'Cargando...' : 'Ver Seguimiento'}
                </button>
                
                {/* 🔐 BOTÓN PRINCIPAL: Navega a vista completa protegida */}
                <button 
                    className="btn-primary"
                    onClick={verVistaCompleta}           // Redirige a página con autenticación
                >
                    Ver Detalles Completos
                </button>
                
                {/* 📤 BOTÓN DE COMPARTIR: Usa Web Share API o clipboard */}
                <button 
                    className="btn-outline"
                    onClick={compartirQR}                // Activa función de compartir
                >
                    Compartir
                </button>
            </div>

            {/* Modal de seguimiento */}
            {mostrandoSeguimiento && seguimientoData && (
                <div className="modal-overlay" onClick={() => setMostrandoSeguimiento(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Estado del Seguimiento</h3>
                            <button 
                                className="modal-close"
                                onClick={() => setMostrandoSeguimiento(false)}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="seguimiento-timeline">
                            {seguimientoData.estados?.map((estado, index) => (
                                <div key={index} className={\`timeline-item \${estado.actual ? 'active' : ''}\`}>
                                    <div className="timeline-dot"></div>
                                    <div className="timeline-content">
                                        <h4>{estado.nombre}</h4>
                                        <p>{estado.descripcion}</p>
                                        {estado.fecha && (
                                            <small>{new Date(estado.fecha).toLocaleString('es-ES')}</small>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 📞 FOOTER: Información de contacto y copyright */}
            <div className="qr-landing-footer">
                {/* 📝 COPYRIGHT: Información legal de la empresa */}
                <p>© 2024 888Cargo - Sistema de Gestión Logística</p>
                
                {/* ☎️ CONTACTO: Enlace directo para llamar (especialmente útil en móviles) */}
                <p>¿Necesitas ayuda? <a href="tel:+1234567890">Contactar Soporte</a></p>
            </div>
        </div>
    );
};

// 📤 EXPORTACIÓN: Hace disponible el componente para importar en otros archivos
export default QRLanding;
```

---

## 🎨 **PASO 5: CREAR LOS ESTILOS CSS**

> **📝 Explicación del Paso**: Los estilos CSS definen la apariencia visual de nuestro componente. Este archivo incluye diseño responsive, gradientes modernos, y microinteracciones para una UX optimizada.

### 📂 **Archivo**: `src/styles/pages/QRLanding.css`

```css
/* 
🎨 ESTILOS PARA QR LANDING PAGE
====================================
Archivo de estilos específicos para la página de aterrizaje de códigos QR.
Incluye diseño responsive, gradientes, y componentes modulares.
*/

/* 📱 CONTENEDOR PRINCIPAL: Configuración base de la página completa */
.qr-landing-container {
    min-height: 100vh;        /* Altura mínima: pantalla completa */
    
    /* 🌈 GRADIENTE DE FONDO: Colores profesionales y modernos */
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    
    padding: 20px;            /* Espaciado interno para todo el contenido */
    
    /* 🖋️ TIPOGRAFÍA: Stack de fuentes system-first para mejor rendimiento */
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.qr-landing-header {
    text-align: center;
    color: white;
    margin-bottom: 30px;
}

.qr-landing-header .logo {
    height: 60px;
    margin-bottom: 15px;
}

.qr-landing-header h1 {
    font-size: 2.2rem;
    font-weight: 300;
    margin: 0;
}

/* Cards */
.articulo-card,
.carga-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    margin: 20px auto;
    max-width: 600px;
    overflow: hidden;
}

.articulo-header {
    background: linear-gradient(135deg, #4CAF50, #45a049);
    color: white;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.articulo-header h2 {
    margin: 0;
    font-size: 1.5rem;
}

.qr-code-badge {
    background: rgba(255, 255, 255, 0.2);
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: bold;
}

.carga-card h3 {
    background: #f8f9fa;
    margin: 0;
    padding: 15px 20px;
    border-bottom: 1px solid #e9ecef;
    color: #495057;
    font-size: 1.2rem;
}

/* Details */
.articulo-details,
.carga-details {
    padding: 20px;
}

.detail-group {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;
}

.detail-group:last-child {
    border-bottom: none;
}

.detail-group label {
    font-weight: 600;
    color: #666;
    font-size: 0.95rem;
}

.detail-group span {
    font-weight: 500;
    color: #333;
}

.codigo-carga {
    background: #e3f2fd;
    padding: 4px 8px;
    border-radius: 4px;
    font-family: monospace;
    color: #1976d2;
}

/* Action Buttons */
.action-buttons {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin: 30px auto;
    max-width: 600px;
    flex-wrap: wrap;
}

.btn-primary,
.btn-secondary,
.btn-outline {
    padding: 12px 24px;
    border-radius: 8px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.95rem;
    min-width: 140px;
}

.btn-primary {
    background: #4CAF50;
    color: white;
}

.btn-primary:hover {
    background: #45a049;
    transform: translateY(-2px);
}

.btn-secondary {
    background: #2196F3;
    color: white;
}

.btn-secondary:hover {
    background: #1976D2;
}

.btn-outline {
    background: transparent;
    color: white;
    border: 2px solid white;
}

.btn-outline:hover {
    background: white;
    color: #333;
}

/* Modal */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
}

.modal-content {
    background: white;
    border-radius: 12px;
    max-width: 500px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
    margin: 0;
    color: #333;
}

.modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #666;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Timeline */
.seguimiento-timeline {
    padding: 20px;
}

.timeline-item {
    display: flex;
    margin-bottom: 20px;
    position: relative;
}

.timeline-item:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 10px;
    top: 30px;
    width: 2px;
    height: calc(100% + 10px);
    background: #e9ecef;
}

.timeline-item.active .timeline-dot {
    background: #4CAF50;
}

.timeline-item.active::after {
    background: #4CAF50;
}

.timeline-dot {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #ddd;
    margin-right: 15px;
    flex-shrink: 0;
    margin-top: 2px;
}

.timeline-content h4 {
    margin: 0 0 5px 0;
    color: #333;
    font-size: 1rem;
}

.timeline-content p {
    margin: 0 0 5px 0;
    color: #666;
    font-size: 0.9rem;
}

.timeline-content small {
    color: #999;
    font-size: 0.8rem;
}

/* Error States */
.qr-landing-error {
    display: flex;
    align-items: center;
    justify-content: center;
}

.error-content {
    background: white;
    padding: 40px;
    border-radius: 12px;
    text-align: center;
    max-width: 400px;
}

.error-icon {
    font-size: 4rem;
    margin-bottom: 20px;
}

.error-content h2 {
    color: #333;
    margin-bottom: 15px;
}

.error-content p {
    color: #666;
    margin-bottom: 25px;
    line-height: 1.5;
}

.error-actions {
    display: flex;
    justify-content: center;
}

/* Footer */
.qr-landing-footer {
    text-align: center;
    color: rgba(255, 255, 255, 0.8);
    margin-top: 40px;
    font-size: 0.9rem;
}

.qr-landing-footer a {
    color: white;
    text-decoration: underline;
}

/* Responsive */
@media (max-width: 768px) {
    .qr-landing-container {
        padding: 15px;
    }
    
    .qr-landing-header h1 {
        font-size: 1.8rem;
    }
    
    .action-buttons {
        flex-direction: column;
        align-items: center;
    }
    
    .btn-primary,
    .btn-secondary,
    .btn-outline {
        width: 100%;
        max-width: 280px;
    }
    
    .detail-group {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }
    
    .modal-content {
        margin: 10px;
        max-height: 90vh;
    }
}

@media (max-width: 480px) {
    .articulo-header {
        flex-direction: column;
        gap: 10px;
        text-align: center;
    }
    
    .qr-code-badge {
        align-self: center;
    }
}
```

---

## 🔗 **PASO 6: AÑADIR LA RUTA EN APP.JSX**

> **📝 Explicación del Paso**: En React Router, todas las rutas de la aplicación se definen en un lugar central. Aquí integramos nuestra nueva página QR Landing como una ruta pública accesible sin autenticación.

### 📂 **Modificar**: `src/App.jsx`

```jsx
// ⚛️ REACT: Biblioteca principal
import React from 'react';

// 🛣️ REACT ROUTER: Componentes para manejo de rutas del lado cliente
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// 📄 PÁGINAS EXISTENTES: Todas las páginas de la aplicación
import AuthPage from "./pages/Auth.jsx";                    // Página de login/registro
import Dashboard from "./components/Dashboard.jsx";          // Panel principal
import QRScanner from "./components/QRScanner.jsx";          // Escáner de códigos QR
import RecuperarWhatsapp from "./components/RecuperarWhatsapp.jsx";  // Recuperar contraseña
import ResetPassword from "./components/ResetPassword.jsx";   // Resetear contraseña
import ProtectedRoute from './components/ProtectedRoute.jsx'; // Wrapper de autenticación
import CrearCarga from "./components/CrearCarga.jsx";        // Crear nueva carga
import VisualizarQR from "./pages/VisualizarQR.jsx";        // Vista de QR generados
import PackingListDetail from "./pages/PackingListDetail.jsx"; // Detalles de packing list
import Documentacion from "./pages/Documentacion.jsx";       // Página de documentación

// ✅ NUEVA IMPORTACIÓN: Nuestra página de aterrizaje para códigos QR
import QRLanding from "./pages/QRLanding.jsx";

// 🏗️ COMPONENTE PRINCIPAL: Define toda la estructura de rutas de la aplicación
function App() {
  return (
    // 🌐 BROWSER ROUTER: Habilita routing del lado cliente usando HTML5 History API
    <BrowserRouter>
      <Routes>
        
        {/* 🏠 RUTA RAÍZ: Redirección automática a página de autenticación */}
        <Route path="/" element={<Navigate to="/auth" replace />} />
        
        {/* 🔓 RUTAS PÚBLICAS: Accesibles sin autenticación */}
        
        {/* 🔐 Página de login y registro */}
        <Route path="/auth" element={<AuthPage />} />
        
        {/* 📱 Recuperación de contraseña vía WhatsApp */}
        <Route path="/recuperar-password" element={<RecuperarWhatsapp />} />
        
        {/* 🔑 Reset de contraseña con token */}
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* ✅ NUEVA RUTA PÚBLICA: Landing page para códigos QR */}
        {/* 📍 Patrón: /qr-landing/ART-2024-001 donde :qrCode es el parámetro dinámico */}
        <Route path="/qr-landing/:qrCode" element={<QRLanding />} />
        
        {/* 🔒 RUTAS PROTEGIDAS: Requieren autenticación JWT válida */}
        {/* 🛡️ ProtectedRoute es un wrapper que valida el token antes de mostrar contenido */}
        <Route element={<ProtectedRoute />}>
          
          {/* 📊 Panel principal del usuario autenticado */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* 👤 Perfil del usuario (reutiliza Dashboard con diferentes props) */}
          <Route path="/profile" element={<Dashboard />} />
          
          {/* 📋 Lista de tareas (reutiliza Dashboard) */}
          <Route path="/tasks" element={<Dashboard />} />
          
          {/* 📷 Escáner de códigos QR para usuarios internos */}
          <Route path="/qr-scanner" element={<QRScanner />} />
          
          {/* ➕ Formulario para crear nuevas cargas */}
          <Route path="/crear-carga" element={<CrearCarga />} />
          
          {/* 👁️ Visualización de QR generados para una carga específica */}
          <Route path="/visualizar-qr/:idCarga" element={<VisualizarQR />} />
          
          {/* 📦 Detalles completos del packing list */}
          <Route path="/packing-list/:idCarga" element={<PackingListDetail />} />
          
          {/* 📚 Documentación del sistema */}
          <Route path="/documentacion" element={<Documentacion />} />
          
        </Route>
        
        {/* 🚫 CATCH-ALL: Cualquier ruta no definida redirige a auth */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## ⚙️ **PASO 7: CREAR COMPONENTES AUXILIARES (SI ES NECESARIO)**

> **📝 Explicación del Paso**: Los componentes auxiliares son elementos reutilizables que proporcionan funcionalidad común en toda la aplicación. Siguen el principio DRY (Don't Repeat Yourself) y mantienen consistencia visual.

### 📂 **Archivo**: `src/components/LoadingSpinner.jsx`

```jsx
// ⚛️ REACT: Biblioteca principal para componentes
import React from 'react';

// 🎨 ESTILOS: CSS específico para el spinner de carga
import '../styles/components/LoadingSpinner.css';

/**
 * 🎡 COMPONENTE LOADING SPINNER
 * 
 * Componente reutilizable para mostrar estados de carga en toda la aplicación.
 * 
 * @param {string} message - Mensaje personalizable que se muestra bajo el spinner
 * @param {string} size - Tamaño del spinner: 'small', 'medium', 'large'
 * 
 * 🎯 Casos de uso:
 * - Carga inicial de páginas
 * - Peticiones a APIs
 * - Procesamiento de formularios
 * - Cualquier operación asíncrona
 */
const LoadingSpinner = ({ message = 'Cargando...', size = 'medium' }) => {
    return (
        // 📦 CONTENEDOR: Clase dinámica basada en el tamaño
        <div className={\`loading-spinner-container loading-\${size}\`}>
            
            <div className="loading-spinner">
                {/* 🌀 SPINNER VISUAL: Elemento animado CSS */}
                <div className="spinner"></div>
                
                {/* 📝 MENSAJE: Texto descriptivo de lo que se está cargando */}
                <p className="loading-message">{message}</p>
            </div>
            
        </div>
    );
};

// 📤 EXPORTACIÓN: Hace disponible el componente para reutilización
export default LoadingSpinner;
```

### 📂 **Archivo**: `src/components/ErrorMessage.jsx`

```jsx
// ⚛️ REACT: Biblioteca principal para componentes
import React from 'react';

// 🎨 ESTILOS: CSS específico para mensajes de error
import '../styles/components/ErrorMessage.css';

/**
 * ⚠️ COMPONENTE ERROR MESSAGE
 * 
 * Componente reutilizable para mostrar diferentes tipos de mensajes al usuario.
 * Proporciona consistencia visual y funcional en el manejo de errores.
 * 
 * @param {string} message - Mensaje de error a mostrar al usuario
 * @param {function|null} onRetry - Función opcional para reintentar la operación
 * @param {string} type - Tipo de mensaje: 'error', 'warning', 'info'
 * @param {boolean} showIcon - Si debe mostrar el ícono visual
 * 
 * 🎯 Casos de uso:
 * - Errores de conexión de red
 * - Errores de validación
 * - Mensajes informativos
 * - Advertencias al usuario
 */
const ErrorMessage = ({ 
    message,                    // Texto principal del error
    onRetry = null,            // Función opcional de reintentar
    type = 'error',            // Tipo de mensaje (por defecto: error)
    showIcon = true            // Mostrar ícono (por defecto: true)
}) => {
    
    // 🎭 MAPEO DE ICONOS: Diferentes emojis según el tipo de mensaje
    const icons = {
        error: '❌',       // Errores críticos
        warning: '⚠️',     // Advertencias
        info: 'ℹ️'         // Información general
    };

    return (
        // 📦 CONTENEDOR: Clase CSS dinámica basada en el tipo
        <div className={\`error-message error-\${type}\`}>
            
            {/* 🎭 ÍCONO CONDICIONAL: Solo se muestra si showIcon es true */}
            {showIcon && (
                <div className="error-icon">
                    {icons[type]}
                </div>
            )}
            
            {/* 📄 CONTENIDO PRINCIPAL: Mensaje y acción opcional */}
            <div className="error-content">
                
                {/* 📝 MENSAJE: Texto descriptivo del error */}
                <p className="error-text">{message}</p>
                
                {/* 🔄 BOTÓN REINTENTAR: Solo se muestra si se proporciona función onRetry */}
                {onRetry && (
                    <button 
                        className="error-retry-btn"
                        onClick={onRetry}              // Ejecuta la función de reintento
                    >
                        Reintentar
                    </button>
                )}
                
            </div>
        </div>
    );
};

// 📤 EXPORTACIÓN: Hace disponible el componente para reutilización
export default ErrorMessage;
```

---

## 🔧 **PASO 8: IMPLEMENTAR EN EL BACKEND (API ENDPOINTS)**

> **📝 Explicación del Paso**: El backend debe proporcionar los endpoints que el frontend consume. Estos endpoints manejan la lógica de negocio, acceso a base de datos, y respuestas estructuradas para el cliente.

### 📂 **Backend**: `routes/qrRoutes.js`

```javascript
// 🚀 EXPRESS: Framework web para Node.js
const express = require('express');

// 🛣️ ROUTER: Instancia para manejar rutas modulares
const router = express.Router();

// 🎮 CONTROLADOR: Importamos la lógica de negocio para QR
const QRController = require('../controllers/qrController');

/**
 * 📍 RUTAS PARA FUNCIONALIDADES DE CÓDIGO QR
 * 
 * Todas las rutas aquí definidas tendrán el prefijo /api/qr/
 * (configurado en el archivo principal del servidor)
 */

// 🌐 RUTA PÚBLICA: Obtener información de artículo por código QR
// GET /api/qr/landing/:qrCode
// 🔓 Sin autenticación - accesible desde enlaces QR públicos
router.get('/landing/:qrCode', QRController.obtenerInformacionLanding);

// 📊 RUTA DE ANALYTICS: Registrar visualización de QR para estadísticas
// POST /api/qr/analytics/view
// 🔓 Sin autenticación - debe ser accesible desde QR públicos
router.post('/analytics/view', QRController.registrarVisualizacion);

// 📤 EXPORTACIÓN: Hace disponible el router para usar en el servidor principal
module.exports = router;
```

### 📂 **Backend**: `controllers/qrController.js`

```javascript
// 🔧 SERVICIO: Importamos la capa de servicios que maneja la lógica de negocio
const QRService = require('../services/qrService');

/**
 * 🎮 CONTROLADOR QR
 * 
 * Capa intermedia entre las rutas y los servicios.
 * Maneja requests HTTP, validaciones básicas, y respuestas estructuradas.
 * 
 * 📋 Responsabilidades:
 * - Extraer datos de req (params, body, headers)
 * - Validar entrada básica
 * - Llamar a servicios apropiados
 * - Formatear respuestas HTTP
 * - Manejar errores y status codes
 */
const QRController = {
    
    /**
     * 📦 OBTENER INFORMACIÓN DE LANDING
     * 
     * Endpoint público para obtener datos de artículo por código QR.
     * Usado por la página de aterrizaje sin autenticación.
     * 
     * @param {Object} req - Request de Express (contiene params.qrCode)
     * @param {Object} res - Response de Express para enviar datos
     */
    async obtenerInformacionLanding(req, res) {
        try {
            // 📥 EXTRACCIÓN: Obtenemos el código QR de los parámetros de URL
            const { qrCode } = req.params;
            
            // 📡 LLAMADA AL SERVICIO: Delegamos la lógica de negocio
            const resultado = await QRService.obtenerInformacionPorQR(qrCode);
            
            // ✅ CASO ÉXITO: QR encontrado con datos válidos
            if (resultado.success) {
                res.json({
                    success: true,
                    data: resultado.data    // Contiene { articulo: {...}, carga: {...} }
                });
            } else {
                // ❌ CASO ERROR: QR no encontrado o datos inválidos
                res.status(404).json({
                    success: false,
                    message: resultado.error || 'QR no encontrado'
                });
            }
            
        } catch (error) {
            // 🚨 MANEJO DE ERRORES INESPERADOS: Errores de servidor
            console.error('Error en obtenerInformacionLanding:', error);
            
            // 🔥 RESPUESTA DE ERROR 500: Error interno del servidor
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    },

    /**
     * 📊 REGISTRAR VISUALIZACIÓN
     * 
     * Endpoint para guardar analytics de visualizaciones de QR.
     * No afecta la funcionalidad principal si falla.
     * 
     * @param {Object} req - Request con datos de analytics en body
     * @param {Object} res - Response para confirmar registro
     */
    async registrarVisualizacion(req, res) {
        try {
            // 📥 DESTRUCTURING: Extraemos datos del cuerpo de la request
            const { qrCode, timestamp, ...metadata } = req.body;
            
            // 🔍 ENRIQUECIMIENTO: Agregamos datos del contexto HTTP
            await QRService.registrarVisualizacion({
                qrCode,                          // Código QR visualizado
                timestamp,                       // Momento de visualización
                ip: req.ip,                     // IP del usuario (para geolocalización)
                userAgent: req.get('User-Agent'), // Navegador/dispositivo usado
                ...metadata                     // Metadata adicional del frontend
            });
            
            // ✅ RESPUESTA SIMPLE: Confirmamos que se guardó correctamente
            res.json({ success: true });
            
        } catch (error) {
            // ⚠️ ERROR SILENCIOSO: Analytics no debe afectar la UX
            console.error('Error registrando visualización:', error);
            
            // 🔥 RESPUESTA DE ERROR: Informamos el problema pero no es crítico
            res.status(500).json({
                success: false,
                message: 'Error registrando visualización'
            });
        }
    }
};

// 📤 EXPORTACIÓN: Hace disponible el controlador para las rutas
module.exports = QRController;
```

---

## 📋 **RESUMEN DEL PROCESO COMPLETO**

### ✅ **Checklist de Desarrollo:**

**1. Planificación y Diseño**
- [ ] Definir funcionalidad y requisitos
- [ ] Diseñar la estructura de datos necesaria
- [ ] Crear wireframes/mockups (opcional)

**2. Desarrollo Backend (API)**
- [ ] Crear endpoints necesarios en el backend
- [ ] Implementar controladores
- [ ] Crear servicios de lógica de negocio
- [ ] Probar endpoints con Postman/Thunder Client

**3. Desarrollo Frontend - Servicios**
- [ ] Crear servicio para comunicación con API
- [ ] Implementar manejo de errores
- [ ] Añadir funciones auxiliares necesarias

**4. Desarrollo Frontend - Hook Custom**
- [ ] Crear custom hook con lógica de estado
- [ ] Implementar efectos y ciclo de vida
- [ ] Añadir funciones de acción/navegación

**5. Desarrollo Frontend - Componente**
- [ ] Crear componente principal de la página
- [ ] Implementar UI y lógica de presentación
- [ ] Manejar estados de carga y error

**6. Estilos y UX**
- [ ] Crear archivos CSS específicos
- [ ] Implementar diseño responsive
- [ ] Añadir transiciones y microinteracciones

**7. Integración y Rutas**
- [ ] Añadir ruta en App.jsx
- [ ] Configurar navegación entre componentes
- [ ] Probar flujos de usuario completos

**8. Testing y Optimización**
- [ ] Probar funcionalidad completa
- [ ] Verificar responsive design
- [ ] Optimizar performance si es necesario
- [ ] Documentar la nueva funcionalidad

---

## 🎯 **PATRONES Y MEJORES PRÁCTICAS IDENTIFICADAS**

### 🏗️ **Arquitectura del Sistema**
1. **Separación de Responsabilidades**: Services ↔ Hooks ↔ Components
2. **Custom Hooks**: Encapsular lógica reutilizable
3. **Error Handling**: Manejo consistente en todas las capas
4. **Loading States**: UX optimizada con estados de carga

### 📝 **Convenciones de Nombres**
- **Páginas**: PascalCase (ej: `QRLanding.jsx`)
- **Componentes**: PascalCase (ej: `LoadingSpinner.jsx`)
- **Hooks**: camelCase con prefijo 'use' (ej: `useQRLanding.js`)
- **Servicios**: camelCase con sufijo 'Service' (ej: `qrLandingService.js`)
- **Estilos**: Carpetas organizadas por tipo (`pages/`, `components/`)

### 🔄 **Flujo de Datos**
```
URL params → Hook → Service → API → Backend
                ↓
Component ← Hook ← Service ← API ← Backend
```

---

**¡Con esta guía tienes todo lo necesario para crear cualquier nueva funcionalidad siguiendo la arquitectura actual del sistema 888Cargo Web!** 🚀