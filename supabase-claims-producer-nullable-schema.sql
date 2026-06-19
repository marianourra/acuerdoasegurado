-- Permite crear reclamos sin productor asignado (p. ej. desde admin).
-- Ejecutar en Supabase SQL Editor si producer_id es NOT NULL.

ALTER TABLE claims
  ALTER COLUMN producer_id DROP NOT NULL;

-- Si el INSERT falla por RLS, agregar política para admins, por ejemplo:
-- CREATE POLICY "Admins can insert claims"
--   ON claims FOR INSERT
--   TO authenticated
--   WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM producers
--       WHERE producers.user_id = auth.uid() AND producers.is_admin = true
--     )
--   );
