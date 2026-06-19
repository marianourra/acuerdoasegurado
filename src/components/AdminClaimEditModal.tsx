import type { Dispatch, SetStateAction, CSSProperties, ChangeEvent, ReactNode } from 'react';
import { claimTypeLabels } from '../constants/claimTypes';
import type { ClaimTypeLetter } from '../services/claimsService';
import type { AdminClaimRow, ClaimPatch } from '../services/adminClaimsService';
import { formatAbogadoName } from '../services/abogadosService';
import type { Abogado } from '../services/abogadosService';
import type { Asistente } from '../services/asistentesService';
import { formatDateTime, formatMoney, toDateInputValue } from '../utils/adminClaimFormat';

type AdminClaimEditModalProps = {
  claim: AdminClaimRow;
  editForm: ClaimPatch;
  setEditForm: Dispatch<SetStateAction<ClaimPatch>>;
  companies: { id: string; name: string }[];
  producers: { id: number; name: string | null }[];
  statuses: { id: string; name: string; color: string | null }[];
  asistentes: Asistente[];
  abogados: Abogado[];
  saveLoading: boolean;
  saveError: string | null;
  onClose: () => void;
  onSave: () => void;
  /** Si está definido, el asistente queda fijo (usuario asistente logueado). */
  lockAsistenteId?: string | null;
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

const sectionTitleStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#667eea',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  margin: '4px 0 8px',
  paddingTop: 8,
  borderTop: '1px solid #f1f5f9',
  gridColumn: '1 / -1',
};

const CLAIM_TYPES = Object.entries(claimTypeLabels) as [ClaimTypeLetter, string][];
const FEES_PERCENT_OPTIONS = [10, 15, 20];

function SectionTitle({ children }: { children: ReactNode }) {
  return <div style={sectionTitleStyle}>{children}</div>;
}

