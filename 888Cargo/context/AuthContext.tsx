import React, { createContext, useContext, useEffect, useState } from 'react';
import AuthService from '../services/auth.service';

interface User {
    id: string;
    email: string;
    name?: string;
    role?: string;
}

interface AuthContextType {
    isLoading: boolean;
    isAuthenticated: boolean;
    token: string | null;
    user: User | null;
    error: string | null;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [authState, setAuthState] = useState({
        isLoading: true,
        isAuthenticated: false,
        token: null as string | null,
        user: null as User | null,
        error: null as string | null
    });

    // Cargar estado inicial
    useEffect(() => {
        loadAuthState();
    }, []);

    const loadAuthState = async () => {
        try {
            console.log('🔄 Cargando estado de autenticación inicial...');
            
            const state = await AuthService.getAuthState();
            
            console.log('✅ Estado cargado:', { 
                isAuthenticated: state.isAuthenticated, 
                hasToken: !!state.token 
            });

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
                console.log('✅ Login exitoso en AuthContext');
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
            const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
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
            console.log('🚪 [AuthContext] Iniciando logout...');
            
            // Primero, actualizar el estado inmediatamente (no esperar)
            console.log('🚪 [AuthContext] Actualizando estado a false INMEDIATAMENTE');
            setAuthState({
                isLoading: false,
                isAuthenticated: false,
                token: null,
                user: null,
                error: null
            });
            
            // Luego, notificar al backend (sin esperar)
            console.log('🚪 [AuthContext] Notificando al backend (async, no esperar)');
            AuthService.logout().catch(err => {
                console.warn('🚪 [AuthContext] Advertencia al notificar backend:', err);
            });
            
            console.log('🚪 [AuthContext] Logout completado');
        } catch (error) {
            console.error('❌ [AuthContext] Error al cerrar sesión:', error);
            // Forzar el logout incluso si hay error
            setAuthState({
                isLoading: false,
                isAuthenticated: false,
                token: null,
                user: null,
                error: null
            });
        }
    };

    const refresh = async () => {
        await loadAuthState();
    };

    return (
        <AuthContext.Provider
            value={{
                ...authState,
                login,
                logout,
                refresh
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext debe usarse dentro de AuthProvider');
    }
    return context;
}
