import { supabase } from './supabaseClient';

export type Abogado = {
  id: string;
  nombre: string;
  apellido: string;
};

export function formatAbogadoName(abogado: { nombre: string; apellido?: string | null } | null | undefined): string {
  if (!abogado) return '—';
  const full = [abogado.nombre, abogado.apellido].filter(Boolean).join(' ').trim();
  return full || '—';
}

export async function getAbogados(): Promise<{
  data: Abogado[] | null;
  error: { message: string } | null;
}> {
  const { data, error } = await supabase
    .from('abogados')
    .select('id, nombre, apellido')
    .order('apellido', { ascending: true })
    .order('nombre', { ascending: true });

  if (error) {
    return { data: null, error: { message: error.message } };
  }

  return { data: (data as Abogado[]) ?? [], error: null };
}
