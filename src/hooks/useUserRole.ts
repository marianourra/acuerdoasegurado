import { useAuth } from '../context/AuthContext';
import type { AppRole } from '../services/roleService';

export function useUserRole(): { role: AppRole; loading: boolean } {
  const { user, loading, producerNameLoaded, isAdmin, isAsistente } = useAuth();

  if (loading || !user || !producerNameLoaded) {
    return { role: 'producer', loading: true };
  }
  if (isAdmin) return { role: 'admin', loading: false };
  if (isAsistente) return { role: 'asistente', loading: false };
  return { role: 'producer', loading: false };
}
