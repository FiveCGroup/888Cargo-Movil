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
                await API.get('/api/profile');
                setIsAuthenticated(true);
            } catch (error) {
                console.error("Error de autenticación:", error);
                // Limpiar localStorage en caso de error de autenticación
                localStorage.removeItem('user');
                setIsAuthenticated(false);
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