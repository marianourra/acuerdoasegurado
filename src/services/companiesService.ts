import { supabase } from './supabaseClient';

export type Company = {
  id: string;
  name: string;
  logo_url: string | null;
};

export async function getCompanies(): Promise<{ data: Company[] | null; error: { message: string } | null }> {
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, logo_url')
    .order('name', { ascending: true });

  if (error) {
    return { data: null, error: { message: error.message } };
  }

  return { data: (data as Company[]) ?? [], error: null };
}

export async function createCompany(
  name: string,
  logoUrl?: string | null
): Promise<{
  data: Company | null;
  error: { message: string } | null;
}> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { data: null, error: { message: 'El nombre es obligatorio.' } };
  }

  const { data, error } = await supabase
    .from('companies')
    .insert({
      name: trimmed,
      logo_url: logoUrl?.trim() || null,
    })
    .select('id, name, logo_url')
    .single();

  if (error) {
    return { data: null, error: { message: error.message } };
  }

  return { data: data as Company, error: null };
}

export async function updateCompany(
  id: string,
  params: { name?: string; logo_url?: string | null }
): Promise<{ data: Company | null; error: { message: string } | null }> {
  const patch: { name?: string; logo_url?: string | null } = {};
  if (params.name !== undefined) {
    const trimmed = params.name.trim();
    if (!trimmed) return { data: null, error: { message: 'El nombre es obligatorio.' } };
    patch.name = trimmed;
  }
  if (params.logo_url !== undefined) {
    patch.logo_url = params.logo_url?.trim() || null;
  }

  const { data, error } = await supabase
    .from('companies')
    .update(patch)
    .eq('id', id)
    .select('id, name, logo_url')
    .single();

  if (error) return { data: null, error: { message: error.message } };
  return { data: data as Company, error: null };
}