function Field({
  label,
  children,
  fullWidth,
}: {
  label: string;
  children: ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div style={fullWidth ? { gridColumn: '1 / -1' } : undefined}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

export default function AdminClaimEditModal({
  claim,
  editForm,
  setEditForm,
  companies,
  producers,
  statuses,
  asistentes,
  abogados,
  saveLoading,
  saveError,
  onClose,
  onSave,
  lockAsistenteId,
}: AdminClaimEditModalProps) {
  const setNum = (key: keyof ClaimPatch) => (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setEditForm((f) => ({ ...f, [key]: v === '' ? null : Number(v) }));
  };

  const setStr = (key: keyof ClaimPatch) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const setSelect = (key: keyof ClaimPatch) => (e: ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setEditForm((f) => ({ ...f, [key]: v === '' ? null : v }));
  };

  const setProducer = (e: ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setEditForm((f) => ({ ...f, producer_id: v === '' ? null : Number(v) }));
  };

  const setDate = (key: 'presentation_date' | 'payment_date' | 'finished_at') => (e: ChangeEvent<HTMLInputElement>) => {
    setEditForm((f) => ({ ...f, [key]: e.target.value || null }));
  };

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
          maxWidth: 720,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
          Editar reclamo
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>
          ID {claim.id}
        </p>

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

        <div
          style={{
            display: 'grid',
            gap: 14,
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          }}
        >
          <SectionTitle>Identificación</SectionTitle>

          <Field label="Fecha de creación (solo lectura)" fullWidth>
            <input type="text" readOnly value={formatDateTime(claim.created_at)} style={{ ...inputStyle, background: '#f8fafc' }} />
          </Field>

          <Field label="Actualizado (solo lectura)" fullWidth>
            <input type="text" readOnly value={formatDateTime(claim.updated_at)} style={{ ...inputStyle, background: '#f8fafc' }} />
          </Field>

          <SectionTitle>Cliente</SectionTitle>

          <Field label="Nombre del cliente">
            <input type="text" value={editForm.client_name ?? ''} onChange={setStr('client_name')} style={inputStyle} />
          </Field>

          <Field label="Teléfono del cliente">
            <input type="text" value={editForm.client_phone ?? ''} onChange={setStr('client_phone')} style={inputStyle} />
          </Field>

          <Field label="Compañía del cliente">
            <select
              value={editForm.client_company_id ?? ''}
              onChange={setSelect('client_company_id')}
              style={inputStyle}
            >
              <option value="">— Sin asignar —</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <SectionTitle>Relaciones</SectionTitle>

          <Field label="Productor">
            <select value={editForm.producer_id ?? ''} onChange={setProducer} style={inputStyle}>
              <option value="">— Sin productor —</option>
              {producers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name ?? `Productor #${p.id}`}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Asistente">
            {lockAsistenteId ? (
              <input
                type="text"
                readOnly
                value={asistentes.find((a) => a.id === lockAsistenteId)?.nombre ?? '—'}
                style={{ ...inputStyle, background: '#f8fafc' }}
              />
            ) : (
              <select value={editForm.asistente_id ?? ''} onChange={setSelect('asistente_id')} style={inputStyle}>
                <option value="">— Sin asignar —</option>
                {asistentes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field label="Abogado">
            <select value={editForm.abogado_id ?? ''} onChange={setSelect('abogado_id')} style={inputStyle}>
              <option value="">— Sin asignar —</option>
              {abogados.map((a) => (
                <option key={a.id} value={a.id}>
                  {formatAbogadoName(a)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Compañía a reclamar">
            <select value={editForm.company_id ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, company_id: e.target.value }))} style={inputStyle}>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <SectionTitle>Estado y tipo</SectionTitle>

          <Field label="Estado">
            <select value={editForm.status_id ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, status_id: e.target.value }))} style={inputStyle}>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Tipo de reclamo">
            <select value={editForm.type ?? ''} onChange={setSelect('type')} style={inputStyle}>
              <option value="">— Sin tipo —</option>
              {CLAIM_TYPES.map(([letter, label]) => (
                <option key={letter} value={letter}>
                  {label} ({letter})
                </option>
              ))}
            </select>
          </Field>

          <SectionTitle>Montos</SectionTitle>

          <Field label="Monto acuerdo">
            <input type="number" min={0} step={0.01} value={editForm.amount_agreed ?? ''} onChange={setNum('amount_agreed')} style={inputStyle} />
          </Field>

          <Field label="% Honorarios">
            <select
              value={editForm.fees_percent ?? ''}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  fees_percent: e.target.value === '' ? null : Number(e.target.value),
                }))
              }
              style={inputStyle}
            >
              <option value="">— Sin asignar —</option>
              {FEES_PERCENT_OPTIONS.map((pct) => (
                <option key={pct} value={pct}>
                  {pct}%
                </option>
              ))}
            </select>
          </Field>

          <Field label="Honorarios (calculado)">
            <input
              type="text"
              readOnly
              value={formatMoney(claim.fees)}
              style={{ ...inputStyle, background: '#f8fafc' }}
            />
          </Field>

          <Field label="Facturación">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#334155', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={editForm.is_invoiced ?? false}
                onChange={(e) => setEditForm((f) => ({ ...f, is_invoiced: e.target.checked }))}
              />
              Facturado
            </label>
          </Field>

          <SectionTitle>Fechas</SectionTitle>

          <Field label="Fecha de presentación">
            <input type="date" value={toDateInputValue(editForm.presentation_date)} onChange={setDate('presentation_date')} style={inputStyle} />
          </Field>

          <Field label="Fecha de pago">
            <input type="date" value={toDateInputValue(editForm.payment_date)} onChange={setDate('payment_date')} style={inputStyle} />
          </Field>

          <Field label="Fecha de finalización">
            <input type="date" value={toDateInputValue(editForm.finished_at)} onChange={setDate('finished_at')} style={inputStyle} />
          </Field>

          <SectionTitle>Observaciones</SectionTitle>

          <Field label="Observaciones (visible al productor)" fullWidth>
            <textarea value={editForm.description ?? ''} onChange={setStr('description')} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </Field>

          <Field label="Resumen del asunto" fullWidth>
            <textarea value={editForm.claim_brief ?? ''} onChange={setStr('claim_brief')} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </Field>

          <Field label="Observaciones internas (solo admin)" fullWidth>
            <textarea value={editForm.internal_observations ?? ''} onChange={setStr('internal_observations')} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </Field>
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
