# 📱 Guía Completa: Desarrollo de la App Móvil 888Cargo

## 📋 Arquitectura Actual de la App Móvil

### 🏗️ **Estructura del Proyecto**
```
888Cargo/
├── app/                    # Páginas con Expo Router (file-based routing)
│   ├── (tabs)/            # Rutas con tabs de navegación
│   ├── login.tsx          # Página de login
│   ├── register.tsx       # Página de registro
│   └── _layout.tsx        # Layout principal de la app
├── components/            # Componentes reutilizables de React Native
├── hooks/                 # Custom hooks para lógica reutilizable
├── services/             # Servicios de API y lógica de negocio
├── constants/            # Constantes y configuración
├── assets/               # Imágenes, fuentes y recursos
├── styles/               # Archivos de estilos organizados
└── utils/                # Utilidades generales
```

### ⚙️ **Stack Tecnológico de la App Móvil**
- **Framework**: React Native 0.79.5
- **Plataforma**: Expo SDK ~53.0.22
- **Routing**: Expo Router ~5.1.5 (file-based)
- **Navigation**: React Navigation v7.x
- **HTTP Client**: Fetch API con wrapper personalizado
- **Storage**: Expo Secure Store + AsyncStorage
- **Estado**: React Hooks + Context API
- **TypeScript**: ~5.8.3
- **Animaciones**: React Native Reanimated ~3.17.4

### 🎯 **Características Principales de la App**
- ✅ **Autenticación JWT** con renovación automática
- ✅ **Navegación por tabs** para funciones principales
- ✅ **Gestión de cargas** y packing lists
- ✅ **Escáner QR** integrado
- ✅ **Almacenamiento seguro** de credenciales
- ✅ **Sincronización offline** básica
- ✅ **Diseño responsivo** para tablets y móviles

---

## 🎯 **EJEMPLO PRÁCTICO: Crear Nueva Pantalla de Tracking**

Vamos a crear una nueva pantalla para rastrear en tiempo real el estado de las cargas usando la arquitectura actual de Expo Router.

---

## 📝 **PASO 1: DEFINIR LA FUNCIONALIDAD**

### 🎨 **Especificaciones de la Pantalla de Tracking:**

#### 🛣️ **Routing y Navegación:**
- **Archivo de ruta**: `app/tracking/[cargaId].tsx`
- **URL interna**: `tracking/12345` (donde 12345 es el ID de la carga)
- **Navegación desde**: Dashboard, Lista de cargas, Notificaciones push
- **Tipo**: Pantalla modal con stack navigation

#### ⚙️ **Funcionalidades:**
- **Mostrar ubicación actual** de la carga en mapa
- **Timeline de estados** con iconografía visual
- **Notificaciones push** cuando cambia el estado
- **Información de contacto** del transportista
- **ETA (tiempo estimado)** de llegada
- **Compartir tracking** con clientes

---

## 🛠️ **PASO 2: CREAR EL SERVICIO DE TRACKING**

> **📝 Explicación del Paso**: En React Native, los servicios manejan la comunicación con APIs y la lógica de negocio. Este archivo centraliza todas las operaciones relacionadas con tracking de cargas.

### 📂 **Archivo**: `services/trackingService.ts`

