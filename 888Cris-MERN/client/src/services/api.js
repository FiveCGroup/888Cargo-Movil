import axios from "axios";

const API = axios.create({
    // En desarrollo, usar el proxy de Vite. En producción, usar la URL completa
    baseURL: import.meta.env.MODE === 'development' ? '' : 'http://localhost:4000',
    withCredentials: true
});

// Interceptor para agregar token a cada petición
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

API.interceptors.response.use(
    response => response, 
    error => {
        console.log("🔍 [API INTERCEPTOR] Error capturado:", error.response?.status);
        return Promise.reject(error);
    }
);

export default API;