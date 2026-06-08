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

export type ClaimStatusStep = {
  id: string;
  name: string;
  color: string | null;
  order_index: number;
};

export const FINALIZED_STATUS_NAMES = ['Acordado', 'Sin responsabilidad', 'Sin acuerdo'] as const;

const ACORDADO_STATUS_ID = 'feb85213-84b6-46cf-8872-faa3a6a1b01d';

export function isFinalizedStatusName(name: string | null | undefined): boolean {
  if (!name) return false;
  const normalized = name.trim().toLowerCase();
  return FINALIZED_STATUS_NAMES.some((statusName) => statusName.toLowerCase() === normalized);
}

export function isAcordadoClaim(claim: {
  status_id?: string | null;
  claim_statuses?: { id?: string; name?: string } | null;
}): boolean {
  const statusId = claim.status_id ?? claim.claim_statuses?.id ?? null;
  if (statusId === ACORDADO_STATUS_ID) return true;
  return claim.claim_statuses?.name?.trim().toLowerCase() === 'acordado';
}

export function isFinalizedClaim(claim: {
  status_id?: string | null;
  claim_statuses?: { id?: string; name?: string } | null;
}): boolean {
  if (isAcordadoClaim(claim)) return true;
  return isFinalizedStatusName(claim.claim_statuses?.name);
}

export async function getClaimStatusesOrdered(): Promise<{
  data: ClaimStatusStep[] | null;
  error: { message: string } | null;
}> {
  const { data, error } = await supabase
    .from('claim_statuses')
    .select('id, name, color, order_index')
    .order('order_index', { ascending: true });

  if (error) {
    return { data: null, error: { message: error.message } };
  }
  return { data: (data as ClaimStatusStep[]) ?? [], error: null };
}

export type ClaimTypeLetter = 'A' | 'L' | 'P' | 'D';

/** Hay cambios desde la última vez que el productor abrió el reclamo. */
export function hasClaimUnreadUpdates(claim: {
  updated_at?: string | null;
  producer_viewed_at?: string | null;
  created_at?: string | null;
}): boolean {
  if (!claim.updated_at) return false;
  const updatedMs = new Date(claim.updated_at).getTime();
  const baselineMs = claim.producer_viewed_at
    ? new Date(claim.producer_viewed_at).getTime()
    : claim.created_at
      ? new Date(claim.created_at).getTime()
      : 0;
  return updatedMs - baselineMs > 1000;
}

export async function markClaimViewedByProducer(
  userId: string,
  claimId: number
): Promise<{ error: { message: string } | null }> {
  const { data: producerId, error: producerError } = await getMyProducerId(userId);
  if (producerError || !producerId) {
    return { error: { message: producerError?.message ?? 'Productor no encontrado.' } };
  }

  const { error } = await supabase
    .from('claims')
    .update({ producer_viewed_at: new Date().toISOString() })
    .eq('id', claimId)
    .eq('producer_id', producerId);

  if (error) return { error: { message: error.message } };
  return { error: null };
}

export type CreateClaimPayload = {
  producer_id: string;
  company_id: string;
  status_id: string;
  client_name: string;
  type: ClaimTypeLetter;
  /** Teléfono del reclamante. */
  client_phone?: string;
  asistente_id?: string | null;
};

export async function createClaim(payload: CreateClaimPayload): Promise<{ data: unknown | null; error: { message: string } | null }> {
  const row: Record<string, unknown> = {
    producer_id: payload.producer_id,
    company_id: payload.company_id,
    status_id: payload.status_id,
    client_name: payload.client_name,
    type: payload.type,
  };
  if (payload.client_phone != null && payload.client_phone.trim() !== '') {
    row.client_phone = payload.client_phone.trim();
  }
  if (payload.asistente_id) {
    row.asistente_id = payload.asistente_id;
  }

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
      client_phone,
      asistente_id,
      claim_number,
      type,
      description,
      amount_claimed,
      amount_agreed,
      producer_profit,
      created_at,
      updated_at,
      producer_viewed_at,
      finished_at,
      claim_statuses!inner (
        id,
        name,
        color
      ),
      companies!company_id (
        id,
        name,
        logo_url
      ),
      producers!inner (
        user_id,
        name
      ),
      asistentes (
        id,
        nombre
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
      client_phone,
      asistente_id,
      claim_number,
      type,
      description,
      amount_claimed,
      amount_agreed,
      producer_profit,
      created_at,
      updated_at,
      producer_viewed_at,
      finished_at,
      payment_date,
      claim_statuses!inner (
        id,
        name,
        color
      ),
      companies!company_id (
        id,
        name,
        logo_url
      ),
      producers!inner (
        user_id,
        name
      ),
      asistentes (
        id,
        nombre
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
      companies!company_id (
        id,
        name,
        logo_url
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
