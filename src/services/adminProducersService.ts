import { supabase } from './supabaseClient';

export type AdminProducerRow = {
  id: number;
  user_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  cbu: string | null;
  is_admin: boolean | null;
};

export async function getAdminProducers(): Promise<{
  data: AdminProducerRow[] | null;
  error: { message: string } | null;
}> {
  const { data, error } = await supabase
    .from('producers')
    .select('id, user_id, name, email, phone, cbu, is_admin')
    .order('name', { ascending: true });

  if (error) return { data: null, error: { message: error.message } };
  return { data: (data as AdminProducerRow[]) ?? [], error: null };
}

export type CreateProducerParams = {
  email: string;
  password: string;
  name: string;
  phone?: string;
  cbu?: string;
  is_admin?: boolean;
};

/**
 * Crea un usuario en Auth y un registro en producers.
 * Si Supabase tiene confirmación de email activada, el productor podrá iniciar sesión tras confirmar.
 */
export async function createProducer(params: CreateProducerParams): Promise<{
  data: AdminProducerRow | null;
  error: { message: string } | null;
}> {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: params.email.trim(),
    password: params.password,
    options: { data: { full_name: params.name } },
  });

  if (authError) {
    return { data: null, error: { message: authError.message } };
  }

  const user = authData?.user;
  if (!user?.id) {
    return { data: null, error: { message: 'No se pudo obtener el usuario creado.' } };
  }

  const { data: row, error: insertError } = await supabase
    .from('producers')
    .insert({
      user_id: user.id,
      name: params.name.trim(),
      email: params.email.trim(),
      phone: params.phone?.trim() || null,
      cbu: params.cbu?.trim() || null,
      is_admin: params.is_admin ?? false,
    })
    .select('id, user_id, name, email, phone, cbu, is_admin')
    .single();

  if (insertError) {
    return { data: null, error: { message: insertError.message } };
  }

  return { data: row as AdminProducerRow, error: null };
}
