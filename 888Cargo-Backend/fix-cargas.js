import { query, get, insert, initDatabase } from './db/database.js';

async function corregirTablaCargas() {
    try {
        console.log('🔄 Corrigiendo tabla cargas...');
        
        // Inicializar base de datos
        await initDatabase();
        
        // 1. Obtener datos existentes
        const datosExistentes = await query('SELECT * FROM cargas');
        console.log('📊 Datos existentes:', datosExistentes.length, 'registros');
        
        // 2. Eliminar tabla temporal si existe
        try {
            await query('DROP TABLE IF EXISTS cargas_temp');
            console.log('🗑️ Tabla temporal existente eliminada');
        } catch (e) {
            // Ignorar error si no existe
        }
        
        // 3. Crear tabla temporal con la estructura correcta (solo renombrando id a id_carga)
        await query(`
            CREATE TABLE cargas_temp (
                id_carga INTEGER PRIMARY KEY AUTOINCREMENT,
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
                ciudad_destino TEXT,
                cbm_total REAL DEFAULT 0,
                FOREIGN KEY (id_cliente) REFERENCES clientes(id),
                FOREIGN KEY (creado_por) REFERENCES users(id)
            )
        `);
        console.log('✅ Tabla temporal creada');
        
        // 4. Copiar datos usando los campos existentes
        for (const datos of datosExistentes) {
            await query(`
                INSERT INTO cargas_temp (codigo_carga, id_cliente, total_items, peso_total, valor_total, direccion_destino, fecha_envio, estado, archivo_original, fecha_creacion, creado_por, ciudad_destino, cbm_total)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                datos.codigo_carga,
                datos.id_cliente,
                datos.total_items || 0,
                datos.peso_total || 0,
                datos.valor_total || 0,
                datos.direccion_destino,
                datos.fecha_envio,
                datos.estado || 'Pendiente',
                datos.archivo_original,
                datos.fecha_creacion,
                datos.creado_por,
                datos.ciudad_destino,
                datos.cbm_total || 0
            ]);
        }
        console.log('✅ Datos copiados a tabla temporal');
        
        // 5. Eliminar tabla original
        await query('DROP TABLE cargas');
        console.log('✅ Tabla cargas original eliminada');
        
        // 6. Renombrar tabla temporal
        await query('ALTER TABLE cargas_temp RENAME TO cargas');
        console.log('✅ Tabla temporal renombrada a cargas');
        
        // 7. Verificar estructura final
        const estructura = await query('PRAGMA table_info(cargas)');
        console.log('📋 Nueva estructura de la tabla cargas:');
        estructura.forEach(col => {
            console.log(`  - ${col.name}: ${col.type} ${col.pk ? '(PK)' : ''}`);
        });
        
        console.log('✅ ¡Tabla cargas corregida exitosamente!');
        
    } catch (error) {
        console.error('❌ Error al corregir tabla cargas:', error);
        throw error;
    }
}

// Ejecutar la corrección
corregirTablaCargas()
    .then(() => {
        console.log('🎉 Corrección completada');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Error en corrección:', error);
        process.exit(1);
    });