import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyBenefits } from '../services/claimsService';
import MainLayout from '../layouts/MainLayout';

export default function MisBeneficios() {
  const { user, loading: authLoading } = useAuth();
  const [benefits, setBenefits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const userId = user.id;

    async function loadBenefits() {
      setLoading(true);
      setErrMsg(null);

      const { data, error } = await getMyBenefits(userId);

      if (error) {
        console.error('❌ getMyBenefits error:', error);
        setErrMsg(error.message);
        setBenefits([]);
      } else {
        setBenefits(data || []);
      }

      setLoading(false);
    }

    loadBenefits();
  }, [user]);

  const totalProfit = useMemo(() => {
    return benefits.reduce((sum, benefit) => sum + Number(benefit.producer_profit || 0), 0);
  }, [benefits]);

  const totalTransferred = useMemo(() => {
    return benefits
      .filter((b) => b.transfer_date)
      .reduce((sum, benefit) => sum + Number(benefit.producer_profit || 0), 0);
  }, [benefits]);

  const pendingProfit = useMemo(() => {
    const transferred = totalTransferred;
    const pending = totalProfit - transferred;
    return pending > 0 ? pending : 0;
  }, [totalProfit, totalTransferred]);

  if (authLoading) return <MainLayout><p style={{ padding: 16 }}>Cargando sesión...</p></MainLayout>;
  if (!user) return null;
  if (loading) return <MainLayout><p style={{ padding: 16 }}>Cargando beneficios...</p></MainLayout>;

  return (
    <MainLayout>
      <div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>
          Mis beneficios
        </h1>

        {/* Resumen */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 32 }}>
          <div
            style={{
              background: 'white',
              padding: 24,
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>Profit generado</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#0f172a' }}>
              ${totalProfit.toLocaleString()}
            </div>
          </div>

          <div
            style={{
              background: 'white',
              padding: 24,
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>Profit pendiente de pago</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#f59e0b' }}>
              ${pendingProfit.toLocaleString()}
            </div>
          </div>
        </div>

        {errMsg && <p style={{ color: 'red', marginBottom: 20 }}>Error cargando beneficios: {errMsg}</p>}
      </div>
    </MainLayout>
  );
}
