import React, { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/components/Dashboard.css"; // Estilos del Dashboard
import Navbar from "./Navbar";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  //Funcion para activar la navegacion entre paginas
  const navigate = useNavigate();

  // Función para ir al escáner QR
  const goToQRScanner = () => {
    navigate("/qr-scanner");
  };

  // Función para ir a crear carga
  const goToCrearCarga = () => {
    navigate("/crear-carga");
  };

  // Función para ir a la documentación
  const goToDocumentacion = () => {
    navigate("/documentacion");
  };

  // Efecto para obtener el perfil del usuario al cargar el componente
  // Se usa el hook useEffect para hacer la llamada a la API y actualizar el estado
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await API.get("/profile");
        setUser(response.data);
      } catch (error) {
        console.error("Error al obtener perfil:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Función para cerrar sesión - Movida al componente Navbar
  // const handleLogout = async () => {
  //     try {
  //         await API.post('/api/logout');
  //         localStorage.removeItem('user');
  //         navigate('/auth');
  //     } catch (error) {
  //         console.error('Error al cerrar sesión:', error);
  //     }
  // };

  // Si el usuario no está cargando, se muestra un mensaje de carga
  // Se usa un condicional para mostrar un mensaje de carga mientras se obtiene el perfil del usuario
  if (loading) return <div>Cargando...</div>;

  return (
    <div className="dashboard-layout">
      <Navbar user={user} />

      {/* CONTENIDO PRINCIPAL */}
      <div className="dashboard-main-content">
        <div>
          <h1>Soluciones de Logística y Transporte</h1>
        </div>

        <div className="dashboard-cards-container">
          <div
            className="dashboard-card"
            //onClick={goToCrearCarga}
          >
            <svg
              className="dashboard-btn cotizador"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              onClick={() => navigate("/cotizador")}
            >
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              <path d="M9 8h2m4 0h2" />
            </svg>
            <span className="card-title">Cotiza tu envío</span>
          </div>

          <div className="dashboard-card primary" onClick={goToCrearCarga}>
            <svg
              className="card-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8m-4-4h8" />
            </svg>
            <span className="card-title">Crear carga</span>
          </div>

          <div
            className="dashboard-card"
            //onClick={goToCrearCarga}
          >
            <svg
              className="card-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <path d="M9 14h6m-6 4h6" />
            </svg>
            <span className="card-title">Control de carga</span>
          </div>

          <div
            className="dashboard-card"
            // onClick={goToCrearCarga}
          >
            <svg
              className="Card-icon"
              viewBox="0 0 462.5 462.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <g id="SVGRepo_iconCarrier">
                <g>
                  <path
                    d="M3.75,425v30c0,4.142,3.358,7.5,7.5,7.5s7.5-3.358,7.5-7.5v-40L3.75,425z"
                  ></path>
                  <path
                    d="M147.912,405v50c0,4.142,3.358,7.5,7.5,7.5s7.5-3.358,7.5-7.5v-50H147.912z"
                  ></path>
                  <path
                    d="M299.579,405v50c0,4.142,3.357,7.5,7.5,7.5s7.5-3.358,7.5-7.5v-50H299.579z"
                  ></path>
                  <path
                    d="M443.75,415v40c0,4.142,3.357,7.5,7.5,7.5s7.5-3.358,7.5-7.5v-30L443.75,415z"
                  ></path>
                  <polygon
                    points="3.75,0 3.75,425 155.41,425 175.41,212.5 155.41,0 "
                  ></polygon>
                  <path
                    d="M458.75,0v425H307.08l-20-212.5l20-212.5H458.75z"
                  ></path>
                  <path
                    d="M307.08,0v425H155.41V0H307.08z"
                  ></path>
                  <path
                    d="M210.41,197.5c8.29,0,15,6.72,15,15s-6.71,15-15,15c-8.28,0-15-6.72-15-15 S202.13,197.5,210.41,197.5z"
                  ></path>
                  <path
                    d="M362.08,197.5c8.28,0,15,6.72,15,15s-6.72,15-15,15c-8.29,0-15-6.72-15-15 S353.79,197.5,362.08,197.5z"
                  ></path>
                  <path
                    d="M115.412,47.5H43.745c-4.142,0-7.5-3.358-7.5-7.5s3.358-7.5,7.5-7.5h71.667 c4.142,0,7.5,3.358,7.5,7.5S119.554,47.5,115.412,47.5z"
                  ></path>
                  <path
                    d="M115.412,77.5H43.745c-4.142,0-7.5-3.358-7.5-7.5s3.358-7.5,7.5-7.5h71.667 c4.142,0,7.5,3.358,7.5,7.5S119.554,77.5,115.412,77.5z"
                  ></path>
                  <path
                    d="M115.412,107.5H43.745c-4.142,0-7.5-3.358-7.5-7.5s3.358-7.5,7.5-7.5h71.667 c4.142,0,7.5,3.358,7.5,7.5S119.554,107.5,115.412,107.5z"
                  ></path>
                  <path
                    d="M115.412,332.5H43.745c-4.142,0-7.5-3.358-7.5-7.5s3.358-7.5,7.5-7.5h71.667 c4.142,0,7.5,3.358,7.5,7.5S119.554,332.5,115.412,332.5z"
                  ></path>
                  <path
                    d="M115.412,362.5H43.745c-4.142,0-7.5-3.358-7.5-7.5s3.358-7.5,7.5-7.5h71.667 c4.142,0,7.5,3.358,7.5,7.5S119.554,362.5,115.412,362.5z"
                  ></path>
                  <path
                    d="M115.412,392.5H43.745c-4.142,0-7.5-3.358-7.5-7.5s3.358-7.5,7.5-7.5h71.667 c4.142,0,7.5,3.358,7.5,7.5S119.554,392.5,115.412,392.5z"
                  ></path>
                  <path
                    d="M267.079,47.5h-71.667c-4.142,0-7.5-3.358-7.5-7.5s3.358-7.5,7.5-7.5h71.667 c4.143,0,7.5,3.358,7.5,7.5S271.221,47.5,267.079,47.5z"
                  ></path>
                  <path
                    d="M267.079,77.5h-71.667c-4.142,0-7.5-3.358-7.5-7.5s3.358-7.5,7.5-7.5h71.667 c4.143,0,7.5,3.358,7.5,7.5S271.221,77.5,267.079,77.5z"
                  ></path>
                  <path
                    d="M267.079,107.5h-71.667c-4.142,0-7.5-3.358-7.5-7.5s3.358-7.5,7.5-7.5h71.667 c4.143,0,7.5,3.358,7.5,7.5S271.221,107.5,267.079,107.5z"
                  ></path>
                  <path
                    d="M267.079,332.5h-71.667c-4.142,0-7.5-3.358-7.5-7.5s3.358-7.5,7.5-7.5h71.667 c4.143,0,7.5,3.358,7.5,7.5S271.221,332.5,267.079,332.5z"
                  ></path>
                  <path
                    d="M267.079,362.5h-71.667c-4.142,0-7.5-3.358-7.5-7.5s3.358-7.5,7.5-7.5h71.667 c4.143,0,7.5,3.358,7.5,7.5S271.221,362.5,267.079,362.5z"
                  ></path>
                  <path
                    d="M267.079,392.5h-71.667c-4.142,0-7.5-3.358-7.5-7.5s3.358-7.5,7.5-7.5h71.667 c4.143,0,7.5,3.358,7.5,7.5S271.221,392.5,267.079,392.5z"
                  ></path>
                  <path
                    d="M418.745,47.5h-71.666c-4.143,0-7.5-3.358-7.5-7.5s3.357-7.5,7.5-7.5h71.666 c4.143,0,7.5,3.358,7.5,7.5S422.887,47.5,418.745,47.5z"
                  ></path>
                  <path
                    d="M418.745,77.5h-71.666c-4.143,0-7.5-3.358-7.5-7.5s3.357-7.5,7.5-7.5h71.666 c4.143,0,7.5,3.358,7.5,7.5S422.887,77.5,418.745,77.5z"
                  ></path>
                  <path
                    d="M418.745,107.5h-71.666c-4.143,0-7.5-3.358-7.5-7.5s3.357-7.5,7.5-7.5h71.666 c4.143,0,7.5,3.358,7.5,7.5S422.887,107.5,418.745,107.5z"
                  ></path>
                  <path
                    d="M418.745,332.5h-71.666c-4.143,0-7.5-3.358-7.5-7.5s3.357-7.5,7.5-7.5h71.666 c4.143,0,7.5,3.358,7.5,7.5S422.887,332.5,418.745,332.5z"
                  ></path>
                  <path
                    d="M418.745,362.5h-71.666c-4.143,0-7.5-3.358-7.5-7.5s3.357-7.5,7.5-7.5h71.666 c4.143,0,7.5,3.358,7.5,7.5S422.887,362.5,418.745,362.5z"
                  ></path>
                  <path
                    d="M418.745,392.5h-71.666c-4.143,0-7.5-3.358-7.5-7.5s3.357-7.5,7.5-7.5h71.666 c4.143,0,7.5,3.358,7.5,7.5S422.887,392.5,418.745,392.5z"
                  ></path>
                  <path
                    d="M58.75,197.5c8.28,0,15,6.72,15,15s-6.72,15-15,15c-8.29,0-15-6.72-15-15S50.46,197.5,58.75,197.5z"
                  ></path>
                </g>
              </g>
            </svg>

            <span className="card-title">Locker</span>
          </div>

          <div className="dashboard-card secondary" onClick={goToQRScanner}>
            <svg
              className="card-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <rect x="7" y="7" width="3" height="3" />
              <rect x="14" y="7" width="3" height="3" />
              <rect x="7" y="14" width="3" height="3" />
              <path d="M14 14h3v3" />
            </svg>
            <span className="card-title">Escanear código QR</span>
          </div>

          <div className="dashboard-card" onClick={goToDocumentacion}>
            <svg
              className="card-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="card-title">📚 Documentación</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
