-- ============================================================
-- Estadísticas globales de cierre por compañía (vista productor)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_company_closing_stats()
RETURNS TABLE (
  company_id uuid,
  company_name text,
  total_claims bigint,
  finalized_claims bigint,
  avg_close_days numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.company_id,
    co.name AS company_name,
    COUNT(*)::bigint AS total_claims,
    COUNT(*) FILTER (WHERE c.finished_at IS NOT NULL AND c.presentation_date IS NOT NULL)::bigint AS finalized_claims,
    ROUND(
      AVG(EXTRACT(EPOCH FROM (c.finished_at - c.presentation_date::timestamp)) / 86400.0)
      FILTER (WHERE c.finished_at IS NOT NULL AND c.presentation_date IS NOT NULL),
      1
    ) AS avg_close_days
  FROM public.claims c
  INNER JOIN public.companies co ON co.id = c.company_id
  GROUP BY c.company_id, co.name
  ORDER BY co.name;
$$;

REVOKE ALL ON FUNCTION public.get_company_closing_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_company_closing_stats() TO authenticated;
