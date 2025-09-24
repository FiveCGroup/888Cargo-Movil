import { API_CONFIG } from '../constants/API';

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
            
            const response = await fetch(`${API_CONFIG.BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Agregar headers específicos para móvil
                    'X-Requested-With': 'XMLHttpRequest',
                    'User-Agent': 'Expo-Mobile-App/1.0.0'
                },
                credentials: 'include', // Para enviar/recibir cookies
                body: JSON.stringify({ email, password }),
            });

            console.log(`[AuthService] Login response status: ${response.status}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error de conexión' }));
                console.log('[AuthService] Authentication failed:', errorData);
                return { 
                    success: false, 
                    error: errorData.message || 'Credenciales inválidas' 
                };
            }

            const userData = await response.json();
            console.log('[AuthService] Login successful');
            
            const user: User = {
                id: userData.id.toString(),
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                country: userData.country
            };

            // Generar un timestamp único para diferenciar sesiones móviles de web
            const mobileSessionToken = `mobile_${Date.now()}_${userData.id}`;
            
            setAuthState({ 
                isAuthenticated: true, 
                token: mobileSessionToken, 
                user,
                sessionType: 'mobile',
                loginTime: new Date().toISOString()
            });
            
            return { 
                success: true, 
                data: { user, token: mobileSessionToken } 
            };
        } catch (error) {
            console.error('💥 [AuthService] Error en login:', error);
            return { 
                success: false, 
                error: 'Error de conexión con el servidor' 
            };
        }
    },

    register: async (userData: RegisterData): Promise<AuthResponse> => {
        try {
            console.log('📝 [AuthService] Iniciando registro real con backend...');
            console.log('📝 [AuthService] Datos:', { ...userData, password: '***' });
            
            const response = await fetch(`${API_CONFIG.BASE_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Agregar headers específicos para móvil
                    'X-Requested-With': 'XMLHttpRequest',
                    'User-Agent': 'Expo-Mobile-App/1.0.0'
                },
                credentials: 'include', // Para enviar/recibir cookies
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

            // Generar token único para sesión móvil
            const mobileSessionToken = `mobile_${Date.now()}_${newUserData.id}`;
            
            setAuthState({ 
                isAuthenticated: true, 
                token: mobileSessionToken, 
                user,
                sessionType: 'mobile',
                loginTime: new Date().toISOString()
            });
            
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
            
            // Intentar cerrar sesión en el backend pero no fallar si hay error
            try {
                await fetch(`${API_CONFIG.BASE_URL}/logout`, {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'User-Agent': 'Expo-Mobile-App/1.0.0'
                    },
                    credentials: 'include', // Para enviar cookies
                });
            } catch (backendError) {
                console.warn('[AuthService] Backend logout notification failed:', backendError);
                // Continuar con logout local
            }

            setAuthState({ 
                isAuthenticated: false, 
                token: null, 
                user: null,
                sessionType: null,
                loginTime: null
            });
            console.log('[AuthService] Mobile session closed successfully');
            
            return { success: true };
        } catch (error) {
            console.error('💥 [AuthService] Error en logout:', error);
            // Aún así limpiar el estado local
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
        // TODO: Implementar reset de contraseña real cuando esté disponible en el backend
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

    getAuthState: async () => getAuthStateInternal(),
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

// Renamed to avoid duplicate identifier error
export const fetchAuthState = () => 
    AuthService.getAuthState();

export const isAuthenticated = () => 
    AuthService.isAuthenticated();