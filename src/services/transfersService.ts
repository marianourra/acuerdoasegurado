import { supabase } from './supabaseClient';

export async function getProducerTransfers() {
  const { data, error } = await supabase
    .from('producer_transfers')
    .select('*')
    .order('transfer_date', { ascending: false });

  return { data, error };
}
