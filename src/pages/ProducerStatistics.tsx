import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import BarChartPanel from '../components/statistics/BarChartPanel';
import PieChartPanel from '../components/statistics/PieChartPanel';
import StatisticsOverview from '../components/statistics/StatisticsOverview';
import CompanyLogo from '../components/CompanyLogo';
import '../components/statistics/statistics.css';
import {
  buildProducerStatistics,
  getCompanyClosingBenchmarks,
  getProducerClaimsForStats,
  type CompanyClosingBenchmark,
  type ProducerStatistics,
} from '../services/producerStatisticsService';

type StatsView = 'overview' | 'status' | 'companies' | 'closing' | 'types';

const VIEW_TABS: Array<{ id: StatsView; label: string }> = [
  { id: 'overview', label: 'Resumen' },
  { id: 'status', label: 'Por estado' },
  { id: 'companies', label: 'Por compañía' },
  { id: 'closing', label: 'Tiempos de cierre' },
  { id: 'types', label: 'Por tipo' },
];

const formatMoney = (n: number) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

const formatDays = (n: number | null | undefined) =>
  n != null ? `${n.toLocaleString('es-AR', { maximumFractionDigits: 1 })} días` : '—';

export default function ProducerStatistics() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [benchmarkError, setBenchmarkError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProducerStatistics | null>(null);
  const [benchmarks, setBenchmarks] = useState<CompanyClosingBenchmark[]>([]);
  const [activeView, setActiveView] = useState<StatsView>('overview');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedStatusId, setSelectedStatusId] = useState<string | null>(null);
  const [closingMode, setClosingMode] = useState<'mine' | 'system'>('mine');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(null);
    setBenchmarkError(null);

    Promise.all([getProducerClaimsForStats(user.id), getCompanyClosingBenchmarks()])
      .then(([claimsRes, benchRes]) => {
        if (claimsRes.error) {
          setError(claimsRes.error.message);
          setStats(null);
        } else {
          setStats(buildProducerStatistics(claimsRes.data ?? []));
        }
        if (benchRes.error) {
          setBenchmarkError(benchRes.error.message);
          setBenchmarks([]);
        } else {
          setBenchmarks(benchRes.data ?? []);
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  const companyDetail = useMemo(() => {
    if (!stats || !selectedCompanyId) return null;
    return stats.byCompany.find((c) => c.id === selectedCompanyId) ?? null;
  }, [stats, selectedCompanyId]);

  const statusDetail = useMemo(() => {
    if (!stats || !selectedStatusId) return null;
    return stats.byStatus.find((s) => s.id === selectedStatusId) ?? null;
  }, [stats, selectedStatusId]);

  const benchmarkDetail = useMemo(() => {
    if (!selectedCompanyId) return null;
    return benchmarks.find((b) => b.company_id === selectedCompanyId) ?? null;
  }, [benchmarks, selectedCompanyId]);

  const statusChartItems = useMemo(
    () =>
      (stats?.byStatus ?? []).map((s) => ({
        id: s.id,
        label: s.name,
        value: s.count,
        color: s.color ?? '#667eea',
      })),
    [stats]
  );

  const companyChartItems = useMemo(
    () =>
      (stats?.byCompany ?? []).map((c) => ({
        id: c.id,
        label: c.name,
        value: c.count,
        color: '#667eea',
        sublabel: `${c.finalized} finalizados`,
      })),
    [stats]
  );

  const typeChartItems = useMemo(
    () =>
      (stats?.byType ?? []).map((t) => ({
        id: t.type,
        label: t.label,
        value: t.count,
        color: '#764ba2',
      })),
    [stats]
  );

  const closingChartItems = useMemo(() => {
    if (closingMode === 'mine') {
      return (stats?.byCompany ?? [])
        .filter((c) => c.avgCloseDays != null)
        .map((c) => ({
          id: c.id,
          label: c.name,
          value: c.avgCloseDays ?? 0,
          color: '#16a34a',
          sublabel: `Basado en ${c.closingSamples} caso${c.closingSamples !== 1 ? 's' : ''} con presentación y cierre`,
        }));
    }
    return benchmarks
      .filter((b) => b.avg_close_days != null)
      .map((b) => ({
        id: b.company_id,
        label: b.company_name,
        value: Number(b.avg_close_days),
        color: '#0ea5e9',
        sublabel: `${b.finalized_claims} de ${b.total_claims} casos en el sistema`,
      }));
  }, [closingMode, stats, benchmarks]);

  if (authLoading || loading) {
    return (
      <MainLayout>
        <LoadingSpinner text="Cargando estadísticas..." />
      </MainLayout>
    );
  }

  if (!user) return null;

  return (
    <MainLayout>
      <div>
        <h1
          style={{
            margin: '0 0 8px',
            fontSize: 'clamp(24px, 5vw, 28px)',
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          Estadísticas
        </h1>
        <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 14 }}>
          Métricas de tus reclamos. Usá las pestañas para explorar distintos cortes de la información.
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

        {benchmarkError && activeView === 'closing' && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 10,
              background: '#fffbeb',
              border: '1px solid #fde68a',
              color: '#92400e',
              fontSize: 13,
            }}
          >
            Estadísticas globales por compañía no disponibles. Ejecutá{' '}
            <code>supabase-producer-statistics-rpc.sql</code> en Supabase para habilitar la vista del sistema.
          </div>
        )}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 20,
          }}
        >
          {VIEW_TABS.map((tab) => {
            const active = activeView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className="stats-tab"
                data-active={active ? 'true' : 'false'}
                onClick={() => {
                  setActiveView(tab.id);
                  setSelectedCompanyId(null);
                  setSelectedStatusId(null);
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: 999,
                  border: active ? 'none' : '1px solid #e2e8f0',
                  background: active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#fff',
                  color: active ? '#fff' : '#475569',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {stats && activeView === 'overview' && <StatisticsOverview stats={stats} />}

        {stats && activeView === 'status' && (
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            <div
              className="stats-panel"
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                padding: 20,
              }}
            >
              <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                Reclamos por estado
              </h2>
              <PieChartPanel
                items={statusChartItems}
                selectedId={selectedStatusId}
                onSelect={setSelectedStatusId}
              />
            </div>
            {statusDetail && (
              <div
                className="stats-detail-card"
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 16,
                  padding: 20,
                  alignSelf: 'start',
                }}
              >
                <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                  Estado seleccionado
                </h3>
                <div
                  className="stats-status-badge"
                  style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: 999,
                    background: statusDetail.color ?? '#64748b',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 12,
                  }}
                >
                  {statusDetail.name}
                </div>
                <div style={{ fontSize: 14, color: '#334155' }}>
                  <strong>{statusDetail.count}</strong> reclamo{statusDetail.count !== 1 ? 's' : ''}
                  {stats.total > 0 && (
                    <span style={{ color: '#64748b' }}>
                      {' '}
                      (
                      {((statusDetail.count / stats.total) * 100).toLocaleString('es-AR', {
                        maximumFractionDigits: 1,
                      })}
                      % del total)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {stats && activeView === 'companies' && (
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            <div
              className="stats-panel"
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                padding: 20,
              }}
            >
              <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                Reclamos por compañía
              </h2>
              <PieChartPanel
                items={companyChartItems}
                selectedId={selectedCompanyId}
                onSelect={setSelectedCompanyId}
              />
            </div>
            {companyDetail && (
              <div
                className="stats-detail-card"
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 16,
                  padding: 20,
                }}
              >
                <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                  Detalle seleccionado
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <CompanyLogo name={companyDetail.name} logoUrl={companyDetail.logoUrl} size={44} />
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{companyDetail.name}</div>
                </div>
                <div style={{ display: 'grid', gap: 10, fontSize: 14, color: '#334155' }}>
                  <div>
                    <strong>Total reclamos:</strong> {companyDetail.count}
                  </div>
                  <div>
                    <strong>Finalizados:</strong> {companyDetail.finalized}
                  </div>
                  <div>
                    <strong>Cierre promedio (tuyos):</strong> {formatDays(companyDetail.avgCloseDays)}
                  </div>
                  <div>
                    <strong>Monto acordado acumulado:</strong> {formatMoney(companyDetail.totalAgreed)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {stats && activeView === 'closing' && (
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            <div
              className="stats-panel"
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                padding: 20,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginBottom: 16,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                  Tiempo de cierre promedio
                </h2>
                <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', borderRadius: 999, padding: 4 }}>
                  <button
                    type="button"
                    className="stats-toggle-btn"
                    onClick={() => {
                      setClosingMode('mine');
                      setSelectedCompanyId(null);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 999,
                      border: 'none',
                      background: closingMode === 'mine' ? '#fff' : 'transparent',
                      color: closingMode === 'mine' ? '#0f172a' : '#64748b',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: closingMode === 'mine' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    Mis casos
                  </button>
                  <button
                    type="button"
                    className="stats-toggle-btn"
                    onClick={() => {
                      setClosingMode('system');
                      setSelectedCompanyId(null);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 999,
                      border: 'none',
                      background: closingMode === 'system' ? '#fff' : 'transparent',
                      color: closingMode === 'system' ? '#0f172a' : '#64748b',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: closingMode === 'system' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    Sistema (todas)
                  </button>
                </div>
              </div>
              <p style={{ margin: '0 0 14px', fontSize: 13, color: '#64748b' }}>
                {closingMode === 'mine'
                  ? 'Promedio de días entre presentación y finalización en tus reclamos por compañía.'
                  : 'Promedio del stock total de reclamos en la base de datos (presentación → finalización), por compañía.'}
              </p>
              <BarChartPanel
                items={closingChartItems}
                valueSuffix=" días"
                selectedId={selectedCompanyId}
                onSelect={setSelectedCompanyId}
                emptyMessage={
                  closingMode === 'mine'
                    ? 'Aún no tenés casos con fecha de presentación y finalización.'
                    : 'Sin datos globales. Verificá la función RPC en Supabase.'
                }
              />
            </div>
            {(companyDetail || benchmarkDetail) && (
              <div
                className="stats-detail-card"
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 16,
                  padding: 20,
                }}
              >
                <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                  Comparativa
                </h3>
                <div style={{ display: 'grid', gap: 12, fontSize: 14, color: '#334155' }}>
                  {companyDetail && (
                    <div className="stats-compare-card" style={{ padding: 12, borderRadius: 10, background: '#f0fdf4' }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>Tus casos — {companyDetail.name}</div>
                      <div>Promedio: {formatDays(companyDetail.avgCloseDays)}</div>
                      <div>
                        Base: {companyDetail.finalized} finalizado{companyDetail.finalized !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                  {benchmarkDetail && (
                    <div className="stats-compare-card" style={{ padding: 12, borderRadius: 10, background: '#f0f9ff' }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>
                        Sistema — {benchmarkDetail.company_name}
                      </div>
                      <div>Promedio: {formatDays(benchmarkDetail.avg_close_days)}</div>
                      <div>
                        Stock: {benchmarkDetail.finalized_claims} finalizados de {benchmarkDetail.total_claims}{' '}
                        reclamos
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {stats && activeView === 'types' && (
          <div
            className="stats-panel"
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 16,
              padding: 20,
            }}
          >
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
              Reclamos por tipo
            </h2>
            <BarChartPanel items={typeChartItems} />
          </div>
        )}
      </div>
    </MainLayout>
  );
}
