import { useEffect, useMemo, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../context/AuthContext';
import { getMyBenefits } from '../services/claimsService';

export default function MisPagos() {
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

  const transfers = useMemo(() => {
    return benefits
      .filter((b) => b.transfer_date)
      .map((benefit) => ({
        id: benefit.id,
        date: benefit.transfer_date,
        amount: Number(benefit.producer_profit || 0),
        claimNumber: benefit.claim_number,
        clientName: benefit.client_name,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [benefits]);

  if (authLoading) return <MainLayout><p style={{ padding: 16 }}>Cargando sesión...</p></MainLayout>;
  if (!user) return null;
  if (loading) return <MainLayout><p style={{ padding: 16 }}>Cargando pagos...</p></MainLayout>;

  return (
    <MainLayout>
      <div>
        <h1 style={{ margin: 0, fontSize: 'clamp(24px, 5vw, 28px)', fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>
          Mis pagos
        </h1>

        {errMsg && <p style={{ color: 'red', marginBottom: 20 }}>Error cargando pagos: {errMsg}</p>}

        <div
          style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <h2
            style={{
              margin: 0,
              marginBottom: 20,
              fontSize: 20,
              fontWeight: 600,
              color: '#0f172a',
            }}
          >
            Transferencias realizadas
          </h2>

          {transfers.length === 0 ? (
            <p style={{ color: '#64748b', padding: 20, textAlign: 'center' }}>
              No hay transferencias registradas aún.
            </p>
          ) : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  minWidth: 600,
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '2px solid #e2e8f0',
                    }}
                  >
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Fecha de transferencia
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Reclamo
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Monto
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((transfer) => (
                    <tr
                      key={transfer.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <td
                        style={{
                          padding: '16px',
                          fontSize: 15,
                          color: '#0f172a',
                        }}
                      >
                        {new Date(transfer.date).toLocaleDateString('es-AR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </td>
                      <td
                        style={{
                          padding: '16px',
                          fontSize: 15,
                          color: '#0f172a',
                        }}
                      >
                        #{transfer.claimNumber} — {transfer.clientName}
                      </td>
                      <td
                        style={{
                          padding: '16px',
                          fontSize: 15,
                          fontWeight: 600,
                          color: '#10b981',
                          textAlign: 'right',
                        }}
                      >
                        ${transfer.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
