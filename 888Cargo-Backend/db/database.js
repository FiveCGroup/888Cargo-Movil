import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'mobile.db');

let db;

// Promisificar métodos de SQLite
const openDB = () => {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('❌ [DB] Error conectando SQLite:', err);
                reject(err);
            } else {
                console.log('✅ [DB] SQLite conectado:', DB_PATH);
                resolve(db);
            }
        });
    });
};

// Función para ejecutar queries
export const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                console.error('❌ [DB] Error en query:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// Función para insertar (devuelve el ID)
export const insert = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                console.error('❌ [DB] Error en insert:', err);
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
                console.error('❌ [DB] Error en get:', err);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

// Inicializar base de datos y crear tablas
export const initDatabase = async () => {
    try {
        await openDB();
        
        // Crear tabla de usuarios
        await query(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                email TEXT UNIQUE NOT NULL,
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

        // Crear tabla de clientes
        await query(`
            CREATE TABLE IF NOT EXISTS clientes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre_cliente TEXT NOT NULL,
                correo_cliente TEXT,
                telefono_cliente TEXT,
                ciudad_cliente TEXT,
                pais_cliente TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Crear tabla de cargas
        await query(`
            CREATE TABLE IF NOT EXISTS cargas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                codigo_carga TEXT UNIQUE NOT NULL,
                id_cliente INTEGER NOT NULL,
                total_items INTEGER DEFAULT 0,
                peso_total REAL DEFAULT 0,
                valor_total REAL DEFAULT 0,
                direccion_destino TEXT,
                fecha_envio DATE,
                estado TEXT DEFAULT 'Pendiente',
                archivo_original TEXT,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                creado_por INTEGER,
                FOREIGN KEY (id_cliente) REFERENCES clientes(id),
                FOREIGN KEY (creado_por) REFERENCES users(id)
            )
        `);

        // Crear tabla de items del packing list
        await query(`
            CREATE TABLE IF NOT EXISTS packing_list_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                id_carga INTEGER NOT NULL,
                item_numero INTEGER NOT NULL,
                descripcion TEXT NOT NULL,
                cantidad INTEGER DEFAULT 1,
                peso REAL DEFAULT 0,
                medidas TEXT,
                valor REAL DEFAULT 0,
                qr_code TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_carga) REFERENCES cargas(id)
            )
        `);

        console.log('✅ [DB] Base de datos móvil inicializada correctamente');
        console.log('✅ [DB] Tablas creadas: users, clientes, cargas, packing_list_items');
        
        // Retornar la instancia de la base de datos para uso en los controladores
        return db;
        
    } catch (error) {
        console.error('❌ [DB] Error inicializando base de datos:', error);
        throw error;
    }
};

export default { query, insert, get, initDatabase };
