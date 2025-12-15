CREATE TABLE IF NOT EXISTS caja (
  id_caja INTEGER PRIMARY KEY AUTOINCREMENT,
  id_articulo INTEGER NOT NULL,
  numero_caja INTEGER NOT NULL,
  total_cajas INTEGER NOT NULL,
  cantidad_en_caja INTEGER,
  cbm REAL,
  gw REAL,
  descripcion_contenido TEXT,
  observaciones TEXT,
  estado TEXT DEFAULT 'pendiente', -- pendiente, escaneada, en_despacho, entregada
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_articulo) REFERENCES articulo_packing_list(id_articulo) ON DELETE CASCADE,
  UNIQUE(id_articulo, numero_caja)
);