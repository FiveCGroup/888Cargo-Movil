import React, { useState, useRef, useEffect } from "react";
import API from "../services/api";
import { CargoAlerts } from "../utils/sweetAlertConfig";
import "../styles/components/CountryCodeDropdown.css";
import "../styles/components/sweetalert-custom.css";

const countryCodes = [
  { code: "+1", country: "Estados Unidos (USA)" },
  { code: "+1", country: "Canadá" },
  { code: "+52", country: "México" },
  { code: "+54", country: "Argentina" },
  { code: "+55", country: "Brasil" },
  { code: "+56", country: "Chile" },
  { code: "+57", country: "Colombia" },
  { code: "+58", country: "Venezuela" },
  { code: "+34", country: "España" },
  { code: "+49", country: "Alemania" },
  { code: "+33", country: "Francia" },
  { code: "+44", country: "Reino Unido" },
  { code: "+39", country: "Italia" },
  { code: "+86", country: "China" },
  { code: "+81", country: "Japón" },
  { code: "+82", country: "Corea del Sur" },
  { code: "+91", country: "India" },
  { code: "+7", country: "Rusia" },
  { code: "+61", country: "Australia" },
  { code: "+64", country: "Nueva Zelanda" },
];

const validations = {
  name: {
    regex: /^[A-Za-záéíóúÁÉÍÓÚüÜñÑ\s]+$/,
    message: "El nombre solo debe contener letras"
  },
  lastname: {
    regex: /^[A-Za-záéíóúÁÉÍÓÚüÜñÑ\s]+$/,
    message: "El apellido solo debe contener letras"
  },
  email: {
    regex: /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/,
    message: "Ingresa un correo electrónico válido"
  },
  phoneNumber: {
    regex: /^\d+$/,
    message: "El número de teléfono solo debe contener dígitos"
  },
  country: {
    regex: /^[A-Za-záéíóúÁÉÍÓÚüÜñÑ\s\(\)]+$/,
    message: "El país solo debe contener letras"
  },
  password: {
    regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{6,}$/,
    message: "La contraseña debe tener al menos 6 caracteres, incluyendo mayúsculas, minúsculas, números y caracteres especiales"
  }
};

