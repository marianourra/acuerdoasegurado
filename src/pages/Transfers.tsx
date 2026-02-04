import { useEffect, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../context/AuthContext';
import { getProducerTransfers } from '../services/transfersService';
import { formatDateLocal } from '../utils/dateUtils';
import LoadingSpinner from '../components/LoadingSpinner';

type Transfer = {
  id: number;
  producer_id: number;
  transfer_date: string;
  amount: number;
  currency: string;
  method: string | null;
  reference: string | null;
  notes: string | null;
};

export default function Transfers() {
  const { user, loading: authLoading } = useAuth();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    async function loadTransfers() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await getProducerTransfers();

      if (fetchError) {
        console.error('❌ Error cargando transferencias:', fetchError);
        setError(fetchError.message);
        setTransfers([]);
      } else {
        setTransfers(data || []);
      }

      setLoading(false);
    }

    loadTransfers();
  }, [user]);

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency || 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (authLoading) {
    return (
      <MainLayout>
        <LoadingSpinner text="Cargando sesión..." />
      </MainLayout>
    );
  }

  if (!user) return null;

  if (loading) {
    return (
      <MainLayout>
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(24px, 5vw, 28px)', fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>
            Mis pagos
          </h1>
          <LoadingSpinner text="Cargando transferencias..." inline />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div>
        <h1 style={{ margin: 0, fontSize: 'clamp(24px, 5vw, 28px)', fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>
          Mis pagos
        </h1>

        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 12,
              padding: '16px',
              marginBottom: 24,
              color: '#dc2626',
              fontSize: 14,
            }}
          >
            Error cargando transferencias: {error}
          </div>
        )}

        {!error && transfers.length === 0 ? (
          <div
            style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            }}
          >
            <p style={{ color: '#64748b', padding: 20, textAlign: 'center', margin: 0 }}>
              No hay transferencias registradas
            </p>
          </div>
        ) : (
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

            {/* Vista móvil: Cards */}
            <div
              style={{
                display: 'block',
              }}
              className="transfers-mobile"
            >
              {transfers.map((transfer) => (
                <div
                  key={transfer.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    background: '#f8fafc',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>Fecha</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>
                        {formatDateLocal(transfer.transfer_date)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>Monto</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>
                        {formatAmount(transfer.amount, transfer.currency)}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>Método</div>
                    <div style={{ fontSize: 14, color: '#334155' }}>Transferencia</div>
                  </div>

                  {transfer.reference && (
                    <div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>Nro de operación</div>
                      <div style={{ fontSize: 14, color: '#334155' }}>{transfer.reference}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Vista desktop: Tabla */}
            <div
              style={{
                display: 'none',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}
              className="transfers-desktop"
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  minWidth: 600,
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
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
                      Fecha
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
                      Método
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
                      Nro de operación
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
                        {formatDateLocal(transfer.transfer_date)}
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
                        {formatAmount(transfer.amount, transfer.currency)}
                      </td>
                      <td
                        style={{
                          padding: '16px',
                          fontSize: 15,
                          color: '#334155',
                        }}
                      >
                        Transferencia
                      </td>
                      <td
                        style={{
                          padding: '16px',
                          fontSize: 15,
                          color: '#334155',
                        }}
                      >
                        {transfer.reference || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Leyenda informativa */}
            <div
              style={{
                marginTop: 24,
                padding: '14px 16px',
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: '#0369a1',
                  lineHeight: 1.5,
                }}
              >
                Las transferencias pueden demorar hasta 48hs en acreditarse.
              </p>
            </div>
          </div>
        )}

        <style>{`
          @media (min-width: 768px) {
            .transfers-mobile {
              display: none !important;
            }
            .transfers-desktop {
              display: block !important;
            }
          }
          @media (max-width: 767px) {
            .transfers-mobile {
              display: block !important;
            }
            .transfers-desktop {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </MainLayout>
  );
}
