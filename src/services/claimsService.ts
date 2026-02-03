import { supabase } from './supabaseClient';

const DEFAULT_STATUS_ID = '10425a79-8097-4459-94d3-fffd8c872390';

export async function getMyProducerId(userId: string): Promise<{ data: string | null; error: { message: string } | null }> {
  const { data, error } = await supabase
    .from('producers')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (error) {
    return { data: null, error: { message: error.message } };
  }
  return { data: data?.id ?? null, error: null };
}

export async function getDefaultStatusId(): Promise<{ data: string | null; error: { message: string } | null }> {
  const { data, error } = await supabase
    .from('claim_statuses')
    .select('id')
    .eq('name', 'Preparando para presentar')
    .single();

  if (error || !data?.id) {
    return { data: DEFAULT_STATUS_ID, error: null };
  }
  return { data: data.id, error: null };
}

export type ClaimTypeLetter = 'A' | 'L' | 'P';

export type CreateClaimPayload = {
  producer_id: string;
  company_id: string;
  status_id: string;
  client_name: string;
  type: ClaimTypeLetter;
  /** Teléfono del reclamante. No se inserta hasta que exista la columna en `claims` (nombre exacto en Supabase). */
  client_phone?: string;
};

export async function createClaim(payload: CreateClaimPayload): Promise<{ data: unknown | null; error: { message: string } | null }> {
  const row: Record<string, unknown> = {
    producer_id: payload.producer_id,
    company_id: payload.company_id,
    status_id: payload.status_id,
    client_name: payload.client_name,
    type: payload.type,
  };
  // Descomentar y usar el nombre de columna correcto cuando lo tengas de Supabase (Table Editor > claims):
  // if (payload.client_phone != null) row['NOMBRE_COLUMNA'] = payload.client_phone;

  const { data, error } = await supabase
    .from('claims')
    .insert(row)
    .select('id')
    .single();

  if (error) {
    return { data: null, error: { message: error.message } };
  }
  return { data, error: null };
}

export async function getMyClaims(userId: string) {
  const { data, error } = await supabase
    .from('claims')
    .select(
      `
      id,
      client_name,
      claim_number,
      type,
      description,
      amount_claimed,
      amount_agreed,
      producer_profit,
      created_at,
      updated_at,
      finished_at,
      claim_statuses!inner (
        id,
        name,
        color
      ),
      companies (
        id,
        name
      ),
      producers!inner (
        user_id,
        name
      )
    `
    )
    .eq('producers.user_id', userId)
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function getMyClaimById(userId: string, claimId: number) {
  const { data, error } = await supabase
    .from('claims')
    .select(
      `
      id,
      client_name,
      claim_number,
      type,
      description,
      amount_claimed,
      amount_agreed,
      producer_profit,
      created_at,
      updated_at,
      finished_at,
      payment_date,
      claim_statuses!inner (
        id,
        name,
        color
      ),
      companies (
        id,
        name
      ),
      producers!inner (
        user_id,
        name
      )
    `
    )
    .eq('id', claimId)
    .eq('producers.user_id', userId)
    .single();

  return { data, error };
}

export async function getMyBenefits(userId: string) {
  const { data, error } = await supabase
    .from('claims')
    .select(
      `
      id,
      claim_number,
      client_name,
      producer_profit,
      amount_agreed,
      created_at,
      updated_at,
      companies (
        id,
        name
      ),
      producers!inner (
        user_id
      )
    `
    )
    .eq('producers.user_id', userId)
    .not('producer_profit', 'is', null)
    .order('created_at', { ascending: false });

  return { data, error };
}
