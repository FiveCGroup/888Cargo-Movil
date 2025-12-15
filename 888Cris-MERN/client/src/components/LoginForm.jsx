import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { CargoAlerts } from "../utils/sweetAlertConfig";
import "../styles/components/sweetalert-custom.css";

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    console.log("🔍 [FRONTEND] handleSubmit iniciado");
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    
    console.log("🔍 [FRONTEND] preventDefault ejecutado");
    
    // Log al backend
    try {
      await fetch('/api/debug/frontend-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '🔍 [FRONTEND] HandleSubmit ejecutado', timestamp: new Date().toISOString() })
      }).catch(() => {});
    } catch{}
    
    // Validar que se hayan ingresado datos antes de intentar iniciar sesión
    if (!formData.email || !formData.password) {
      console.log("🔍 [FRONTEND] Validación falló - campos vacíos");
      try {
        await CargoAlerts.showValidationWarning(
          'Por favor ingresa tu correo electrónico y contraseña para continuar.'
        );
      } catch (alertError) {
        console.error("Error al mostrar alerta de validación:", alertError);
      }
      return false;
    }
    
    console.log("🔍 [FRONTEND] Iniciando login con:", { email: formData.email });
    setLoading(true);

    try {
      console.log("🔍 [FRONTEND] Haciendo request con API.post...");
      const response = await API.post("/api/login", formData);
      console.log("🔍 [FRONTEND] Response recibida:", response);

      // Verificación corregida - los datos están en response.data.user
      if (response.data && response.data.success && response.data.user && response.data.user.id) {
        console.log("🔍 [FRONTEND] Login exitoso - datos válidos");
        
        // Guardar token
        localStorage.setItem("token", response.data.token);
        
        // Guardamos los datos del usuario
        localStorage.setItem("user", JSON.stringify({
          id: response.data.user.id,
          name: response.data.user.username || response.data.user.full_name,
          email: response.data.user.email,
          roles: response.data.user.roles
        }));

        // Mostrar mensaje de bienvenida
        try {
          await CargoAlerts.showLoginWelcome(response.data.user.username || response.data.user.email);
        } catch (alertError) {
          console.error("Error al mostrar alerta de bienvenida:", alertError);
        }

        // Navegar al dashboard
        navigate("/dashboard");
      } else {
        console.log("🔍 [FRONTEND] Datos incompletos del servidor:", response.data);
        try {
          await CargoAlerts.showError(
            'Error de Autenticación',
            'Los datos recibidos del servidor son incompletos. Por favor, intenta nuevamente.'
          );
        } catch (alertError) {
          console.error("Error al mostrar alerta de error:", alertError);
        }
      }
    } catch (error) {
      console.log("🔍 Error capturado en catch:", error);
      console.error("Error al iniciar sesión:", error);
      
      try {
        if (error.response) {
          console.log("🔍 Error tiene response - status:", error.response.status);
          const status = error.response.status;
          const serverMessage = error.response.data?.message || "";
          
          // Manejar errores específicos según el código de estado
          if (status === 401) {
            console.log("🔍 Mostrando error 401");
            // Credenciales incorrectas o usuario no existe
            await CargoAlerts.showInvalidCredentials();
          } else if (status === 403) {
            console.log("🔍 Mostrando error 403");
            // Cuenta inactiva
            await CargoAlerts.showInactiveAccount();
          } else if (status === 404) {
            console.log("🔍 Mostrando error 404");
            // Usuario no encontrado
            const result = await CargoAlerts.showUserNotFound();
            if (result.isConfirmed) {
              console.log("Usuario quiere crear una cuenta nueva");
            }
          } else if (status >= 500) {
            console.log("🔍 Mostrando error 500+");
            await CargoAlerts.showLoginError("Error del servidor. Por favor, intenta más tarde.");
          } else {
            console.log("🔍 Mostrando error genérico");
            await CargoAlerts.showLoginError(serverMessage || "Error de autenticación");
          }
        } else if (error.request) {
          console.log("🔍 Error de request - no response");
          await CargoAlerts.showLoginError("No se pudo conectar con el servidor. Verifica tu conexión a internet.");
        } else {
          console.log("🔍 Error desconocido");
          await CargoAlerts.showLoginError("Error en la solicitud de inicio de sesión");
        }
      } catch (alertError) {
        console.error("Error al mostrar alerta de error:", alertError);
        // Fallback a alert básico si SweetAlert falla
        alert("Error al iniciar sesión: " + (error.response?.data?.message || error.message));
      }
    } finally {
      console.log("🔍 Finally ejecutado - setLoading(false)");
      setLoading(false);
    }
    
    console.log("🔍 Retornando false para prevenir submit");
    return false;
  };

  // Función para manejar click del botón sin form submission
  const handleLoginClick = async (e) => {
    console.log("🔍 [FRONTEND] handleLoginClick iniciado");
    e.preventDefault();
    e.stopPropagation();
    
    // También enviamos un log al backend para confirmar que llega
    try {
      await fetch('/api/debug/frontend-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '🔍 [FRONTEND] Login click iniciado', timestamp: new Date().toISOString() })
      }).catch(() => {}); // Ignorar errores de este log
    } catch {}
    
    await handleSubmit(e);
  };

  return (
    <div className="form">
      <h2 className="form-title">Iniciar Sesión</h2>
      <input
        name="email"
        value={formData.email}
        onChange={handleChange}
        type="email"
        placeholder="Correo electrónico"
        className="form-input"
        disabled={loading}
        required
      />
      <input
        name="password"
        value={formData.password}
        onChange={handleChange}
        type="password"
        placeholder="Contraseña"
        className="form-input"
        disabled={loading}
        required
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleLoginClick(e);
          }
        }}
      />
      <button
        type="button"
        className="form-button"
        disabled={loading}
        onClick={handleLoginClick}
      >
        {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
      </button>
      
      {/* Enlace para recuperación de contraseña */}
      <div className="forgot-password">
        <Link to="/recuperar-password">¿Olvidaste tu contraseña?</Link>
      </div>
      
      {error && <p className="form-error">{error}</p>}
    </div>
  );
};

export default LoginForm;
