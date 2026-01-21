// backend/db.js
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const dbPath = path.join(__dirname, '..', 'db', 'packing_list.db');

// Configurar SQLite para manejar múltiples conexiones y bloqueos
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Error al conectar con SQLite:', err.message);
  } else {
    console.log('Base de datos SQLite conectada');
    
    // Configurar PRAGMAs de forma secuencial para asegurar que se apliquen
    db.serialize(() => {
      // Configurar WAL mode para mejor rendimiento y menos bloqueos
      db.run('PRAGMA journal_mode = WAL;', (err) => {
        if (err) {
          console.warn('No se pudo activar WAL mode:', err.message);
        } else {
          console.log('WAL mode activado');
        }
      });
      
      // Configurar timeout para reintentos automáticos en caso de bloqueo (30 segundos)
      db.run('PRAGMA busy_timeout = 30000;', (err) => {
        if (err) {
          console.warn('No se pudo configurar busy_timeout:', err.message);
        } else {
          console.log('busy_timeout configurado a 30000ms');
        }
      });
      
      // Configurar foreign keys
      db.run('PRAGMA foreign_keys = ON;', (err) => {
        if (err) {
          console.warn('No se pudo activar foreign keys:', err.message);
        }
      });
      
      // Configurar synchronous para mejor rendimiento con WAL
      db.run('PRAGMA synchronous = NORMAL;', (err) => {
        if (err) {
          console.warn('No se pudo configurar synchronous:', err.message);
        }
      });
    });
  }
});

export const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export async function initializeDatabase() {
  try {
    // Esperar un momento para que las configuraciones PRAGMA se apliquen
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verificar que la conexión esté lista
    await new Promise((resolve, reject) => {
      db.get('SELECT 1', (err) => {
        if (err) {
          // Si hay un error de bloqueo, esperar y reintentar
          if (err.code === 'SQLITE_BUSY') {
            console.warn('Base de datos ocupada, esperando...');
            setTimeout(() => {
              db.get('SELECT 1', (retryErr) => {
                if (retryErr) reject(retryErr);
                else resolve();
              });
            }, 1000);
          } else {
            reject(err);
          }
        } else {
          resolve();
        }
      });
    });
    
    console.log('Inicializando base de datos completa...');
    
    // TUS MIGRACIONES REALES (según tu imagen)
    const migrations = [
      '001_create_recovery_tokens_table.sql',
      '002_create_cotizaciones_table.sql',
      '003_create_users_table.sql',
      '004_create_roles_table.sql',
      '005_create_permissions_table.sql',
      '006_create_user_roles_table.sql',
      '007_create_role_permissions_table.sql',
      '008_create_clientes_table.sql',
      '009_create_carga_table.sql',
      '010_create_articulo_packing_list_table.sql',
      '011_create_caja_table.sql',
      '012_create_qr_table.sql',
      '013_create_contenedores_table.sql',
      '014_create_carga_contenedor_table.sql',
      '015_create_notifications_table.sql',
      '016_create_audit_log_table.sql',
      '017_add_indexes_and_constraints.sql',
      '018_add_cantidad_to_articulo_packing_list.sql',
      '019_fix_clientes_nombre_from_users.sql'
    ];

    for (const migration of migrations) {
      const migrationPath = path.join(__dirname, 'migrations', migration);
      if (fs.existsSync(migrationPath)) {
        console.log(`Ejecutando migración: ${migration}`);
        const sql = fs.readFileSync(migrationPath, 'utf8');
        try {
          // Reintentar hasta 3 veces en caso de bloqueo
          let retries = 3;
          let lastError = null;
          
          while (retries > 0) {
            try {
              await new Promise((resolve, reject) => {
                db.exec(sql, (err) => {
                  if (err) {
                    // Si la migración falla porque la columna/tabla ya existe, continuar (idempotencia básica)
                    if (err.message && (
                      err.message.includes('duplicate column name') ||
                      err.message.includes('already exists') ||
                      err.message.includes('UNIQUE constraint failed')
                    )) {
                      console.warn(`Migración ${migration} ya aplicada. Continuando...`);
                      resolve();
                    } else if (err.code === 'SQLITE_BUSY') {
                      // Si hay bloqueo, rechazar para reintentar
                      reject(err);
                    } else {
                      reject(err);
                    }
                  } else {
                    resolve();
                  }
                });
              });
              // Si llegamos aquí, la migración fue exitosa
              break;
            } catch (err) {
              lastError = err;
              if (err.code === 'SQLITE_BUSY' && retries > 1) {
                console.warn(`Migración ${migration} bloqueada, reintentando... (${retries - 1} intentos restantes)`);
                retries--;
                await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries))); // Backoff exponencial
              } else {
                throw err;
              }
            }
          }
          
          if (lastError && lastError.code === 'SQLITE_BUSY') {
            throw new Error(`No se pudo ejecutar migración ${migration} después de 3 intentos: ${lastError.message}`);
          }
        } catch (err) {
          // Si la migración falla porque la columna ya existe, continuar (idempotencia básica)
          if (err && err.message && (
            err.message.includes('duplicate column name') ||
            err.message.includes('already exists') ||
            err.message.includes('UNIQUE constraint failed')
          )) {
            console.warn(`Migración ${migration} ya aplicada. Continuando...`);
            continue;
          }
          throw err;
        }
      } else {
        console.warn(`Migración no encontrada: ${migration}. Saltando...`);
      }
    }

    console.log('Base de datos inicializada correctamente');
  } catch (error) {
    console.error('Error inicializando base de datos:', error);
    throw error;
  }
}

// Inicializar base de datos de forma asíncrona, pero no bloquear el módulo
initializeDatabase().catch((err) => {
  console.error('Error crítico al inicializar base de datos:', err);
  // No lanzar el error aquí para permitir que el servidor inicie
  // El error se manejará cuando se intente usar la base de datos
});

export default db;