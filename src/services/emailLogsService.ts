import { supabase } from './supabaseClient';

export type EmailLogRow = {
  id: string;
  type: string;
  claim_id: number | null;
  claim_number: string | null;
  client_name: string | null;
  producer_id: string | null;
  recipient_email: string;
  recipient_name: string | null;
  subject: string | null;
  status: 'sent' | 'failed';
  provider_message_id: string | null;
  error: string | null;
  created_at: string;
};

export async function getEmailLogs(limit = 200): Promise<{
  data: EmailLogRow[] | null;
  error: { message: string } | null;
}> {
  // Nota: no seleccionamos `client_name` de email_logs para no depender de que
  // la migración que agrega esa columna ya se haya corrido. El nombre del
  // reclamante se resuelve siempre desde `claims` vía claim_id (abajo).
  const { data, error } = await supabase
    .from('email_logs')
    .select(
      'id, type, claim_id, claim_number, producer_id, recipient_email, recipient_name, subject, status, provider_message_id, error, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return { data: null, error: { message: error.message } };

  const logs = (data as Omit<EmailLogRow, 'client_name'>[]) ?? [];

  // Resolver el nombre del reclamante desde claims para cada claim_id presente.
  const claimIds = Array.from(
    new Set(logs.map((l) => l.claim_id).filter((id): id is number => id != null))
  );

  const namesByClaimId = new Map<number, string | null>();
  if (claimIds.length > 0) {
    const { data: claimsData } = await supabase
      .from('claims')
      .select('id, client_name')
      .in('id', claimIds);
    for (const c of (claimsData as { id: number; client_name: string | null }[] | null) ?? []) {
      namesByClaimId.set(c.id, c.client_name);
    }
  }

  const withNames: EmailLogRow[] = logs.map((l) => ({
    ...l,
    client_name: l.claim_id != null ? namesByClaimId.get(l.claim_id) ?? null : null,
  }));

  return { data: withNames, error: null };
}
