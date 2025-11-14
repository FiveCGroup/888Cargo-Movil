// routes/qr.routes.js
// Rutas para operaciones de códigos QR - Refactorizadas con servicios especializados
import express from "express";
import { 
    generateQRsForArticle,
    generateBatchQRs,
    getArticleQRs,
    scanQRCode,
    getQRStatistics,
    validateQRContent,
    exportQRsAsZip,
    generateQRsPDFForCarga,
    generateQRDataForCarga,
    getQRDataForCarga,
    generateDynamicQRImage,
    validateScannedQRData,
    getSystemDashboard,
    runSystemDiagnostics,
    regenerateQRsForCarga
} from "../controllers/qr.controller.js";
import { authRequired } from "../middlewares/validateToken.js";

const router = express.Router();

// =====================================
// RUTAS DE CÓDIGOS QR - NUEVA ARQUITECTURA v2.0
// =====================================

// Rutas públicas (sin autenticación)
// Validar contenido de QR (legacy)
router.post("/validate", validateQRContent);

// Validar QR escaneado con nueva estructura de datos
router.post("/validate-scanned", validateScannedQRData);

// Generar imagen QR dinámica (pública para facilidad de uso)
router.get("/image/:qrId", generateDynamicQRImage);

// RUTA TEMPORAL DE DEPURACIÓN - Sin autenticación
router.get("/debug/carga/:idCarga/data", getQRDataForCarga);

// Rutas protegidas (requieren autenticación)
// Generar QRs como datos para una carga completa (NUEVA VERSIÓN OPTIMIZADA)
router.post("/carga/:idCarga/generate-data", authRequired, generateQRDataForCarga);

// Obtener datos QR de una carga
router.get("/carga/:idCarga/data", authRequired, getQRDataForCarga);

// Regenerar QRs para una carga (NUEVA FUNCIONALIDAD)
router.post("/carga/:idCarga/regenerate", authRequired, regenerateQRsForCarga);

// Generar QRs para un artículo específico (legacy)
router.post("/articles/:articuloId/generate", authRequired, generateQRsForArticle);

// Generar QRs en lote para múltiples artículos
router.post("/batch/generate", authRequired, generateBatchQRs);

// Obtener QRs de un artículo
router.get("/articles/:articuloId/codes", authRequired, getArticleQRs);

// Escanear código QR
router.post("/scan", authRequired, scanQRCode);

// Obtener estadísticas de QRs
router.get("/statistics", authRequired, getQRStatistics);

// Exportar QRs como ZIP
router.get("/articles/:articuloId/export/zip", authRequired, exportQRsAsZip);

// Generar PDF con QRs de una carga (versión mejorada con opción optimizada)
router.get("/pdf-carga/:idCarga", authRequired, generateQRsPDFForCarga);

// Ruta temporal de prueba sin autenticación
router.get("/pdf-test/:idCarga", generateQRsPDFForCarga);

// Dashboard del sistema
router.get("/dashboard", authRequired, getSystemDashboard);

// Diagnóstico del sistema
router.get("/diagnostics", authRequired, runSystemDiagnostics);

// =====================================
// RUTAS DE COMPATIBILIDAD (LEGACY)
// =====================================

// Mantener compatibilidad con rutas anteriores
router.post("/generar-qrs-articulo/:id_articulo", authRequired, (req, res) => {
    // Redirigir a nueva ruta con formato actualizado
    req.params.articuloId = req.params.id_articulo;
    return generateQRsForArticle(req, res);
});

router.get("/qrs-articulo/:id_articulo", authRequired, (req, res) => {
    // Redirigir a nueva ruta con formato actualizado
    req.params.articuloId = req.params.id_articulo;
    return getArticleQRs(req, res);
});

router.get("/estadisticas", authRequired, (req, res) => {
    // Redirigir a nueva ruta
    return getQRStatistics(req, res);
});

export default router;
