import { query, run, get } from '../db.js';

// Obtener un cliente por correo electrónico
export async function getClienteByEmail(email) {
  try {
    const result = await get('SELECT * FROM cliente WHERE correo_cliente = ?', [email]);
    return result;
  } catch (error) {
    console.error('Error al buscar cliente por email:', error);
    throw error;
  }
}

// Obtener un cliente por ID
export async function getClienteById(id) {
  try {
    const result = await get('SELECT * FROM cliente WHERE id_cliente = ?', [id]);
    return result;
  } catch (error) {
    console.error('Error al buscar cliente por ID:', error);
    throw error;
  }
}

// Crear un nuevo cliente
export async function createCliente(clienteData) {
  const {
    nombre_cliente,
    correo_cliente,
    telefono_cliente,
    ciudad_cliente,
    pais_cliente,
    password
  } = clienteData;

  try {
    // Generar cliente_shippingMark único antes de insertar
    const cliente_shippingMark = await generateUniqueShippingMark(nombre_cliente);

    const result = await run(
      `INSERT INTO cliente 
      (nombre_cliente, correo_cliente, telefono_cliente, ciudad_cliente, pais_cliente, cliente_shippingMark, password) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre_cliente, correo_cliente, telefono_cliente, ciudad_cliente, pais_cliente, cliente_shippingMark, password]
    );
    
    // Obtener el cliente recién creado
    const newCliente = await getClienteById(result.id);
    return newCliente;
  } catch (error) {
    console.error('Error al crear cliente:', error);
    throw error;
  }
}

/**
 * Genera un shippingMark único basado en iniciales del nombre y el prefijo 888.
 * Si ya existe, se intentan combinaciones adicionales tomando letras siguientes del nombre
 */
export async function generateUniqueShippingMark(nombreCliente) {
  const { query } = await import('../db.js');
  const prefix = '888';

  // Normalizar nombre: mantener solo letras y espacios
  const clean = (nombreCliente || '').replace(/[^a-zA-Z\s]/g, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  const nameLetters = clean.replace(/\s+/g, '').toUpperCase();

  // Helper: generar 3 letras a partir de un string (recorta o rellena)
  const threeFrom = (s) => {
    const src = (s || '').toUpperCase();
    if (src.length >= 3) return src.substring(0, 3);
    return (src + 'XXX').substring(0, 3);
  };

  // 1) Candidate base: primeras iniciales de hasta 3 palabras
  let base = '';
  if (parts.length >= 3) {
    base = (parts[0][0] + parts[1][0] + parts[2][0]).toUpperCase();
  } else if (parts.length === 2) {
    base = (parts[0][0] + parts[1][0] + (parts[0].length > 1 ? parts[0][1] : 'X')).toUpperCase();
  } else if (parts.length === 1) {
    base = threeFrom(parts[0]);
  } else {
    // Nombre vacío: fallback simple
    base = threeFrom(nameLetters || Math.random().toString(36).toUpperCase());
  }

  // Construir lista de candidatos ordenada por prioridad
  const candidates = new Set();
  // añadir base
  candidates.add(base);

  // 2) Substrings de longitud 3 del nombre (ventana deslizante)
  for (let i = 0; i + 3 <= nameLetters.length; i++) {
    candidates.add(nameLetters.substring(i, i + 3));
  }

  // 3) Combinaciones: iniciales + letras subsecuentes de las partes
  for (let i = 0; i < parts.length; i++) {
    for (let j = 0; j < parts.length; j++) {
      for (let k = 0; k < parts.length; k++) {
        const a = (parts[i][0] || 'X').toUpperCase();
        const b = (parts[j][0] || 'X').toUpperCase();
        const c = (parts[k][0] || 'X').toUpperCase();
        candidates.add((a + b + c).substring(0, 3));
      }
    }
  }

  // 4) Si aún no hay, combinar primeras letras y luego letras interiores
  for (let i = 0; i < nameLetters.length; i++) {
    for (let j = i + 1; j < nameLetters.length; j++) {
      for (let k = j + 1; k < nameLetters.length; k++) {
        candidates.add((nameLetters[i] + nameLetters[j] + nameLetters[k]).substring(0, 3));
        if (candidates.size > 500) break;
      }
      if (candidates.size > 500) break;
    }
    if (candidates.size > 500) break;
  }

  // Obtener existentes en DB
  const existingRows = await query('SELECT cliente_shippingMark FROM cliente WHERE cliente_shippingMark IS NOT NULL');
  const existing = new Set(existingRows.map(r => String(r.cliente_shippingMark).toUpperCase()));

  // Probar candidatos en orden de inserción del Set
  for (const cand of candidates) {
    if (!cand) continue;
    const c = cand.toUpperCase().replace(/[^A-Z]/g, '').padEnd(3, 'X').substring(0, 3);
    const final = prefix + c;
    if (!existing.has(final)) return final;
  }

  // Fallback determinístico: usar hash incremental derivado del nombre para generar 3 letras
  const hashCode = (str) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  };

  let salt = 0;
  while (salt < 1000) {
    const h = hashCode(nameLetters + String(salt));
    // mapear a 3 letras A-Z
    const letters = [];
    let v = h;
    for (let i = 0; i < 3; i++) {
      letters.push(String.fromCharCode(65 + (v % 26)));
      v = Math.floor(v / 26);
    }
    const final = prefix + letters.join('');
    if (!existing.has(final)) return final;
    salt++;
  }

  // Último recurso: generar aleatorio garantizando 3 letras
  const randLetters = () => {
    return Array.from({ length: 3 }).map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
  };
  let tries = 0;
  while (tries < 1000) {
    const final = prefix + randLetters();
    if (!existing.has(final)) return final;
    tries++;
  }

  // Si todo falla (muy improbable), devolver prefijo + XXX
  return prefix + 'XXX';
}

// Actualizar un cliente existente
export async function updateCliente(id_cliente, clienteData) {
  const {
    nombre_cliente,
    correo_cliente,
    telefono_cliente,
    ciudad_cliente,
  pais_cliente,
  cliente_shippingMark
  } = clienteData;

  try {
    // Si no viene cliente_shippingMark, intentar mantener el existente; si existe vacío, generar uno nuevo
    let shippingMarkToUse = cliente_shippingMark;
    if (!shippingMarkToUse) {
      const existing = await get('SELECT cliente_shippingMark FROM cliente WHERE id_cliente = ?', [id_cliente]);
      shippingMarkToUse = existing?.cliente_shippingMark;
    }
    if (!shippingMarkToUse) {
      shippingMarkToUse = await generateUniqueShippingMark(nombre_cliente);
    }

    await run(
      `UPDATE cliente 
       SET nombre_cliente = ?, correo_cliente = ?, telefono_cliente = ?, 
           ciudad_cliente = ?, pais_cliente = ?, cliente_shippingMark = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id_cliente = ?`,
      [nombre_cliente, correo_cliente, telefono_cliente, ciudad_cliente, pais_cliente, shippingMarkToUse, id_cliente]
    );
    
    // Obtener el cliente actualizado
    const updatedCliente = await getClienteById(id_cliente);
    return updatedCliente;
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    throw error;
  }
}

// Obtener todos los clientes
export async function getAllClientes() {
  try {
    const result = await query('SELECT * FROM cliente ORDER BY nombre_cliente');
    return result;
  } catch (error) {
    console.error('Error al obtener todos los clientes:', error);
    throw error;
  }
}

// Eliminar un cliente
export async function deleteCliente(id_cliente) {
  try {
    const clienteToDelete = await getClienteById(id_cliente);
    await run('DELETE FROM cliente WHERE id_cliente = ?', [id_cliente]);
    return clienteToDelete;
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    throw error;
  }
}
