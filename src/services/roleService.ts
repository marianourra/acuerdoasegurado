import { supabase } from './supabaseClient';

export type AppRole = 'admin' | 'asistente' | 'producer';

export function getHomePathForRole(role: AppRole): string {
  if (role === 'admin') return '/admin/claims';
  if (role === 'asistente') return '/admin/claims';
  return '/dashboard';
}

export async function getCurrentUserRole(): Promise<AppRole> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return 'producer';

  const [{ data: producer }, { data: asistente }] = await Promise.all([
    supabase.from('producers').select('is_admin').eq('user_id', user.id).maybeSingle(),
    supabase.from('asistentes').select('id').eq('user_id', user.id).maybeSingle(),
  ]);

  if (producer?.is_admin === true) return 'admin';
  if (asistente?.id) return 'asistente';
  return 'producer';
}

export async function isCurrentUserAsistente(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === 'asistente';
}

export async function getCurrentAsistenteId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return null;

  const { data, error } = await supabase
    .from('asistentes')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !data?.id) return null;
  return data.id as string;
}
