import { query, run, get } from '../db.js';

export class PackingListModel {
    
    // ================== CLIENTE ==================
    
    static async crearCliente(clienteData) {
        const { nombre_cliente, correo_cliente, telefono_cliente, ciudad_cliente, pais_cliente } = clienteData;
        
        const sql = `
            INSERT INTO cliente (nombre_cliente, correo_cliente, telefono_cliente, ciudad_cliente, pais_cliente)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        const result = await run(sql, [nombre_cliente, correo_cliente, telefono_cliente, ciudad_cliente, pais_cliente]);
        return result.lastID || result.id;
    }
    
    static async obtenerClientePorId(id_cliente) {
        const sql = `SELECT * FROM cliente WHERE id_cliente = ?`;
        return await get(sql, [id_cliente]);
    }
    
    static async obtenerClientePorCorreo(correo_cliente) {
        const sql = `SELECT * FROM cliente WHERE correo_cliente = ?`;
        return await get(sql, [correo_cliente]);
    }
    
    // ================== CARGA ==================
    
    static async crearCarga(cargaData) {
        const { codigo_carga, fecha_inicio, fecha_fin, ciudad_destino, archivo_original, id_cliente } = cargaData;
        
        const sql = `
            INSERT INTO carga (codigo_carga, fecha_inicio, fecha_fin, ciudad_destino, archivo_original, id_cliente)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const result = await run(sql, [codigo_carga, fecha_inicio, fecha_fin, ciudad_destino, archivo_original, id_cliente]);
        return result.lastID || result.id;
    }
    
    static async obtenerCargaPorId(id_carga) {
        const sql = `
            SELECT c.*, cl.nombre_cliente, cl.correo_cliente 
            FROM carga c 
            LEFT JOIN cliente cl ON c.id_cliente = cl.id_cliente 
            WHERE c.id_carga = ?
        `;
        return await get(sql, [id_carga]);
    }
    
    static async obtenerCargasPorCliente(id_cliente) {
        const sql = `SELECT * FROM carga WHERE id_cliente = ? ORDER BY fecha_creacion DESC`;
        return await query(sql, [id_cliente]);
    }
    
    // ================== ARTÍCULO PACKING LIST ==================
    
    static async crearArticulo(articuloData) {
        const {
            id_carga, fecha, cn, ref_art, descripcion_espanol, descripcion_chino,
            unidad, precio_unidad, precio_total, material, unidades_empaque,
            marca_producto, serial, medida_largo, medida_ancho, medida_alto,
            cbm, gw, imagen_url
        } = articuloData;
        
        const sql = `
            INSERT INTO articulo_packing_list (
                id_carga, fecha, cn, ref_art, descripcion_espanol, descripcion_chino,
                unidad, precio_unidad, precio_total, material, unidades_empaque,
                marca_producto, serial, medida_largo, medida_ancho, medida_alto,
                cbm, gw, imagen_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const result = await run(sql, [
            id_carga, fecha, cn, ref_art, descripcion_espanol, descripcion_chino,
            unidad, precio_unidad, precio_total, material, unidades_empaque,
            marca_producto, serial, medida_largo, medida_ancho, medida_alto,
            cbm, gw, imagen_url
        ]);
        
        return result.lastID || result.id;
    }
    
    static async obtenerArticulosPorCarga(id_carga) {
        const sql = `SELECT * FROM articulo_packing_list WHERE id_carga = ? ORDER BY id_articulo`;
        return await query(sql, [id_carga]);
    }
    
    static async obtenerArticuloPorId(id_articulo) {
        const sql = `SELECT * FROM articulo_packing_list WHERE id_articulo = ?`;
        return await get(sql, [id_articulo]);
    }
    
    static async obtenerImagenArticulo(id_articulo) {
        const sql = `SELECT imagen_data, imagen_nombre, imagen_tipo FROM articulo_packing_list WHERE id_articulo = ?`;
        return await get(sql, [id_articulo]);
    }
    
    static async actualizarUrlImagen(id_articulo, imagen_url) {
        const sql = `UPDATE articulo_packing_list SET imagen_url = ? WHERE id_articulo = ?`;
        return await run(sql, [imagen_url, id_articulo]);
    }
    
    // ================== CAJA ==================
    
    static async crearCaja(cajaData) {
        const { id_articulo, numero_caja, cantidad_en_caja, cbm, gw } = cajaData;
        
        const sql = `
            INSERT INTO caja (id_articulo, numero_caja, cantidad_en_caja, cbm, gw)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        const result = await run(sql, [id_articulo, numero_caja, cantidad_en_caja, cbm, gw]);
        return result.lastID || result.id;
    }
    
    static async obtenerCajasPorArticulo(id_articulo) {
        const sql = `SELECT * FROM caja WHERE id_articulo = ? ORDER BY numero_caja`;
        return await query(sql, [id_articulo]);
    }
    
    // ================== MÉTODOS COMPLEJOS ==================
    
