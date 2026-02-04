import { supabase } from './supabaseClient';

/**
 * Comprueba si el usuario actual es admin (producers.is_admin = true).
 * La seguridad real debe estar en RLS; esto solo oculta la UI a no-admin.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return false;

  const { data, error } = await supabase
    .from('producers')
    .select('is_admin')
    .eq('user_id', user.id)
    .single();

  if (error || data == null) return false;
  return data.is_admin === true;
}
