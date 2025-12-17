// backend/index.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { CleanupTasks } from './tasks/cleanup.tasks.js';

const app = express();

// Middlewares - CORS Permisivo en Desarrollo
const isDevelopment = process.env.NODE_ENV !== 'production';
app.use(cors({
  origin: isDevelopment ? true : ['http://localhost:5173', 'http://192.168.58.115:5173', 'exp://*'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser());

// RUTAS - SIN ERRORES DE SINTAXIS
app.use('/api', routes);

// Ruta de salud
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: '888Cargo Backend corriendo al 100%',
    timestamp: new Date().toISOString()
  });
});

// Iniciar tareas de limpieza
CleanupTasks.startAll();

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, message: 'Error interno' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`API en http://localhost:${PORT}/api`);
});