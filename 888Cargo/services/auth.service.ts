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
        const user = { id: '1', name: 'Demo', email };
        const token = 'demo-token';
        setAuthState({ isAuthenticated: true, token, user });
        return { success: true, data: { user, token } };
    },
    register: async (userData: RegisterData): Promise<AuthResponse> => {
        const user = { id: '1', name: userData.name, email: userData.email };
        const token = 'demo-token';
        setAuthState({ isAuthenticated: true, token, user });
        return { success: true, data: { user, token } };
    },
    logout: async (): Promise<{ success: boolean; error?: string }> => {
        setAuthState({ isAuthenticated: false, token: null, user: null });
        return { success: true };
    },
    resetPassword: async (email: string): Promise<AuthResponse> => ({ success: true }),
    verifyToken: async (): Promise<AuthResponse> => {
        const state = getAuthStateInternal();
        if (state.isAuthenticated && state.token) {
            return { success: true };
        }
        return { success: false };
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