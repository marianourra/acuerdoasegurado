import { supabase } from './supabaseClient';

export async function getProducerTransfers() {
  const { data, error } = await supabase
    .from('producer_transfers')
    .select('*')
    .order('transfer_date', { ascending: false });

  return { data, error };
}

// --- Admin: listar todas las transferencias con nombre del productor
export type AdminTransferRow = {
  id: number;
  producer_id: number;
  transfer_date: string;
  amount: number;
  currency: string;
  method: string | null;
  reference: string | null;
  notes: string | null;
  producers: { name: string | null } | null;
};

export async function getAdminTransfers(): Promise<{
  data: AdminTransferRow[] | null;
  error: { message: string } | null;
}> {
  const { data, error } = await supabase
    .from('producer_transfers')
    .select('id, producer_id, transfer_date, amount, currency, method, reference, notes, producers(name)')
    .order('transfer_date', { ascending: false });

  if (error) return { data: null, error: { message: error.message } };
  return { data: (data as AdminTransferRow[]) ?? [], error: null };
}

export type CreateTransferParams = {
  producer_id: number | string;
  transfer_date: string; // YYYY-MM-DD
  amount: number;
  currency?: string;
  method?: string;
  reference?: string;
  notes?: string;
};

export type TransferInsertResult = {
  id: number;
  producer_id: number;
  transfer_date: string;
  amount: number;
  currency: string;
  method: string | null;
  reference: string | null;
  notes: string | null;
};

export async function createTransfer(params: CreateTransferParams): Promise<{
  data: TransferInsertResult | null;
  error: { message: string } | null;
}> {
  const { data, error } = await supabase
    .from('producer_transfers')
    .insert({
      producer_id: params.producer_id,
      transfer_date: params.transfer_date,
      amount: params.amount,
      currency: params.currency ?? 'ARS',
      method: params.method?.trim() || null,
      reference: params.reference?.trim() || null,
      notes: params.notes?.trim() || null,
    })
    .select('id, producer_id, transfer_date, amount, currency, method, reference, notes')
    .single();

  if (error) return { data: null, error: { message: error.message } };
  return { data: data as TransferInsertResult, error: null };
}
