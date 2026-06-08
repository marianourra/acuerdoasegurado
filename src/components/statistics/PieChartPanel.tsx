import { useMemo, useState } from 'react';
import './statistics.css';

export type PieChartItem = {
  id: string;
  label: string;
  value: number;
  color?: string;
  sublabel?: string;
};

type PieChartPanelProps = {
  items: PieChartItem[];
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  emptyMessage?: string;
  /** Vista más chica para el resumen */
  compact?: boolean;
};

const FALLBACK_COLORS = [
  '#667eea',
  '#764ba2',
  '#16a34a',
  '#0ea5e9',
  '#f59e0b',
  '#ec4899',
  '#14b8a6',
  '#8b5cf6',
  '#ef4444',
  '#64748b',
];

const CHART_SIZES = {
  default: { size: 220, rOuter: 96, rInner: 58 },
  compact: { size: 168, rOuter: 72, rInner: 44 },
} as const;

type Slice = PieChartItem & {
  color: string;
  percent: number;
  startAngle: number;
  endAngle: number;
};

function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSlicePath(
  cx: number,
  cy: number,
  rOut: number,
  rIn: number,
  start: number,
  end: number
) {
  const large = end - start > 180 ? 1 : 0;
  const p1 = polar(cx, cy, rOut, end);
  const p2 = polar(cx, cy, rOut, start);
  const p3 = polar(cx, cy, rIn, start);
  const p4 = polar(cx, cy, rIn, end);
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rOut} ${rOut} 0 ${large} 0 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rIn} ${rIn} 0 ${large} 1 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ');
}

export default function PieChartPanel({
  items,
  selectedId = null,
  onSelect,
  emptyMessage = 'Sin datos para mostrar.',
  compact = false,
}: PieChartPanelProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const dims = compact ? CHART_SIZES.compact : CHART_SIZES.default;
  const SIZE = dims.size;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R_OUTER = dims.rOuter;
  const R_INNER = dims.rInner;

  const { slices, total } = useMemo(() => {
    const sum = items.reduce((acc, item) => acc + item.value, 0);
    let cursor = 0;
    const built: Slice[] = items.map((item, index) => {
      const percent = sum > 0 ? (item.value / sum) * 100 : 0;
      const sweep = sum > 0 ? (item.value / sum) * 360 : 0;
      const startAngle = cursor;
      const endAngle = cursor + (sweep >= 360 ? 359.99 : sweep);
      cursor += sweep;
      return {
        ...item,
        color: item.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length],
        percent,
        startAngle,
        endAngle,
      };
    });
    return { slices: built, total: sum };
  }, [items]);

  const activeId = hoveredId ?? selectedId;
  const activeSlice = slices.find((s) => s.id === activeId) ?? null;

  if (items.length === 0 || total === 0) {
    return <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>{emptyMessage}</p>;
  }

  return (
    <div
      style={{
        display: 'grid',
        gap: compact ? 14 : 20,
        gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label="Gráfico de torta"
          style={{ overflow: 'visible' }}
        >
          {slices.map((slice) => {
            const isActive = activeId === slice.id;
            const isDimmed = activeId != null && !isActive;
            const mid = (slice.startAngle + slice.endAngle) / 2;
            const pop = polar(CX, CY, isActive ? 6 : 0, mid);

            return (
              <g
                key={slice.id}
                transform={`translate(${pop.x - CX} ${pop.y - CY})`}
                style={{
                  transition: 'transform 0.25s ease, opacity 0.25s ease',
                  opacity: isDimmed ? 0.45 : 1,
                  cursor: onSelect ? 'pointer' : 'default',
                }}
                onMouseEnter={() => setHoveredId(slice.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelect?.(selectedId === slice.id ? null : slice.id)}
              >
                <path
                  d={donutSlicePath(CX, CY, R_OUTER, R_INNER, slice.startAngle, slice.endAngle)}
                  fill={slice.color}
                  stroke="#fff"
                  strokeWidth={2}
                  style={{
                    transition: 'filter 0.2s ease',
                    filter: isActive ? 'brightness(1.05) drop-shadow(0 2px 6px rgba(0,0,0,0.15))' : 'none',
                  }}
                />
              </g>
            );
          })}
          <circle cx={CX} cy={CY} r={R_INNER - 4} fill="#fff" />
          <text
            x={CX}
            y={CY - (compact ? 4 : 6)}
            textAnchor="middle"
            style={{ fontSize: compact ? 18 : 22, fontWeight: 800, fill: '#0f172a' }}
          >
            {activeSlice ? activeSlice.value : total}
          </text>
          <text
            x={CX}
            y={CY + (compact ? 12 : 14)}
            textAnchor="middle"
            style={{ fontSize: compact ? 10 : 11, fontWeight: 600, fill: '#64748b' }}
          >
            {activeSlice
              ? `${activeSlice.percent.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%`
              : 'Total'}
          </text>
        </svg>
      </div>

      <div
        style={{
          display: compact ? 'grid' : 'flex',
          flexDirection: 'column',
          gridTemplateColumns: compact ? 'repeat(auto-fill, minmax(140px, 1fr))' : undefined,
          gap: 8,
          width: '100%',
        }}
      >
        {slices.map((slice) => {
          const isActive = activeId === slice.id;
          const LegendTag = onSelect ? 'button' : 'div';

          return (
            <LegendTag
              key={slice.id}
              type={onSelect ? 'button' : undefined}
              className="stats-pie-legend"
              onMouseEnter={() => setHoveredId(slice.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={onSelect ? () => onSelect(selectedId === slice.id ? null : slice.id) : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                textAlign: 'left',
                border: isActive ? `2px solid ${slice.color}` : '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '8px 10px',
                background: isActive ? '#f8fafc' : '#fff',
                cursor: onSelect ? 'pointer' : 'default',
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 999,
                  background: slice.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#334155',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {slice.label}
                </span>
                {slice.sublabel && (
                  <span style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                    {slice.sublabel}
                  </span>
                )}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', flexShrink: 0 }}>
                {slice.value}
                <span style={{ fontWeight: 500, color: '#94a3b8', marginLeft: 4 }}>
                  ({slice.percent.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%)
                </span>
              </span>
            </LegendTag>
          );
        })}
      </div>
    </div>
  );
}
