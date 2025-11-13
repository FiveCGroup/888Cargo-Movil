import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import '../styles/components/Dashboard.css';
import '../styles/components/QRScanner.css';
import '../styles/global/buttons.css';

const QRScanner = () => {
    const [result, setResult] = useState(null);
    const [parsedResult, setParsedResult] = useState(null);
    const [error, setError] = useState(null);
    const [cameraPermission, setCameraPermission] = useState("asking");
    const navigate = useNavigate();

    const scannerRef = useRef(null);

    const handleScan = (decodedText, decodedResult) => {
        if (decodedText) {
            setResult(decodedText);
            try {
                const parsed = JSON.parse(decodedText);
                setParsedResult(parsed);
            } catch {
                setParsedResult(null);
            }
        }
    };

    useEffect(() => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices
                .getUserMedia({ video: true })
                .then(() => setCameraPermission("granted"))
                .catch((err) => {
                    console.error("Error al obtener permisos de cámara:", err);
                    setCameraPermission("denied");
                    setError("No se pudo acceder a la cámara. Verifica los permisos.");
                });
        } else {
            setCameraPermission("not-supported");
            setError("Tu navegador no soporta acceso a la cámara.");
        }
        return () => {
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear().catch(() => {});
                } catch (e) {
                    // ignore
                }
                scannerRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (cameraPermission !== 'granted') return;
        const config = { fps: 10, qrbox: 250 };
        const verbose = false;
        const scanner = new Html5QrcodeScanner(
            "html5qr-reader",
            { fps: 10, qrbox: 350, rememberLastUsedCamera: true },
            verbose
        );
        scanner.render(handleScan, (err) => {
            console.warn('QR scan error', err);
            setError('Error escaneando QR: ' + String(err));
        });
        scannerRef.current = scanner;
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(() => {});
                scannerRef.current = null;
            }
        };
    }, [cameraPermission]);

    const handleGoBack = () => {
        navigate("/dashboard");
    };

    return (
        <div className="dashboard-layout qrscanner-page-container">
            <Navbar user={null} />
            <div className="dashboard-main-content">
                {/* Header con botón de regreso y título */}
                <div className="qr-scanner-header">
                    <button 
                        className="btn-back-icon qr-scanner-back-btn"
                        onClick={handleGoBack}
                        title="Volver al Dashboard"
                    >
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <h1 className="qr-scanner-page-title">
                        Escanear Código QR
                    </h1>
                </div>

                <div className="qr-scanner-content-card">
                    {cameraPermission === "asking" && (
                        <div className="qr-scanner-loading">
                            <div className="loading-spinner" />
                        </div>
                    )}

                    {cameraPermission === "granted" && (
                        <div className="qr-scanner-camera-container">
                            <div className="qr-scanner-camera-wrapper">
                                <div className="qr-scanner-overlay" />
                                <div id="html5qr-reader" className="qr-scanner-reader" />
                            </div>
                            <p className="qr-scanner-instructions">
                                Centra el código QR en el recuadro para escanearlo
                            </p>
                        </div>
                    )}

                    {cameraPermission === "denied" && (
                        <div className="error-container">
                            <div className="error-icon"><i className="fas fa-camera-slash"></i></div>
                            <div className="error-title">Permiso de cámara denegado</div>
                            <div className="error-message">{error || "Por favor, permite el acceso a la cámara para escanear códigos QR."}</div>
                            <button onClick={() => window.location.reload()} className="btn btn-primary">
                                <i className="fas fa-redo"></i> Reintentar
                            </button>
                        </div>
                    )}

                    {cameraPermission === "not-supported" && (
                        <div className="error-container">
                            <div className="error-icon"><i className="fas fa-exclamation-triangle"></i></div>
                            <div className="error-title">Cámara no soportada</div>
                            <div className="error-message">{error}</div>
                        </div>
                    )}

                    {result && (
                        <div className="qr-result-card">
                            <h2 className="qr-result-title">Resultado del escaneo</h2>
                            {parsedResult && typeof parsedResult === 'object' ? (
                                <div className="qr-result-content">
                                    <div className="qr-result-grid">
                                        {Object.entries(parsedResult).map(([key, value]) => (
                                            <React.Fragment key={key}>
                                                <div className="qr-result-label">{key}:</div>
                                                <div className="qr-result-value">{String(value)}</div>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="qr-result-raw">
                                    {result}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QRScanner;
