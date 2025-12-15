CREATE TABLE IF NOT EXISTS carga_contenedor (
  id_carga INTEGER,
  id_contenedor INTEGER,
  fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_carga, id_contenedor),
  FOREIGN KEY (id_carga) REFERENCES carga(id_carga) ON DELETE CASCADE,
  FOREIGN KEY (id_contenedor) REFERENCES contenedores(id_contenedor) ON DELETE CASCADE
);