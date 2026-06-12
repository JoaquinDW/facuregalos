-- Migration: Crear tabla del mural de ganadores anteriores (collage de fotos)
-- Created: 2026-06-12
-- Description: Tabla para gestionar un mural/collage de fotos de ganadores anteriores.
--              Cada fila es una foto. Se administra desde el backoffice.
--
-- Para aplicar esta migración en Supabase:
-- 1. Ve a tu proyecto en https://supabase.com/dashboard
-- 2. Navega a "SQL Editor" en el menú lateral
-- 3. Haz clic en "New query"
-- 4. Copia y pega todo este contenido
-- 5. Haz clic en "Run" para ejecutar

-- ============================================
-- PASO 1: Crear la tabla mural_ganadores
-- ============================================

CREATE TABLE IF NOT EXISTS mural_ganadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imagen_url TEXT NOT NULL,
  nombre TEXT,
  orden INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PASO 2: Crear índices para optimizar consultas
-- ============================================

CREATE INDEX IF NOT EXISTS idx_mural_ganadores_visible
  ON mural_ganadores(visible);

CREATE INDEX IF NOT EXISTS idx_mural_ganadores_orden
  ON mural_ganadores(orden ASC);

-- ============================================
-- PASO 3: Habilitar Row Level Security (RLS)
-- ============================================

ALTER TABLE mural_ganadores ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 4: Crear políticas de seguridad
-- ============================================

-- Política para permitir lectura pública de fotos visibles
CREATE POLICY "mural_ganadores_select_visible"
  ON mural_ganadores
  FOR SELECT
  USING (visible = true);

-- Política para permitir todas las operaciones (backoffice)
CREATE POLICY "mural_ganadores_all_operations"
  ON mural_ganadores
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- PASO 5: Crear trigger para updated_at automático
-- (reutiliza trigger_set_updated_at creado en migración 16)
-- ============================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_mural_ganadores_updated_at ON mural_ganadores;

CREATE TRIGGER set_mural_ganadores_updated_at
  BEFORE UPDATE ON mural_ganadores
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================
-- PASO 6: Comentarios
-- ============================================

COMMENT ON TABLE mural_ganadores IS 'Mural/collage de fotos de ganadores anteriores, administrado desde el backoffice';
COMMENT ON COLUMN mural_ganadores.imagen_url IS 'URL de la foto del ganador';
COMMENT ON COLUMN mural_ganadores.nombre IS 'Nombre opcional del ganador (se muestra al pasar el mouse)';
COMMENT ON COLUMN mural_ganadores.orden IS 'Orden de aparición en el mural (menor primero)';
COMMENT ON COLUMN mural_ganadores.visible IS 'Si la foto es visible públicamente';

-- ============================================
-- Migración completada
-- ============================================

SELECT 'Tabla mural_ganadores creada exitosamente' as status,
       COUNT(*) as registros
FROM mural_ganadores;
