-- Registro permanente de qué libros eligió cada email.
-- Sirve para descontar el saldo de forma server-side y evitar que
-- un comprador elija más libros de los que le corresponden por su pack.

CREATE TABLE IF NOT EXISTS libros_reclamados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  libro_id UUID NOT NULL REFERENCES libros(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (email, libro_id)
);

CREATE INDEX IF NOT EXISTS idx_libros_reclamados_email ON libros_reclamados (email);

-- El backoffice usa la anon key sin auth de Supabase (igual que la tabla libros)
ALTER TABLE libros_reclamados DISABLE ROW LEVEL SECURITY;
