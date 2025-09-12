import { useEffect, useState } from 'react';
import AuthService from '../services/auth.service';

// Tipos para TypeScript
interface User {
    id: string;
    email: string;
    name?: string;
    role?: string;
}

interface AuthState {
    isLoading: boolean;
    isAuthenticated: boolean;
    token: string | null;
    user: User | null;
    error: string | null;
}

// Hook principal de autenticación
export function useAuth() {
    const [authState, setAuthState] = useState<AuthState>({
        isLoading: true,
        isAuthenticated: false,
        token: null,
        user: null,
        error: null
    });

    // Cargar estado inicial de autenticación
    useEffect(() => {
        loadAuthState();
    }, []);

    const loadAuthState = async () => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true }));
            
            const state = await AuthService.getAuthState();
            
            // Si hay token, verificar que sea válido
            if (state.token) {
                const verifyResult = await AuthService.verifyToken();
                if (!verifyResult.success) {
                    // Token inválido, limpiar estado
                    await AuthService.logout();
                    setAuthState({
                        isLoading: false,
                        isAuthenticated: false,
                        token: null,
                        user: null,
                        error: null
                    });
                    return;
                }
            }

            setAuthState({
                isLoading: false,
                isAuthenticated: state.isAuthenticated,
                token: state.token,
                user: state.user,
                error: null
            });
        } catch (error) {
            console.error('❌ Error cargando estado de auth:', error);
            setAuthState({
                isLoading: false,
                isAuthenticated: false,
                token: null,
                user: null,
                error: 'Error al cargar autenticación'
            });
        }
    };

    const login = async (email: string, password: string) => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
            
            const result = await AuthService.login(email, password);
            
            if (result.success && result.data) {
                setAuthState({
                    isLoading: false,
                    isAuthenticated: true,
                    token: result.data.token,
                    user: result.data.user,
                    error: null
                });
                return { success: true };
            } else {
                setAuthState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: result.error || 'Error desconocido'
                }));
                return { success: false, error: result.error };
            }
        } catch (error) {
            const errorMsg = 'Error al iniciar sesión';
            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMsg
            }));
            return { success: false, error: errorMsg };
        }
    };

    const register = async (userData: any) => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
            
            const result = await AuthService.register(userData);
            
            setAuthState(prev => ({ ...prev, isLoading: false }));
            
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setAuthState(prev => ({ ...prev, error: result.error || 'Error desconocido' }));
                return { success: false, error: result.error };
            }
        } catch (error) {
            const errorMsg = 'Error al registrar usuario';
            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMsg
            }));
            return { success: false, error: errorMsg };
        }
    };

    const logout = async () => {
        try {
            const result = await AuthService.logout();
            
            // Limpiar estado local independientemente del resultado del servidor
            setAuthState({
                isLoading: false,
                isAuthenticated: false,
                token: null,
                user: null,
                error: null
            });
            
            if (result.success) {
                console.log('✅ Sesión cerrada exitosamente');
            } else {
                console.log('⚠️ Error en logout del servidor, pero sesión local limpiada');
            }
            
            // Siempre retornar éxito ya que el estado local se limpió
            return { success: true };
        } catch (error) {
            console.error('❌ Error en logout:', error);
            
            // Aún así limpiar el estado local
            setAuthState({
                isLoading: false,
                isAuthenticated: false,
                token: null,
                user: null,
                error: null
            });
            
            return { success: true }; // Retornar éxito porque limpiamos el estado local
        }
    };

    const resetPassword = async (email: string) => {
        try {
            const result = await AuthService.resetPassword(email);
            return result;
        } catch (error) {
            return { success: false, error: 'Error al solicitar recuperación' };
        }
    };

    const clearError = () => {
        setAuthState(prev => ({ ...prev, error: null }));
    };

    const refresh = async () => {
        await loadAuthState();
    };

    return {
        ...authState,
        login,
        register,
        logout,
        resetPassword,
        clearError,
        refresh
    };
}

// Hook simplificado para verificar estado de autenticación
export function useAuthState() {
    const [authState, setAuthState] = useState<Omit<AuthState, 'error'>>({
        isLoading: true,
        isAuthenticated: false,
        token: null,
        user: null
    });

    useEffect(() => {
        checkAuthState();
    }, []);

    const checkAuthState = async () => {
        try {
            const state = await AuthService.getAuthState();
            setAuthState({
                isLoading: false,
                isAuthenticated: state.isAuthenticated,
                token: state.token,
                user: state.user
            });
        } catch (error) {
            console.error('❌ Error verificando auth state:', error);
            setAuthState({
                isLoading: false,
                isAuthenticated: false,
                token: null,
                user: null
            });
        }
    };

    return {
        ...authState,
        refresh: checkAuthState
    };
}

// Hook para verificar si el usuario está autenticado
export function useIsAuthenticated(): boolean {
    const { isAuthenticated } = useAuth();
    return isAuthenticated;
}

// Hook para obtener el usuario actual
export function useCurrentUser(): User | null {
    const { user } = useAuth();
    return user;
}

// Hook para obtener el token actual
export function useAuthToken(): string | null {
    const { token } = useAuth();
    return token;
}
