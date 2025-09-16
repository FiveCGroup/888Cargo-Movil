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
                },
                credentials: 'include', // Para enviar/recibir cookies
                body: JSON.stringify({ email, password }),
            });

            console.log('🔐 [AuthService] Respuesta del servidor:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error de conexión' }));
                console.log('❌ [AuthService] Error del servidor:', errorData);
                return { 
                    success: false, 
                    error: errorData.message || 'Credenciales inválidas' 
                };
            }

            const userData = await response.json();
            console.log('✅ [AuthService] Login exitoso:', userData);
            
            const user: User = {
                id: userData.id.toString(),
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                country: userData.country
            };

            // Simular token (en la vida real vendría en las cookies)
            const token = 'backend-authenticated-token';
            
            setAuthState({ isAuthenticated: true, token, user });
            
            return { 
                success: true, 
                data: { user, token } 
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
                },
                credentials: 'include', // Para enviar/recibir cookies
                body: JSON.stringify(userData),
            });

            console.log('📝 [AuthService] Respuesta del servidor:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error de conexión' }));
                console.log('❌ [AuthService] Error del servidor:', errorData);
                return { 
                    success: false, 
                    error: errorData.message || 'Error al registrar usuario' 
                };
            }

            const newUserData = await response.json();
            console.log('✅ [AuthService] Registro exitoso:', newUserData);
            
            const user: User = {
                id: newUserData.id.toString(),
                name: newUserData.name,
                email: newUserData.email,
                phone: userData.phone,
                country: userData.country
            };

            // Simular token (en la vida real vendría en las cookies)
            const token = 'backend-authenticated-token';
            
            setAuthState({ isAuthenticated: true, token, user });
            
            return { 
                success: true, 
                data: { user, token } 
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
            console.log('🚪 [AuthService] Cerrando sesión...');
            
            await fetch(`${API_CONFIG.BASE_URL}/logout`, {
                method: 'POST',
                credentials: 'include', // Para enviar cookies
            });

            setAuthState({ isAuthenticated: false, token: null, user: null });
            console.log('✅ [AuthService] Sesión cerrada exitosamente');
            
            return { success: true };
        } catch (error) {
            console.error('💥 [AuthService] Error en logout:', error);
            // Aún así limpiar el estado local
            setAuthState({ isAuthenticated: false, token: null, user: null });
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
            console.log('🔍 [AuthService] Verificando token...');
            
            const response = await fetch(`${API_CONFIG.BASE_URL}/profile`, {
                method: 'GET',
                credentials: 'include', // Para enviar cookies
            });

            if (!response.ok) {
                console.log('❌ [AuthService] Token inválido');
                setAuthState({ isAuthenticated: false, token: null, user: null });
                return { success: false, error: 'Token inválido' };
            }

            const userData = await response.json();
            console.log('✅ [AuthService] Token válido:', userData);
            
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