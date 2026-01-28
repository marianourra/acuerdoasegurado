import { supabase } from './supabaseClient';

export async function getMyClaims(userId: string) {
  const { data, error } = await supabase
    .from('claims')
    .select(
      `
      id,
      client_name,
      claim_number,
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
        user_id
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
        user_id
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
