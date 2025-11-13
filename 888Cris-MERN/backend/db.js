import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Configuración de SQLite - Base de datos en carpeta db separada
const dbPath = path.join(__dirname, '..', 'db', 'packing_list.db');

// Crear la base de datos SQLite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error al conectar con SQLite:', err.message);
  } else {
    console.log('✅ Base de datos SQLite conectada');
  }
});

// Función para promisificar las consultas de SQLite
export const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Función para ejecutar comandos SQL (INSERT, UPDATE, DELETE)
export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

// Función para obtener un solo registro
export const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Función para inicializar las tablas
export const initializeDatabase = async () => {
  try {
    // Verificar si necesitamos recrear las tablas
    try {
      // Verificar la estructura actual de las tablas
      const resultAPL = await query("PRAGMA table_info(articulo_packing_list)");
      const tieneImagenData = resultAPL.some(col => col.name === 'imagen_data');
      
      const resultCarga = await query("PRAGMA table_info(carga)");
      const tieneCodigoCarga = resultCarga.some(col => col.name === 'codigo_carga');
      
      // Verificar si la tabla caja tiene los nuevos campos
      const resultCaja = await query("PRAGMA table_info(caja)");
      const tieneTotalCajas = resultCaja.some(col => col.name === 'total_cajas');
      
      // Verificar si existe la tabla qr y su estructura optimizada
      const tablas = await query("SELECT name FROM sqlite_master WHERE type='table' AND name='qr'");
      const existeTablaQR = tablas.length > 0;
      
      let tieneEstructuraOptimizada = false;
      if (existeTablaQR) {
        const resultQR = await query("PRAGMA table_info(qr)");
        tieneEstructuraOptimizada = resultQR.some(col => col.name === 'datos_qr') && 
                                    resultQR.some(col => col.name === 'contenido_json') &&
                                    resultQR.some(col => col.name === 'opciones_render');
      }
      
      if (!tieneCodigoCarga || !tieneImagenData || !tieneTotalCajas || !existeTablaQR || !tieneEstructuraOptimizada) {
        console.log('🔄 Actualizando estructura de base de datos a versión QR optimizada v2.0...');
        
        // Eliminar tablas en el orden correcto (respetando foreign keys)
        await run(`DROP TABLE IF EXISTS qr`);
        await run(`DROP TABLE IF EXISTS caja`);
        await run(`DROP TABLE IF EXISTS articulo_packing_list`);
        await run(`DROP TABLE IF EXISTS carga`);
      }
    } catch (error) {
      // Primera vez creando tablas
    }

    // Crear tabla cliente (actualizada) con campo cliente_shippingMark
    await run(`
      CREATE TABLE IF NOT EXISTS cliente (
        id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_cliente TEXT NOT NULL,
        correo_cliente TEXT UNIQUE,
        telefono_cliente TEXT,
        ciudad_cliente TEXT,
        pais_cliente TEXT,
        direccion_entrega TEXT,
        cliente_shippingMark TEXT UNIQUE,
        password TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Asegurar que la columna cliente_shippingMark exista en esquemas antiguos
    try {
      const clienteCols = await query("PRAGMA table_info(cliente)");
      const hasShipping = clienteCols.some(col => col.name === 'cliente_shippingMark');
      if (!hasShipping) {
        await run('ALTER TABLE cliente ADD COLUMN cliente_shippingMark TEXT UNIQUE');
        console.log('🔧 Columna cliente_shippingMark añadida a tabla cliente');
      }
    } catch (err) {
      // Si algo falla, continuar (tabla recién creada o no accesible)
    }

    // Crear tabla users (para autenticación)
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        nombre_cliente TEXT,
        correo_cliente TEXT,
        telefono_cliente TEXT,
        ciudad_cliente TEXT,
        pais_cliente TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla carga (nueva estructura)
    await run(`
      CREATE TABLE IF NOT EXISTS carga (
        id_carga INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo_carga TEXT NOT NULL UNIQUE,
        fecha_inicio DATE NOT NULL,
        fecha_fin DATE,
        ciudad_destino TEXT,
        direccion_destino TEXT,
        archivo_original TEXT,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        id_cliente INTEGER NOT NULL,
        FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente)
      )
    `);

    // Crear tabla articulo_packing_list (nueva estructura)
    await run(`
      CREATE TABLE IF NOT EXISTS articulo_packing_list (
        id_articulo INTEGER PRIMARY KEY AUTOINCREMENT,
        id_carga INTEGER NOT NULL,
        fecha DATE,
        cn TEXT,
        ref_art TEXT,
        descripcion_espanol TEXT,
        descripcion_chino TEXT,
        unidad TEXT,
        precio_unidad REAL,
        precio_total REAL,
        material TEXT,
        unidades_empaque INTEGER,
        marca_producto TEXT,
        serial TEXT,
        medida_largo REAL,
        medida_ancho REAL,
        medida_alto REAL,
        cbm REAL,
        gw REAL,
        imagen_url TEXT,
        imagen_data BLOB,
        imagen_nombre TEXT,
        imagen_tipo TEXT,
        FOREIGN KEY (id_carga) REFERENCES carga(id_carga)
      )
    `);

    // Crear tabla caja (nueva estructura con campos para QR)
    await run(`
      CREATE TABLE IF NOT EXISTS caja (
        id_caja INTEGER PRIMARY KEY AUTOINCREMENT,
        id_articulo INTEGER NOT NULL,
        numero_caja INTEGER NOT NULL,
        total_cajas INTEGER NOT NULL,
        cantidad_en_caja INTEGER,
        cbm REAL,
        gw REAL,
        descripcion_contenido TEXT,
        observaciones TEXT,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_articulo) REFERENCES articulo_packing_list(id_articulo)
      )
    `);

    // Crear tabla qr (nueva tabla para códigos QR - optimizada para datos)
    await run(`
      CREATE TABLE IF NOT EXISTS qr (
        id_qr INTEGER PRIMARY KEY AUTOINCREMENT,
        id_caja INTEGER NOT NULL,
        codigo_qr TEXT NOT NULL UNIQUE,
        tipo_qr TEXT DEFAULT 'caja',
        datos_qr TEXT NOT NULL,
        contenido_json TEXT,
        fecha_generacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_escaneado DATETIME,
        fecha_impresion DATETIME,
        estado TEXT DEFAULT 'generado',
        opciones_render TEXT DEFAULT '{"width":300,"margin":2,"color":{"dark":"#000000","light":"#FFFFFF"}}',
        escaneado_por TEXT,
        contador_escaneos INTEGER DEFAULT 0,
        FOREIGN KEY (id_caja) REFERENCES caja(id_caja)
      )
    `);

    console.log('✅ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    throw error;
  }
};

// Inicializar la base de datos al cargar el módulo
initializeDatabase();

export default db;