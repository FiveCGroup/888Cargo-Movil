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
                id_carga INTEGER PRIMARY KEY AUTOINCREMENT,
                codigo_carga TEXT UNIQUE NOT NULL,
                id_cliente INTEGER NOT NULL,
                direccion_destino TEXT,
                ciudad_destino TEXT,
                archivo_original TEXT,
                fecha_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                estado TEXT DEFAULT 'Pendiente',
                total_items INTEGER DEFAULT 0,
                peso_total REAL DEFAULT 0,
                valor_total REAL DEFAULT 0,
                cbm_total REAL DEFAULT 0,
                creado_por INTEGER,
                FOREIGN KEY (id_cliente) REFERENCES clientes(id),
                FOREIGN KEY (creado_por) REFERENCES users(id)
            )
        `);

        // Crear tabla de artículos del packing list
        await query(`
            CREATE TABLE IF NOT EXISTS articulo_packing_list (
                id_articulo INTEGER PRIMARY KEY AUTOINCREMENT,
                id_carga INTEGER NOT NULL,
                secuencia INTEGER,
                fecha TEXT,
                marca_cliente TEXT,
                tel_cliente TEXT,
                ciudad_destino TEXT,
                phto TEXT,
                cn TEXT,
                ref_art TEXT,
                descripcion_espanol TEXT,
                descripcion_chino TEXT,
                unit TEXT,
                precio_unit REAL DEFAULT 0,
                precio_total REAL DEFAULT 0,
                material TEXT,
                unidades_empaque INTEGER DEFAULT 0,
                marca_producto TEXT,
                cajas INTEGER DEFAULT 0,
                cant_por_caja INTEGER DEFAULT 0,
                cant_total INTEGER DEFAULT 0,
                largo REAL DEFAULT 0,
                ancho REAL DEFAULT 0,
                alto REAL DEFAULT 0,
                cbm REAL DEFAULT 0,
                cbmtt REAL DEFAULT 0,
                gw REAL DEFAULT 0,
                gwtt REAL DEFAULT 0,
                serial TEXT,
                imagen_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_carga) REFERENCES cargas(id_carga) ON DELETE CASCADE
            )
        `);

        // Crear tabla de cajas
        await query(`
            CREATE TABLE IF NOT EXISTS caja (
                id_caja INTEGER PRIMARY KEY AUTOINCREMENT,
                id_articulo INTEGER NOT NULL,
                numero_caja INTEGER NOT NULL,
                total_cajas INTEGER NOT NULL,
                cantidad_en_caja INTEGER DEFAULT 0,
                cbm REAL DEFAULT 0,
                gw REAL DEFAULT 0,
                descripcion_contenido TEXT,
                observaciones TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_articulo) REFERENCES articulo_packing_list(id_articulo) ON DELETE CASCADE
            )
        `);

        // Crear tabla de QR codes
        await query(`
            CREATE TABLE IF NOT EXISTS qr (
                id_qr INTEGER PRIMARY KEY AUTOINCREMENT,
                id_caja INTEGER NOT NULL,
                codigo_qr TEXT UNIQUE NOT NULL,
                tipo_qr TEXT DEFAULT 'caja',
                datos_qr TEXT,
                estado TEXT DEFAULT 'generado',
                url_imagen TEXT,
                formato TEXT DEFAULT 'PNG',
                tamaño INTEGER DEFAULT 200,
                nivel_correccion TEXT DEFAULT 'M',
                fecha_generacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_caja) REFERENCES caja(id_caja) ON DELETE CASCADE
            )
        `);

        console.log('✅ [DB] Base de datos móvil inicializada correctamente');
        console.log('✅ [DB] Tablas creadas: users, clientes, cargas, articulo_packing_list, caja, qr');
        
        // Retornar la instancia de la base de datos para uso en los controladores
        return db;
        
    } catch (error) {
        console.error('❌ [DB] Error inicializando base de datos:', error);
        throw error;
    }
};

export default { query, insert, get, initDatabase };
