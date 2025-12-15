-- Migración: Crear tabla de cotizaciones
CREATE TABLE IF NOT EXISTS cotizaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('maritimo', 'aereo')),
    destino TEXT NOT NULL CHECK(destino IN ('China', 'Miami', 'Europa')),
    largo_cm REAL NOT NULL,
    ancho_cm REAL NOT NULL,
    alto_cm REAL NOT NULL,
    peso_kg REAL NOT NULL,
    volumen_m3 REAL NOT NULL,
    peso_volumetrico REAL NOT NULL,
    peso_cobrable REAL,
    volumen_cobrable REAL,
    tarifa_usd REAL NOT NULL,
    valor_usd REAL NOT NULL,
    valor_cop INTEGER NOT NULL,
    trm REAL NOT NULL,
    detalle_calculo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_cotizaciones_user_id ON cotizaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_tipo ON cotizaciones(tipo);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_created_at ON cotizaciones(created_at);