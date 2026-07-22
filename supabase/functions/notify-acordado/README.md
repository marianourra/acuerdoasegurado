# notify-acordado

Edge Function que envía un email al productor cuando un reclamo pasa a estado **Acordado**.

## Flujo

```
UPDATE en claims  →  trigger notify_claim_acordado (pg_net)  →  Edge Function notify-acordado  →  Resend  →  email al productor
```

La function vuelve a validar la transición a "Acordado" (compara `record` vs `old_record`), busca el email del productor en `producers` y envía el correo con Resend.

## 1. Configurar Resend

1. Crear cuenta en https://resend.com y verificar un dominio (o usar el dominio de pruebas de Resend).
2. Generar una API key.
3. Definir un remitente verificado, ej. `Acuerdo Asegurado <no-reply@tudominio.com>`.

## 2. Deployar la function

```bash
supabase functions deploy notify-acordado --no-verify-jwt
```

> Usamos `--no-verify-jwt` porque la seguridad se maneja con el header `x-webhook-secret`.

## 3. Cargar los secrets

```bash
supabase secrets set \
  RESEND_API_KEY="re_xxxxxxxx" \
  NOTIFY_FROM_EMAIL="Acuerdo Asegurado <no-reply@tudominio.com>" \
  WEBHOOK_SECRET="un-string-secreto-largo"
```

Opcionales (tienen valores por defecto):

- `APP_URL` → destino del botón del email. Default: `https://acuerdoasegurado.com`
- `LOGO_URL` → logo de la firma. Default: `${APP_URL}/logo.png`

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` ya están disponibles en el runtime; no hace falta cargarlos.

> **Logo del email:** el archivo está en `public/logo.png`, por lo que queda servido en `https://acuerdoasegurado.com/logo.png` cuando deployés el frontend. Si tu dominio o ruta es otra, cargá `LOGO_URL` con la URL pública correcta.

## 4. Crear el trigger

Editar `supabase-claims-acordado-email-webhook.sql` (en la raíz del repo) y reemplazar:

- `<FUNCTION_URL>` → `https://<PROJECT_REF>.supabase.co/functions/v1/notify-acordado`
- `<SUPABASE_ANON_KEY>` → anon key del proyecto (Settings → API)
- `<WEBHOOK_SECRET>` → el mismo valor que cargaste como secret

Luego ejecutarlo en Supabase → SQL Editor.

## 5. Probar

Cambiar el estado de un reclamo (con productor que tenga email) a **Acordado** desde el panel admin. Debería llegar el email.

Logs de la function:

```bash
supabase functions logs notify-acordado
```

## Alternativa sin SQL (dashboard)

En vez del trigger, se puede crear un **Database Webhook** desde el dashboard (Database → Webhooks): tabla `claims`, evento `UPDATE`, tipo HTTP Request → la URL de la function, agregando el header `x-webhook-secret`. La function filtra igual la transición a Acordado.