    static async obtenerPackingListCompleto(id_carga) {
        const sql = `
            SELECT 
                c.codigo_carga,
                c.fecha_inicio,
                c.ciudad_destino,
                c.archivo_original,
                cl.nombre_cliente,
                cl.telefono_cliente,
                cl.ciudad_cliente,
                apl.*,
                GROUP_CONCAT(
                    CASE WHEN cj.id_caja IS NOT NULL THEN
                        'Caja ' || cj.numero_caja || ': ' || cj.cantidad_en_caja || ' unidades'
                    END, 
                    '; '
                ) as detalle_cajas
            FROM carga c
            LEFT JOIN cliente cl ON c.id_cliente = cl.id_cliente
            LEFT JOIN articulo_packing_list apl ON c.id_carga = apl.id_carga
            LEFT JOIN caja cj ON apl.id_articulo = cj.id_articulo
            WHERE c.id_carga = ?
            GROUP BY apl.id_articulo
            ORDER BY apl.id_articulo
        `;
        
        return await query(sql, [id_carga]);
    }
    
    static async calcularEstadisticasCarga(id_carga) {
        const sql = `
            SELECT 
                COUNT(apl.id_articulo) as total_articulos,
                SUM(apl.precio_total) as precio_total_carga,
                SUM(apl.cbm) as cbm_total,
                SUM(apl.gw) as peso_total,
                COUNT(DISTINCT cj.id_caja) as total_cajas
            FROM articulo_packing_list apl
            LEFT JOIN caja cj ON apl.id_articulo = cj.id_articulo
            WHERE apl.id_carga = ?
        `;
        
        return await get(sql, [id_carga]);
    }
    
    // ================== VALIDACIONES ==================
    
    static async validarCodigoCargaUnico(codigo_carga, id_carga = null) {
        let sql = `SELECT COUNT(*) as count FROM carga WHERE codigo_carga = ?`;
        let params = [codigo_carga];
        
        if (id_carga) {
            sql += ` AND id_carga != ?`;
            params.push(id_carga);
        }
        
        const result = await get(sql, params);
        return result.count === 0;
    }
    
    static async validarCorreoClienteUnico(correo_cliente, id_cliente = null) {
        let sql = `SELECT COUNT(*) as count FROM cliente WHERE correo_cliente = ?`;
        let params = [correo_cliente];
        
        if (id_cliente) {
            sql += ` AND id_cliente != ?`;
            params.push(id_cliente);
        }
        
        const result = await get(sql, params);
        return result.count === 0;
    }
    
    // ================== MÉTODOS DE BÚSQUEDA ==================
    
    static async buscarCargasPorCodigo(codigo_carga) {
        const sql = `
            SELECT 
                c.id_carga,
                c.codigo_carga,
                c.fecha_inicio,
                c.fecha_fin,
                c.ciudad_destino,
                c.archivo_original,
                c.fecha_creacion,
                cl.id_cliente,
                cl.nombre_cliente,
                cl.correo_cliente,
                cl.telefono_cliente,
                cl.ciudad_cliente,
                cl.pais_cliente
            FROM carga c
            LEFT JOIN cliente cl ON c.id_cliente = cl.id_cliente
            WHERE c.codigo_carga LIKE ?
            ORDER BY c.fecha_creacion DESC
        `;
        
        return await query(sql, [`%${codigo_carga}%`]);
    }
    
    static async obtenerTodasLasCargas() {
        const sql = `
            SELECT 
                c.id_carga,
                c.codigo_carga,
                c.fecha_inicio,
                c.fecha_fin,
                c.ciudad_destino,
                c.archivo_original,
                c.fecha_creacion,
                cl.id_cliente,
                cl.nombre_cliente,
                cl.correo_cliente,
                cl.telefono_cliente,
                cl.ciudad_cliente,
                cl.pais_cliente
            FROM carga c
            LEFT JOIN cliente cl ON c.id_cliente = cl.id_cliente
            ORDER BY c.fecha_creacion DESC
        `;
        
        return await query(sql);
    }
    
    static async obtenerEstadisticasCarga(id_carga) {
        const sql = `
            SELECT 
                COUNT(apl.id_articulo) as total_articulos,
                SUM(apl.precio_total) as precio_total_carga,
                SUM(apl.cbm) as cbm_total,
                SUM(apl.gw) as peso_total,
                COALESCE(SUM(cj.cantidad_en_caja), 0) as total_cajas
            FROM articulo_packing_list apl
            LEFT JOIN caja cj ON apl.id_articulo = cj.id_articulo
            WHERE apl.id_carga = ?
        `;
        
        const result = await get(sql, [id_carga]);
        return result || {
            total_articulos: 0,
            precio_total_carga: 0,
            cbm_total: 0,
            peso_total: 0,
            total_cajas: 0
        };
    }
    
    static async contarArticulosCarga(id_carga) {
        const sql = `SELECT COUNT(*) as count FROM articulo_packing_list WHERE id_carga = ?`;
        const result = await get(sql, [id_carga]);
        return result.count || 0;
    }
}
