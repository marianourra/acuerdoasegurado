type ClearFiltersButtonProps = {
  onClick: () => void;
  disabled?: boolean;
};

export default function ClearFiltersButton({ onClick, disabled = false }: ClearFiltersButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Limpiar filtros"
      title="Limpiar filtros"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 14px',
        borderRadius: 10,
        border: '1px solid #e2e8f0',
        background: disabled ? '#f8fafc' : '#fff',
        color: disabled ? '#94a3b8' : '#475569',
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'border-color 0.15s ease, color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.borderColor = '#cbd5e1';
        e.currentTarget.style.color = '#0f172a';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.06)';
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.borderColor = '#e2e8f0';
        e.currentTarget.style.color = '#475569';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path
          d="M3 5h14l-5.2 6.24v4.36L8 18v-6.4L3 5z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M13.5 13.5l3 3M16.5 13.5l-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      Limpiar filtros
    </button>
  );
}
