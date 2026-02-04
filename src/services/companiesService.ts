import { supabase } from './supabaseClient';

export type Company = {
  id: string;
  name: string;
};

export async function getCompanies(): Promise<{ data: Company[] | null; error: { message: string } | null }> {
  const { data, error } = await supabase
    .from('companies')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    return { data: null, error: { message: error.message } };
  }

  return { data: (data as Company[]) ?? [], error: null };
}

export async function createCompany(name: string): Promise<{
  data: Company | null;
  error: { message: string } | null;
}> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { data: null, error: { message: 'El nombre es obligatorio.' } };
  }

  const { data, error } = await supabase
    .from('companies')
    .insert({ name: trimmed })
    .select('id, name')
    .single();

  if (error) {
    return { data: null, error: { message: error.message } };
  }

  return { data: data as Company, error: null };
}
