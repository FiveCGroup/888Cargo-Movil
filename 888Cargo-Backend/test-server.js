const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = 3102;

console.log('🚀 [Test Server] Iniciando...');

// CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Multer
const upload = multer({ storage: multer.memoryStorage() });

// Health check
app.get('/api/health', (req, res) => {
    console.log('🏥 Health check');
    res.json({ status: 'ok', port: PORT });
});

// Procesar Excel
app.post('/api/cargas/procesar-excel', upload.single('excelFile'), (req, res) => {
    console.log('📄 Procesando Excel...');
    console.log('📄 Archivo:', req.file ? req.file.originalname : 'No hay archivo');
    
    const datos = [
        ['SKU', 'Producto', 'Cantidad', 'Precio'],
        ['001', 'Producto A', '10', '25.99'],
        ['002', 'Producto B', '15', '35.99'],
        ['003', 'Producto C', '8', '45.99']
    ];
    
    res.json({
        success: true,
        data: {
            datosExcel: datos,
            estadisticas: { totalFilas: 4, filasValidas: 3, filasConError: 0 }
        }
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor en puerto ${PORT}`);
    console.log(`🌐 Local: http://localhost:${PORT}/api/health`);
    console.log(`📱 Emulador: http://10.0.2.2:${PORT}/api/health`);
});
