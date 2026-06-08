import './statistics.css';

type Segment = {
  label: string;
  value: number;
  color: string;
};

type StackedRatioBarProps = {
  title: string;
  segments: Segment[];
};

export default function StackedRatioBar({ title, segments }: StackedRatioBarProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{title}</div>
      <div
        className="stats-stack-wrap"
        style={{
          display: 'flex',
          height: 28,
          borderRadius: 999,
          overflow: 'hidden',
          background: '#f1f5f9',
        }}
      >
        {segments.map((seg) => {
          const width = total > 0 ? (seg.value / total) * 100 : 0;
          if (width <= 0) return null;
          return (
            <div
              key={seg.label}
              className="stats-stack-segment"
              title={`${seg.label}: ${seg.value}`}
              style={{
                width: `${width}%`,
                background: seg.color,
                transition: 'width 0.5s ease, filter 0.2s ease',
                minWidth: width > 0 ? 4 : 0,
              }}
            />
          );
        })}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 10 }}>
        {segments.map((seg) => (
          <div key={seg.label} className="stats-legend-chip" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: seg.color }} />
            <span style={{ color: '#475569', fontWeight: 600 }}>{seg.label}</span>
            <span style={{ color: '#0f172a', fontWeight: 700 }}>{seg.value}</span>
            {total > 0 && (
              <span style={{ color: '#94a3b8' }}>
                ({((seg.value / total) * 100).toLocaleString('es-AR', { maximumFractionDigits: 0 })}%)
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
