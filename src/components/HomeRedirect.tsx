import { Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoadingSpinner from './LoadingSpinner';
import { useUserRole } from '../hooks/useUserRole';
import { getHomePathForRole } from '../services/roleService';

export default function HomeRedirect() {
  const { role, loading } = useUserRole();

  if (loading) {
    return (
      <MainLayout>
        <LoadingSpinner text="Cargando..." />
      </MainLayout>
    );
  }

  return <Navigate to={getHomePathForRole(role)} replace />;
}