```typescript
// 🌐 Importamos la configuración de API de la app
import { api, withAuth } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 📍 Tipos TypeScript para tracking
interface TrackingLocation {
    latitude: number;
    longitude: number;
    timestamp: string;
    address?: string;
}

interface TrackingState {
    id: string;
    name: string;
    description: string;
    timestamp: string;
    location?: TrackingLocation;
    isActive: boolean;
}

interface TrackingData {
    cargaId: string;
    codigoCarga: string;
    estadoActual: TrackingState;
    historialEstados: TrackingState[];
    ubicacionActual?: TrackingLocation;
    eta?: string;
    transportista?: {
        nombre: string;
        telefono: string;
        empresa: string;
    };
    ruta?: TrackingLocation[];
}

/**
 * 🚚 SERVICIO DE TRACKING
 * 
 * Maneja toda la lógica relacionada con el seguimiento de cargas:
 * - Obtención de datos de tracking en tiempo real
 * - Cache local para offline
 * - Subscripción a notificaciones push
 * - Compartir información de tracking
 */
const trackingService = {
    
    /**
     * 📍 OBTENER DATOS DE TRACKING: Información completa de una carga
     * 
     * @param {string} cargaId - ID único de la carga a rastrear
     * @returns {Promise<Object>} Datos completos de tracking
     * 
     * 🔄 Flujo: App → Service → API → Backend → GPS/Tracking System
     */
    async obtenerTrackingDeCarga(cargaId: string): Promise<{ success: boolean; data?: TrackingData; error?: string }> {
        try {
            console.log('📍 [Tracking] Obteniendo datos para carga:', cargaId);
            
            // 🔐 Obtener token de autenticación del almacenamiento seguro
            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
                return { success: false, error: 'No hay sesión activa' };
            }
            
            // 📡 Llamada a la API con autenticación
            const response = await api.get(
                \`/api/tracking/carga/\${cargaId}\`,
                withAuth(token)
            );
            
            // ✅ ÉXITO: Procesar y cachear datos
            if (response.success) {
                // 💾 Guardar en cache local para uso offline
                await AsyncStorage.setItem(
                    \`tracking_\${cargaId}\`,
                    JSON.stringify(response.data)
                );
                
                return {
                    success: true,
                    data: response.data
                };
            } else {
                return {
                    success: false,
                    error: response.message || 'Error al obtener tracking'
                };
            }
            
        } catch (error) {
            console.error('❌ [Tracking] Error obteniendo datos:', error);
            
            // 🔄 FALLBACK: Intentar cargar datos del cache local
            try {
                const cachedData = await AsyncStorage.getItem(\`tracking_\${cargaId}\`);
                if (cachedData) {
                    console.log('📱 [Tracking] Usando datos del cache local');
                    return {
                        success: true,
                        data: JSON.parse(cachedData)
                    };
                }
            } catch (cacheError) {
                console.warn('⚠️ [Tracking] No hay datos en cache:', cacheError);
            }
            
            return {
                success: false,
                error: 'Error de conexión. Verifica tu internet.'
            };
        }
    },

    /**
     * 🔄 SUSCRIPCIÓN EN TIEMPO REAL: WebSocket o polling para actualizaciones
     * 
     * @param {string} cargaId - ID de la carga a monitorear
     * @param {function} onUpdate - Callback que recibe las actualizaciones
     * @returns {function} Función para cancelar la suscripción
     */
    async suscribirseAActualizaciones(
        cargaId: string, 
        onUpdate: (data: TrackingData) => void
    ): Promise<() => void> {
        console.log('🔔 [Tracking] Iniciando suscripción para carga:', cargaId);
        
        // 📡 POLLING: Obtener actualizaciones cada 30 segundos
        const intervalId = setInterval(async () => {
            try {
                const result = await this.obtenerTrackingDeCarga(cargaId);
                if (result.success && result.data) {
                    onUpdate(result.data);
                }
            } catch (error) {
                console.warn('⚠️ [Tracking] Error en polling:', error);
            }
        }, 30000); // 30 segundos
        
        // 🛑 FUNCIÓN DE CANCELACIÓN: Para limpiar cuando el componente se desmonte
        return () => {
            console.log('🔕 [Tracking] Cancelando suscripción');
            clearInterval(intervalId);
        };
    },

    /**
     * 🗺️ CALCULAR DISTANCIA Y ETA: Estimaciones basadas en GPS
     * 
     * @param {TrackingLocation} origen - Ubicación actual
     * @param {TrackingLocation} destino - Destino final
     * @returns {Promise<Object>} Distancia y tiempo estimado
     */
    async calcularETA(
        origen: TrackingLocation, 
        destino: TrackingLocation
    ): Promise<{ distancia: number; tiempoEstimado: string }> {
        try {
            // 📐 Usar API de Google Maps o similar para cálculo preciso
            // Por simplicidad, usamos cálculo básico de distancia
            const distancia = this.calcularDistanciaHaversine(origen, destino);
            
            // ⏱️ Estimación básica: 60 km/h promedio
            const tiempoEnHoras = distancia / 60;
            const horas = Math.floor(tiempoEnHoras);
            const minutos = Math.round((tiempoEnHoras - horas) * 60);
            
            return {
                distancia: Math.round(distancia),
                tiempoEstimado: \`\${horas}h \${minutos}m\`
            };
        } catch (error) {
            console.error('❌ [Tracking] Error calculando ETA:', error);
            return {
                distancia: 0,
                tiempoEstimado: 'No disponible'
            };
        }
    },

    /**
     * 📤 COMPARTIR TRACKING: Generar enlace público para clientes
     * 
     * @param {string} cargaId - ID de la carga
     * @returns {Promise<string>} URL pública de tracking
     */
    async generarEnlacePublico(cargaId: string): Promise<string> {
        try {
            const token = await AsyncStorage.getItem('authToken');
            
            const response = await api.post(
                \`/api/tracking/share\`,
                { cargaId },
                withAuth(token!)
            );
            
            // 🔗 Generar URL pública que apunta al QR Landing del web
            const publicUrl = \`https://888cargo.com/tracking/\${response.trackingToken}\`;
            
            console.log('📤 [Tracking] Enlace público generado:', publicUrl);
            return publicUrl;
            
        } catch (error) {
            console.error('❌ [Tracking] Error generando enlace:', error);
            throw new Error('No se pudo generar el enlace de compartir');
        }
    },

    /**
     * 📐 UTILIDAD: Calcular distancia entre dos puntos GPS
     * Usa la fórmula de Haversine para cálculos precisos en la Tierra
     */
    calcularDistanciaHaversine(punto1: TrackingLocation, punto2: TrackingLocation): number {
        const R = 6371; // Radio de la Tierra en km
        
        const dLat = (punto2.latitude - punto1.latitude) * (Math.PI / 180);
        const dLon = (punto2.longitude - punto1.longitude) * (Math.PI / 180);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                 Math.cos(punto1.latitude * (Math.PI / 180)) * 
                 Math.cos(punto2.latitude * (Math.PI / 180)) *
                 Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distancia en km
    }
};

// 📤 Exportar servicio para uso en hooks y componentes
export default trackingService;
export type { TrackingData, TrackingState, TrackingLocation };
```

---

## 🎣 **PASO 3: CREAR EL CUSTOM HOOK**

> **📝 Explicación del Paso**: Los custom hooks en React Native encapsulan la lógica de estado y efectos específicos de la funcionalidad. Este hook maneja todo lo relacionado con tracking: datos, suscripciones, y acciones.

### 📂 **Archivo**: `hooks/useTracking.ts`

