import { supabase } from './supabaseClient';

export type AdminClaimRow = {
  id: number;
  client_name: string | null;
  client_phone: string | null;
  company_id: string;
  status_id: string;
  amount_claimed: number | null;
  amount_agreed: number | null;
  producer_profit: number | null;
  type: string | null;
  payment_date: string | null;
  finished_at: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  companies: { id: string; name: string } | null;
  claim_statuses: { id: string; name: string; color: string | null } | null;
};

export async function getAdminClaims(): Promise<{
  data: AdminClaimRow[] | null;
  error: { message: string } | null;
}> {
  const { data, error } = await supabase
    .from('claims')
    .select(
      `
      id,
      client_name,
      client_phone,
      company_id,
      status_id,
      amount_claimed,
      amount_agreed,
      producer_profit,
      type,
      payment_date,
      finished_at,
      description,
      created_at,
      updated_at,
      companies (
        id,
        name
      ),
      claim_statuses (
        id,
        name,
        color
      )
    `
    )
    .order('updated_at', { ascending: false });

  if (error) return { data: null, error: { message: error.message } };
  return { data: (data as AdminClaimRow[]) ?? [], error: null };
}

export type ClaimPatch = {
  status_id?: string;
  company_id?: string;
  amount_agreed?: number | null;
  producer_profit?: number | null;
  payment_date?: string | null;
  finished_at?: string | null;
  description?: string | null;
};

export async function updateClaimById(
  id: number,
  patch: ClaimPatch
): Promise<{ data: unknown | null; error: { message: string } | null }> {
  const { data, error } = await supabase
    .from('claims')
    .update(patch)
    .eq('id', id)
    .select('id')
    .single();

  if (error) return { data: null, error: { message: error.message } };
  return { data, error: null };
}

export async function deleteClaimById(
  id: number
): Promise<{ error: { message: string } | null }> {
  const { error } = await supabase.from('claims').delete().eq('id', id);
  if (error) return { error: { message: error.message } };
  return { error: null };
}
