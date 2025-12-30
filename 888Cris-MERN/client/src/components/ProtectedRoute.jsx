import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import API from '../services/api';

const ProtectedRoute = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        // Evitar verificación innecesaria si ya sabemos que no está autenticado
        const userInStorage = localStorage.getItem('user');
        if (!userInStorage) {
            setIsAuthenticated(false);
            setIsLoading(false);
            return;
        }

        const verifyToken = async () => {
            try {
                await API.get('/profile');
                setIsAuthenticated(true);
            } catch (error) {
                console.error("Error de autenticación:", error);
                // Sólo limpiar localStorage si el backend respondió 401 (token inválido/expirado)
                if (error && error.response && error.response.status === 401) {
                    localStorage.removeItem('user');
                    setIsAuthenticated(false);
                } else {
                    // Error de red o servidor temporal: no forzar logout, asumir autenticado para evitar redirecciones
                    console.warn('Fallo al verificar perfil pero no es 401; manteniendo sesión activa temporalmente.');
                    setIsAuthenticated(true);
                }
            } finally {
                setIsLoading(false);
            }
        };

        verifyToken();
    }, []);

    if (isLoading) {
        return <div className="loading-container">Cargando...</div>;
    }

    // Usar state para mantener la URL a la que intentaba acceder el usuario
    return isAuthenticated ? 
        <Outlet /> : 
        <Navigate to="/auth" state={{ from: location }} replace />;
};

export default ProtectedRoute;