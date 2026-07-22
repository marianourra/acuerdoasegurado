-- Tarifa por caso de cada asistente, guardada por mes (puede variar mes a mes).
-- Se usa en Admin → Honorarios (liquidación de asistentes) para calcular el
-- importe a abonar y los indicadores de costo de asistentes / honorarios.
-- Ejecutar en Supabase → SQL Editor.

CREATE TABLE IF NOT EXISTS public.asistente_monthly_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asistente_id uuid NOT NULL REFERENCES public.asistentes(id) ON DELETE CASCADE,
  month text NOT NULL CHECK (month ~ '^\d{4}-\d{2}$'),
  rate numeric NOT NULL DEFAULT 0 CHECK (rate >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (asistente_id, month)
);

CREATE INDEX IF NOT EXISTS idx_asistente_monthly_rates_month
  ON public.asistente_monthly_rates (month);

-- RLS: solo admin puede leer/escribir (mismo helper que el resto del proyecto)
ALTER TABLE public.asistente_monthly_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "asistente_monthly_rates_select_admin" ON public.asistente_monthly_rates;
CREATE POLICY "asistente_monthly_rates_select_admin"
  ON public.asistente_monthly_rates
  FOR SELECT
  TO authenticated
  USING (public.is_app_admin());

DROP POLICY IF EXISTS "asistente_monthly_rates_insert_admin" ON public.asistente_monthly_rates;
CREATE POLICY "asistente_monthly_rates_insert_admin"
  ON public.asistente_monthly_rates
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_app_admin());

DROP POLICY IF EXISTS "asistente_monthly_rates_update_admin" ON public.asistente_monthly_rates;
CREATE POLICY "asistente_monthly_rates_update_admin"
  ON public.asistente_monthly_rates
  FOR UPDATE
  TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

DROP POLICY IF EXISTS "asistente_monthly_rates_delete_admin" ON public.asistente_monthly_rates;
CREATE POLICY "asistente_monthly_rates_delete_admin"
  ON public.asistente_monthly_rates
  FOR DELETE
  TO authenticated
  USING (public.is_app_admin());
