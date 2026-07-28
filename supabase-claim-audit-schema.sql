-- Sistema de auditoría de reclamos.
-- Registra automáticamente (vía trigger) cada cambio hecho sobre un reclamo:
-- quién lo hizo (auth.uid()), cuándo, y qué campos cambiaron (valor anterior/nuevo).
-- El admin lo consulta desde Admin → Auditoría.
-- Ejecutar en Supabase → SQL Editor.

CREATE TABLE IF NOT EXISTS public.claim_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id bigint REFERENCES public.claims(id) ON DELETE CASCADE,
  claim_number text,
  client_name text,
  actor_id uuid,
  action text NOT NULL DEFAULT 'update' CHECK (action IN ('insert', 'update', 'delete')),
  changes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claim_audit_log_created_at
  ON public.claim_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_claim_audit_log_claim_id
  ON public.claim_audit_log (claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_audit_log_actor_id
  ON public.claim_audit_log (actor_id);

-- RLS: solo admin puede leer. El INSERT lo hace el trigger (SECURITY DEFINER),
-- que evita RLS; por eso no se crea política de INSERT.
ALTER TABLE public.claim_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "claim_audit_log_select_admin" ON public.claim_audit_log;
CREATE POLICY "claim_audit_log_select_admin"
  ON public.claim_audit_log
  FOR SELECT
  TO authenticated
  USING (public.is_app_admin());

-- Función de trigger: calcula el diff de columnas y registra el cambio.
CREATE OR REPLACE FUNCTION public.log_claim_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_j jsonb;
  new_j jsonb;
  diff jsonb := '[]'::jsonb;
  k text;
  v_old jsonb;
  v_new jsonb;
  -- Columnas técnicas que no aportan a la auditoría.
  ignored text[] := ARRAY['updated_at', 'created_at', 'id', 'producer_viewed_at'];
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    old_j := to_jsonb(OLD);
    new_j := to_jsonb(NEW);

    FOR k IN SELECT jsonb_object_keys(new_j) LOOP
      IF k = ANY(ignored) THEN
        CONTINUE;
      END IF;
      v_old := old_j -> k;
      v_new := new_j -> k;
      IF v_old IS DISTINCT FROM v_new THEN
        diff := diff || jsonb_build_object('field', k, 'old', v_old, 'new', v_new);
      END IF;
    END LOOP;

    -- Nada relevante cambió (ej. solo updated_at).
    IF jsonb_array_length(diff) = 0 THEN
      RETURN NEW;
    END IF;

    INSERT INTO public.claim_audit_log (claim_id, claim_number, client_name, actor_id, action, changes)
    VALUES (NEW.id, NEW.claim_number::text, NEW.client_name, auth.uid(), 'update', diff);
    RETURN NEW;

  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.claim_audit_log (claim_id, claim_number, client_name, actor_id, action, changes)
    VALUES (NEW.id, NEW.claim_number::text, NEW.client_name, auth.uid(), 'insert', '[]'::jsonb);
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_claim_changes ON public.claims;
CREATE TRIGGER trg_log_claim_changes
  AFTER INSERT OR UPDATE ON public.claims
  FOR EACH ROW EXECUTE FUNCTION public.log_claim_changes();
