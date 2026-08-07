-- Permite leer logos/nombres de compañías sin sesión (pantalla de login).
-- Solo SELECT; no habilita insert/update/delete para anon.
-- Ejecutar en Supabase → SQL Editor.

DROP POLICY IF EXISTS "companies_select_anon" ON public.companies;
CREATE POLICY "companies_select_anon"
  ON public.companies
  FOR SELECT
  TO anon
  USING (true);
