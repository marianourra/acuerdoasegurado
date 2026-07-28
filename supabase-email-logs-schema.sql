-- Registro (log) de emails enviados por la plataforma.
-- Lo escribe la Edge Function `notify-acordado` (con service role, por eso no
-- necesita política de INSERT para usuarios). El admin lo consulta desde
-- Admin → Emails enviados.
-- Ejecutar en Supabase → SQL Editor.

CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'acordado',
  claim_id bigint REFERENCES public.claims(id) ON DELETE SET NULL,
  claim_number text,
  client_name text,
  producer_id uuid REFERENCES public.producers(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  subject text,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  provider_message_id text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Si la tabla ya existía, agrega la columna del nombre del reclamante.
ALTER TABLE public.email_logs
  ADD COLUMN IF NOT EXISTS client_name text;

CREATE INDEX IF NOT EXISTS idx_email_logs_created_at
  ON public.email_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_claim_id
  ON public.email_logs (claim_id);

-- RLS: solo admin puede leer. El INSERT lo hace la Edge Function con service
-- role, que evita RLS; por eso no se crea política de INSERT para authenticated.
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_logs_select_admin" ON public.email_logs;
CREATE POLICY "email_logs_select_admin"
  ON public.email_logs
  FOR SELECT
  TO authenticated
  USING (public.is_app_admin());
