-- ============================================================
-- Campos PAS en reclamos (taller inspección + observaciones)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE public.claims
  ADD COLUMN IF NOT EXISTS taller_inspeccion text,
  ADD COLUMN IF NOT EXISTS observaciones_pas text;

COMMENT ON COLUMN public.claims.taller_inspeccion IS
  'Taller de inspección indicado por el PAS.';
COMMENT ON COLUMN public.claims.observaciones_pas IS
  'Observaciones internas del PAS sobre el reclamo.';

-- Si el productor no puede actualizar sus reclamos, agregar policy UPDATE, p. ej.:
-- CREATE POLICY "Producers update own claim pas fields"
--   ON public.claims FOR UPDATE TO authenticated
--   USING (producer_id IN (SELECT id FROM producers WHERE user_id = auth.uid()))
--   WITH CHECK (producer_id IN (SELECT id FROM producers WHERE user_id = auth.uid()));
