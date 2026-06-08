import type { Dispatch, SetStateAction, CSSProperties } from 'react';
import type { AdminProducerRow, UpdateProducerParams } from '../services/adminProducersService';

type AdminProducerEditModalProps = {
  producer: AdminProducerRow;
  editForm: UpdateProducerParams;
  setEditForm: Dispatch<SetStateAction<UpdateProducerParams>>;
  saveLoading: boolean;
  saveError: string | null;
  onClose: () => void;
  onSave: () => void;
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#475569',
  marginBottom: 4,
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  fontSize: 14,
  boxSizing: 'border-box',
};

export default function AdminProducerEditModal({
  producer,
  editForm,
  setEditForm,
  saveLoading,
  saveError,
  onClose,
  onSave,
}: AdminProducerEditModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          maxWidth: 480,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
          Editar productor
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>ID {producer.id}</p>

        {saveError && (
          <div
            style={{
              marginBottom: 16,
              padding: 10,
              borderRadius: 8,
              background: '#fef2f2',
              color: '#dc2626',
              fontSize: 13,
            }}
          >
            {saveError}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Nombre *</label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Email *</label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Teléfono</label>
            <input
              type="tel"
              value={editForm.phone ?? ''}
              onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>CBU (22 dígitos)</label>
            <input
              type="text"
              value={editForm.cbu ?? ''}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, cbu: e.target.value.replace(/\D/g, '').slice(0, 22) }))
              }
              maxLength={22}
              style={inputStyle}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={editForm.is_admin ?? false}
              onChange={(e) => setEditForm((f) => ({ ...f, is_admin: e.target.checked }))}
            />
            <span style={{ fontSize: 14, color: '#334155' }}>Es administrador</span>
          </label>
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#fff',
              color: '#475569',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saveLoading}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: 'none',
              background: saveLoading ? '#94a3b8' : '#667eea',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: saveLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {saveLoading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
