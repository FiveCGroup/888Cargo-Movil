-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_carga_codigo ON carga(codigo_carga);
CREATE INDEX IF NOT EXISTS idx_qr_codigo ON qr(codigo_qr);
CREATE INDEX IF NOT EXISTS idx_caja_articulo ON caja(id_articulo);
CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- Triggers útiles
CREATE TRIGGER IF NOT EXISTS update_carga_totals
AFTER INSERT ON caja
BEGIN
  UPDATE carga 
  SET 
    total_cajas = (SELECT COUNT(*) FROM caja WHERE id_articulo IN (SELECT id_articulo FROM articulo_packing_list WHERE id_carga = NEW.id_articulo)),
    gw_total = (SELECT SUM(gw) FROM caja WHERE id_articulo IN (SELECT id_articulo FROM articulo_packing_list WHERE id_carga = NEW.id_articulo)),
    cbm_total = (SELECT SUM(cbm) FROM caja WHERE id_articulo IN (SELECT id_articulo FROM articulo_packing_list WHERE id_carga = NEW.id_articulo))
  WHERE id_carga = (SELECT id_carga FROM articulo_packing_list WHERE id_articulo = NEW.id_articulo);
END;