-- =============================================================================
-- RLS completo: rol asistente (staff) + compatibilidad con admin y productor
-- Ejecutar en Supabase → SQL Editor (como postgres / service role).
--
-- Problema que resuelve: asistentes ven listado vacío porque RLS en `claims`
-- (y a veces en tablas relacionadas del SELECT anidado) no les permite leer filas.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Helpers (SECURITY DEFINER evita recursión RLS al consultar producers/asistentes)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.producers
    WHERE user_id = auth.uid()
      AND is_admin IS TRUE
  );
$$;

CREATE OR REPLACE FUNCTION public.current_asistente_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id
  FROM public.asistentes a
  WHERE a.user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_app_producer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.producers
    WHERE user_id = auth.uid()
  );
$$;

-- producers.id es uuid en este proyecto (no bigint)
DROP FUNCTION IF EXISTS public.current_producer_id();

CREATE OR REPLACE FUNCTION public.current_producer_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id
  FROM public.producers p
  WHERE p.user_id = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.is_app_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_asistente_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_app_producer() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_producer_id() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_app_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_asistente_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_app_producer() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_producer_id() TO authenticated;

-- -----------------------------------------------------------------------------
-- 2) Tabla asistentes (login + detección de rol)
-- -----------------------------------------------------------------------------

ALTER TABLE public.asistentes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "asistentes_select_own_or_admin" ON public.asistentes;
CREATE POLICY "asistentes_select_own_or_admin"
  ON public.asistentes
  FOR SELECT
  TO authenticated
  USING (
    public.is_app_admin()
    OR user_id = auth.uid()
  );

-- Staff (admin/asistente) puede listar nombres para selects del modal de reclamos
DROP POLICY IF EXISTS "asistentes_select_staff_directory" ON public.asistentes;
CREATE POLICY "asistentes_select_staff_directory"
  ON public.asistentes
  FOR SELECT
  TO authenticated
  USING (
    public.is_app_admin()
    OR public.current_asistente_id() IS NOT NULL
  );

DROP POLICY IF EXISTS "asistentes_insert_admin" ON public.asistentes;
CREATE POLICY "asistentes_insert_admin"
  ON public.asistentes
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_app_admin());

DROP POLICY IF EXISTS "asistentes_update_admin" ON public.asistentes;
CREATE POLICY "asistentes_update_admin"
  ON public.asistentes
  FOR UPDATE
  TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

-- -----------------------------------------------------------------------------
-- 3) Tabla claims — acceso admin, asistente asignado y productor dueño
-- -----------------------------------------------------------------------------

ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- SELECT
DROP POLICY IF EXISTS "claims_select_admin" ON public.claims;
CREATE POLICY "claims_select_admin"
  ON public.claims
  FOR SELECT
  TO authenticated
  USING (public.is_app_admin());

DROP POLICY IF EXISTS "claims_select_asistente_assigned" ON public.claims;
CREATE POLICY "claims_select_asistente_assigned"
  ON public.claims
  FOR SELECT
  TO authenticated
  USING (
    public.current_asistente_id() IS NOT NULL
    AND asistente_id = public.current_asistente_id()
  );

DROP POLICY IF EXISTS "claims_select_producer_own" ON public.claims;
CREATE POLICY "claims_select_producer_own"
  ON public.claims
  FOR SELECT
  TO authenticated
  USING (
    public.current_producer_id() IS NOT NULL
    AND producer_id = public.current_producer_id()
  );

-- INSERT
DROP POLICY IF EXISTS "claims_insert_admin" ON public.claims;
CREATE POLICY "claims_insert_admin"
  ON public.claims
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_app_admin());

DROP POLICY IF EXISTS "claims_insert_asistente_assigned" ON public.claims;
CREATE POLICY "claims_insert_asistente_assigned"
  ON public.claims
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_asistente_id() IS NOT NULL
    AND asistente_id = public.current_asistente_id()
  );

DROP POLICY IF EXISTS "claims_insert_producer_own" ON public.claims;
CREATE POLICY "claims_insert_producer_own"
  ON public.claims
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_producer_id() IS NOT NULL
    AND producer_id = public.current_producer_id()
  );

-- UPDATE
DROP POLICY IF EXISTS "claims_update_admin" ON public.claims;
CREATE POLICY "claims_update_admin"
  ON public.claims
  FOR UPDATE
  TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

DROP POLICY IF EXISTS "claims_update_asistente_assigned" ON public.claims;
CREATE POLICY "claims_update_asistente_assigned"
  ON public.claims
  FOR UPDATE
  TO authenticated
  USING (
    public.current_asistente_id() IS NOT NULL
    AND asistente_id = public.current_asistente_id()
  )
  WITH CHECK (
    public.current_asistente_id() IS NOT NULL
    AND asistente_id = public.current_asistente_id()
  );

