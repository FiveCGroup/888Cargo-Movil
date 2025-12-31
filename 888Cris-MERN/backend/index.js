// backend/index.js
dotenv.config({ path: './.env' });
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { CleanupTasks } from './tasks/cleanup.tasks.js';

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');

// Debug brutal para que veamos exactamente qué pasa
console.log('🔥 RUTA ABSOLUTA DEL .env:', envPath);
console.log('🔥 ¿EXISTE EL ARCHIVO?', fs.existsSync(envPath));
if (fs.existsSync(envPath)) {
  const stats = fs.statSync(envPath);
  console.log('🔥 TAMAÑO:', stats.size, 'bytes');
  console.log('🔥 CONTENIDO CRUDO (primeras líneas):');
  const content = fs.readFileSync(envPath, 'utf8');
  console.log(content.split('\n').slice(0, 10).join('\n')); // Muestra las primeras 10 líneas
}

// Forzamos la carga con opciones extras (ignoramos encoding raro)
const result = dotenv.config({
  path: envPath,
  encoding: 'utf8',
  debug: true  // Esto hace que dotenv imprima sus propios logs si falla
});

if (result.error) {
  console.error('❌ FALLO AL CARGAR .env:', result.error.message);
  console.error('❌ Posibles causas: permisos, encoding, o archivo corrupto');
} else {
  console.log('✅ .env CARGADO OK - Variables totales:', Object.keys(result.parsed || {}).length);
}

// Logs inmediatos de las vars clave
console.log('WHATSAPP_ENABLED →', process.env.WHATSAPP_ENABLED);
console.log('EMAIL_NOTIFICATIONS →', process.env.EMAIL_NOTIFICATIONS);
console.log('TOKEN_SECRET (primeros 20) →', process.env.TOKEN_SECRET?.substring(0, 20));
console.log('WHATSAPP_TOKEN (primeros 20) →', process.env.WHATSAPP_TOKEN?.substring(0, 20));

const app = express();


// Middlewares - CORS Permisivo en Desarrollo
const isDevelopment = process.env.NODE_ENV !== 'production';
app.use(cors({
  origin: isDevelopment ? true : ['http://localhost:5173', 'http://192.168.18.21:5173', 'exp://*'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser());

// Servir documentación técnica (code-docs) si existe
try {
  const maxSearchDepth = 6;
  let codeDocsPath = null;
  for (let i = 0; i < maxSearchDepth; i++) {
    const candidate = path.resolve(__dirname, '..'.repeat(i), 'code-docs');
    if (fs.existsSync(candidate)) {
      codeDocsPath = candidate;
      break;
    }
  }
  if (!codeDocsPath) {
    const cwdCandidate = path.resolve(process.cwd(), 'code-docs');
    if (fs.existsSync(cwdCandidate)) codeDocsPath = cwdCandidate;
  }

  if (codeDocsPath) {
    console.log('📚 [Index] Sirviendo documentación desde:', codeDocsPath);
    app.use('/code-docs', express.static(codeDocsPath));
  } else {
    console.warn('⚠️ [Index] No se encontró `code-docs` para servir estáticos.');
  }

  // Endpoint debug para comprobar ruta de docs
  app.get('/api/debug/docs-path', (req, res) => {
    res.json({ path: codeDocsPath, exists: !!codeDocsPath, files: codeDocsPath && fs.existsSync(codeDocsPath) ? fs.readdirSync(codeDocsPath) : [] });
  });
} catch (err) {
  console.error('Error configurando code-docs static:', err);
}

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