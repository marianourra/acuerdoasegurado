import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import CompanyLogo from '../components/CompanyLogo';
import { ensureAdminAccess } from '../utils/adminAccess';
import { getAdminFeesClaims } from '../services/adminFeesService';
import type { AdminClaimRow } from '../services/adminClaimsService';
import { updateClaimById } from '../services/adminClaimsService';
import { isAcordadoClaim, isAcordadoImpago, isAcordadoOrLiquidadoClaim } from '../services/claimsService';
import { getClaimFeesAmount, formatMoney, formatDate } from '../utils/adminClaimFormat';
import { computeMonthlyFeesStats, getFeesRecognitionDate } from '../utils/adminFeesStats';

const DEFAULT_ASSISTANT_RATE = 20000;

function ratioOrNull(cost: number, base: number): number | null {
  return base > 0 ? (cost / base) * 100 : null;
}

function formatRatio(ratio: number | null): string {
  return ratio != null ? `${ratio.toFixed(1)}%` : '—';
}
import { getAsistentes, type Asistente } from '../services/asistentesService';
import { getAsistenteRates, upsertAsistenteRate, rateKey } from '../services/asistenteRatesService';

/** Clave de mes 'YYYY-MM' según la fecha de presentación (usa la porción de fecha almacenada). */
function getPresentationMonthKey(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const match = /^(\d{4})-(\d{2})/.exec(dateStr);
  if (match) return `${match[1]}-${match[2]}`;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function dateToMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function currentMonthKey(): string {
  return dateToMonthKey(new Date());
}

function monthKeyToLabel(key: string): string {
  const [year, month] = key.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  const label = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function InvoicedStatusBadge({
  isInvoiced,
  onToggle,
  disabled,
}: {
  isInvoiced: boolean;
  onToggle?: () => void;
  disabled?: boolean;
}) {
  const clickable = Boolean(onToggle);
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    cursor: clickable ? (disabled ? 'wait' : 'pointer') : 'default',
    opacity: disabled ? 0.6 : 1,
  };

  const commonProps = clickable
    ? {
        type: 'button' as const,
        onClick: onToggle,
        disabled,
        title: isInvoiced ? 'Marcar como sin facturar' : 'Marcar como facturado',
      }
    : {};

  const Tag: React.ElementType = clickable ? 'button' : 'span';

  if (isInvoiced) {
    return (
      <Tag
        aria-label="Facturado"
        aria-pressed={clickable ? true : undefined}
        {...commonProps}
        style={{ ...baseStyle, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' }}
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        Facturado
      </Tag>
    );
  }

  return (
    <Tag
      aria-label="Sin facturar"
      aria-pressed={clickable ? false : undefined}
      {...commonProps}
      style={{ ...baseStyle, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}
    >
      Sin facturar
    </Tag>
  );
}

function ImpagoBadge() {
  return (
    <span
      aria-label="Convenio impago"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        borderRadius: 999,
        background: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#dc2626',
        fontSize: 12,
        fontWeight: 700,
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      Convenio impago
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
  const [savedRates, setSavedRates] = useState<Record<string, number>>({});
  const [rateEdits, setRateEdits] = useState<Record<string, string>>({});
  const [expandedAssistantId, setExpandedAssistantId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey());

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
    Promise.all([getAdminFeesClaims(), getAsistentes(), getAsistenteRates()])
      .then(([claimsRes, asistentesRes, ratesRes]) => {
        if (claimsRes.error) {
          setError(claimsRes.error.message);
          setClaims([]);
        } else {
          setClaims(claimsRes.data ?? []);
        }
        if (asistentesRes.data) setAsistentes(asistentesRes.data);
        if (ratesRes.data) {
          const map: Record<string, number> = {};
          for (const r of ratesRes.data) map[rateKey(r.month, r.asistente_id)] = r.rate;
          setSavedRates(map);
        }
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
      .sort((a, b) => {
        const dateA = a.claim.payment_date;
        const dateB = b.claim.payment_date;
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      });
  }, [claims]);

  const totalPendingFees = useMemo(
    () => pendingFeesClaims.reduce((sum, row) => sum + (row.fees ?? 0), 0),
    [pendingFeesClaims]
  );

  const impagoCount = useMemo(
    () => pendingFeesClaims.filter((row) => isAcordadoImpago(row.claim)).length,
    [pendingFeesClaims]
  );

  const [invoicingId, setInvoicingId] = useState<number | null>(null);

  const toggleInvoiced = async (claim: AdminClaimRow) => {
    if (invoicingId != null) return;
    const next = !claim.is_invoiced;
    setInvoicingId(claim.id);
    setClaims((prev) => prev.map((c) => (c.id === claim.id ? { ...c, is_invoiced: next } : c)));
    const { error: err } = await updateClaimById(claim.id, { is_invoiced: next });
    setInvoicingId(null);
    if (err) {
      setClaims((prev) => prev.map((c) => (c.id === claim.id ? { ...c, is_invoiced: !next } : c)));
      setError(`No se pudo actualizar la facturación: ${err.message}`);
    }
  };

  const monthlyFeesStats = useMemo(() => computeMonthlyFeesStats(claims), [claims]);

  const availableMonths = useMemo(() => {
    const keys = new Set<string>();
    for (const c of claims) {
      if (!c.asistente_id) continue;
      const key = getPresentationMonthKey(c.presentation_date);
      if (key) keys.add(key);
    }
    return [...keys].sort((a, b) => b.localeCompare(a));
  }, [claims]);

  useEffect(() => {
    setSelectedMonth((prev) => {
      if (availableMonths.includes(prev)) return prev;
      return availableMonths[0] ?? currentMonthKey();
    });
  }, [availableMonths]);

  const assistantBilling = useMemo(() => {
    const presentedInMonth = claims.filter(
      (c) => c.asistente_id && getPresentationMonthKey(c.presentation_date) === selectedMonth
    );

    const byAssistant = new Map<
      string,
      { id: string; name: string; claims: AdminClaimRow[] }
    >();

    for (const asistente of asistentes) {
      byAssistant.set(asistente.id, { id: asistente.id, name: asistente.nombre, claims: [] });
    }

    for (const claim of presentedInMonth) {
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
  }, [claims, asistentes, selectedMonth]);

  const effectiveRate = useCallback(
    (month: string, asistenteId: string): number => {
      const key = rateKey(month, asistenteId);
      const raw =
        rateEdits[key] ??
        (savedRates[key] != null ? String(savedRates[key]) : String(DEFAULT_ASSISTANT_RATE));
      const n = Number(raw);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    },
    [rateEdits, savedRates]
  );

  const getRateInputValue = useCallback(
    (month: string, asistenteId: string): string => {
      const key = rateKey(month, asistenteId);
      if (rateEdits[key] != null) return rateEdits[key];
      if (savedRates[key] != null) return String(savedRates[key]);
      return String(DEFAULT_ASSISTANT_RATE);
    },
    [rateEdits, savedRates]
  );

  const persistRate = useCallback(
    (asistenteId: string) => {
      const key = rateKey(selectedMonth, asistenteId);
      const raw = rateEdits[key];
      if (raw == null) return;
      const n = Number(raw);
      const rate = Number.isFinite(n) && n >= 0 ? n : 0;
      if (savedRates[key] === rate) return;
      setSavedRates((prev) => ({ ...prev, [key]: rate }));
      upsertAsistenteRate(asistenteId, selectedMonth, rate).then(({ error }) => {
        if (error) setError(`No se pudo guardar la tarifa: ${error.message}`);
      });
    },
    [selectedMonth, rateEdits, savedRates]
  );

  const assistantTotals = useMemo(() => {
    let grandTotal = 0;
    const rows = assistantBilling.map((row) => {
      const rate = effectiveRate(selectedMonth, row.id);
      const total = row.claims.length * rate;
      grandTotal += total;
      return { ...row, rate, total };
    });
    return { rows, grandTotal };
  }, [assistantBilling, effectiveRate, selectedMonth]);

  // Honorarios generados en el mes: universo total y solo casos con asistente asignado.
  const monthlyFees = useMemo(() => {
    let total = 0;
    let assigned = 0;
    for (const c of claims) {
      if (!isAcordadoOrLiquidadoClaim(c)) continue;
      const d = getFeesRecognitionDate(c);
      if (d == null || dateToMonthKey(d) !== selectedMonth) continue;
      const fees = getClaimFeesAmount(c) ?? 0;
      total += fees;
      if (c.asistente_id) assigned += fees;
    }
    return { total, assigned };
  }, [claims, selectedMonth]);

  const monthlyRatioAssigned = ratioOrNull(assistantTotals.grandTotal, monthlyFees.assigned);
  const monthlyRatioTotal = ratioOrNull(assistantTotals.grandTotal, monthlyFees.total);

  // Honorarios generados histórico (todos los meses): total y solo asignados.
  const historicFees = useMemo(() => {
    let total = 0;
    let assigned = 0;
    for (const c of claims) {
      if (!isAcordadoOrLiquidadoClaim(c)) continue;
      const fees = getClaimFeesAmount(c) ?? 0;
      total += fees;
      if (c.asistente_id) assigned += fees;
    }
    return { total, assigned };
  }, [claims]);

  const historicAssistantCost = useMemo(() => {
    const counts = new Map<string, { month: string; asistenteId: string; count: number }>();
    for (const c of claims) {
      if (!c.asistente_id) continue;
      const month = getPresentationMonthKey(c.presentation_date);
      if (!month) continue;
      const key = rateKey(month, c.asistente_id);
      const entry = counts.get(key) ?? { month, asistenteId: c.asistente_id, count: 0 };
      entry.count += 1;
      counts.set(key, entry);
    }
    let total = 0;
    for (const { month, asistenteId, count } of counts.values()) {
      total += count * effectiveRate(month, asistenteId);
    }
    return total;
  }, [claims, effectiveRate]);

  const historicRatioAssigned = ratioOrNull(historicAssistantCost, historicFees.assigned);
  const historicRatioTotal = ratioOrNull(historicAssistantCost, historicFees.total);

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
            {/* Promedio mensual de honorarios */}
            <section style={panelStyle}>
              <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                Promedio mensual de honorarios
              </h2>
              <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>
                Promedio siempre mensual: se toma el stock total de casos en estado Acordado o Liquidado con
                honorarios calculados de cada ventana (según fecha de finalización, pago o última actualización)
                y se divide por la cantidad de meses del período.
              </p>

              <div
                style={{
                  display: 'grid',
                  gap: 14,
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                }}
              >
                {monthlyFeesStats.map((stat) => (
                  <div
                    key={stat.days}
                    style={{
                      padding: '16px 18px',
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      background: 'linear-gradient(135deg, #f8fafc 0%, #fff 100%)',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>
                      {stat.label}
                    </div>
                    <div style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 800, color: '#5b21b6' }}>
                      {formatMoney(stat.monthlyAverage)}
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>/mes</span>
                    </div>
                    <div style={{ marginTop: 10, fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                      <div>
                        Total en el período:{' '}
                        <strong style={{ color: '#334155' }}>{formatMoney(stat.totalFees)}</strong>
                      </div>
                      <div>
                        {stat.caseCount} caso{stat.caseCount !== 1 ? 's' : ''} · promedio sobre {stat.months}{' '}
                        {stat.months === 1 ? 'mes' : 'meses'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

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

              {impagoCount > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 16,
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden style={{ flexShrink: 0 }}>
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {impagoCount} convenio{impagoCount !== 1 ? 's' : ''} impago{impagoCount !== 1 ? 's' : ''}: fecha
                  de pago vencida y aún en estado Acordado.
                </div>
              )}

              {pendingFeesClaims.length === 0 ? (
                <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
                  No hay honorarios pendientes de liquidación.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {pendingFeesClaims.map(({ claim, fees }) => {
                    const impago = isAcordadoImpago(claim);
                    return (
                    <div
                      key={claim.id}
                      style={{
                        display: 'grid',
                        gap: 12,
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        alignItems: 'center',
                        padding: '12px 14px',
                        borderRadius: 12,
                        border: impago ? '1px solid #fecaca' : '1px solid #e2e8f0',
                        background: impago ? '#fffbfb' : '#f8fafc',
                        boxShadow: impago ? '0 0 0 1px rgba(220, 38, 38, 0.08)' : 'none',
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
                        <div style={{ fontSize: 13, fontWeight: 700, color: impago ? '#dc2626' : '#334155' }}>
                          {claim.payment_date ? formatDate(claim.payment_date) : 'Pendiente'}
                          {impago && (
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626' }}> · vencida</span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Facturación</div>
                        <InvoicedStatusBadge
                          isInvoiced={claim.is_invoiced}
                          onToggle={() => toggleInvoiced(claim)}
                          disabled={invoicingId === claim.id}
                        />
                        {impago && <ImpagoBadge />}
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Liquidación asistentes */}
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
                    Liquidación de asistentes
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                    Casos presentados en el mes seleccionado (según fecha de presentación). La cantidad se cuenta
                    automáticamente; ingresá la tarifa por caso para calcular el importe a abonar a cada asistente.
                  </p>
                </div>
                <div style={{ minWidth: 200 }}>
                  <label
                    htmlFor="assistant-month"
                    style={{ display: 'block', fontSize: 11, color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}
                  >
                    MES
                  </label>
                  <select
                    id="assistant-month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {!availableMonths.includes(selectedMonth) && (
                      <option value={selectedMonth}>{monthKeyToLabel(selectedMonth)}</option>
                    )}
                    {availableMonths.map((key) => (
                      <option key={key} value={key}>
                        {monthKeyToLabel(key)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: 14,
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    padding: '16px 18px',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    background: 'linear-gradient(135deg, #f5f3ff 0%, #fff 100%)',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>
                    Honorarios generados en el mes
                  </div>
                  <div style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 800, color: '#5b21b6' }}>
                    {formatMoney(monthlyFees.total)}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8' }}>
                    Con asistente asignado: {formatMoney(monthlyFees.assigned)}
                  </div>
                </div>
                <div
                  style={{
                    padding: '16px 18px',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #fff 100%)',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>
                    Pagado a asistentes (total)
                  </div>
                  <div style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 800, color: '#15803d' }}>
                    {formatMoney(assistantTotals.grandTotal)}
                  </div>
                </div>
                <div
                  style={{
                    padding: '16px 18px',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    background: 'linear-gradient(135deg, #eff6ff 0%, #fff 100%)',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>
                    Costo asistentes / honorarios (mes)
                  </div>
                  <div style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 800, color: '#1d4ed8' }}>
                    {formatRatio(monthlyRatioAssigned)}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8' }}>
                    Solo casos con asistente asignado
                  </div>
                  <div style={{ marginTop: 2, fontSize: 11, color: '#94a3b8' }}>
                    Sobre facturación total: <strong style={{ color: '#64748b' }}>{formatRatio(monthlyRatioTotal)}</strong>
                  </div>
                </div>
                <div
                  style={{
                    padding: '16px 18px',
                    borderRadius: 12,
                    border: '1px solid #c7d2fe',
                    background: 'linear-gradient(135deg, #eef2ff 0%, #fff 100%)',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>
                    Costo asistentes / honorarios (histórico)
                  </div>
                  <div style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 800, color: '#4338ca' }}>
                    {formatRatio(historicRatioAssigned)}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8' }}>
                    Solo asignados: {formatMoney(historicAssistantCost)} sobre {formatMoney(historicFees.assigned)}
                  </div>
                  <div style={{ marginTop: 2, fontSize: 11, color: '#94a3b8' }}>
                    Sobre facturación total: <strong style={{ color: '#64748b' }}>{formatRatio(historicRatioTotal)}</strong>
                  </div>
                </div>
              </div>

              {assistantTotals.rows.length === 0 ? (
                <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
                  No hay casos presentados por asistentes en {monthKeyToLabel(selectedMonth)}.
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
                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Casos presentados</div>
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
                              value={getRateInputValue(selectedMonth, row.id)}
                              onChange={(e) =>
                                setRateEdits((prev) => ({
                                  ...prev,
                                  [rateKey(selectedMonth, row.id)]: e.target.value,
                                }))
                              }
                              onBlur={() => persistRate(row.id)}
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
                                    Presentado:{' '}
                                    {claim.presentation_date ? formatDate(claim.presentation_date) : '—'}
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
