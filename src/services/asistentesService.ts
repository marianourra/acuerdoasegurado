import { supabase } from './supabaseClient';

export type Asistente = {
  id: string;
  nombre: string;
};

export async function getAsistentes(): Promise<{
  data: Asistente[] | null;
  error: { message: string } | null;
}> {
  const { data, error } = await supabase
    .from('asistentes')
    .select('id, nombre')
    .order('nombre', { ascending: true });

  if (error) {
    return { data: null, error: { message: error.message } };
  }

  return { data: (data as Asistente[]) ?? [], error: null };
}
