-- Tabla para el catálogo de libros digitales que se regalan con cada compra

CREATE TABLE IF NOT EXISTS libros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  imagen_url TEXT,
  link_drive TEXT NOT NULL,
  orden INT DEFAULT 0,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