```typescript
// ⚛️ HOOKS DE REACT: Para manejo de estado y efectos
import { useState, useEffect, useCallback, useRef } from 'react';

// 📍 SERVICIOS: Nuestro servicio de tracking
import trackingService, { TrackingData, TrackingLocation } from '../services/trackingService';

// 📱 REACT NATIVE: Para compartir contenido nativo
import { Share } from 'react-native';

// 🔔 EXPO: Para notificaciones y haptics
import * as Haptics from 'expo-haptics';

/**
 * 🎣 CUSTOM HOOK PARA TRACKING
 * 
 * Encapsula toda la lógica relacionada con el seguimiento de cargas:
 * - Estado de los datos de tracking
 * - Suscripción a actualizaciones en tiempo real
 * - Acciones del usuario (compartir, actualizar, etc.)
 * - Manejo de errores y estados de carga
 * 
 * @param {string} cargaId - ID de la carga a rastrear
 */
export const useTracking = (cargaId: string) => {
    
    // 🗂️ ESTADOS PRINCIPALES: Datos core del tracking
    
    // 📦 Datos completos de tracking de la carga
    const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
    
    // ⏳ Estado de carga inicial
    const [loading, setLoading] = useState<boolean>(true);
    
    // ❌ Mensaje de error general
    const [error, setError] = useState<string | null>(null);
    
    // 🔄 Estado de actualización (para pull-to-refresh)
    const [refreshing, setRefreshing] = useState<boolean>(false);
    
    // 🔔 Flag para indicar si hay actualizaciones nuevas
    const [hasNewUpdates, setHasNewUpdates] = useState<boolean>(false);

    // 📡 REF PARA SUSCRIPCIÓN: Mantener referencia para cleanup
    const unsubscribeRef = useRef<(() => void) | null>(null);

    /**
     * 🚀 FUNCIÓN PRINCIPAL: Cargar datos iniciales de tracking
     * 
     * Se ejecuta al montar el componente y cuando se solicita actualización manual
     */
    const cargarDatosTracking = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) {
                setLoading(true);
            }
            setError(null);
            
            console.log('📍 [useTracking] Cargando datos para carga:', cargaId);
            
            // 📡 Obtener datos del servicio
            const resultado = await trackingService.obtenerTrackingDeCarga(cargaId);
            
            if (resultado.success && resultado.data) {
                // ✅ ÉXITO: Actualizar estado con los datos
                setTrackingData(resultado.data);
                
                // 📳 FEEDBACK HÁPTICO: Vibración sutil para confirmar actualización
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                
                console.log('✅ [useTracking] Datos cargados exitosamente');
            } else {
                // ❌ ERROR: Mostrar mensaje de error
                setError(resultado.error || 'Error al cargar tracking');
                console.error('❌ [useTracking] Error:', resultado.error);
            }
            
        } catch (error) {
            console.error('💥 [useTracking] Error inesperado:', error);
            setError('Error de conexión');
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    }, [cargaId]);

    /**
     * 🔄 ACTUALIZACIÓN MANUAL: Para pull-to-refresh
     * 
     * Función optimizada que no muestra loading general sino el estado refreshing
     */
    const actualizarManual = useCallback(async () => {
        setRefreshing(true);
        await cargarDatosTracking(false); // No mostrar loading principal
        setRefreshing(false);
    }, [cargarDatosTracking]);

    /**
     * 📤 COMPARTIR TRACKING: Usar el sistema nativo de compartir
     * 
     * Genera enlace público y usa la API nativa de Share de React Native
     */
    const compartirTracking = useCallback(async () => {
        try {
            if (!trackingData) return;
            
            console.log('📤 [useTracking] Generando enlace para compartir...');
            
            // 🔗 Generar enlace público
            const enlacePublico = await trackingService.generarEnlacePublico(cargaId);
            
            // 📱 COMPARTIR NATIVO: Usar sistema del dispositivo
            const result = await Share.share({
                message: \`Puedes rastrear tu carga "\${trackingData.codigoCarga}" en tiempo real desde este enlace: \${enlacePublico}\`,
                url: enlacePublico, // En iOS aparece como enlace separado
                title: \`Tracking de Carga \${trackingData.codigoCarga}\`
            });
            
            if (result.action === Share.sharedAction) {
                console.log('✅ [useTracking] Enlace compartido exitosamente');
                
                // 📳 FEEDBACK: Vibración de éxito
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            
        } catch (error) {
            console.error('❌ [useTracking] Error compartiendo:', error);
            setError('No se pudo compartir el enlace');
        }
    }, [trackingData, cargaId]);

    /**
     * 📍 CALCULAR INFORMACIÓN DE UBICACIÓN: ETA y distancia
     * 
     * Función memoizada que calcula datos derivados de la ubicación actual
     */
    const infoUbicacion = useCallback(() => {
        if (!trackingData?.ubicacionActual || !trackingData?.ruta) {
            return null;
        }
        
        // 🎯 Obtener destino final de la ruta
        const destino = trackingData.ruta[trackingData.ruta.length - 1];
        
        if (!destino) return null;
        
        // 📐 Calcular distancia usando el servicio
        const distancia = trackingService.calcularDistanciaHaversine(
            trackingData.ubicacionActual,
            destino
        );
        
        return {
            distanciaRestante: Math.round(distancia),
            destinoFinal: destino.address || 'Destino'
        };
        
    }, [trackingData]);

    // ⚡ EFFECT: Cargar datos iniciales al montar
    useEffect(() => {
        if (cargaId) {
            cargarDatosTracking();
        }
    }, [cargaId, cargarDatosTracking]);

    // 🔔 EFFECT: Suscribirse a actualizaciones en tiempo real
    useEffect(() => {
        if (!cargaId || !trackingData) return;
        
        console.log('🔔 [useTracking] Iniciando suscripción a actualizaciones...');
        
        // 📡 Crear suscripción
        const iniciarSuscripcion = async () => {
            try {
                const unsubscribe = await trackingService.suscribirseAActualizaciones(
                    cargaId,
                    (nuevosdatos: TrackingData) => {
                        console.log('🆕 [useTracking] Nueva actualización recibida');
                        
                        // 🔍 Verificar si realmente hay cambios
                        if (trackingData.estadoActual.id !== nuevosdatos.estadoActual.id) {
                            setHasNewUpdates(true);
                            
                            // 📳 NOTIFICACIÓN HÁPTICA: Cambio importante
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        }
                        
                        // 🔄 Actualizar datos
                        setTrackingData(nuevosdatos);
                    }
                );
                
                // 💾 Guardar función de cancelación
                unsubscribeRef.current = unsubscribe;
                
            } catch (error) {
                console.error('❌ [useTracking] Error en suscripción:', error);
            }
        };
        
        iniciarSuscripcion();
        
        // 🧹 CLEANUP: Cancelar suscripción al desmontar
        return () => {
            if (unsubscribeRef.current) {
                console.log('🧹 [useTracking] Limpiando suscripción...');
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
        
    }, [cargaId, trackingData]);

    /**
     * 🔕 MARCAR ACTUALIZACIONES COMO VISTAS
     * 
     * Función para limpiar el flag de nuevas actualizaciones
     */
    const marcarComoVisto = useCallback(() => {
        setHasNewUpdates(false);
    }, []);

    /**
     * ❌ LIMPIAR ERROR
     * 
     * Función para limpiar errores manualmente
     */
    const limpiarError = useCallback(() => {
        setError(null);
    }, []);

    // 📤 RETORNO: Estados y funciones expuestas al componente
    return {
        // 🗂️ DATOS PRINCIPALES
        trackingData,           // Datos completos de tracking
        loading,               // Estado de carga inicial
        error,                 // Mensaje de error actual
        refreshing,            // Estado de actualización manual
        hasNewUpdates,         // Flag de actualizaciones nuevas
        
        // 📊 DATOS CALCULADOS
        infoUbicacion: infoUbicacion(), // Información de ubicación procesada
        
        // 🎬 ACCIONES DISPONIBLES
        actualizarManual,      // Función para pull-to-refresh
        compartirTracking,     // Compartir enlace público
        marcarComoVisto,       // Limpiar flag de nuevas actualizaciones
        limpiarError,          // Limpiar errores
        recargar: cargarDatosTracking // Recargar datos completos
    };
};

/**
 * 🎣 HOOK SIMPLIFICADO: Solo para verificar si hay tracking activo
 * 
 * Útil para mostrar badges o indicadores en otras pantallas
 */
export const useHasActiveTracking = (cargaId: string): boolean => {
    const [hasActive, setHasActive] = useState(false);
    
    useEffect(() => {
        const verificar = async () => {
            try {
                const resultado = await trackingService.obtenerTrackingDeCarga(cargaId);
                setHasActive(resultado.success && !!resultado.data);
            } catch {
                setHasActive(false);
            }
        };
        
        if (cargaId) {
            verificar();
        }
    }, [cargaId]);
    
    return hasActive;
};
```

