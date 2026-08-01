-- Sorteos Diarios
-- Sortea un premio entre las personas que compraron un día determinado
-- (todos los compradores del día o solo los primeros X).
-- El ganador se elige de forma aleatoria automática entre los compradores
-- pagados de ese día.
--
-- La card promocional de la landing (título, premio, descripción, visible)
-- se guarda como key-value en la tabla `configuracion` existente con el
-- prefijo `promo_diaria_*`, por lo que no requiere columnas nuevas.

CREATE TABLE IF NOT EXISTS sorteos_diarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sorteo_id UUID NOT NULL REFERENCES sorteos(id) ON DELETE CASCADE,
  -- Día cuyos compradores participan (ej: ayer)
  fecha DATE NOT NULL,
  -- 'todos' | 'primeros_x'
  tipo_participantes TEXT NOT NULL DEFAULT 'todos',
  -- Cantidad X cuando tipo_participantes = 'primeros_x'
  cantidad_participantes INTEGER,
  -- Descripción del premio (ej: "$50.000", "Una remera")
  premio TEXT NOT NULL,
  -- Cuántos compradores entraron efectivamente al sorteo (transparencia)
  total_participantes INTEGER NOT NULL DEFAULT 0,
  -- Ganador
  ganador_comprador_id UUID REFERENCES compradores(id) ON DELETE SET NULL,
  ganador_nombre TEXT,
  ganador_numero INTEGER,
  -- Mostrar este resultado en la landing
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sorteos_diarios_sorteo_id
  ON sorteos_diarios(sorteo_id);
CREATE INDEX IF NOT EXISTS idx_sorteos_diarios_fecha
  ON sorteos_diarios(fecha DESC);

-- RLS: la app usa auth propia (no Supabase Auth), se permite todo via anon key.
ALTER TABLE sorteos_diarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todas las operaciones en sorteos_diarios" ON sorteos_diarios;
CREATE POLICY "Permitir todas las operaciones en sorteos_diarios" ON sorteos_diarios
  FOR ALL USING (true) WITH CHECK (true);
