type ConfirmModalProps = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && !confirmLoading && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          maxWidth: 440,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="confirm-modal-title"
          style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: '0 0 24px',
            fontSize: 14,
            color: '#475569',
            lineHeight: 1.55,
            whiteSpace: 'pre-line',
          }}
        >
          {message}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={confirmLoading}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#fff',
              color: '#475569',
              fontSize: 14,
              fontWeight: 600,
              cursor: confirmLoading ? 'not-allowed' : 'pointer',
              opacity: confirmLoading ? 0.7 : 1,
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmLoading}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: 'none',
              background: confirmLoading ? '#94a3b8' : '#667eea',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: confirmLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {confirmLoading ? 'Guardando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
