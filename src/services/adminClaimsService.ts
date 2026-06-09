import { supabase } from './supabaseClient';
import type { ClaimTypeLetter } from './claimsService';

export type AdminClaimRow = {
  id: number;
  claim_number: string | number | null;
  client_name: string | null;
  client_phone: string | null;
  company_id: string;
  client_company_id: string | null;
  producer_id: number;
  status_id: string;
  type: ClaimTypeLetter | string | null;
  amount_claimed: number | null;
  amount_agreed: number | null;
  producer_profit: number | null;
  fees_percent: number | null;
  fees: number | null;
  is_invoiced: boolean;
  payment_date: string | null;
  presentation_date: string | null;
  finished_at: string | null;
  description: string | null;
  claim_brief: string | null;
  internal_observations: string | null;
  asistente_id: string | null;
  abogado_id: string | null;
  created_at: string;
  updated_at: string;
  companies: { id: string; name: string; logo_url: string | null } | null;
  client_companies: { id: string; name: string; logo_url: string | null } | null;
  claim_statuses: { id: string; name: string; color: string | null } | null;
  producers: { id: number; name: string | null } | null;
  asistentes: { id: string; nombre: string } | null;
  abogados: { id: string; nombre: string; apellido: string } | null;
};

export type ClaimPatch = {
  claim_number?: string | number | null;
  client_name?: string | null;
  client_phone?: string | null;
  company_id?: string;
  client_company_id?: string | null;
  producer_id?: number;
  status_id?: string;
  type?: ClaimTypeLetter | string | null;
  amount_claimed?: number | null;
  amount_agreed?: number | null;
  producer_profit?: number | null;
  fees_percent?: number | null;
  is_invoiced?: boolean;
  payment_date?: string | null;
  presentation_date?: string | null;
  finished_at?: string | null;
  description?: string | null;
  claim_brief?: string | null;
  internal_observations?: string | null;
  asistente_id?: string | null;
  abogado_id?: string | null;
};

export function claimToEditForm(claim: AdminClaimRow): ClaimPatch {
  return {
    client_name: claim.client_name,
    client_phone: claim.client_phone,
    company_id: claim.company_id,
    client_company_id: claim.client_company_id,
    producer_id: claim.producer_id,
    status_id: claim.status_id,
    type: claim.type,
    amount_agreed: claim.amount_agreed,
    fees_percent: claim.fees_percent,
    is_invoiced: claim.is_invoiced,
    payment_date: claim.payment_date,
    presentation_date: claim.presentation_date,
    finished_at: claim.finished_at,
    description: claim.description,
    claim_brief: claim.claim_brief,
    internal_observations: claim.internal_observations,
    asistente_id: claim.asistente_id,
    abogado_id: claim.abogado_id,
  };
}

export function buildSavePatch(form: ClaimPatch): ClaimPatch {
  return {
    client_name: form.client_name?.trim() || null,
    client_phone: form.client_phone?.trim() || null,
    company_id: form.company_id,
    client_company_id: form.client_company_id || null,
    producer_id: form.producer_id,
    status_id: form.status_id,
    type: form.type || null,
    amount_agreed: form.amount_agreed ?? null,
    fees_percent: form.fees_percent ?? null,
    is_invoiced: form.is_invoiced ?? false,
    payment_date: form.payment_date || null,
    presentation_date: form.presentation_date || null,
    finished_at: form.finished_at || null,
    description: form.description?.trim() || null,
    claim_brief: form.claim_brief?.trim() || null,
    internal_observations: form.internal_observations?.trim() || null,
    asistente_id: form.asistente_id || null,
    abogado_id: form.abogado_id || null,
  };
}

export async function getAdminClaims(): Promise<{
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
      client_phone,
      company_id,
      client_company_id,
      producer_id,
      status_id,
      type,
      amount_claimed,
      amount_agreed,
      producer_profit,
      fees_percent,
      fees,
      is_invoiced,
      payment_date,
      presentation_date,
      finished_at,
      description,
      claim_brief,
      internal_observations,
      asistente_id,
      abogado_id,
      created_at,
      updated_at,
      companies!company_id (
        id,
        name,
        logo_url
      ),
      client_companies:companies!client_company_id (
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
      ),
      abogados (
        id,
        nombre,
        apellido
      )
    `
    )
    .order('updated_at', { ascending: false });

  if (error) return { data: null, error: { message: error.message } };
  return { data: (data as unknown as AdminClaimRow[]) ?? [], error: null };
}

export async function updateClaimById(
  id: number,
  patch: ClaimPatch
): Promise<{ data: unknown | null; error: { message: string } | null }> {
  const { data, error } = await supabase
    .from('claims')
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
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
