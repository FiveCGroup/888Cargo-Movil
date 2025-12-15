CREATE TABLE IF NOT EXISTS carga (
  id_carga INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo_carga TEXT UNIQUE NOT NULL, -- ej: 888CGS-ITEM-1
  id_cliente INTEGER NOT NULL,
  shipping_mark TEXT,
  estado TEXT DEFAULT 'En bodega China', -- En bodega China, En tránsito, En despacho, Entregada, etc.
  ubicacion_actual TEXT DEFAULT 'China',
  destino TEXT NOT NULL, -- Medellín, Bogotá, etc.
  fecha_recepcion DATETIME,
  fecha_envio DATETIME,
  fecha_arribo DATETIME,
  contenedor_asociado TEXT,
  observaciones TEXT,
  gw_total REAL,
  cbm_total REAL,
  total_cajas INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
);