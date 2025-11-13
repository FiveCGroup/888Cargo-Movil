// src/components/RecuperarWhatsapp.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { CargoAlerts } from "../utils/sweetAlertConfig";
import Logo888Cargo from "./Logo888Cargo";
import "../styles/pages/ForgotPassword.css";

const RecuperarWhatsapp = () => {
    const [telefono, setTelefono] = useState("");
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState(false);
    const navigate = useNavigate();

    const validatePhoneNumber = (phone) => {
        // Validar formato con código de país - 10 a 15 dígitos
        const phoneRegex = /^[0-9]{10,15}$/;
        return phoneRegex.test(phone.trim());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!telefono.trim()) {
            await CargoAlerts.showValidationWarning(
                'Por favor ingresa tu número de WhatsApp.'
            );
            return;
        }

        if (!validatePhoneNumber(telefono)) {
            await CargoAlerts.showValidationWarning(
                'Por favor ingresa un número válido de 10-15 dígitos incluyendo código de país (ej: 573001234567).'
            );
            return;
        }

        setLoading(true);

        try {
            const response = await API.post("/api/recuperacion/enviar-enlace", {
                telefono: telefono.trim(),
            });

            if (response.data.success) {
                // Mostrar alerta de éxito
                const result = await CargoAlerts.showSuccess(
                    '✅ Enlace Enviado',
                    'Hemos enviado un enlace de recuperación a tu WhatsApp. El enlace expirará en 30 minutos.'
                );
                
                // Limpiar campo y redirigir al login
                if (result.isConfirmed || result.isDismissed) {
                    setTelefono("");
                    navigate("/auth");
                }
            }
        } catch (error) {
            console.error("Error al enviar enlace:", error);
            
            const errorMessage = error.response?.data?.message || 
                               error.message || 
                               "No se pudo enviar el mensaje. Intenta nuevamente.";
            
            await CargoAlerts.showError(
                'Error al Enviar',
                errorMessage
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-content">
                {/* Header */}
                <div className="forgot-password-header">
                    <div className="forgot-password-icon">🔐</div>
                    <Logo888Cargo variant="default" size="large" showText={false} />
                    <h2 className="forgot-password-subtitle">Recuperar Contraseña</h2>
                </div>

                {/* Card */}
                <div className="forgot-password-card">
                    <h2 className="forgot-password-title">¿Olvidaste tu contraseña?</h2>
                    
                    <p className="forgot-password-description">
                        No te preocupes, te ayudaremos a restablecerla.
                        <br /><br />
                        Ingresa el número de WhatsApp asociado a tu cuenta (con código de país) y te enviaremos un enlace para crear una nueva contraseña.
                    </p>
                    
                    <form onSubmit={handleSubmit} className="forgot-password-form">
                        <div className="form-group">
                            <label htmlFor="telefono" className="form-label">
                                Número de WhatsApp (con código de país)
                            </label>
                            <div className="phone-input-wrapper">
                                <span className="phone-prefix">+</span>
                                <input
                                    id="telefono"
                                    type="text"
                                    value={telefono}
                                    onChange={(e) => {
                                        // Solo permitir números
                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                        if (value.length <= 15) {
                                            setTelefono(value);
                                        }
                                    }}
                                    onFocus={() => setFocused(true)}
                                    onBlur={() => setFocused(false)}
                                    placeholder="573001234567 (Colombia) o 8613800000000 (China)"
                                    disabled={loading}
                                    required
                                    maxLength="15"
                                    className={`form-input phone-input ${focused ? 'focused' : ''}`}
                                />
                            </div>
                            <small className="form-helper">
                                Incluye el código de país sin el símbolo + (ej: 57 para Colombia, 86 para China)
                            </small>
                        </div>

                        <button 
                            type="submit" 
                            className={`form-button ${loading ? 'loading' : ''}`}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Enviando...
                                </>
                            ) : (
                                <>📱 Enviar Enlace por WhatsApp</>
                            )}
                        </button>

                        <div className="forgot-password-footer">
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

export default RecuperarWhatsapp;
