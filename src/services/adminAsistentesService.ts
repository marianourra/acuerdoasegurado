import { supabase } from './supabaseClient';

export type AdminAsistenteRow = {
  id: string;
  nombre: string;
  user_id: string | null;
  email: string | null;
};

export async function getAdminAsistentes(): Promise<{
  data: AdminAsistenteRow[] | null;
  error: { message: string } | null;
}> {
  const { data, error } = await supabase
    .from('asistentes')
    .select('id, nombre, user_id, email')
    .order('nombre', { ascending: true });

  if (error) return { data: null, error: { message: error.message } };
  return { data: (data as AdminAsistenteRow[]) ?? [], error: null };
}

export type CreateAsistenteParams = {
  email: string;
  password: string;
  nombre: string;
};

export async function createAsistenteUser(params: CreateAsistenteParams): Promise<{
  data: AdminAsistenteRow | null;
  error: { message: string } | null;
}> {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: params.email.trim(),
    password: params.password,
    options: { data: { full_name: params.nombre.trim() } },
  });

  if (authError) {
    return { data: null, error: { message: authError.message } };
  }

  const user = authData?.user;
  if (!user?.id) {
    return { data: null, error: { message: 'No se pudo obtener el usuario creado.' } };
  }

  const { data: row, error: insertError } = await supabase
    .from('asistentes')
    .insert({
      nombre: params.nombre.trim(),
      email: params.email.trim(),
      user_id: user.id,
    })
    .select('id, nombre, user_id, email')
    .single();

  if (insertError) {
    return { data: null, error: { message: insertError.message } };
  }

  return { data: row as AdminAsistenteRow, error: null };
}

export type UpdateAsistenteParams = {
  nombre: string;
  email: string;
};

export function asistenteToEditForm(asistente: AdminAsistenteRow): UpdateAsistenteParams {
  return {
    nombre: asistente.nombre,
    email: asistente.email ?? '',
  };
}

export async function updateAdminAsistente(
  id: string,
  params: UpdateAsistenteParams
): Promise<{ data: AdminAsistenteRow | null; error: { message: string } | null }> {
  const { data, error } = await supabase
    .from('asistentes')
    .update({
      nombre: params.nombre.trim(),
      email: params.email.trim(),
    })
    .eq('id', id)
    .select('id, nombre, user_id, email')
    .single();

  if (error) return { data: null, error: { message: error.message } };
  return { data: data as AdminAsistenteRow, error: null };
}
