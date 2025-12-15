CREATE TABLE IF NOT EXISTS clientes (
  id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_cliente TEXT NOT NULL,
  correo_cliente TEXT,
  telefono_cliente TEXT,
  pais_cliente TEXT,
  ciudad_cliente TEXT,
  direccion_entrega TEXT,
  cliente_shippingMark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);