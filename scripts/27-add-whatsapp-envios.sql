-- Registro de mensajes de WhatsApp enviados (para facturación a Facu) y
-- configuración de costo/margen.

CREATE TABLE IF NOT EXISTS whatsapp_envios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comprador_id uuid REFERENCES compradores(id) ON DELETE SET NULL,
  sorteo_id uuid,
  telefono text,
  provider text,               -- 'twilio' | 'baileys'
  provider_message_id text,    -- sid de Twilio
  estado text,                 -- 'enviado' | 'error'
  costo_unitario numeric,      -- snapshot del costo por mensaje al momento del envío
  moneda text DEFAULT 'USD',
  created_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_envios_created_at ON whatsapp_envios (created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_envios_sorteo_id ON whatsapp_envios (sorteo_id);

-- RLS: mismo patrón que el resto (app usa auth propia, anon key)
ALTER TABLE whatsapp_envios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todas las operaciones en whatsapp_envios" ON whatsapp_envios;
CREATE POLICY "Permitir todas las operaciones en whatsapp_envios" ON whatsapp_envios
  FOR ALL USING (true) WITH CHECK (true);

-- Config de costos/margen (tabla configuracion key-value ya existente)
INSERT INTO configuracion (clave, valor) VALUES
  ('whatsapp_costo_unitario', '0.05'),
  ('whatsapp_moneda', 'USD'),
  ('whatsapp_margen', '0.20')            -- 20%
ON CONFLICT (clave) DO NOTHING;
