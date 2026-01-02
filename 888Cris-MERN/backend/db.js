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

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con SQLite:', err.message);
  } else {
    console.log('Base de datos SQLite conectada');
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
          await new Promise((resolve, reject) => {
            db.exec(sql, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        } catch (err) {
          // Si la migración falla porque la columna ya existe, continuar (idempotencia básica)
          if (err && err.message && err.message.includes('duplicate column name')) {
            console.warn(`Migración ${migration} ya aplicada (columna duplicada). Continuando...`);
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

initializeDatabase();

export default db;