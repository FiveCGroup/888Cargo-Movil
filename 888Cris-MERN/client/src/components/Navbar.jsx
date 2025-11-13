import React from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Logo888Cargo from './Logo888Cargo';
import '../styles/components/Navbar.css';
import '../styles/global/buttons.css';

const Navbar = ({ user }) => {
    const navigate = useNavigate();

    // Función para cerrar sesión
    const handleLogout = async () => {
        try {
            await API.post('/api/logout');
            localStorage.removeItem('user');
            navigate('/auth');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    // Función para ir a la documentación
    const goToDocumentacion = () => {
        navigate('/documentacion');
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Logo888Cargo variant="default" size="large" showText={false} />
            </div>
            <div className="navbar-user">
                <button 
                    className="btn btn-outline-primary btn-sm docs-btn" 
                    onClick={goToDocumentacion}
                    title="Ver documentación técnica"
                >
                    📚 Docs
                </button>
                <div className="notification-icon">🔔</div>
                <div className="user-name">{user?.name}</div>
                <div className="user-avatar">👤</div>
                <button className="btn btn-danger btn-sm logout-btn" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i>Cerrar Sesión
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
