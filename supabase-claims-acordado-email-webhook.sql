-- Trigger que llama a la Edge Function `notify-acordado` cuando un reclamo
-- pasa a estado "Acordado", para notificar por email al productor.
--
-- IMPORTANTE:
--   - Reemplazá SOLO <WEBHOOK_SECRET> (y si cambió, la anon key).
--   - NUNCA dejes placeholders como <PROJECT_REF> en la URL: eso rompe el UPDATE
--     del reclamo con errores tipo "Quote command returned error".
--   - El envío de email está envuelto en EXCEPTION: si falla el mail, el cambio
--     de estado a Acordado IGUAL se guarda.
--
-- Requisitos:
--   1) supabase functions deploy notify-acordado --project-ref zvamxultqzecpxshxlld --no-verify-jwt
--   2) supabase secrets set WEBHOOK_SECRET="<mismo valor que abajo>"
--   3) Ejecutar este SQL en Supabase → SQL Editor (con el secret real).
--
-- Ejecutar en Supabase → SQL Editor.

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

    begin
      perform net.http_post(
        url := 'https://zvamxultqzecpxshxlld.supabase.co/functions/v1/notify-acordado',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          -- Publishable/anon key (pública; también está en el frontend).
          -- El gateway de Functions suele exigir AMBOS headers:
          'Authorization', 'Bearer sb_publishable_eVBfgAQLiN2fxxKveo6QNw_cAg_K1e9',
          'apikey', 'sb_publishable_eVBfgAQLiN2fxxKveo6QNw_cAg_K1e9',
          -- Debe coincidir EXACTAMENTE con supabase secrets WEBHOOK_SECRET:
          -- (sin espacios ni comillas extras)
          'x-webhook-secret', '<WEBHOOK_SECRET>'
        ),
        body := jsonb_build_object(
          'type', 'UPDATE',
          'table', 'claims',
          'record', to_jsonb(NEW),
          'old_record', to_jsonb(OLD)
        )
      );
    exception
      when others then
        -- Nunca bloquear el UPDATE del reclamo por un fallo del email.
        raise warning 'notify_claim_acordado: no se pudo encolar el email (%): %',
          SQLSTATE, SQLERRM;
    end;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_notify_claim_acordado on public.claims;
create trigger trg_notify_claim_acordado
  after update on public.claims
  for each row
  execute function public.notify_claim_acordado();
