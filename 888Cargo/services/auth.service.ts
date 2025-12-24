import { API_CONFIG } from '../constants/API';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock temporal de AuthService para evitar errores de importación
type User = {
    id: string;
    name: string;
    email: string;
    phone?: string;
    country?: string;
};

export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterData {
    name: string;
    lastname?: string;
    email: string;
    password: string;
    phone?: string;
    country?: string;
}

export interface AuthResponse {
    success: boolean;
    data?: {
        user: User;
        token: string;
        refreshToken?: string;
    };
    message?: string;
    error?: string;
}

// Estado global temporal para simular persistencia
const AUTH_KEY = '__888cargo_auth__';
const STORAGE_TOKEN_KEY = '@auth:token';

declare global {
    // Extiende globalThis para incluir la propiedad AUTH_KEY
    // eslint-disable-next-line no-var
    var __888cargo_auth__: any;
}

function setAuthState(state: any) {
    globalThis[AUTH_KEY] = state;
}

function getAuthStateInternal() {
    return globalThis[AUTH_KEY] || {
        isAuthenticated: false,
        token: null,
        user: null
    };
}

const AuthService = {
    login: async (email: string, password: string): Promise<AuthResponse> => {
        try {
            console.log('🔐 [AuthService] Iniciando login real con backend...');
            console.log('🔐 [AuthService] Email:', email);
            console.log('🔗 [AuthService] URL del backend:', API_CONFIG.BASE_URL);
            
            // Primero probar conectividad básica
            try {
                console.log('🔄 [AuthService] Probando conectividad...');
                const healthResponse = await fetch(`${API_CONFIG.BASE_URL}/health`, {
                    method: 'GET'
                });
                if (healthResponse.ok) {
                    console.log('✅ [AuthService] Backend accesible');
                } else {
                    console.warn('⚠️ [AuthService] Backend responde pero con error');
                }
            } catch (connectError: any) {
                console.error('❌ [AuthService] Error de conectividad básica:', connectError);
                return { 
                    success: false, 
                    error: `No se puede conectar al servidor. Verifica:\n1. Que el backend esté ejecutándose\n2. Tu IP actual: ${API_CONFIG.BASE_URL}\n3. Que estés en la misma red WiFi\n\nError: ${connectError?.message || 'Error desconocido'}` 
                };
            }
            
            // CORREGIDO: Agregar /auth/ al endpoint
            const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'User-Agent': 'Expo-Mobile-App/1.0.0'
                },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });

            console.log(`📡 [AuthService] Login response status: ${response.status}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error de conexión' }));
                console.log('❌ [AuthService] Authentication failed:', errorData);
                return { 
                    success: false, 
                    error: errorData.message || 'Credenciales inválidas' 
                };
            }

            const userData = await response.json();
            console.log('✅ [AuthService] Login successful:', userData);
            
            // CORREGIDO: Los datos están en userData.user, no directamente en userData
            const userInfo = userData.user || userData;
            
            const user: User = {
                id: (userInfo.id || userData.id)?.toString() || '',
                name: userInfo.username || userInfo.name || userInfo.full_name || '',
                email: userInfo.email || '',
                phone: userInfo.phone || '',
                country: userInfo.country || ''
            };

            // Usar el token real del backend
            const token = userData.token || `mobile_${Date.now()}_${user.id}`;
            
            setAuthState({ 
                isAuthenticated: true, 
                token: token, 
                user,
                sessionType: 'mobile',
                loginTime: new Date().toISOString()
            });
            // Persistir token en AsyncStorage para que otras partes de la app lo detecten
            try {
                await AsyncStorage.setItem(STORAGE_TOKEN_KEY, token);
            } catch (e) {
                console.warn('[AuthService] No se pudo guardar token en AsyncStorage:', e);
            }
            
            return { 
                success: true, 
                data: { user, token } 
            };
        } catch (error: any) {
            console.error('💥 [AuthService] Error en login:', error);
            
            let errorMessage = 'Error de conexión con el servidor';
            
            if (error?.message?.includes('Network request failed')) {
                errorMessage = `Error de red: No se puede conectar al servidor.\n\n🔧 Soluciones:\n1. Verifica que el backend esté ejecutándose en ${API_CONFIG.BASE_URL}\n2. Verifica tu conexión WiFi\n3. Verifica que estés en la misma red que el servidor`;
            } else if (error?.message?.includes('timeout')) {
                errorMessage = 'Timeout: El servidor está tardando demasiado en responder';
            } else if (error?.message?.includes('JSON')) {
                errorMessage = 'Error de formato en la respuesta del servidor';
            }
            
            return { 
                success: false, 
                error: errorMessage
            };
        }
    },

    register: async (userData: RegisterData): Promise<AuthResponse> => {
        try {
            console.log('📝 [AuthService] Iniciando registro real con backend...');
            console.log('📝 [AuthService] Datos:', { ...userData, password: '***' });
            
            // CORREGIDO: Agregar /auth/ al endpoint
            const response = await fetch(`${API_CONFIG.BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'User-Agent': 'Expo-Mobile-App/1.0.0'
                },
                credentials: 'include',
                body: JSON.stringify(userData),
            });

            console.log('📝 [AuthService] Respuesta del servidor:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error de conexión' }));
                console.log('[AuthService] Registration failed:', errorData);
                return { 
                    success: false, 
                    error: errorData.message || 'Error al registrar usuario' 
                };
            }

            const newUserData = await response.json();
            console.log('[AuthService] Registration successful');
            
            const user: User = {
                id: newUserData.id.toString(),
                name: newUserData.name,
                email: newUserData.email,
                phone: userData.phone,
                country: userData.country
            };

            const mobileSessionToken = `mobile_${Date.now()}_${newUserData.id}`;
            
            setAuthState({ 
                isAuthenticated: true, 
                token: mobileSessionToken, 
                user,
                sessionType: 'mobile',
                loginTime: new Date().toISOString()
            });
            // Persistir token de sesión móvil
            try {
                await AsyncStorage.setItem(STORAGE_TOKEN_KEY, mobileSessionToken);
            } catch (e) {
                console.warn('[AuthService] No se pudo guardar token en AsyncStorage (register):', e);
            }
            
            return { 
                success: true, 
                data: { user, token: mobileSessionToken } 
            };
        } catch (error) {
            console.error('💥 [AuthService] Error en registro:', error);
            return { 
                success: false, 
                error: 'Error de conexión con el servidor' 
            };
        }
    },

    logout: async (): Promise<{ success: boolean; error?: string }> => {
        try {
            console.log('🚪 [AuthService] Cerrando sesión móvil...');
            
            try {
                // CORREGIDO: Agregar /auth/ al endpoint
                await fetch(`${API_CONFIG.BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'User-Agent': 'Expo-Mobile-App/1.0.0'
                    },
                    credentials: 'include',
                });
            } catch (backendError) {
                console.warn('[AuthService] Backend logout notification failed:', backendError);
            }

            setAuthState({ 
                isAuthenticated: false, 
                token: null, 
                user: null,
                sessionType: null,
                loginTime: null
            });
            // Limpiar token persistido
            try {
                await AsyncStorage.removeItem(STORAGE_TOKEN_KEY);
            } catch (e) {
                console.warn('[AuthService] No se pudo eliminar token de AsyncStorage:', e);
            }
            console.log('[AuthService] Mobile session closed successfully');
            
            return { success: true };
        } catch (error) {
            console.error('💥 [AuthService] Error en logout:', error);
            setAuthState({ 
                isAuthenticated: false, 
                token: null, 
                user: null,
                sessionType: null,
                loginTime: null
            });
            return { success: true };
        }
    },

    resetPassword: async (email: string): Promise<AuthResponse> => {
        // POR HACER: Implementar reset de contraseña real cuando esté disponible en el backend
        console.log('🔄 [AuthService] Reset de contraseña no implementado aún');
        return { success: false, error: 'Reset de contraseña no disponible aún' };
    },

    verifyToken: async (): Promise<AuthResponse> => {
        try {
            console.log('[AuthService] Verifying authentication token...');
            
            const response = await fetch(`${API_CONFIG.BASE_URL}/profile`, {
                method: 'GET',
                credentials: 'include', // Para enviar cookies
            });

            if (!response.ok) {
                console.log('[AuthService] Token validation failed');
                setAuthState({ isAuthenticated: false, token: null, user: null });
                return { success: false, error: 'Token inválido' };
            }

            const userData = await response.json();
            console.log('[AuthService] Token validation successful');
            
            const user: User = {
                id: userData.id.toString(),
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                country: userData.country
            };

            setAuthState({ isAuthenticated: true, token: 'backend-authenticated-token', user });
            return { success: true, data: { user, token: 'backend-authenticated-token' } };
        } catch (error) {
            console.error('💥 [AuthService] Error verificando token:', error);
            setAuthState({ isAuthenticated: false, token: null, user: null });
            return { success: false, error: 'Error verificando autenticación' };
        }
    },

    getAuthState: async () => {
        try {
            const internal = getAuthStateInternal();
            // Intentar leer token persistido en AsyncStorage como fallback
            try {
                const persisted = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
                if (persisted && !internal.token) {
                    console.log('[AuthService] Encontrado token en AsyncStorage, aplicando al estado interno');
                    internal.token = persisted;
                    internal.isAuthenticated = true;
                }
            } catch (e) {
                console.warn('[AuthService] Error leyendo token de AsyncStorage en getAuthState:', e);
            }
            return internal;
        } catch (e) {
            return getAuthStateInternal();
        }
    },
    isAuthenticated: () => getAuthStateInternal().isAuthenticated
};

export default AuthService;

export const login = (email: string, password: string): Promise<AuthResponse> => 
    AuthService.login(email, password);

export const register = (userData: RegisterData): Promise<AuthResponse> => 
    AuthService.register(userData);

export const logout = (): Promise<{ success: boolean; error?: string }> => 
    AuthService.logout();

export const resetPassword = (email: string): Promise<AuthResponse> => 
    AuthService.resetPassword(email);

export const verifyToken = (): Promise<AuthResponse> => 
    AuthService.verifyToken();

// Renombrado para evitar error de identificador duplicado
export const fetchAuthState = () => 
    AuthService.getAuthState();

export const isAuthenticated = () => 
    AuthService.isAuthenticated();