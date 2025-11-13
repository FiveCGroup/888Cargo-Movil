// utils/sweetAlertConfig.js
// Configuraciones centralizadas para SweetAlert2 en 888 Cargo

import Swal from 'sweetalert2';

/**
 * Configuraciones base para diferentes tipos de alertas
 */
const baseConfig = {
  background: '#fff',
  allowOutsideClick: false,
  customClass: {
    popup: 'swal-popup-888cargo'
  }
};

/**
 * Configuraciones específicas por tipo de alerta
 */
const configs = {
  success: {
    ...baseConfig,
    icon: 'success',
    confirmButtonColor: '#28a745',
    customClass: {
      ...baseConfig.customClass,
      title: 'swal-title-success',
      content: 'swal-content-success',
      confirmButton: 'swal-button-success'
    },
    showClass: {
      popup: 'animate__animated animate__bounceIn'
    },
    hideClass: {
      popup: 'animate__animated animate__bounceOut'
    }
  },
  
  error: {
    ...baseConfig,
    icon: 'error',
    confirmButtonColor: '#dc3545',
    customClass: {
      ...baseConfig.customClass,
      title: 'swal-title-error',
      content: 'swal-content-error',
      confirmButton: 'swal-button-error'
    }
  },
  
  warning: {
    ...baseConfig,
    icon: 'warning',
    confirmButtonColor: '#ffc107',
    customClass: {
      ...baseConfig.customClass,
      confirmButton: 'swal-button-warning'
    }
  },
  
  info: {
    ...baseConfig,
    icon: 'info',
    confirmButtonColor: '#17a2b8',
    customClass: {
      ...baseConfig.customClass,
      confirmButton: 'swal-button-info'
    }
  }
};

/**
 * Clase utilitaria para alertas de 888 Cargo
 */
export class CargoAlerts {
  
  /**
   * Mostrar alerta de registro exitoso
   * @param {string} userName - Nombre del usuario registrado
   */
  static async showRegistrationSuccess(userName) {
    return await Swal.fire({
      ...configs.success,
      title: '¡Registro Exitoso! 🎉',
      text: `¡Bienvenido/a ${userName}! Tu cuenta ha sido creada correctamente. Ya puedes iniciar sesión.`,
      confirmButtonText: 'Continuar',
      timer: 5000,
      timerProgressBar: true,
      allowEscapeKey: false
    });
  }
  
  /**
   * Mostrar alerta de bienvenida al iniciar sesión
   * @param {string} userName - Nombre del usuario que inicia sesión
   */
  static async showLoginWelcome(userName) {
    return await Swal.fire({
      ...configs.success,
      title: '¡Bienvenido/a! 👋',
      text: `Hola ${userName}, has iniciado sesión correctamente.`,
      confirmButtonText: 'Continuar',
      timer: 3000,
      timerProgressBar: true
    });
  }
  
  /**
   * Mostrar alerta de error genérico
   * @param {string} title - Título del error
   * @param {string} message - Mensaje del error
   */
  static async showError(title, message) {
    return await Swal.fire({
      ...configs.error,
      title: title,
      text: message,
      confirmButtonText: 'Entendido'
    });
  }
  
  /**
   * Mostrar alerta de éxito genérica
   * @param {string} title - Título del éxito
   * @param {string} message - Mensaje del éxito
   */
  static async showSuccess(title, message) {
    return await Swal.fire({
      ...configs.success,
      title: title,
      text: message,
      confirmButtonText: 'Entendido',
      timer: 4000,
      timerProgressBar: true
    });
  }
  
  /**
   * Mostrar alerta de error de registro
   * @param {string} message - Mensaje de error específico
   */
  static async showRegistrationError(message) {
    return await this.showError(
      'Error en el Registro',
      message || "Hubo un problema al registrar tu cuenta. Por favor, intenta nuevamente."
    );
  }
  
