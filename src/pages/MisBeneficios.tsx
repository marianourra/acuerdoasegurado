import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyBenefits, getMyClaims } from '../services/claimsService';
import { getProducerTransfers } from '../services/transfersService';
import MainLayout from '../layouts/MainLayout';
import LoadingSpinner from '../components/LoadingSpinner';

export default function MisBeneficios() {
  const { user, loading: authLoading } = useAuth();
  const [benefits, setBenefits] = useState<any[]>([]);
  const [allClaims, setAllClaims] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const userId = user.id;

    async function loadData() {
      setLoading(true);
      setErrMsg(null);

      // Cargar beneficios (reclamos con producer_profit)
      const { data: benefitsData, error: benefitsError } = await getMyBenefits(userId);

      if (benefitsError) {
        console.error('❌ getMyBenefits error:', benefitsError);
        setErrMsg(benefitsError.message);
        setBenefits([]);
      } else {
        setBenefits(benefitsData || []);
      }

      // Cargar todos los reclamos para el total
      const { data: claimsData, error: claimsError } = await getMyClaims(userId);

      if (claimsError) {
        console.error('❌ getMyClaims error:', claimsError);
        // No mostramos error aquí porque ya tenemos el de beneficios
      } else {
        setAllClaims(claimsData || []);
      }

      // Cargar transferencias para calcular beneficios pendientes
      const { data: transfersData, error: transfersError } = await getProducerTransfers();

      if (transfersError) {
        console.error('❌ getProducerTransfers error:', transfersError);
        // No mostramos error aquí porque ya tenemos el de beneficios
      } else {
        setTransfers(transfersData || []);
      }

      setLoading(false);
    }

    loadData();
  }, [user]);

  const totalProfit = useMemo(() => {
    return benefits.reduce((sum, benefit) => sum + Number(benefit.producer_profit || 0), 0);
  }, [benefits]);

  const totalTransfers = useMemo(() => {
    return transfers.reduce((sum, transfer) => sum + Number(transfer.amount || 0), 0);
  }, [transfers]);

  const pendingBenefits = useMemo(() => {
    const pending = totalProfit - totalTransfers;
    return pending > 0 ? pending : 0;
  }, [totalProfit, totalTransfers]);

  // Datos para gráficos
  const liquidatedPercentage = useMemo(() => {
    if (totalProfit === 0) return 0;
    return Math.min(100, (totalTransfers / totalProfit) * 100);
  }, [totalProfit, totalTransfers]);

  const topBenefits = useMemo(() => {
    return [...benefits]
      .sort((a, b) => Number(b.producer_profit || 0) - Number(a.producer_profit || 0))
      .slice(0, 5)
      .map(b => ({
        claimNumber: b.claim_number,
        clientName: b.client_name,
        amount: Number(b.producer_profit || 0),
      }));
  }, [benefits]);

  const maxBenefit = useMemo(() => {
    if (topBenefits.length === 0) return 1;
    return Math.max(...topBenefits.map(b => b.amount), 1);
  }, [topBenefits]);

  if (authLoading) return <MainLayout><LoadingSpinner text="Cargando sesión..." /></MainLayout>;
  if (!user) return null;
  if (loading) return <MainLayout><LoadingSpinner text="Cargando beneficios..." /></MainLayout>;

  return (
    <MainLayout>
      <div>
        <h1 style={{ margin: 0, fontSize: 'clamp(24px, 5vw, 28px)', fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>
          Mis beneficios
        </h1>

        {/* Resumen */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <div
            style={{
              background: 'white',
              padding: 24,
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>Beneficio total generado</div>
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
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>Total de reclamos</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#0f172a' }}>
              {allClaims.length}
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
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>Beneficios pendientes de liquidación</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#f59e0b' }}>
              ${pendingBenefits.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Leyenda informativa */}
        <div
          style={{
            marginBottom: 32,
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
            Los beneficios pendientes serán liquidados a partir de los $50,000.
          </p>
        </div>

        {errMsg && <p style={{ color: 'red', marginBottom: 20 }}>Error cargando beneficios: {errMsg}</p>}

        {/* Gráficos visuales */}
        {!errMsg && (totalProfit > 0 || topBenefits.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginTop: 32 }}>
            {/* Gráfico circular de liquidación */}
            <div
              style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                padding: 24,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              }}
            >
              <h3 style={{ margin: 0, marginBottom: 20, fontSize: 18, fontWeight: 600, color: '#0f172a' }}>
                Estado de liquidación
              </h3>
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <div style={{ position: 'relative', width: 200, height: 200 }}>
                  <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}>
                    {/* Círculo de fondo */}
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="16"
                    />
                    {/* Círculo de progreso */}
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="16"
                      strokeDasharray={`${2 * Math.PI * 80}`}
                      strokeDashoffset={`${2 * Math.PI * 80 * (1 - liquidatedPercentage / 100)}`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: '#10b981' }}>
                      {liquidatedPercentage.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
                      Liquidado
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }}></div>
                    <span style={{ fontSize: 13, color: '#64748b' }}>
                      ${totalTransfers.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }}></div>
                    <span style={{ fontSize: 13, color: '#64748b' }}>
                      ${pendingBenefits.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico de barras - Top beneficios */}
            {topBenefits.length > 0 && (
              <div
                style={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                }}
              >
                <h3 style={{ margin: 0, marginBottom: 20, fontSize: 18, fontWeight: 600, color: '#0f172a' }}>
                  Top 5 reclamos por beneficio
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {topBenefits.map((benefit, index) => {
                    const percentage = (benefit.amount / maxBenefit) * 100;
                    return (
                      <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              #{benefit.claimNumber}
                            </div>
                            <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {benefit.clientName}
                            </div>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#10b981', marginLeft: 12 }}>
                            ${benefit.amount.toLocaleString()}
                          </div>
                        </div>
                        <div
                          style={{
                            height: 8,
                            background: '#e2e8f0',
                            borderRadius: 4,
                            overflow: 'hidden',
                            position: 'relative',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${percentage}%`,
                              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                              borderRadius: 4,
                              transition: 'width 0.5s ease',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Gráfico de distribución */}
            <div
              style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                padding: 24,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              }}
            >
              <h3 style={{ margin: 0, marginBottom: 20, fontSize: 18, fontWeight: 600, color: '#0f172a' }}>
                Distribución de beneficios
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, color: '#64748b' }}>Liquidados</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                      {totalProfit > 0 ? ((totalTransfers / totalProfit) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 12,
                      background: '#e2e8f0',
                      borderRadius: 6,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${totalProfit > 0 ? (totalTransfers / totalProfit) * 100 : 0}%`,
                        background: '#10b981',
                        borderRadius: 6,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                    ${totalTransfers.toLocaleString()}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, color: '#64748b' }}>Pendientes</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                      {totalProfit > 0 ? ((pendingBenefits / totalProfit) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 12,
                      background: '#e2e8f0',
                      borderRadius: 6,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${totalProfit > 0 ? (pendingBenefits / totalProfit) * 100 : 0}%`,
                        background: '#f59e0b',
                        borderRadius: 6,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                    ${pendingBenefits.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
