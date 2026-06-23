import { supabase } from './supabaseClient';
import type { AdminClaimRow } from './adminClaimsService';

export async function getAdminFeesClaims(): Promise<{
  data: AdminClaimRow[] | null;
  error: { message: string } | null;
}> {
  const { data, error } = await supabase
    .from('claims')
    .select(
      `
      id,
      claim_number,
      client_name,
      company_id,
      producer_id,
      status_id,
      amount_agreed,
      fees_percent,
      fees,
      is_invoiced,
      payment_date,
      finished_at,
      updated_at,
      asistente_id,
      created_at,
      companies!company_id (
        id,
        name,
        logo_url
      ),
      claim_statuses (
        id,
        name,
        color
      ),
      producers (
        id,
        name
      ),
      asistentes (
        id,
        nombre
      )
    `
    )
    .order('updated_at', { ascending: false });

  if (error) return { data: null, error: { message: error.message } };
  return { data: (data as unknown as AdminClaimRow[]) ?? [], error: null };
}
