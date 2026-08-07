-- Segundo logo por compañía: el existente (logo_url) se usa en reclamos del sitio;
-- login_logo_url se usa en el carrete de la pantalla de login.
-- Ejecutar en Supabase → SQL Editor.

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS login_logo_url text;
