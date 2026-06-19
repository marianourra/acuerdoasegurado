import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import type { User } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  /** Nombre del productor (tabla producers). */
  producerName: string | null;
  producerNameLoaded: boolean;
  /** is_admin del productor actual. */
  isAdmin: boolean;
  /** Usuario vinculado a un registro en asistentes. */
  isAsistente: boolean;
  asistenteId: string | null;
  asistenteName: string | null;
  /** Nombre para mostrar: productor o asistente. */
  displayName: string | null;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  producerName: null,
  producerNameLoaded: false,
  isAdmin: false,
  isAsistente: false,
  asistenteId: null,
  asistenteName: null,
  displayName: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [producerName, setProducerName] = useState<string | null>(null);
  const [producerNameLoaded, setProducerNameLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAsistente, setIsAsistente] = useState(false);
  const [asistenteId, setAsistenteId] = useState<string | null>(null);
  const [asistenteName, setAsistenteName] = useState<string | null>(null);

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

  useEffect(() => {
    if (!user?.id) {
      setProducerName(null);
      setProducerNameLoaded(false);
      setIsAdmin(false);
      setIsAsistente(false);
      setAsistenteId(null);
      setAsistenteName(null);
      return;
    }

    Promise.all([
      supabase.from('producers').select('name, is_admin').eq('user_id', user.id).maybeSingle(),
      supabase.from('asistentes').select('id, nombre').eq('user_id', user.id).maybeSingle(),
    ]).then(([producerRes, asistenteRes]) => {
      const producer = producerRes.data;
      const asistente = asistenteRes.data;

      setProducerName(producer?.name ?? null);
      setIsAdmin(producer?.is_admin === true);
      setIsAsistente(Boolean(asistente?.id));
      setAsistenteId(asistente?.id ?? null);
      setAsistenteName(asistente?.nombre ?? null);
      setProducerNameLoaded(true);
    });
  }, [user?.id]);

  const displayName = producerName ?? asistenteName;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        producerName,
        producerNameLoaded,
        isAdmin,
        isAsistente,
        asistenteId,
        asistenteName,
        displayName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
