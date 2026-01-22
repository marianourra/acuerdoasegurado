import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL='https://zvamxultqzecpxshxlld.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY='sb_publishable_eVBfgAQLiN2fxxKveo6QNw_cAg_K1e9';


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