const RegisterForm = () => {
  const initialFormState = {
    name: "",
    lastname: "",
    email: "",
    countryCode: "+57",
    phoneNumber: "",
    country: "Colombia",
    password: "",
    confirmarPassword: "",
    userRole: 1,
    acceptWhatsapp: false
  };

  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCodes, setFilteredCodes] = useState(countryCodes);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const filtered = countryCodes.filter(item => 
      item.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.includes(searchTerm)
    );
    setFilteredCodes(filtered);
  }, [searchTerm]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const validateField = (name, value) => {
    if (!validations[name]) return "";

    if (!validations[name].regex.test(value) && value !== "") {
      return validations[name].message;
    }

    if (name === "confirmarPassword" && value !== formData.password) {
      return "Las contraseñas no coinciden";
    }

    return "";
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
      return;
    }

    if (name === "country") {
      setFormData({ ...formData, [name]: value });

      const countryMatch = countryCodes.find(item =>
        item.country.toLowerCase().includes(value.toLowerCase())
      );

      if (countryMatch) {
        setFormData(prev => ({ ...prev, [name]: value, countryCode: countryMatch.code }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }

    const error = validateField(name, value);
    setFormErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const selectCountryCode = (code, country) => {
    setFormData({ ...formData, countryCode: code, country: country });
    setShowDropdown(false);
    setSearchTerm("");

    setFormErrors(prev => ({
      ...prev,
      country: ""
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let hasErrors = false;
    let newErrors = {};

    Object.keys(validations).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        hasErrors = true;
      }
    });

    if (formData.password !== formData.confirmarPassword) {
      newErrors.confirmarPassword = "Las contraseñas no coinciden";
      hasErrors = true;
    }

    if (!formData.acceptWhatsapp) {
      newErrors.acceptWhatsapp = "Debes aceptar recibir mensajes por WhatsApp";
      hasErrors = true;
    }

    if (hasErrors) {
      setFormErrors(newErrors);
      return;
    }

    try {
      const { confirmarPassword, countryCode, phoneNumber, acceptWhatsapp, ...rest } = formData;
      const dataToSend = {
        ...rest,
        phone: `${countryCode}${phoneNumber}`,
        acceptWhatsapp: formData.acceptWhatsapp
      };

      const response = await API.post("/api/register", dataToSend);
      
      // Mostrar mensaje de éxito usando la utilidad centralizada
      await CargoAlerts.showRegistrationSuccess(formData.name);

      setFormData(initialFormState);
      setFormErrors({});
    } catch (error) {
      console.error("Error al registrar:", error);
      
      // Mostrar mensaje de error usando la utilidad centralizada
      await CargoAlerts.showRegistrationError(
        error.response?.data?.message || "Hubo un problema al registrar tu cuenta. Por favor, intenta nuevamente."
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <h2 className="form-title">Registrarse</h2>

      <div className="form-group">
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          type="text"
          placeholder="Nombre"
          className={`form-input ${formErrors.name ? 'input-error' : ''}`}
          required
        />
        {formErrors.name && <p className="error-message">{formErrors.name}</p>}
      </div>

      <div className="form-group">
        <input
          name="lastname"
          value={formData.lastname}
          onChange={handleChange}
          type="text"
          placeholder="Apellido"
          className={`form-input ${formErrors.lastname ? 'input-error' : ''}`}
          required
        />
        {formErrors.lastname && <p className="error-message">{formErrors.lastname}</p>}
      </div>

      <div className="form-group">
        <input
          name="email"
          value={formData.email}
          onChange={handleChange}
          type="email"
          placeholder="Correo"
          className={`form-input ${formErrors.email ? 'input-error' : ''}`}
          required
        />
        {formErrors.email && <p className="error-message">{formErrors.email}</p>}
      </div>

      <div className="phone-input-container">
        <div className="country-code-selector" ref={dropdownRef}>
          <div
            className="selected-code"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {formData.countryCode}
          </div>

          {showDropdown && (
            <div className="country-dropdown">
              <input
                type="text"
                placeholder="Buscar país..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="country-search"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="country-list">
                {filteredCodes.map((item, index) => (
                  <div
                    key={index}
                    className="country-item"
                    onClick={() => selectCountryCode(item.code, item.country)}
                  >
                    <span className="country-code">{item.code}</span>
                    <span className="country-name">{item.country}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="phone-input-wrapper">
          <input
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            type="tel"
            placeholder="Número de teléfono"
            className={`phone-number-input ${formErrors.phoneNumber ? 'input-error' : ''}`}
            required
          />
          {formErrors.phoneNumber && <p className="error-message">{formErrors.phoneNumber}</p>}
        </div>
      </div>

      <div className="form-group">
        <input
          name="country"
          value={formData.country}
          onChange={handleChange}
          type="text"
          placeholder="País"
          className={`form-input ${formErrors.country ? 'input-error' : ''}`}
          required
          list="country-suggestions"
        />
        {formErrors.country && <p className="error-message">{formErrors.country}</p>}

        <datalist id="country-suggestions">
          {countryCodes.map((item, index) => (
            <option key={index} value={item.country} />
          ))}
        </datalist>
      </div>

      <div className="form-group">
        <input
          name="password"
          value={formData.password}
          onChange={handleChange}
          type="password"
          placeholder="Contraseña"
          className={`form-input ${formErrors.password ? 'input-error' : ''}`}
          required
        />
        {formErrors.password && <p className="error-message">{formErrors.password}</p>}
      </div>

      <div className="form-group">
        <input
          name="confirmarPassword"
          value={formData.confirmarPassword}
          onChange={handleChange}
          type="password"
          placeholder="Confirmar contraseña"
          className={`form-input ${formErrors.confirmarPassword ? 'input-error' : ''}`}
          required
        />
        {formErrors.confirmarPassword && <p className="error-message">{formErrors.confirmarPassword}</p>}
      </div>

      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            name="acceptWhatsapp"
            checked={formData.acceptWhatsapp}
            onChange={handleChange}
          />
          Acepto recibir mensajes a través de WhatsApp y otros medios.
        </label>
        {formErrors.acceptWhatsapp && <p className="error-message">{formErrors.acceptWhatsapp}</p>}
      </div>

      <button type="submit" className="form-button">Crear Cuenta</button>
    </form>
  );
};

export default RegisterForm;
