-- ============================================================
-- Backfill: presentation_date = fecha de creación (created_at)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================
-- Solo actualiza reclamos que aún no tienen fecha de presentación.
-- created_at (timestamptz) se convierte a date en la zona del servidor.

-- (Opcional) Vista previa de cuántos registros se actualizarían:
-- SELECT COUNT(*) AS reclamos_a_actualizar
-- FROM public.claims
-- WHERE presentation_date IS NULL
--   AND created_at IS NOT NULL;

UPDATE public.claims
SET presentation_date = created_at::date
WHERE presentation_date IS NULL
  AND created_at IS NOT NULL;

-- (Opcional) Verificación posterior:
-- SELECT
--   COUNT(*) FILTER (WHERE presentation_date IS NULL) AS sin_presentacion,
--   COUNT(*) FILTER (WHERE presentation_date IS NOT NULL) AS con_presentacion
-- FROM public.claims;
