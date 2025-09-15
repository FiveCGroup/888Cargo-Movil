import { query, get, insert, initDatabase } from './db/database.js';

async function recrearTablaCargas() {
    try {
        console.log('🔄 Recreando tabla cargas con estructura correcta...');
        
        // Inicializar base de datos
        await initDatabase();
        
        // 1. Verificar si hay datos existentes
        const datosExistentes = await query('SELECT * FROM cargas');
        console.log('📊 Datos existentes:', datosExistentes.length, 'registros');
        
        // 2. Crear una tabla temporal con la estructura correcta
        await query(`
            CREATE TABLE IF NOT EXISTS cargas_temp (
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
        
        // 3. Copiar datos si existen
        if (datosExistentes.length > 0) {
            await query(`
                INSERT INTO cargas_temp (codigo_carga, id_cliente, direccion_destino, ciudad_destino, archivo_original, fecha_inicio, fecha_creacion, estado, total_items, peso_total, valor_total, cbm_total, creado_por)
                SELECT codigo_carga, id_cliente, direccion_destino, ciudad_destino, archivo_original, fecha_inicio, fecha_creacion, estado, total_items, peso_total, valor_total, cbm_total, creado_por
                FROM cargas
            `);
            console.log('✅ Datos copiados a tabla temporal');
        }
        
        // 4. Eliminar tabla original
        await query('DROP TABLE cargas');
        console.log('✅ Tabla cargas original eliminada');
        
        // 5. Renombrar tabla temporal
        await query('ALTER TABLE cargas_temp RENAME TO cargas');
        console.log('✅ Tabla temporal renombrada a cargas');
        
        // 6. Verificar estructura final
        const estructura = await query('PRAGMA table_info(cargas)');
        console.log('📋 Nueva estructura de la tabla cargas:');
        estructura.forEach(col => {
            console.log(`  - ${col.name}: ${col.type} ${col.pk ? '(PK)' : ''}`);
        });
        
        console.log('✅ ¡Tabla cargas recreada exitosamente!');
        
    } catch (error) {
        console.error('❌ Error al recrear tabla cargas:', error);
        throw error;
    }
}

// Ejecutar la migración
recrearTablaCargas()
    .then(() => {
        console.log('🎉 Migración completada');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Error en migración:', error);
        process.exit(1);
    });