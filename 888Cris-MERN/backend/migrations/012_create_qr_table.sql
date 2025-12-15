CREATE TABLE IF NOT EXISTS qr (
  id_qr INTEGER PRIMARY KEY AUTOINCREMENT,
  id_caja INTEGER NOT NULL,
  codigo_qr TEXT UNIQUE NOT NULL,
  tipo_qr TEXT DEFAULT 'caja',
  datos_qr TEXT NOT NULL, -- JSON con toda la info
  contenido_json TEXT,
  fecha_generacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_escaneado DATETIME,
  fecha_impresion DATETIME,
  estado TEXT DEFAULT 'generado', -- generado, impreso, escaneado
  escaneado_por INTEGER, -- user_id
  contador_escaneos INTEGER DEFAULT 0,
  opciones_render TEXT DEFAULT '{"width":300,"margin":2}',
  FOREIGN KEY (id_caja) REFERENCES caja(id_caja) ON DELETE CASCADE,
  FOREIGN KEY (escaneado_por) REFERENCES users(id)
);