---

## 🎨 **PASO 4: CREAR LA PANTALLA (PÁGINA)**

> **📝 Explicación del Paso**: En Expo Router, las pantallas se crean como archivos TypeScript/JSX en la carpeta `app/`. Esta pantalla usa componentes nativos de React Native para una experiencia móvil optimizada.

### 📂 **Archivo**: `app/tracking/[cargaId].tsx`

```tsx
// ⚛️ REACT: Biblioteca principal para componentes
import React from 'react';

// 📱 REACT NATIVE: Componentes nativos para la interfaz móvil
import {
    View,
    Text,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Alert,
    Linking,
    Dimensions,
    Platform,
    StatusBar
} from 'react-native';

// 🧭 EXPO ROUTER: Para navegación y parámetros de URL
import { useLocalSearchParams, Stack, router } from 'expo-router';

// 🎭 EXPO ICONS: Iconos vectoriales nativos
import { Ionicons } from '@expo/vector-icons';

// 📳 EXPO MODULES: Funcionalidades nativas del dispositivo
import * as Haptics from 'expo-haptics';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

// 🎣 CUSTOM HOOKS: Nuestro hook de tracking y otros
import { useTracking } from '../../hooks/useTracking';
import { useColorScheme } from '../../hooks/useColorScheme';

// 🎨 COMPONENTES: Componentes reutilizables de la app
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import LoadingSpinner from '../../components/LoadingSpinner';

// 🎨 ESTILOS: Archivo de estilos específico
import { trackingStyles } from '../../styles/tracking.styles';

/**
 * 📍 PANTALLA DE TRACKING
 * 
 * Pantalla completa para rastrear una carga específica en tiempo real.
 * Usa Expo Router con parámetros dinámicos: /tracking/[cargaId]
 * 
 * 📱 Funcionalidades:
 * - Información en tiempo real de la carga
 * - Timeline visual de estados
 * - Mapa de ubicación (opcional)
 * - Compartir tracking con clientes
 * - Pull-to-refresh para actualizaciones
 * - Notificaciones hápticas
 */
export default function TrackingScreen() {
    
    // 🔗 PARÁMETROS DE RUTA: Extraemos el cargaId de la URL
    // Si la URL es /tracking/12345, params.cargaId será "12345"
    const params = useLocalSearchParams<{ cargaId: string }>();
    const cargaId = params.cargaId;
    
    // 🎨 TEMA: Detección de tema claro/oscuro del sistema
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    
    // 📱 DIMENSIONES: Para adaptar UI a diferentes pantallas
    const { width, height } = Dimensions.get('window');
    
    // 🎣 HOOK DE TRACKING: Toda la lógica de datos y acciones
    const {
        trackingData,
        loading,
        error,
        refreshing,
        hasNewUpdates,
        infoUbicacion,
        actualizarManual,
        compartirTracking,
        marcarComoVisto,
        limpiarError,
        recargar
    } = useTracking(cargaId);

    // 📞 FUNCIÓN: Llamar al transportista
    const llamarTransportista = async () => {
        if (!trackingData?.transportista?.telefono) {
            Alert.alert('❌ Error', 'No hay número de teléfono disponible');
            return;
        }
        
        const telefono = trackingData.transportista.telefono;
        const url = \`tel:\${telefono}\`;
        
        try {
            // 📱 ABRIR APP DE TELÉFONO: Usar Linking de React Native
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
                
                // 📳 FEEDBACK HÁPTICO: Confirmar acción
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } else {
                Alert.alert('❌ Error', 'No se puede realizar llamadas en este dispositivo');
            }
        } catch (error) {
            console.error('❌ Error abriendo teléfono:', error);
            Alert.alert('❌ Error', 'No se pudo abrir la aplicación de teléfono');
        }
    };

    // 🗺️ FUNCIÓN: Abrir ubicación en mapas
    const abrirEnMapas = async () => {
        if (!trackingData?.ubicacionActual) {
            Alert.alert('❌ Error', 'No hay ubicación disponible');
            return;
        }
        
        const { latitude, longitude } = trackingData.ubicacionActual;
        
        // 🗺️ URLS ESPECÍFICAS POR PLATAFORMA
        const mapUrl = Platform.select({
            ios: \`maps://app?q=\${latitude},\${longitude}\`,
            android: \`geo:\${latitude},\${longitude}?q=\${latitude},\${longitude}\`
        });
        
        try {
            if (mapUrl) {
                const supported = await Linking.canOpenURL(mapUrl);
                if (supported) {
                    await Linking.openURL(mapUrl);
                } else {
                    // 🌐 FALLBACK: Google Maps web
                    const webUrl = \`https://maps.google.com/?q=\${latitude},\${longitude}\`;
                    await Linking.openURL(webUrl);
                }
                
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
        } catch (error) {
            console.error('❌ Error abriendo mapas:', error);
            Alert.alert('❌ Error', 'No se pudo abrir la aplicación de mapas');
        }
    };

    // 🔄 RENDER CONDICIONAL 1: Estado de carga inicial
    if (loading) {
        return (
            <ThemedView style={trackingStyles.container}>
                <Stack.Screen 
                    options={{ 
                        title: 'Cargando tracking...',
                        headerBackTitle: 'Atrás'
                    }} 
                />
                <LoadingSpinner message="Obteniendo información de tracking..." />
            </ThemedView>
        );
    }

    // ❌ RENDER CONDICIONAL 2: Estado de error
    if (error) {
        return (
            <ThemedView style={trackingStyles.container}>
                <Stack.Screen 
                    options={{ 
                        title: 'Error en tracking',
                        headerBackTitle: 'Atrás'
                    }} 
                />
                
                <View style={trackingStyles.errorContainer}>
                    {/* 🚨 ICONO DE ERROR */}
                    <Ionicons 
                        name="alert-circle-outline" 
                        size={64} 
                        color={isDark ? '#ff6b6b' : '#e63946'} 
                    />
                    
                    {/* 📝 MENSAJE DE ERROR */}
                    <ThemedText style={trackingStyles.errorTitle}>
                        Error al cargar tracking
                    </ThemedText>
                    <ThemedText style={trackingStyles.errorMessage}>
                        {error}
                    </ThemedText>
                    
                    {/* 🔄 BOTONES DE ACCIÓN */}
                    <View style={trackingStyles.errorActions}>
                        <TouchableOpacity 
                            style={trackingStyles.retryButton}
                            onPress={() => {
                                limpiarError();
                                recargar();
                            }}
                        >
                            <Ionicons name="refresh" size={20} color="white" />
                            <Text style={trackingStyles.retryButtonText}>
                                Reintentar
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={trackingStyles.backButton}
                            onPress={() => router.back()}
                        >
                            <Text style={trackingStyles.backButtonText}>
                                Volver
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ThemedView>
        );
    }

    // ✅ RENDER PRINCIPAL: Contenido cuando tenemos datos
    if (!trackingData) {
        return (
            <ThemedView style={trackingStyles.container}>
                <Stack.Screen 
                    options={{ 
                        title: 'Tracking no encontrado',
                        headerBackTitle: 'Atrás'
                    }} 
                />
                <ThemedText>No se encontraron datos de tracking</ThemedText>
            </ThemedView>
        );
    }

    return (
        <>
            {/* 📱 STATUS BAR: Configuración para iOS */}
            <ExpoStatusBar style={isDark ? 'light' : 'dark'} />
            
            {/* 🧭 HEADER DE NAVEGACIÓN: Configuración dinámica */}
            <Stack.Screen 
                options={{ 
                    title: \`Carga \${trackingData.codigoCarga}\`,
                    headerBackTitle: 'Atrás',
                    headerRight: () => (
                        <TouchableOpacity 
                            onPress={compartirTracking}
                            style={{ marginRight: 8 }}
                        >
                            <Ionicons 
                                name="share-outline" 
                                size={24} 
                                color={isDark ? 'white' : 'black'} 
                            />
                        </TouchableOpacity>
                    )
                }} 
            />
            
            <ThemedView style={trackingStyles.container}>
                
                {/* 🔔 BANNER DE ACTUALIZACIONES: Solo se muestra si hay cambios nuevos */}
                {hasNewUpdates && (
                    <TouchableOpacity 
                        style={trackingStyles.updatesBanner}
                        onPress={marcarComoVisto}
                    >
                        <Ionicons name="notifications" size={20} color="white" />
                        <Text style={trackingStyles.updatesBannerText}>
                            ¡Hay actualizaciones nuevas! Toca para marcar como visto
                        </Text>
                    </TouchableOpacity>
                )}
                
                {/* 📜 SCROLL VIEW: Contenido desplazable con pull-to-refresh */}
                <ScrollView
                    style={trackingStyles.scrollContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={actualizarManual}
                            tintColor={isDark ? 'white' : 'black'}
                            title="Actualizando tracking..."
                        />
                    }
                >
                    
                    {/* 📊 TARJETA DE ESTADO ACTUAL */}
                    <View style={trackingStyles.statusCard}>
                        
                        <View style={trackingStyles.statusHeader}>
                            {/* 🏷️ ESTADO ACTUAL */}
                            <View style={trackingStyles.statusBadge}>
                                <Ionicons name="checkmark-circle" size={16} color="white" />
                                <Text style={trackingStyles.statusBadgeText}>
                                    {trackingData.estadoActual.name}
                                </Text>
                            </View>
                            
                            {/* ⏰ TIMESTAMP */}
                            <ThemedText style={trackingStyles.timestamp}>
                                {new Date(trackingData.estadoActual.timestamp).toLocaleString('es-ES')}
                            </ThemedText>
                        </View>
                        
                        {/* 📝 DESCRIPCIÓN DEL ESTADO */}
                        <ThemedText style={trackingStyles.statusDescription}>
                            {trackingData.estadoActual.description}
                        </ThemedText>
                        
                        {/* 📍 INFORMACIÓN DE UBICACIÓN */}
                        {infoUbicacion && (
                            <View style={trackingStyles.locationInfo}>
                                <Ionicons name="location" size={16} color="#666" />
                                <Text style={trackingStyles.locationText}>
                                    Faltan {infoUbicacion.distanciaRestante} km hasta {infoUbicacion.destinoFinal}
                                </Text>
                            </View>
                        )}
                        
                        {/* 🗺️ BOTÓN DE MAPA */}
                        {trackingData.ubicacionActual && (
                            <TouchableOpacity 
                                style={trackingStyles.mapButton}
                                onPress={abrirEnMapas}
                            >
                                <Ionicons name="map" size={20} color="white" />
                                <Text style={trackingStyles.mapButtonText}>
                                    Ver en Mapas
                                </Text>
                            </TouchableOpacity>
                        )}
                        
                    </View>
                    
                    {/* 📞 TARJETA DE CONTACTO DEL TRANSPORTISTA */}
                    {trackingData.transportista && (
                        <View style={trackingStyles.driverCard}>
                            <ThemedText style={trackingStyles.sectionTitle}>
                                Transportista
                            </ThemedText>
                            
                            <View style={trackingStyles.driverInfo}>
                                <View style={trackingStyles.driverDetails}>
                                    <ThemedText style={trackingStyles.driverName}>
                                        {trackingData.transportista.nombre}
                                    </ThemedText>
                                    <ThemedText style={trackingStyles.driverCompany}>
                                        {trackingData.transportista.empresa}
                                    </ThemedText>
                                </View>
                                
                                {/* 📞 BOTÓN DE LLAMADA */}
                                <TouchableOpacity 
                                    style={trackingStyles.callButton}
                                    onPress={llamarTransportista}
                                >
                                    <Ionicons name="call" size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    
                    {/* 📋 TIMELINE DE ESTADOS */}
                    <View style={trackingStyles.timelineCard}>
                        <ThemedText style={trackingStyles.sectionTitle}>
                            Historial de Estados
                        </ThemedText>
                        
                        {trackingData.historialEstados.map((estado, index) => (
                            <View key={estado.id} style={trackingStyles.timelineItem}>
                                
                                {/* 🔵 DOT DE TIMELINE */}
                                <View style={[
                                    trackingStyles.timelineDot,
                                    estado.isActive ? trackingStyles.timelineDotActive : null
                                ]} />
                                
                                {/* 📏 LÍNEA DE CONEXIÓN */}
                                {index < trackingData.historialEstados.length - 1 && (
                                    <View style={trackingStyles.timelineLine} />
                                )}
                                
                                {/* 📄 CONTENIDO DEL EVENTO */}
                                <View style={trackingStyles.timelineContent}>
                                    <ThemedText style={[
                                        trackingStyles.timelineTitle,
                                        estado.isActive ? trackingStyles.timelineTitleActive : null
                                    ]}>
                                        {estado.name}
                                    </ThemedText>
                                    
                                    <ThemedText style={trackingStyles.timelineDescription}>
                                        {estado.description}
                                    </ThemedText>
                                    
                                    <ThemedText style={trackingStyles.timelineTimestamp}>
                                        {new Date(estado.timestamp).toLocaleString('es-ES')}
                                    </ThemedText>
                                    
                                    {/* 📍 UBICACIÓN DEL EVENTO */}
                                    {estado.location && (
                                        <View style={trackingStyles.timelineLocation}>
                                            <Ionicons name="location-outline" size={12} color="#666" />
                                            <Text style={trackingStyles.timelineLocationText}>
                                                {estado.location.address || 'Ubicación registrada'}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>
                    
                    {/* 🎬 BOTONES DE ACCIÓN PRINCIPALES */}
                    <View style={trackingStyles.actionsContainer}>
                        
                        {/* 📤 BOTÓN COMPARTIR */}
                        <TouchableOpacity 
                            style={trackingStyles.shareButton}
                            onPress={compartirTracking}
                        >
                            <Ionicons name="share-social" size={20} color="white" />
                            <Text style={trackingStyles.shareButtonText}>
                                Compartir Tracking
                            </Text>
                        </TouchableOpacity>
                        
                        {/* 🔄 BOTÓN ACTUALIZAR */}
                        <TouchableOpacity 
                            style={trackingStyles.refreshButton}
                            onPress={actualizarManual}
                            disabled={refreshing}
                        >
                            <Ionicons 
                                name="refresh" 
                                size={20} 
                                color={refreshing ? "#ccc" : "white"} 
                            />
                            <Text style={[
                                trackingStyles.refreshButtonText,
                                refreshing ? { color: '#ccc' } : null
                            ]}>
                                {refreshing ? 'Actualizando...' : 'Actualizar'}
                            </Text>
                        </TouchableOpacity>
                        
                    </View>
                    
                    {/* 📏 ESPACIADO INFERIOR: Para que el último elemento no quede pegado al borde */}
                    <View style={{ height: 40 }} />
                    
                </ScrollView>
            </ThemedView>
        </>
    );
}
```

