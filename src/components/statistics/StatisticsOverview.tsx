import type { ProducerStatistics } from '../../services/producerStatisticsService';
import './statistics.css';
import PieChartPanel from './PieChartPanel';
import RingGauge from './RingGauge';
import StackedRatioBar from './StackedRatioBar';
import MiniRankBars from './MiniRankBars';

type StatisticsOverviewProps = {
  stats: ProducerStatistics;
};

const panelStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 20,
};

const formatDays = (n: number | null | undefined) =>
  n != null ? `${n.toLocaleString('es-AR', { maximumFractionDigits: 1 })} días` : '—';

export default function StatisticsOverview({ stats }: StatisticsOverviewProps) {
  const finalizedPct = stats.total > 0 ? (stats.finalized / stats.total) * 100 : 0;
  const agreementPct = stats.agreementRatePercent ?? 0;
  const recentPct = stats.total > 0 ? (stats.recentLast30Days / stats.total) * 100 : 0;

  const statusItems = stats.byStatus.map((s) => ({
    id: s.id,
    label: s.name,
    value: s.count,
    color: s.color ?? '#667eea',
  }));

  const typeItems = stats.byType.map((t, i) => ({
    id: t.type,
    label: t.label,
    value: t.count,
    color: ['#764ba2', '#667eea', '#16a34a', '#f59e0b'][i % 4],
  }));

  const pipelineItems = [
    { id: 'active', label: 'En trámite', value: stats.active, color: '#16a34a' },
    { id: 'finalized', label: 'Finalizados', value: stats.finalized, color: '#764ba2' },
  ];

  const companyRank = stats.byCompany.map((c) => ({
    id: c.id,
    label: c.name,
    value: c.count,
    color: '#667eea',
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Hero + anillos */}
      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        }}
      >
        <div
          className="stats-panel-hero"
          style={{
            ...panelStyle,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: 160,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.9, marginBottom: 8 }}>
            Tu cartera de reclamos
          </div>
          <div style={{ fontSize: 'clamp(36px, 8vw, 52px)', fontWeight: 800, lineHeight: 1 }}>
            {stats.total}
          </div>
          <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>reclamos cargados</div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              marginTop: 20,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <span className="stats-hero-chip">{stats.active} en trámite</span>
            <span className="stats-hero-chip">{stats.finalized} finalizados</span>
            <span className="stats-hero-chip">{stats.recentLast30Days} últimos 30 días</span>
          </div>
        </div>

        <div className="stats-panel" style={{ ...panelStyle, display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <RingGauge
            value={finalizedPct}
            label="Tasa de cierre"
            sublabel={`${stats.finalized} de ${stats.total}`}
            color="#764ba2"
          />
          <RingGauge
            value={agreementPct}
            label="Con acuerdo"
            sublabel={`${stats.withAgreement} casos`}
            color="#f59e0b"
          />
          <RingGauge
            value={recentPct}
            label="Actividad reciente"
            sublabel="Últimos 30 días"
            color="#0ea5e9"
          />
        </div>
      </div>

      {/* Barra apilada pipeline */}
      <div className="stats-panel" style={panelStyle}>
        <StackedRatioBar title="Distribución del pipeline" segments={pipelineItems} />
      </div>

      {/* Tortas estado + tipos */}
      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}
      >
        <div className="stats-panel" style={panelStyle}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            Estados
          </h3>
          <PieChartPanel items={statusItems} compact />
        </div>
        <div className="stats-panel" style={panelStyle}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            Tipos de reclamo
          </h3>
          <PieChartPanel items={typeItems} compact />
        </div>
      </div>

      {/* Ranking compañías + métricas financieras/tiempo */}
      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}
      >
        <div className="stats-panel" style={panelStyle}>
          <MiniRankBars title="Top compañías a reclamar" items={companyRank} />
        </div>

        <div className="stats-panel" style={{ ...panelStyle, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            Indicadores clave
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            <div
              className="stats-kpi-card"
              style={{
                padding: 14,
                borderRadius: 12,
                background: 'linear-gradient(180deg, #f0fdf4 0%, #fff 100%)',
                border: '1px solid #bbf7d0',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', marginBottom: 4 }}>
                Cierre promedio
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
                {formatDays(stats.avgCloseDaysOverall)}
              </div>
            </div>
            <div
              className="stats-kpi-card"
              style={{
                padding: 14,
                borderRadius: 12,
                background: 'linear-gradient(180deg, #f0f9ff 0%, #fff 100%)',
                border: '1px solid #bae6fd',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: '#0284c7', marginBottom: 4 }}>
                Compañías distintas
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
                {stats.byCompany.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
