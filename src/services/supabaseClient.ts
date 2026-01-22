import { createClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = envUrl || 'https://zvamxultqzecpxshxlld.supabase.co';
const supabaseAnonKey = envKey || 'sb_publishable_eVBfgAQLiN2fxxKveo6QNw_cAg_K1e9';


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