  /**
   * Mostrar alerta de error de inicio de sesión
   * @param {string} message - Mensaje de error específico
   */
  static async showLoginError(message) {
    return await this.showError(
      'Error al Iniciar Sesión',
      message
    );
  }
  
  /**
   * Mostrar alerta específica para credenciales incorrectas
   * @param {string} customMessage - Mensaje personalizado opcional
   */
  static async showInvalidCredentials(customMessage) {
    try {
      return await Swal.fire({
        ...configs.error,
        title: '🔐 Credenciales Incorrectas',
        text: customMessage || 'El correo electrónico o la contraseña que ingresaste no son correctos. Por favor, verifica tus datos e intenta nuevamente.',
        confirmButtonText: 'Intentar de Nuevo',
        timer: 3000,
        timerProgressBar: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showClass: {
          popup: 'animate__animated animate__shakeX'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOut'
        }
      });
    } catch (error) {
      console.error("Error en showInvalidCredentials:", error);
      // Fallback a versión simple
      return await Swal.fire({
        title: 'Credenciales Incorrectas',
        text: 'Usuario o contraseña incorrectos',
        icon: 'error',
        timer: 3000,
        timerProgressBar: true,
        confirmButtonText: 'OK'
      });
    }
  }
  
  /**
   * Mostrar alerta para usuario no encontrado
   */
  static async showUserNotFound() {
    return await Swal.fire({
      ...configs.error,
      title: '👤 Usuario No Encontrado',
      text: 'No existe una cuenta registrada con este correo electrónico. ¿Deseas crear una cuenta nueva?',
      confirmButtonText: 'Crear Cuenta',
      showCancelButton: true,
      cancelButtonText: 'Intentar de Nuevo',
      cancelButtonColor: '#6c757d',
      timer: 5000,
      timerProgressBar: true,
      customClass: {
        ...configs.error.customClass,
        cancelButton: 'swal-button-secondary'
      }
    });
  }
  
  /**
   * Mostrar alerta para cuenta inactiva
   */
  static async showInactiveAccount() {
    return await Swal.fire({
      ...configs.warning,
      title: '⚠️ Cuenta Inactiva',
      text: 'Tu cuenta está temporalmente inactiva. Por favor, contacta al administrador para reactivarla.',
      confirmButtonText: 'Entendido',
      timer: 4000,
      timerProgressBar: true,
      icon: 'warning'
    });
  }
  
  /**
   * Mostrar alerta de campos requeridos
   * @param {string} message - Mensaje específico de validación
   */
  static async showValidationWarning(message) {
    return await Swal.fire({
      ...configs.warning,
      title: 'Campos Requeridos',
      text: message || 'Por favor completa todos los campos requeridos para continuar.',
      confirmButtonText: 'Entendido'
    });
  }
  
  /**
   * Mostrar alerta de información
   * @param {string} title - Título informativo
   * @param {string} message - Mensaje informativo
   */
  static async showInfo(title, message) {
    return await Swal.fire({
      ...configs.info,
      title: title,
      text: message,
      confirmButtonText: 'Entendido'
    });
  }
  
  /**
   * Mostrar alerta de confirmación
   * @param {string} title - Título de la confirmación
   * @param {string} message - Mensaje de confirmación
   * @param {string} confirmText - Texto del botón de confirmación
   * @param {string} cancelText - Texto del botón de cancelación
   */
  static async showConfirmation(title, message, confirmText = 'Sí', cancelText = 'No') {
    return await Swal.fire({
      ...baseConfig,
      title: title,
      text: message,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      customClass: {
        ...baseConfig.customClass,
        confirmButton: 'swal-button-success',
        cancelButton: 'swal-button-secondary'
      }
    });
  }
  
  /**
   * Mostrar toast (notificación pequeña)
   * @param {string} message - Mensaje del toast
   * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
   * @param {number} timer - Tiempo en ms (por defecto 3000)
   */
  static showToast(message, type = 'success', timer = 3000) {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: timer,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });

    return Toast.fire({
      icon: type,
      title: message
    });
  }
}

export default CargoAlerts;
