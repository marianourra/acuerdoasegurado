-- Trigger que llama a la Edge Function `notify-acordado` cuando un reclamo
-- pasa a estado "Acordado", para notificar por email al productor.
--
-- Requisitos previos:
--   1) Deployar la function:  supabase functions deploy notify-acordado --no-verify-jwt
--   2) Cargar secrets:        supabase secrets set RESEND_API_KEY=... NOTIFY_FROM_EMAIL=... WEBHOOK_SECRET=...
--   3) Reemplazar abajo los placeholders <...> por tus valores reales.
--
-- Ejecutar en Supabase → SQL Editor.

-- pg_net permite hacer llamadas HTTP desde Postgres.
create extension if not exists pg_net;

create or replace function public.notify_claim_acordado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acordado_id uuid;
begin
  select id into acordado_id from public.claim_statuses where name = 'Acordado' limit 1;

  -- Solo cuando el estado TRANSICIONA a Acordado (no en cada update).
  if acordado_id is not null
     and NEW.status_id = acordado_id
     and NEW.status_id is distinct from OLD.status_id then

    perform net.http_post(
      -- URL de la function: https://<PROJECT_REF>.supabase.co/functions/v1/notify-acordado
      url := 'https://zvamxultqzecpxshxlld.supabase.co/functions/v1/notify-acordado',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        -- Anon key del proyecto (necesaria para pasar el gateway de functions):
        'Authorization', 'Bearer sb_publishable_eVBfgAQLiN2fxxKveo6QNw_cAg_K1e9',
        -- Debe coincidir con el secret WEBHOOK_SECRET configurado en la function:
        'x-webhook-secret', 'c7fbf4c7f16883af0536f905401db7749fd9c39df7e8bfee50c1e2f247712376'
      ),
      body := jsonb_build_object(
        'type', 'UPDATE',
        'table', 'claims',
        'record', row_to_json(NEW),
        'old_record', row_to_json(OLD)
      )
    );
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_notify_claim_acordado on public.claims;
create trigger trg_notify_claim_acordado
  after update on public.claims
  for each row
  execute function public.notify_claim_acordado();
