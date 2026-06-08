type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
};

export default function StatCard({ label, value, hint, accent = '#667eea' }: StatCardProps) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 14,
        padding: '16px 18px',
        borderTop: `3px solid ${accent}`,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
        {value}
      </div>
      {hint && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>{hint}</div>}
    </div>
  );
}
