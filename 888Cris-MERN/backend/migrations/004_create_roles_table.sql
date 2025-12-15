CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL, -- superadmin, admin, bodeguero, cliente
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Roles por defecto
INSERT OR IGNORE INTO roles (name, description) VALUES
('superadmin', 'Acceso total al sistema'),
('admin', 'Administrador general'),
('bodeguero', 'Personal de bodega'),
('cliente', 'Cliente final');