---

## 🎨 **PASO 5: CREAR LOS ESTILOS**

> **📝 Explicación del Paso**: React Native usa StyleSheet para optimizar los estilos. Este archivo define todos los estilos específicos de la pantalla de tracking, siguiendo las convenciones de diseño mobile-first.

### 📂 **Archivo**: `styles/tracking.styles.ts`

```typescript
// 📱 REACT NATIVE: API de estilos optimizada
import { StyleSheet, Dimensions, Platform } from 'react-native';

// 📏 DIMENSIONES: Para cálculos responsivos
const { width, height } = Dimensions.get('window');

/**
 * 🎨 ESTILOS PARA TRACKING SCREEN
 * 
 * Estilos optimizados para React Native con:
 * - Diseño responsive para diferentes tamaños de pantalla
 * - Soporte para tema claro/oscuro
 * - Optimizaciones específicas por plataforma (iOS/Android)
 * - Microinteracciones y feedback visual
 */
export const trackingStyles = StyleSheet.create({
    
    // 📦 CONTENEDORES PRINCIPALES
    
    /**
     * 🏠 CONTENEDOR RAÍZ
     * Flex: 1 hace que ocupe toda la pantalla disponible
     */
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa', // Se sobrescribe con themed colors
    },
    
    /**
     * 📜 CONTENEDOR DE SCROLL
     * Padding horizontal para que el contenido no toque los bordes
     */
    scrollContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    
    // 🔔 BANNER DE ACTUALIZACIONES
    
    /**
     * 📢 BANNER SUPERIOR PARA NOTIFICACIONES
     * Posición fixed-like en la parte superior
     */
    updatesBanner: {
        backgroundColor: '#28a745',
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        borderRadius: 8,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    
    updatesBannerText: {
        color: 'white',
        fontWeight: '500',
        marginLeft: 8,
        flex: 1,
        fontSize: 14,
    },
    
    // 📊 TARJETA DE ESTADO ACTUAL
    
    /**
     * 🎯 TARJETA PRINCIPAL DEL ESTADO
     * Elemento más prominente de la pantalla
     */
    statusCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    
    /**
     * 🏷️ HEADER DEL ESTADO
     * Contiene badge y timestamp en una fila
     */
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    
    /**
     * 🏅 BADGE DEL ESTADO ACTUAL
     * Destacado visual del estado
     */
    statusBadge: {
        backgroundColor: '#28a745',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    
    statusBadgeText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 6,
    },
    
    /**
     * ⏰ TIMESTAMP DEL ESTADO
     * Información temporal alineada a la derecha
     */
    timestamp: {
        fontSize: 12,
        color: '#666',
        textAlign: 'right',
        flex: 1,
    },
    
    /**
     * 📝 DESCRIPCIÓN DEL ESTADO
     * Texto principal explicativo
     */
    statusDescription: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 16,
        color: '#333',
    },
    
    // 📍 INFORMACIÓN DE UBICACIÓN
    
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    
    locationText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    
    /**
     * 🗺️ BOTÓN DE MAPA
     * CTA principal para abrir mapas
     */
    mapButton: {
        backgroundColor: '#007bff',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-start',
    },
    
    mapButtonText: {
        color: 'white',
        fontWeight: '600',
        marginLeft: 8,
        fontSize: 14,
    },
    
    // 👤 TARJETA DE TRANSPORTISTA
    
    /**
     * 🚛 INFORMACIÓN DEL CONDUCTOR
     * Tarjeta secundaria con datos de contacto
     */
    driverCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    
    driverDetails: {
        flex: 1,
    },
    
    driverName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    
    driverCompany: {
        fontSize: 14,
        color: '#666',
    },
    
    /**
     * 📞 BOTÓN DE LLAMADA
     * Botón circular para llamar al transportista
     */
    callButton: {
        backgroundColor: '#28a745',
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    
    // 📋 TIMELINE DE ESTADOS
    
    /**
     * 📜 CONTENEDOR DEL TIMELINE
     * Historia completa de estados de la carga
     */
    timelineCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    
    /**
     * 📍 ITEM INDIVIDUAL DEL TIMELINE
     * Cada evento en el historial
     */
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 20,
        position: 'relative',
    },
    
    /**
     * ⚪ DOT DEL TIMELINE
     * Indicador visual de cada evento
     */
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#ddd',
        marginTop: 4,
        marginRight: 16,
        zIndex: 1,
    },
    
    timelineDotActive: {
        backgroundColor: '#28a745',
        width: 16,
        height: 16,
        borderRadius: 8,
        marginTop: 2,
        borderWidth: 3,
        borderColor: '#e8f5e8',
    },
    
    /**
     * ─ LÍNEA CONECTORA DEL TIMELINE
     * Une los eventos visualmente
     */
    timelineLine: {
        position: 'absolute',
        left: 5.5,
        top: 16,
        width: 1,
        height: '100%',
        backgroundColor: '#e9ecef',
    },
    
    /**
     * 📄 CONTENIDO DEL EVENTO
     * Información detallada de cada estado
     */
    timelineContent: {
        flex: 1,
        paddingTop: 0,
    },
    
    timelineTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
        color: '#333',
    },
    
    timelineTitleActive: {
        fontWeight: '600',
        color: '#28a745',
    },
    
    timelineDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
        lineHeight: 20,
    },
    
    timelineTimestamp: {
        fontSize: 12,
        color: '#999',
        marginBottom: 8,
    },
    
    /**
     * 📍 UBICACIÓN DEL EVENTO
     * Información geográfica opcional
     */
    timelineLocation: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    
    timelineLocationText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
        fontStyle: 'italic',
    },
    
    // 🎬 BOTONES DE ACCIÓN
    
    /**
     * 🎯 CONTENEDOR DE ACCIONES PRINCIPALES
     * Botones en la parte inferior
     */
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        marginBottom: 16,
        gap: 12,
    },
    
    /**
     * 📤 BOTÓN COMPARTIR
     * Acción principal de la pantalla
     */
    shareButton: {
        backgroundColor: '#007bff',
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    
    shareButtonText: {
        color: 'white',
        fontWeight: '600',
        marginLeft: 8,
        fontSize: 16,
    },
    
    /**
     * 🔄 BOTÓN ACTUALIZAR
     * Acción secundaria
     */
    refreshButton: {
        backgroundColor: '#6c757d',
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    
    refreshButtonText: {
        color: 'white',
        fontWeight: '600',
        marginLeft: 8,
        fontSize: 16,
    },
    
    // 🚨 ESTADOS DE ERROR
    
    /**
     * ❌ CONTENEDOR DE ERROR
     * Pantalla completa para estados de error
     */
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    
    errorTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    
    errorMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    
    /**
     * 🎬 ACCIONES DE ERROR
     * Botones para recuperación
     */
    errorActions: {
        width: '100%',
        gap: 12,
    },
    
    retryButton: {
        backgroundColor: '#007bff',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    
    retryButtonText: {
        color: 'white',
        fontWeight: '600',
        marginLeft: 8,
        fontSize: 16,
    },
    
    backButton: {
        backgroundColor: 'transparent',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
        justifyContent: 'center',
    },
    
    backButtonText: {
        color: '#666',
        fontWeight: '500',
        fontSize: 16,
    },
    
    // 📝 TÍTULOS DE SECCIÓN
    
    /**
     * 🏷️ TÍTULO DE SECCIÓN
     * Headers para organizar el contenido
     */
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        color: '#333',
    },
});

/**
 * 🎨 TEMA DINÁMICO: Función helper para adaptar colores según el tema
 * 
 * @param isDark - Si el tema actual es oscuro
 * @returns Objeto con colores adaptados al tema
 */
export const getThemeColors = (isDark: boolean) => ({
    background: isDark ? '#1a1a1a' : '#f8f9fa',
    cardBackground: isDark ? '#2d2d2d' : 'white',
    textPrimary: isDark ? '#ffffff' : '#333333',
    textSecondary: isDark ? '#cccccc' : '#666666',
    textMuted: isDark ? '#999999' : '#999999',
    border: isDark ? '#404040' : '#e9ecef',
    success: '#28a745',
    primary: '#007bff',
    warning: '#ffc107',
    danger: '#dc3545',
});

/**
 * 📏 UTILIDADES RESPONSIVAS
 * 
 * Funciones helper para adaptar estilos a diferentes pantallas
 */
export const responsive = {
    // 📱 ¿Es pantalla pequeña?
    isSmallScreen: width < 375,
    
    // 📱 ¿Es tablet?
    isTablet: width >= 768,
    
    // 📏 Padding adaptativo
    paddingHorizontal: width < 375 ? 12 : 16,
    
    // 📝 Tamaño de fuente adaptativo
    fontSize: {
        small: width < 375 ? 12 : 14,
        medium: width < 375 ? 14 : 16,
        large: width < 375 ? 16 : 18,
        xlarge: width < 375 ? 18 : 20,
    }
};
```

¿Te gustaría que continúe con el resto de la guía móvil, incluyendo los pasos de integración, configuración de Expo Router, y otros patrones específicos de React Native? 🚀
