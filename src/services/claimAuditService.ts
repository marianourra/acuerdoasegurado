import { supabase } from './supabaseClient';

export type AuditChange = {
  field: string;
  old: unknown;
  new: unknown;
};

export type ClaimAuditRow = {
  id: string;
  claim_id: number | null;
  claim_number: string | null;
  client_name: string | null;
  actor_id: string | null;
  action: 'insert' | 'update' | 'delete';
  changes: AuditChange[];
  created_at: string;
};

export async function getClaimAuditLog(limit = 300): Promise<{
  data: ClaimAuditRow[] | null;
  error: { message: string } | null;
}> {
  const { data, error } = await supabase
    .from('claim_audit_log')
    .select('id, claim_id, claim_number, client_name, actor_id, action, changes, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return { data: null, error: { message: error.message } };
  return { data: (data as ClaimAuditRow[]) ?? [], error: null };
}

export type AsistenteWithUser = {
  id: string;
  nombre: string;
  user_id: string | null;
};

export async function getAsistentesWithUser(): Promise<{
  data: AsistenteWithUser[] | null;
  error: { message: string } | null;
}> {
  const { data, error } = await supabase.from('asistentes').select('id, nombre, user_id');

  if (error) return { data: null, error: { message: error.message } };
  return { data: (data as AsistenteWithUser[]) ?? [], error: null };
}
