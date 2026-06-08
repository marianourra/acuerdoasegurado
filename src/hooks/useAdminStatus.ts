import { useAuth } from '../context/AuthContext';

/** null solo mientras se carga el perfil del productor (misma query que el nombre). */
export function useAdminStatus(): boolean | null {
  const { user, loading, producerNameLoaded, isAdmin } = useAuth();
  if (loading || !user) return false;
  if (!producerNameLoaded) return null;
  return isAdmin;
}
