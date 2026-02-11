-- Migración 020: Agregar restricciones UNIQUE para prevenir duplicados
-- Fecha: 2026-01-29
-- Descripción: Agregar restricción UNIQUE en correo_cliente para prevenir registros duplicados

-- Primero, eliminar duplicados existentes (mantener el registro más antiguo)
-- Esto es necesario antes de agregar la restricción UNIQUE
DELETE FROM clientes
WHERE id_cliente NOT IN (
  SELECT MIN(id_cliente)
  FROM clientes
  GROUP BY correo_cliente
  HAVING correo_cliente IS NOT NULL AND correo_cliente != ''
);

-- Agregar índice único en correo_cliente
-- SQLite no soporta ALTER TABLE ADD CONSTRAINT UNIQUE directamente,
-- así que creamos un índice único que actúa como restricción
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_correo_unique 
ON clientes(correo_cliente) 
WHERE correo_cliente IS NOT NULL AND correo_cliente != '';

-- Nota: SQLite no soporta restricciones UNIQUE con ALTER TABLE de la misma manera que otros DBMS.
-- El índice único anterior funcionará como restricción. Si necesitas una restricción explícita,
-- sería necesario recrear la tabla, pero eso es más complejo y puede causar pérdida de datos.
-- El índice único es suficiente para prevenir duplicados.
