import type { NavigateFunction } from 'react-router-dom';
import { isCurrentUserAdmin } from '../services/adminService';
import { getCurrentUserRole, getHomePathForRole, getCurrentAsistenteId } from '../services/roleService';

export async function ensureAdminAccess(navigate: NavigateFunction): Promise<boolean> {
  const admin = await isCurrentUserAdmin();
  if (admin) return true;
  const role = await getCurrentUserRole();
  navigate(getHomePathForRole(role), { replace: true });
  return false;
}

/** Admin o asistente con acceso a la vista de reclamos (misma UI, distinto alcance de datos). */
export async function ensureStaffClaimsAccess(
  navigate: NavigateFunction
): Promise<{ allowed: boolean; isAdmin: boolean; asistenteId: string | null }> {
  const admin = await isCurrentUserAdmin();
  if (admin) {
    return { allowed: true, isAdmin: true, asistenteId: null };
  }

  const role = await getCurrentUserRole();
  if (role === 'asistente') {
    const asistenteId = await getCurrentAsistenteId();
    if (asistenteId) {
      return { allowed: true, isAdmin: false, asistenteId };
    }
  }

  navigate(getHomePathForRole(role), { replace: true });
  return { allowed: false, isAdmin: false, asistenteId: null };
}
