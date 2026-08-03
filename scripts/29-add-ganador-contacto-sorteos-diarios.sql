-- Guarda el contacto del ganador del regalo diario (snapshot al momento del
-- sorteo), para poder comunicarse con él aunque luego se borre el comprador.
-- Puede ser un teléfono, un @usuario de Instagram o un email, según el método
-- de contacto que haya elegido el comprador.

ALTER TABLE sorteos_diarios
  ADD COLUMN IF NOT EXISTS ganador_contacto TEXT;
