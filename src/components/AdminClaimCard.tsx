import { useState } from 'react';
import { claimTypeLabels } from '../constants/claimTypes';
import type { ClaimTypeLetter } from '../services/claimsService';
import type { AdminClaimRow } from '../services/adminClaimsService';
import { formatDate, getAdminClaimFieldSections } from '../utils/adminClaimFormat';
import CompanyLogo from './CompanyLogo';

type AdminClaimCardProps = {
  claim: AdminClaimRow;
  onEdit: (claim: AdminClaimRow) => void;
  onDelete: (id: number, clientName: string) => void;
};

const actionBtnStyle = {
  padding: '6px 12px',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
} as const;

export default function AdminClaimCard({ claim, onEdit, onDelete }: AdminClaimCardProps) {
  const [expanded, setExpanded] = useState(false);
  const sections = getAdminClaimFieldSections(claim);

  return (
    <div
      className="dashboard-claim-card"
      style={{
        border: '1px solid #e2e8f0',
        padding: 14,
        borderRadius: 14,
        background: '#fff',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 800, fontSize: 'clamp(14px, 4vw, 16px)', wordBreak: 'break-word' }}>
            Reclamante: {claim.client_name ?? '—'}
          </div>

          {claim.type && claimTypeLabels[claim.type as ClaimTypeLetter] && (
            <div style={{ fontSize: 13, color: '#667eea', fontWeight: 600 }}>
              {claimTypeLabels[claim.type as ClaimTypeLetter]}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CompanyLogo name={claim.companies?.name} logoUrl={claim.companies?.logo_url} />
            <span style={{ fontSize: 14, color: '#334155', fontWeight: 500 }}>
              {claim.companies?.name || 'Compañía'}
            </span>
          </div>

          {claim.producers?.name && (
            <div style={{ fontSize: 12, color: '#64748b' }}>
              <strong>Productor:</strong> {claim.producers.name}
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: '#777', marginTop: 4 }}>
            {claim.created_at && (
              <span>
                <strong>Fecha de inicio:</strong>{' '}
                {new Date(claim.created_at).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </span>
            )}
            {claim.updated_at && (
              <span>
                <strong>Última actualización:</strong>{' '}
                {new Date(claim.updated_at).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </span>
            )}
            {claim.payment_date && (
              <span>
                <strong>Fecha de pago:</strong> {formatDate(claim.payment_date)}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexShrink: 0 }}>
          <span
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              backgroundColor: claim.claim_statuses?.color ?? '#6B7280',
              color: '#fff',
              fontSize: 12,
              fontWeight: 800,
              height: 'fit-content',
              whiteSpace: 'nowrap',
            }}
          >
            {claim.claim_statuses?.name ?? 'Sin estado'}
          </span>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Ocultar detalle' : 'Ver detalle'}
            title={expanded ? 'Ocultar detalle' : 'Ver detalle'}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: expanded ? '#667eea' : '#fff',
              color: expanded ? '#fff' : '#667eea',
              fontSize: 20,
              fontWeight: 600,
              lineHeight: 1,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
          >
            {expanded ? '−' : '+'}
          </button>
        </div>
      </div>

      {expanded && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: '1px solid #f1f5f9',
          }}
        >
          {sections.map((section) => (
            <div key={section.title} style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#667eea',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: 6,
                }}
              >
                {section.title}
              </div>
              <div
                style={{
                  display: 'grid',
                  gap: 8,
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                }}
              >
                {section.fields.map((field) => (
                  <div
                    key={field.label}
                    style={
                      field.label.includes('Observaciones') ||
                      field.label.includes('Resumen') ||
                      field.label === 'Observaciones internas'
                        ? { gridColumn: '1 / -1' }
                        : undefined
                    }
                  >
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>
                      {field.label}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: '#334155',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {field.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => onEdit(claim)}
          style={{
            ...actionBtnStyle,
            border: '1px solid #667eea',
            background: '#fff',
            color: '#667eea',
          }}
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onDelete(claim.id, claim.client_name ?? '')}
          style={{
            ...actionBtnStyle,
            border: '1px solid #dc2626',
            background: '#fff',
            color: '#dc2626',
          }}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
