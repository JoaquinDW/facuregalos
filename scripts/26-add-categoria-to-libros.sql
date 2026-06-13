-- Categoría del libro (ej: "Autoayuda", "Educación Financiera").
-- Se usa para filtrar en la página /libros.
ALTER TABLE libros ADD COLUMN IF NOT EXISTS categoria TEXT;

CREATE INDEX IF NOT EXISTS idx_libros_categoria ON libros (categoria);
