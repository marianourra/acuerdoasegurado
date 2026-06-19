import { Navigate } from 'react-router-dom';

/** Compatibilidad: redirige a la misma vista de admin. */
export default function AssistantNewClaim() {
  return <Navigate to="/admin/claims/new" replace />;
}