DROP POLICY IF EXISTS "claims_update_producer_own" ON public.claims;
CREATE POLICY "claims_update_producer_own"
  ON public.claims
  FOR UPDATE
  TO authenticated
  USING (
    public.current_producer_id() IS NOT NULL
    AND producer_id = public.current_producer_id()
  )
  WITH CHECK (
    public.current_producer_id() IS NOT NULL
    AND producer_id = public.current_producer_id()
  );

-- DELETE
DROP POLICY IF EXISTS "claims_delete_admin" ON public.claims;
CREATE POLICY "claims_delete_admin"
  ON public.claims
  FOR DELETE
  TO authenticated
  USING (public.is_app_admin());

DROP POLICY IF EXISTS "claims_delete_asistente_assigned" ON public.claims;
CREATE POLICY "claims_delete_asistente_assigned"
  ON public.claims
  FOR DELETE
  TO authenticated
  USING (
    public.current_asistente_id() IS NOT NULL
    AND asistente_id = public.current_asistente_id()
  );

-- -----------------------------------------------------------------------------
-- 4) Tablas de lectura para filtros / joins del listado admin-asistente
--    (si RLS está activo y no hay policy, los joins devuelven vacío o fallan)
-- -----------------------------------------------------------------------------

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "companies_select_authenticated" ON public.companies;
CREATE POLICY "companies_select_authenticated"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE public.claim_statuses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "claim_statuses_select_authenticated" ON public.claim_statuses;
CREATE POLICY "claim_statuses_select_authenticated"
  ON public.claim_statuses
  FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE public.producers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "producers_select_authenticated" ON public.producers;
CREATE POLICY "producers_select_authenticated"
  ON public.producers
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "producers_select_own" ON public.producers;
CREATE POLICY "producers_select_own"
  ON public.producers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

ALTER TABLE public.abogados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "abogados_select_authenticated" ON public.abogados;
CREATE POLICY "abogados_select_authenticated"
  ON public.abogados
  FOR SELECT
  TO authenticated
  USING (true);

-- producers: admin puede insert/update (pantalla Admin → Productores)
DROP POLICY IF EXISTS "producers_insert_admin" ON public.producers;
CREATE POLICY "producers_insert_admin"
  ON public.producers
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_app_admin());

DROP POLICY IF EXISTS "producers_update_admin" ON public.producers;
CREATE POLICY "producers_update_admin"
  ON public.producers
  FOR UPDATE
  TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

DROP POLICY IF EXISTS "producers_update_own" ON public.producers;
CREATE POLICY "producers_update_own"
  ON public.producers
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- companies: admin CRUD
DROP POLICY IF EXISTS "companies_insert_admin" ON public.companies;
CREATE POLICY "companies_insert_admin"
  ON public.companies
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_app_admin());

DROP POLICY IF EXISTS "companies_update_admin" ON public.companies;
CREATE POLICY "companies_update_admin"
  ON public.companies
  FOR UPDATE
  TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

DROP POLICY IF EXISTS "companies_delete_admin" ON public.companies;
CREATE POLICY "companies_delete_admin"
  ON public.companies
  FOR DELETE
  TO authenticated
  USING (public.is_app_admin());

-- -----------------------------------------------------------------------------
-- 5) Diagnóstico (ejecutar manualmente si sigue vacío)
-- -----------------------------------------------------------------------------
--
-- A) ¿El usuario tiene fila en asistentes?
-- SELECT id, nombre, email, user_id FROM asistentes
-- WHERE email IN ('martinezcandela60@gmail.com', 'lautarocatelli@gmail.com');
--
-- B) ¿Hay reclamos con ese asistente_id?
-- SELECT c.id, c.client_name, c.asistente_id, a.nombre, a.email
-- FROM claims c
-- LEFT JOIN asistentes a ON a.id = c.asistente_id
-- WHERE a.email IN ('martinezcandela60@gmail.com', 'lautarocatelli@gmail.com');
--
-- C) Si los reclamos apuntan a un asistente VIEJO (sin user_id), reasignar:
-- UPDATE claims c
-- SET asistente_id = a_new.id
-- FROM asistentes a_old
-- JOIN asistentes a_new ON a_new.email = 'martinezcandela60@gmail.com'
-- WHERE c.asistente_id = a_old.id
--   AND a_old.nombre ILIKE '%Candela%'
--   AND a_old.user_id IS NULL;
--
-- (Repetir para Lautaro.)
-- -----------------------------------------------------------------------------
