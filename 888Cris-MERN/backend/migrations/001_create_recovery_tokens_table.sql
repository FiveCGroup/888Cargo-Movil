-- Migración: Crear tabla de tokens de recuperación
-- Archivo: migrations/001_create_recovery_tokens_table.sql

CREATE TABLE IF NOT EXISTS recovery_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índice para mejorar performance en consultas por token
CREATE INDEX IF NOT EXISTS idx_recovery_tokens_token ON recovery_tokens(token);

-- Índice para mejorar performance en consultas por expiración
CREATE INDEX IF NOT EXISTS idx_recovery_tokens_expires ON recovery_tokens(expires_at);

-- Índice para mejorar performance en consultas por usuario
CREATE INDEX IF NOT EXISTS idx_recovery_tokens_user_id ON recovery_tokens(user_id);