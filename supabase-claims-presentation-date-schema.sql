-- ============================================================
-- Fecha de presentación del reclamo ante la compañía
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================
-- created_at = fecha de creación del reclamo en el sistema
-- presentation_date = fecha efectiva de presentación ante la compañía
-- (usada para estimar tiempos de cierre vs finished_at)

ALTER TABLE public.claims
  ADD COLUMN IF NOT EXISTS presentation_date date;

COMMENT ON COLUMN public.claims.presentation_date IS
  'Fecha efectiva de presentación del reclamo ante la compañía.';
