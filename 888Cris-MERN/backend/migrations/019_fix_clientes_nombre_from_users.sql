-- Actualizar clientes.nombre_cliente cuando contiene un email o está vacío
-- Usar full_name de users cuando exista

UPDATE clientes
SET nombre_cliente = (
  SELECT COALESCE(NULLIF(u.full_name, ''), substr(clientes.correo_cliente, 1, instr(clientes.correo_cliente, '@') - 1))
  FROM users u
  WHERE u.email = clientes.correo_cliente
)
WHERE (nombre_cliente IS NULL OR nombre_cliente = '' OR nombre_cliente LIKE '%@%');

-- Como medida adicional, aseguramos que no queden nombres vacíos
UPDATE clientes
SET nombre_cliente = substr(correo_cliente, 1, instr(correo_cliente, '@') - 1)
WHERE nombre_cliente IS NULL OR nombre_cliente = '';
