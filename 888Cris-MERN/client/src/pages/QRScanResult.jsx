import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import CargoAlerts from "../utils/sweetAlertConfig";
import Navbar from "../components/Navbar";
import '../styles/components/Dashboard.css';
import '../styles/global/buttons.css';
import logo from '../assets/images/888cargo-logo.png';

const QRScanResult = () => {
    // Obtener los datos pasados desde QRScanner mediante state
    const location = useLocation();
    const navigate = useNavigate();
    
    // Desestructurar los datos del QR escaneado
    const { parsedResult, rawResult } = location.state || {};

    // Helper: normalizar clave y decidir si mostrarla
    const normalizeKey = (k = "") =>
        String(k)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // eliminar acentos
            .replace(/[_\s-]/g, ''); // quitar guiones/espacios/underscores

    const excludedNormalized = ['codigounico', 'timestamp', 'version']; // keys a ocultar (normalizadas)

    const shouldIncludeKey = (k) => {
        const nk = normalizeKey(k);
        return !excludedNormalized.includes(nk);
    };

    // Filtrar entradas a mostrar (sin las claves excluidas)
    const filteredEntries = parsedResult && typeof parsedResult === 'object'
        ? Object.entries(parsedResult).filter(([k]) => shouldIncludeKey(k))
        : [];

    // Validar que existan datos, si no, redirigir al scanner
    if (!parsedResult && !rawResult) {
        return (
            <div className="dashboard-layout">
                <Navbar user={null} />
                <div className="dashboard-main-content">
                    <div className="error-container">
                        <div className="error-icon">
                            <i className="fas fa-exclamation-circle"></i>
                        </div>
                        <div className="error-title">No hay datos disponibles</div>
                        <div className="error-message">
                            No se encontraron resultados del escaneo. Por favor, escanea un código QR nuevamente.
                        </div>
                        <button 
                            onClick={() => navigate("/qr-scanner")} 
                            className="btn btn-primary"
                        >
                            <i className="fas fa-qrcode"></i> Volver al Scanner
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Manejar el escaneo de otro código QR
    const handleScanAgain = () => {
        navigate("/qr-scanner");
    };

    // Manejar copiar al portapapeles
    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(rawResult);
        CargoAlerts.showToast("Contenido del QR copiado al portapapeles", "success", 3000);
    };

    // Manejar descargar los datos como PDF con diseño mejorado
    const handleDownloadPDF = async () => {
        try {
            // Crear nueva instancia de PDF (A4 en milímetros)
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Definir colores personalizados
            const primaryColor = [18, 35, 54];      // Azul oscuro
            const secondaryColor = [52, 73, 94];    // Gris oscuro
            const accentColor = [18, 35, 54];       // Azul claro
            const textColor = [44, 62, 80];         // Texto oscuro
            const lightGray = [236, 240, 241];      // Gris claro

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            let yPosition = 10;
            
            // ============================================
            // ENCABEZADO CON LOGO
            // ============================================
            
            // Fondo del encabezado
            doc.setFillColor(...primaryColor);
            doc.rect(0, 0, pageWidth, 30, 'F');

            // Logo (aumentado)
            doc.addImage(logo, 'PNG', 16, -5, 36, 36);
            
            // Texto del encabezado
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text('MÓVIL - Sistema de Gestión de Códigos QR', 15, 25);

            yPosition = 40;
            
            // ============================================
            // TÍTULO
            // ============================================
            
            doc.setTextColor(...textColor);
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('Resultado del Escaneo QR', 15, yPosition);
            yPosition += 10;

            // ============================================
            // INFORMACIÓN DE FECHA
            // ============================================
            
            doc.setFillColor(...lightGray);
            doc.rect(15, yPosition, 180, 15, 'F');
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(...secondaryColor);
            doc.text(`Fecha y hora: ${new Date().toLocaleString('es-ES')}`, 18, yPosition + 5);
            doc.text(`ID Documento: ${new Date().getTime()}`, 18, yPosition + 11);
            
            yPosition += 22;
            
            // ============================================
            // DATOS DEL QR (FILTRADOS)
            // ============================================
            
            if (filteredEntries.length > 0) {
                // Encabezado de sección
                doc.setFillColor(...accentColor);
                doc.rect(15, yPosition - 5, 180, 8, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.text('DATOS DETECTADOS DEL CÓDIGO QR', 18, yPosition);
                
                yPosition += 12;

                // Mostrar cada dato en formato tabla (usando filteredEntries)
                const dataArray = filteredEntries;
                dataArray.forEach((entry, index) => {
                    const [key, value] = entry;
                    const valueStr = String(value);

                    // Verificar salto de página
                    if (yPosition > 260) {
                        doc.addPage();
                        yPosition = 15;
                        
                        // Repetir encabezado en nueva página
                        doc.setFillColor(...primaryColor);
                        doc.rect(0, 0, pageWidth, 10, 'F');
                        doc.setTextColor(255, 255, 255);
                        doc.setFontSize(8);
                        doc.text('888CARGO MÓVIL - Continuación del Documento', 15, 7);
                        yPosition = 18;
                    }

                    // Fondo alternado para mejor legibilidad
                    if (index % 2 === 0) {
                        doc.setFillColor(248, 249, 250);
                        doc.rect(15, yPosition - 4, 180, 10, 'F');
                    }

                    // Borde de celda
                    doc.setDrawColor(...lightGray);
                    doc.rect(15, yPosition - 4, 180, 10);

                    // Texto de la clave (etiqueta)
                    doc.setTextColor(...primaryColor);
                    doc.setFontSize(9);
                    doc.setFont(undefined, 'bold');
                    doc.text(`${key}:`, 18, yPosition + 1);

                    // Texto del valor
                    doc.setTextColor(...textColor);
                    doc.setFont(undefined, 'normal');
                    
                    // Dividir texto largo en múltiples líneas
                    const maxWidth = 130;
                    const splitValue = doc.splitTextToSize(valueStr, maxWidth);
                    
                    if (splitValue.length > 1) {
                        splitValue.forEach((line, idx) => {
                            doc.text(line, 60, yPosition + (idx * 4) + 1);
                        });
                        yPosition += splitValue.length * 4;
                    } else {
                        doc.text(valueStr, 60, yPosition + 1);
                    }

                    yPosition += 10;
                });
            } else {
                // Si no quedan campos útiles después del filtrado, mostrar datos crudos
                doc.setFillColor(...accentColor);
                doc.rect(15, yPosition - 5, 180, 8, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.text('DATOS CRUDOS DEL CÓDIGO QR', 18, yPosition);
                
                yPosition += 12;

                doc.setTextColor(...textColor);
                doc.setFontSize(9);
                doc.setFont(undefined, 'normal');
                
                const rawLines = doc.splitTextToSize(rawResult || '', 170);
                rawLines.forEach((line) => {
                    if (yPosition > 270) {
                        doc.addPage();
                        yPosition = 15;
                    }
                    doc.text(line, 15, yPosition);
                    yPosition += 6;
                });
            }
            
            // ============================================
            // PIE DE PÁGINA
            // ============================================
            
            const totalPages = doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                
                // Línea separadora
                doc.setDrawColor(...lightGray);
                doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);
                
                // Texto del pie de página
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text('Generado por 888CARGO-MÓVIL | Sistema de Gestión de Códigos QR', pageWidth / 2, pageHeight - 12, { align: 'center' });
                doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
            }

            // Generar nombre de archivo con fecha
            const fecha = new Date().toISOString().slice(0, 10);
            const hora = new Date().toTimeString().slice(0, 8).replace(/:/g, '-');
            const nombreArchivo = `888CARGO-QR-${fecha}_${hora}.pdf`;
            
            doc.save(nombreArchivo);
            CargoAlerts.showToast(`PDF descargado: ${nombreArchivo}`, "success", 3000);
        } catch (error) {
            console.error("Error al descargar PDF:", error);
            CargoAlerts.showError("Error al descargar PDF", "Hubo un problema al generar el archivo PDF. Por favor, intenta nuevamente.");
        }
    };

    return (
        <div className="dashboard-layout qr-result-page">
            <Navbar user={null} />
            <div className="dashboard-main-content">
                {/* Encabezado con botón de retorno */}
                <div className="qr-scanner-header">
                    <button 
                        className="btn-back-icon qr-scanner-back-btn"
                        onClick={() => navigate("/dashboard")}
                        title="Volver al Dashboard"
                    >
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <h1 className="qr-scanner-page-title">
                        Resultado del Escaneo
                    </h1>
                </div>

                {/* Contenedor principal de resultados */}
                <div className="qr-scanner-content-card">
                    {/* Sección de datos filtrados */}
                    {filteredEntries.length > 0 ? (
                        <div className="qr-result-section">
                            <h2 className="qr-result-subtitle">
                                <i className="fas fa-check-circle"></i> Datos detectados
                            </h2>
                            <div className="qr-result-grid">
                                {filteredEntries.map(([key, value]) => (
                                    <React.Fragment key={key}>
                                        <div className="qr-result-label">{key}:</div>
                                        <div className="qr-result-value">{String(value)}</div>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Si no hay datos filtrados, mostrar el resultado crudo */
                        <div className="qr-result-section">
                            <h2 className="qr-result-subtitle">
                                <i className="fas fa-barcode"></i> Datos crudos
                            </h2>
                            <div className="qr-result-raw">
                                {rawResult}
                            </div>
                        </div>
                    )}

                    {/* Sección de acciones */}
                    <div className="qr-result-actions">
                        <h3 className="qr-actions-title">Acciones disponibles</h3>
                        <div className="qr-actions-grid">
                            {/* Botón: Escanear otro código */}
                            <button 
                                onClick={handleScanAgain}
                                className="btn btn-primary qr-action-btn"
                                title="Escanear otro código QR"
                            >
                                <i className="fas fa-qrcode"></i> Escanear otro
                            </button>

                            {/* Botón: Copiar al portapapeles */}
                            <button 
                                onClick={handleCopyToClipboard}
                                className="btn btn-secondary qr-action-btn"
                                title="Copiar contenido del QR"
                            >
                                <i className="fas fa-copy"></i> Copiar
                            </button>

                            {/* Botón: Descargar como PDF */}
                            <button 
                                onClick={handleDownloadPDF}
                                className="btn btn-secondary qr-action-btn"
                                title="Descargar datos como PDF"
                            >
                                <i className="fas fa-file-pdf"></i> Descargar PDF
                            </button>
                        </div>
                    </div>

                    {/* Sección informativa */}
                    <div className="qr-result-info">
                        <p className="info-text">
                            <i className="fas fa-info-circle"></i>
                            Los datos del QR han sido escaneados correctamente. 
                            Puedes realizar acciones adicionales o escanear otro código.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRScanResult;