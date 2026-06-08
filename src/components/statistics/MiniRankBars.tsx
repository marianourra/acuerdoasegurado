import './statistics.css';

export type RankItem = {
  id: string;
  label: string;
  value: number;
  color?: string;
  logoUrl?: string | null;
};

type MiniRankBarsProps = {
  title: string;
  items: RankItem[];
  maxItems?: number;
};

export default function MiniRankBars({ title, items, maxItems = 5 }: MiniRankBarsProps) {
  const rows = items.slice(0, maxItems);
  const max = Math.max(...rows.map((r) => r.value), 1);

  if (rows.length === 0) {
    return (
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{title}</div>
        <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Sin datos.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map((row, index) => {
          const color = row.color ?? '#667eea';
          return (
            <div key={row.id} className="stats-rank-row">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#475569',
                }}
              >
                <span>
                  <span style={{ color: '#94a3b8', marginRight: 6 }}>#{index + 1}</span>
                  {row.label}
                </span>
                <span style={{ color: '#0f172a' }}>{row.value}</span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
                <div
                  className="stats-rank-bar-fill"
                  style={{
                    width: `${(row.value / max) * 100}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                    transition: 'width 0.45s ease, filter 0.2s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
