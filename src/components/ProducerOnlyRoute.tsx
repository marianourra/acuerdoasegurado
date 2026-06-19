import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoadingSpinner from './LoadingSpinner';
import { useUserRole } from '../hooks/useUserRole';
import { getHomePathForRole } from '../services/roleService';

export default function ProducerOnlyRoute({ children }: { children: ReactNode }) {
  const { role, loading } = useUserRole();

  if (loading) {
    return (
      <MainLayout>
        <LoadingSpinner text="Cargando..." />
      </MainLayout>
    );
  }

  if (role !== 'producer') {
    return <Navigate to={getHomePathForRole(role)} replace />;
  }

  return <>{children}</>;
}
