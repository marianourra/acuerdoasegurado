// Edge Function: notifica por email al productor cuando un reclamo pasa a "Acordado".
//
// Se dispara vía Database Webhook / trigger sobre UPDATE en `claims`
// (ver supabase-claims-acordado-email-webhook.sql).
//
// Secrets requeridos (supabase secrets set ...):
//   RESEND_API_KEY     -> API key de Resend
//   NOTIFY_FROM_EMAIL  -> remitente verificado en Resend, ej. "Acuerdo Asegurado <no-reply@tudominio.com>"
//   WEBHOOK_SECRET     -> string secreto compartido con el trigger (header x-webhook-secret)
// Disponibles automáticamente en el runtime:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type ClaimRecord = {
  id: number;
  claim_number: string | number | null;
  client_name: string | null;
  company_id: string | null;
  producer_id: string | null;
  status_id: string | null;
};

type WebhookPayload = {
  type?: string;
  table?: string;
  record?: ClaimRecord | null;
  old_record?: ClaimRecord | null;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // Validación de secreto compartido (el trigger envía este header).
  const expectedSecret = Deno.env.get('WEBHOOK_SECRET');
  if (expectedSecret && req.headers.get('x-webhook-secret') !== expectedSecret) {
    return json({ error: 'Unauthorized' }, 401);
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  if (payload.table !== 'claims') {
    return json({ skipped: 'not a claims event' });
  }

  const record = payload.record;
  const oldRecord = payload.old_record;
  if (!record) {
    return json({ skipped: 'no record' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Resolver el id del estado "Acordado" desde la base (robusto ante cambios de id).
  const { data: statusRow, error: statusErr } = await supabase
    .from('claim_statuses')
    .select('id')
    .eq('name', 'Acordado')
    .single();

  if (statusErr || !statusRow?.id) {
    return json({ error: 'No se pudo resolver el estado Acordado', detail: statusErr?.message }, 500);
  }

  const acordadoId = statusRow.id as string;

  // Solo notificar cuando el estado PASA a Acordado (transición), no en cada update.
  const becameAcordado = record.status_id === acordadoId && oldRecord?.status_id !== acordadoId;
  if (!becameAcordado) {
    return json({ skipped: 'status did not transition to Acordado' });
  }

  if (!record.producer_id) {
    return json({ skipped: 'claim without producer' });
  }

  // Buscar email y nombre del productor.
  const { data: producer, error: producerErr } = await supabase
    .from('producers')
    .select('name, email')
    .eq('id', record.producer_id)
    .single();

  if (producerErr || !producer?.email) {
    return json({ skipped: 'producer without email', detail: producerErr?.message });
  }

  // Nombre de la compañía (opcional, para el cuerpo del email).
  let companyName = '';
  if (record.company_id) {
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', record.company_id)
      .single();
    companyName = company?.name ?? '';
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('NOTIFY_FROM_EMAIL');
  if (!resendApiKey || !fromEmail) {
    return json({ error: 'Faltan RESEND_API_KEY o NOTIFY_FROM_EMAIL' }, 500);
  }

  const appUrl = Deno.env.get('APP_URL') ?? 'https://acuerdoasegurado.com';
  const logoUrl = Deno.env.get('LOGO_URL') ?? `${appUrl}/logo.png`;

  const clientName = record.client_name ?? 'tu cliente';
  const aseguradora = companyName || 'la aseguradora';
  const producerName = producer.name ?? '';

  const subject = 'Hemos conseguido un acuerdo en tu reclamo';
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-collapse:collapse;">
    <tr>
      <td align="left" style="padding:24px 32px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
        <div style="max-width:560px;">
          <p style="font-size:16px;color:#0f172a;margin:0 0 16px;">Hola ${producerName || ''},</p>
          <p style="font-size:16px;color:#334155;line-height:1.6;margin:0 0 12px;">
            Te informamos que el reclamo de <strong>${clientName}</strong> contra la aseguradora <strong>${aseguradora}</strong>
            ha sido <strong style="color:#16a34a;">acordado</strong>.
          </p>
          <p style="font-size:15px;color:#334155;line-height:1.6;margin:0 0 24px;">
            Para más detalles ingresá a consultar su estado.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
            <tr>
              <td style="border-radius:10px;background:#667eea;">
                <a href="${appUrl}" style="display:inline-block;padding:12px 26px;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;border-radius:10px;">
                  Consultar mi reclamo
                </a>
              </td>
            </tr>
          </table>
          <div style="margin-top:24px;padding-top:24px;border-top:1px solid #f1f5f9;">
            <img src="${logoUrl}" alt="Acuerdo Asegurado" height="40" style="display:block;height:40px;margin-bottom:8px;border:0;" />
            <p style="font-size:12px;color:#94a3b8;margin:0;">Acuerdo Asegurado</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const logEmail = async (fields: {
    status: 'sent' | 'failed';
    providerMessageId?: string | null;
    error?: string | null;
  }) => {
    const { error: logErr } = await supabase.from('email_logs').insert({
      type: 'acordado',
      claim_id: record.id,
      claim_number: record.claim_number != null ? String(record.claim_number) : null,
      client_name: record.client_name ?? null,
      producer_id: record.producer_id,
      recipient_email: producer.email,
      recipient_name: producerName || null,
      subject,
      status: fields.status,
      provider_message_id: fields.providerMessageId ?? null,
      error: fields.error ?? null,
    });
    if (logErr) console.error('No se pudo registrar el email en email_logs:', logErr.message);
  };

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [producer.email],
      subject,
      html,
    }),
  });

  if (!resendRes.ok) {
    const detail = await resendRes.text();
    await logEmail({ status: 'failed', error: detail });
    return json({ error: 'Fallo el envío del email', detail }, 502);
  }

  let providerMessageId: string | null = null;
  try {
    const sentData = (await resendRes.json()) as { id?: string };
    providerMessageId = sentData?.id ?? null;
  } catch {
    providerMessageId = null;
  }

  await logEmail({ status: 'sent', providerMessageId });

  return json({ sent: true, to: producer.email, claim: record.id, id: providerMessageId });
});
