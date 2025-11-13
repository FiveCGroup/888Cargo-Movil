import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import API from "../services/api";
import { CargoAlerts } from "../utils/sweetAlertConfig";
import Logo888Cargo from "./Logo888Cargo";
import "../styles/pages/ResetPassword.css";

const ResetPassword = () => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [confirmFocused, setConfirmFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const tokenFromUrl = queryParams.get("token");
        
        if (!tokenFromUrl) {
            setVerifying(false);
            CargoAlerts.showError(
                'Token no proporcionado',
                'Solicita un nuevo enlace de recuperación.'
            );
            return;
        }
        
        setToken(tokenFromUrl);
        verifyToken(tokenFromUrl);
    }, [location]);

    const verifyToken = async (tokenToVerify) => {
        try {
            const response = await API.get(`/api/recuperacion/verificar-token/${tokenToVerify}`);
            if (response.data.valid) {
                setTokenValid(true);
            } else {
                setTokenValid(false);
                await CargoAlerts.showError(
                    'Enlace Expirado',
                    'El enlace ha expirado o no es válido. Por favor, solicita un nuevo enlace.'
                );
            }
        } catch (error) {
            setTokenValid(false);
            await CargoAlerts.showError(
                'Enlace Inválido',
                'El enlace ha expirado o no es válido. Por favor, solicita un nuevo enlace.'
            );
        } finally {
            setVerifying(false);
        }
    };

    const validatePassword = (pwd) => {
        return {
            minLength: pwd.length >= 8,
            hasUppercase: /[A-Z]/.test(pwd),
            hasLowercase: /[a-z]/.test(pwd),
            hasNumber: /[0-9]/.test(pwd)
        };
    };

    const getPasswordRequirements = () => {
        const validation = validatePassword(password);
        return [
            { text: 'Mínimo 8 caracteres', met: validation.minLength },
            { text: 'Una letra mayúscula', met: validation.hasUppercase },
            { text: 'Una letra minúscula', met: validation.hasLowercase },
            { text: 'Un número', met: validation.hasNumber },
        ];
    };

    const isPasswordValid = () => {
        const validation = validatePassword(password);
        return validation.minLength && validation.hasUppercase && 
               validation.hasLowercase && validation.hasNumber;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!password || !confirmPassword) {
            await CargoAlerts.showValidationWarning(
                'Por favor completa todos los campos.'
            );
            return;
        }

        if (!isPasswordValid()) {
            await CargoAlerts.showValidationWarning(
                'La contraseña debe cumplir todos los requisitos de seguridad.'
            );
            return;
        }
        
        if (password !== confirmPassword) {
            await CargoAlerts.showValidationWarning(
                'Las contraseñas no coinciden.'
            );
            return;
        }
        
        setLoading(true);
        
        try {
            const response = await API.post("/api/recuperacion/cambiar-password", {
                token,
                newPassword: password
            });
            
            if (response.data.success) {
                const result = await CargoAlerts.showSuccess(
                    '✅ Contraseña Actualizada',
                    'Tu contraseña ha sido actualizada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.'
                );
                
                if (result.isConfirmed || result.isDismissed) {
                    navigate("/auth");
                }
            }
        } catch (error) {
            console.error("Error al cambiar contraseña:", error);
            await CargoAlerts.showError(
                'Error al Actualizar',
                error.response?.data?.message || 
                "No se pudo actualizar la contraseña. Intenta nuevamente."
            );
        } finally {
            setLoading(false);
        }
    };

    // Pantalla de carga mientras verifica
    if (verifying) {
        return (
            <div className="reset-password-container">
                <div className="reset-password-loading">
                    <div className="spinner-large"></div>
                    <p>Verificando enlace de recuperación...</p>
                </div>
            </div>
        );
    }

    // Pantalla de error si el token no es válido
    if (!tokenValid) {
        return (
            <div className="reset-password-container">
                <div className="reset-password-content">
                    <div className="reset-password-header">
                        <div className="reset-password-icon error">❌</div>
                        <h2 className="reset-password-subtitle">Enlace Inválido</h2>
                    </div>
                    
                    <div className="reset-password-card">
                        <p className="reset-password-description">
                            El enlace de recuperación ha expirado o es inválido.
                            <br /><br />
                            Por favor, solicita un nuevo enlace de recuperación.
                        </p>
                        
                        <div className="reset-password-actions">
                            <button 
                                onClick={() => navigate("/recuperar-password")}
                                className="form-button"
                            >
                                Solicitar Nuevo Enlace
                            </button>
                            
                            <Link to="/auth" className="back-link">
                                ← Volver al inicio de sesión
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Formulario principal
    return (
        <div className="reset-password-container">
            <div className="reset-password-content">
                {/* Header */}
                <div className="reset-password-header">
                    <div className="reset-password-icon">🔑</div>
                    <Logo888Cargo variant="default" size="large" showText={false} />
                    <h2 className="reset-password-subtitle">Nueva Contraseña</h2>
                </div>

                {/* Card */}
                <div className="reset-password-card">
                    <h2 className="reset-password-title">Crear Nueva Contraseña</h2>
                    
                    <p className="reset-password-description">
                        Ingresa tu nueva contraseña. Asegúrate de que sea segura y fácil de recordar.
                    </p>
                    
                    <form onSubmit={handleSubmit} className="reset-password-form">
                        {/* Nueva Contraseña */}
                        <div className="form-group">
                            <label htmlFor="password" className="form-label">
                                Nueva Contraseña
                            </label>
                            <div className="password-input-wrapper">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={() => setPasswordFocused(true)}
                                    onBlur={() => setPasswordFocused(false)}
                                    placeholder="Ingresa tu nueva contraseña"
                                    disabled={loading}
                                    required
                                    className={`form-input ${passwordFocused ? 'focused' : ''}`}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex="-1"
                                >
                                    {showPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                        </div>

                        {/* Confirmar Contraseña */}
                        <div className="form-group">
                            <label htmlFor="confirmPassword" className="form-label">
                                Confirmar Contraseña
                            </label>
                            <div className="password-input-wrapper">
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    onFocus={() => setConfirmFocused(true)}
                                    onBlur={() => setConfirmFocused(false)}
                                    placeholder="Confirma tu nueva contraseña"
                                    disabled={loading}
                                    required
                                    className={`form-input ${confirmFocused ? 'focused' : ''} ${
                                        confirmPassword && confirmPassword !== password ? 'invalid' : ''
                                    } ${
                                        confirmPassword && confirmPassword === password && password.length >= 8 ? 'valid' : ''
                                    }`}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    tabIndex="-1"
                                >
                                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                            {confirmPassword && confirmPassword !== password && (
                                <small className="form-helper error">
                                    Las contraseñas no coinciden
                                </small>
                            )}
                        </div>

                        {/* Requisitos de contraseña */}
                        {password.length > 0 && (
                            <div className="password-requirements">
                                <p className="requirements-title">Requisitos de contraseña:</p>
                                <ul className="requirements-list">
                                    {getPasswordRequirements().map((req, index) => (
                                        <li 
                                            key={index} 
                                            className={`requirement-item ${req.met ? 'met' : ''}`}
                                        >
                                            <span className="requirement-icon">
                                                {req.met ? '✓' : '○'}
                                            </span>
                                            <span className="requirement-text">{req.text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className={`form-button ${loading ? 'loading' : ''}`}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Actualizando...
                                </>
                            ) : (
                                <>🔒 Actualizar Contraseña</>
                            )}
                        </button>

                        <div className="reset-password-footer">
                            <Link to="/auth" className="back-link">
                                ← Volver al inicio de sesión
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;