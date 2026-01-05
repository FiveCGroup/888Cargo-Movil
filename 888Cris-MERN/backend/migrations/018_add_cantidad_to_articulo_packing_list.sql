-- Añadir columna `cantidad` a tabla articulo_packing_list para compatibilidad con código
ALTER TABLE articulo_packing_list ADD COLUMN cantidad INTEGER DEFAULT 1;
