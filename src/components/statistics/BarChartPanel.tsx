import './statistics.css';

export type BarChartItem = {
  id: string;
  label: string;
  value: number;
  color?: string;
  sublabel?: string;
};

type BarChartPanelProps = {
  items: BarChartItem[];
  valueSuffix?: string;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  emptyMessage?: string;
};

export default function BarChartPanel({
  items,
  valueSuffix = '',
  selectedId = null,
  onSelect,
  emptyMessage = 'Sin datos para mostrar.',
}: BarChartPanelProps) {
  const max = Math.max(...items.map((i) => i.value), 1);

  if (items.length === 0) {
    return <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>{emptyMessage}</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item) => {
        const isSelected = selectedId === item.id;
        const barColor = item.color ?? '#667eea';
        const interactive = Boolean(onSelect);

        const RowTag = interactive ? 'button' : 'div';

        return (
          <RowTag
            key={item.id}
            type={interactive ? 'button' : undefined}
            className="stats-bar-row"
            onClick={interactive ? () => onSelect?.(isSelected ? null : item.id) : undefined}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              border: isSelected ? `2px solid ${barColor}` : '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '10px 12px',
              background: isSelected ? '#f8fafc' : '#fff',
              cursor: interactive ? 'pointer' : 'default',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 8,
                marginBottom: 6,
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
              }}
            >
              <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.label}
              </span>
              <span style={{ flexShrink: 0, color: '#0f172a' }}>
                {item.value}
                {valueSuffix}
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
              <div
                className="stats-bar-fill"
                style={{
                  width: `${Math.max((item.value / max) * 100, item.value > 0 ? 4 : 0)}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: barColor,
                  transition: 'width 0.35s ease, filter 0.2s ease',
                }}
              />
            </div>
            {item.sublabel && (
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{item.sublabel}</div>
            )}
          </RowTag>
        );
      })}
    </div>
  );
}
