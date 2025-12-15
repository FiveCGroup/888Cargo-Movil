-- backend/migrations/001_create_recovery_tokens_table.sql
CREATE TABLE IF NOT EXISTS recovery_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  used INTEGER DEFAULT 0, -- 0 = no usado, 1 = usado
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_recovery_token ON recovery_tokens(token);
CREATE INDEX IF NOT EXISTS idx_recovery_expires ON recovery_tokens(expires_at);