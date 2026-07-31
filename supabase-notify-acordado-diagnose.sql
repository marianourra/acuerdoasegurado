-- Diagnóstico rápido: ¿llegó la llamada HTTP al mail de Acordado?
-- Ejecutar en Supabase → SQL Editor después de marcar un reclamo como Acordado.

SELECT
  id,
  status_code,
  error_msg,
  left(content::text, 300) AS body_preview,
  created
FROM net._http_response
ORDER BY created DESC
LIMIT 10;

-- Interpretación típica:
--   status_code = 401  →  WEBHOOK_SECRET del trigger NO coincide con el secret de la function
--   status_code = 502  →  Resend falló (revisá RESEND_API_KEY / NOTIFY_FROM_EMAIL)
--   status_code = 200  →  la function OK; mirá body_preview (sent/skipped)
--   error_msg not null →  fallo de red / URL
