import { Navigate } from 'react-router-dom';

/** Compatibilidad: redirige a la misma vista de admin. */
export default function AssistantClaims() {
  return <Navigate to="/admin/claims" replace />;
}
