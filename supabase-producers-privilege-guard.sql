-- Impide que un productor se autoasigne is_admin o cambie user_id.
-- Solo un admin (is_app_admin) puede modificar esas columnas.
-- Ejecutar en Supabase → SQL Editor.

CREATE OR REPLACE FUNCTION public.prevent_producer_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    IF NOT public.is_app_admin() THEN
      RAISE EXCEPTION 'No autorizado a modificar is_admin o user_id'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_producer_privilege_escalation ON public.producers;
CREATE TRIGGER trg_prevent_producer_privilege_escalation
  BEFORE UPDATE ON public.producers
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_producer_privilege_escalation();

COMMENT ON FUNCTION public.prevent_producer_privilege_escalation() IS
  'Bloquea cambios de is_admin/user_id salvo que el actor sea admin (is_app_admin).';
