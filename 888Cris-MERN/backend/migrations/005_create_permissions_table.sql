CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL, -- ej: carga:create, qr:generate, user:delete
  description TEXT,
  module TEXT NOT NULL -- auth, carga, qr, admin, etc.
);