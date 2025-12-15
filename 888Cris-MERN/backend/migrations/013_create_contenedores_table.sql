CREATE TABLE IF NOT EXISTS contenedores (
  id_contenedor INTEGER PRIMARY KEY AUTOINCREMENT,
  numero_contenedor TEXT UNIQUE NOT NULL,
  estado TEXT DEFAULT 'En Bodega',
  estado_documentacion TEXT DEFAULT 'Incompleta',
  fecha_salida_programada DATE,
  destino_final TEXT,
  packing_list_master TEXT,
  observaciones TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);