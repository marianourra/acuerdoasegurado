import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import CompanyLogo from '../components/CompanyLogo';
import { ensureAdminAccess } from '../utils/adminAccess';
import { getAdminFeesClaims } from '../services/adminFeesService';
import type { AdminClaimRow } from '../services/adminClaimsService';
import { isAcordadoClaim } from '../services/claimsService';
import { getClaimFeesAmount, formatMoney, formatDate } from '../utils/adminClaimFormat';
import { getAsistentes, type Asistente } from '../services/asistentesService';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function isCreatedWithinLast30Days(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() <= THIRTY_DAYS_MS;
}

function InvoicedStatusBadge({ isInvoiced }: { isInvoiced: boolean }) {
  if (isInvoiced) {
    return (
      <span
        aria-label="Facturado"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          borderRadius: 999,
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          color: '#1d4ed8',
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        Facturado
      </span>
    );
  }

  return (
    <span
      aria-label="Sin facturar"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        borderRadius: 999,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        color: '#64748b',
        fontSize: 12,
        fontWeight: 700,
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      Sin facturar
    </span>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  fontSize: 14,
};

const panelStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 20,
};

export default function AdminFees() {
  const navigate = useNavigate();
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [claims, setClaims] = useState<AdminClaimRow[]>([]);
  const [asistentes, setAsistentes] = useState<Asistente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assistantRates, setAssistantRates] = useState<Record<string, string>>({});
  const [expandedAssistantId, setExpandedAssistantId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const allowed = await ensureAdminAccess(navigate);
      if (cancelled) return;
      setAdminChecked(true);
      if (allowed) setIsAdmin(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    Promise.all([getAdminFeesClaims(), getAsistentes()])
      .then(([claimsRes, asistentesRes]) => {
        if (claimsRes.error) {
          setError(claimsRes.error.message);
          setClaims([]);
        } else {
          setClaims(claimsRes.data ?? []);
        }
        if (asistentesRes.data) setAsistentes(asistentesRes.data);
      })
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const pendingFeesClaims = useMemo(() => {
    return claims
      .filter((c) => isAcordadoClaim(c))
      .map((c) => ({
        claim: c,
        fees: getClaimFeesAmount(c),
      }))
      .filter((row) => row.fees != null && row.fees > 0)
      .sort((a, b) => (a.claim.client_name ?? '').localeCompare(b.claim.client_name ?? ''));
  }, [claims]);

  const totalPendingFees = useMemo(
    () => pendingFeesClaims.reduce((sum, row) => sum + (row.fees ?? 0), 0),
    [pendingFeesClaims]
  );

  const assistantBilling = useMemo(() => {
    const recentAssigned = claims.filter(
      (c) => c.asistente_id && c.created_at && isCreatedWithinLast30Days(c.created_at)
    );

    const byAssistant = new Map<
      string,
      { id: string; name: string; claims: AdminClaimRow[] }
    >();

    for (const asistente of asistentes) {
      byAssistant.set(asistente.id, { id: asistente.id, name: asistente.nombre, claims: [] });
    }

    for (const claim of recentAssigned) {
      const id = claim.asistente_id!;
      const name = claim.asistentes?.nombre ?? 'Asistente';
      if (!byAssistant.has(id)) {
        byAssistant.set(id, { id, name, claims: [] });
      }
      byAssistant.get(id)!.claims.push(claim);
    }

    return [...byAssistant.values()]
      .filter((row) => row.claims.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [claims, asistentes]);

  const assistantTotals = useMemo(() => {
    let grandTotal = 0;
    const rows = assistantBilling.map((row) => {
      const rate = Number(assistantRates[row.id] ?? 0);
      const validRate = Number.isFinite(rate) && rate >= 0 ? rate : 0;
      const total = row.claims.length * validRate;
      grandTotal += total;
      return { ...row, rate: validRate, total };
    });
    return { rows, grandTotal };
  }, [assistantBilling, assistantRates]);

  if (!adminChecked || !isAdmin) {
    return (
      <MainLayout>
        <LoadingSpinner text="Verificando acceso..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h1
          style={{
            margin: '0 0 8px',
            fontSize: 'clamp(22px, 4vw, 26px)',
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          Admin — Honorarios
        </h1>
        <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: 14 }}>
          Control de honorarios pendientes de cobro y liquidación de asistentes por casos asignados.
        </p>

        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 10,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <LoadingSpinner text="Cargando honorarios..." size={48} inline />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Honorarios pendientes de cobro */}
            <section style={panelStyle}>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 16,
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 20,
                }}
              >
                <div>
                  <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                    Honorarios pendientes de liquidación
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                    Casos en estado Acordado con honorarios calculados.
                  </p>
                </div>
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    minWidth: 200,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.9, marginBottom: 4 }}>
                    TOTAL PENDIENTE DE COBRO
                  </div>
                  <div style={{ fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 800 }}>
                    {formatMoney(totalPendingFees)}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>
                    {pendingFeesClaims.length} caso{pendingFeesClaims.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {pendingFeesClaims.length === 0 ? (
                <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
                  No hay honorarios pendientes de liquidación.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {pendingFeesClaims.map(({ claim, fees }) => (
                    <div
                      key={claim.id}
                      style={{
                        display: 'grid',
                        gap: 12,
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        alignItems: 'center',
                        padding: '12px 14px',
                        borderRadius: 12,
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Reclamante</div>
                        <div style={{ fontWeight: 700, color: '#0f172a', wordBreak: 'break-word' }}>
                          {claim.client_name ?? '—'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <CompanyLogo name={claim.companies?.name} logoUrl={claim.companies?.logo_url} size={32} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                          {claim.companies?.name ?? '—'}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Monto acordado</div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{formatMoney(claim.amount_agreed)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#764ba2', fontWeight: 700 }}>Honorarios</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#5b21b6' }}>{formatMoney(fees)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Fecha de pago</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                          {claim.payment_date ? formatDate(claim.payment_date) : 'Pendiente'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Facturación</div>
                        <InvoicedStatusBadge isInvoiced={claim.is_invoiced} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Liquidación asistentes */}
            <section style={panelStyle}>
              <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                Liquidación de asistentes
              </h2>
              <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>
                Casos asignados con fecha de creación en los últimos 30 días. Ingresá la tarifa por caso para
                calcular el importe a abonar a cada asistente.
              </p>

              {assistantTotals.rows.length === 0 ? (
                <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
                  No hay casos asignados a asistentes en el último mes.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {assistantTotals.rows.map((row) => {
                    const expanded = expandedAssistantId === row.id;
                    return (
                      <div
                        key={row.id}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: 12,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            display: 'grid',
                            gap: 12,
                            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                            alignItems: 'center',
                            padding: '14px 16px',
                            background: '#f8fafc',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Asistente</div>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{row.name}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Casos (30 días)</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#667eea' }}>{row.claims.length}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>
                              Tarifa por caso
                            </div>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              placeholder="0"
                              value={assistantRates[row.id] ?? ''}
                              onChange={(e) =>
                                setAssistantRates((prev) => ({ ...prev, [row.id]: e.target.value }))
                              }
                              style={inputStyle}
                            />
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>Total a abonar</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#15803d' }}>
                              {formatMoney(row.total)}
                            </div>
                          </div>
                          <div style={{ justifySelf: 'end' }}>
                            <button
                              type="button"
                              onClick={() => setExpandedAssistantId(expanded ? null : row.id)}
                              style={{
                                padding: '8px 12px',
                                borderRadius: 8,
                                border: '1px solid #e2e8f0',
                                background: '#fff',
                                color: '#667eea',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              {expanded ? 'Ocultar casos' : 'Ver casos'}
                            </button>
                          </div>
                        </div>

                        {expanded && (
                          <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {row.claims.map((claim) => (
                                <div
                                  key={claim.id}
                                  style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 12,
                                    justifyContent: 'space-between',
                                    fontSize: 13,
                                    color: '#334155',
                                    padding: '8px 10px',
                                    borderRadius: 8,
                                    background: '#fff',
                                    border: '1px solid #f1f5f9',
                                  }}
                                >
                                  <span style={{ fontWeight: 600 }}>{claim.client_name ?? '—'}</span>
                                  <span>{claim.companies?.name ?? '—'}</span>
                                  <span style={{ color: '#64748b' }}>
                                    Creado:{' '}
                                    {new Date(claim.created_at).toLocaleDateString('es-AR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                    })}
                                  </span>
                                  <span
                                    style={{
                                      padding: '2px 8px',
                                      borderRadius: 999,
                                      background: claim.claim_statuses?.color ?? '#94a3b8',
                                      color: '#fff',
                                      fontSize: 11,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {claim.claim_statuses?.name ?? '—'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 18px',
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                      border: '1px solid #bbf7d0',
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>
                      Total general a abonar a asistentes
                    </span>
                    <span style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 800, color: '#14532d' }}>
                      {formatMoney(assistantTotals.grandTotal)}
                    </span>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
