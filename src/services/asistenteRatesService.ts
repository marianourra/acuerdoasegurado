import { supabase } from './supabaseClient';

export type AsistenteMonthlyRate = {
  asistente_id: string;
  month: string;
  rate: number;
};

/** Clave estable para mapas locales: `${month}:${asistenteId}`. */
export function rateKey(month: string, asistenteId: string): string {
  return `${month}:${asistenteId}`;
}

export async function getAsistenteRates(): Promise<{
  data: AsistenteMonthlyRate[] | null;
  error: { message: string } | null;
}> {
  const { data, error } = await supabase
    .from('asistente_monthly_rates')
    .select('asistente_id, month, rate');

  if (error) return { data: null, error: { message: error.message } };
  return { data: (data as AsistenteMonthlyRate[]) ?? [], error: null };
}

export async function upsertAsistenteRate(
  asistenteId: string,
  month: string,
  rate: number
): Promise<{ error: { message: string } | null }> {
  const { error } = await supabase.from('asistente_monthly_rates').upsert(
    {
      asistente_id: asistenteId,
      month,
      rate,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'asistente_id,month' }
  );

  if (error) return { error: { message: error.message } };
  return { error: null };
}
