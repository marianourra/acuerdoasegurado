import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import type { User } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  /** Nombre del productor (tabla producers). Cargado una vez por sesión, no se vuelve a pedir al cambiar de página. */
  producerName: string | null;
  producerNameLoaded: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  producerName: null,
  producerNameLoaded: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [producerName, setProducerName] = useState<string | null>(null);
  const [producerNameLoaded, setProducerNameLoaded] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Cargar nombre del productor una sola vez cuando hay usuario; se mantiene en contexto al navegar
  useEffect(() => {
    if (!user?.id) {
      setProducerName(null);
      setProducerNameLoaded(false);
      return;
    }
    supabase
      .from('producers')
      .select('name')
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        setProducerName(!error && data ? data.name : null);
        setProducerNameLoaded(true);
      });
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{ user, loading, producerName, producerNameLoaded }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
