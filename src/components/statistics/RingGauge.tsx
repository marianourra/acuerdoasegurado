import './statistics.css';

type RingGaugeProps = {
  value: number;
  max?: number;
  label: string;
  sublabel?: string;
  color?: string;
  size?: number;
  displayValue?: string;
};

export default function RingGauge({
  value,
  max = 100,
  label,
  sublabel,
  color = '#667eea',
  size = 120,
  displayValue,
}: RingGaugeProps) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const offset = circumference * (1 - pct);

  return (
    <div className="stats-ring-gauge" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={stroke}
        />
        <circle
          className="stats-ring-stroke"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease, filter 0.25s ease' }}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          style={{ fontSize: size * 0.2, fontWeight: 800, fill: '#0f172a' }}
        >
          {displayValue ?? `${Math.round(pct * 100)}%`}
        </text>
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{label}</div>
        {sublabel && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sublabel}</div>}
      </div>
    </div>
  );
}
