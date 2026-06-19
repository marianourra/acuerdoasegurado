import { useState } from 'react';
import { claimTypeLabels } from '../constants/claimTypes';
import { isAcordadoClaim, isAcordadoImpago, type ClaimTypeLetter } from '../services/claimsService';
import type { AdminClaimRow } from '../services/adminClaimsService';
import { formatDate, formatMoney, getAdminClaimFieldSections, getClaimFeesAmount } from '../utils/adminClaimFormat';
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

function HighlightDivider({ color }: { color: string }) {
  return (
    <div
      style={{
        width: 1,
        alignSelf: 'stretch',
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

function HighlightMetric({
  label,
  value,
  labelColor,
  valueColor = '#0f172a',
  valueSize = 'clamp(17px, 4vw, 20px)',
}: {
  label: string;
  value: string;
  labelColor: string;
  valueColor?: string;
  valueSize?: string;
}) {
  return (
    <div style={{ flex: '1 1 120px', minWidth: 0 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: labelColor,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: valueSize,
          fontWeight: 800,
          color: valueColor,
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ImpagoAlert() {
  return (
    <span
      className="admin-impago-alert"
      aria-label="Convenio impago"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        borderRadius: 999,
        background: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#dc2626',
        fontSize: 12,
        fontWeight: 700,
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      Convenio impago
    </span>
  );
}

function FacturadoBadge() {
  return (
    <span
      className="admin-facturado-badge"
      aria-label="Facturado"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        borderRadius: 999,
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        color: '#1d4ed8',
        fontSize: 12,
        fontWeight: 700,
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
      Facturado
    </span>
  );
}

export default function AdminClaimCard({ claim, onEdit, onDelete }: AdminClaimCardProps) {
  const [expanded, setExpanded] = useState(false);
  const sections = getAdminClaimFieldSections(claim);
  const hasAgreedAmount = claim.amount_agreed != null && claim.amount_agreed > 0;
  const hasPaymentDate = Boolean(claim.payment_date);
  const isAcordadoPendiente = isAcordadoClaim(claim);
  const isImpago = isAcordadoImpago(claim);
  const feesAmount = getClaimFeesAmount(claim);
  const dividerColor = isImpago ? '#fecaca' : hasPaymentDate ? '#bbf7d0' : '#fde68a';

  return (
    <div
      className="dashboard-claim-card"
      style={{
        border: isImpago ? '1px solid #fecaca' : '1px solid #e2e8f0',
        padding: 14,
        borderRadius: 14,
        background: isImpago ? '#fffbfb' : '#fff',
        boxShadow: isImpago ? '0 0 0 1px rgba(220, 38, 38, 0.08)' : 'none',
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

          {hasAgreedAmount && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                alignItems: 'stretch',
                marginTop: 8,
                padding: '10px 12px',
                borderRadius: 10,
                background: isImpago
                  ? 'linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)'
                  : hasPaymentDate
                    ? 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)'
                    : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                border: isImpago ? '1px solid #fecaca' : hasPaymentDate ? '1px solid #bbf7d0' : '1px solid #fde68a',
              }}
            >
              <HighlightMetric
                label="Monto acordado"
                value={formatMoney(claim.amount_agreed)}
                labelColor="#16a34a"
              />

              {isAcordadoPendiente && (
                <>
                  <HighlightDivider color={dividerColor} />
                  <HighlightMetric
                    label={
                      claim.fees_percent != null
                        ? `Honorarios (${claim.fees_percent}%)`
                        : 'Honorarios'
                    }
                    value={formatMoney(feesAmount)}
                    labelColor="#764ba2"
                  />
                </>
              )}

              <HighlightDivider color={dividerColor} />

              <HighlightMetric
                label="Fecha de pago"
                value={hasPaymentDate ? formatDate(claim.payment_date) : 'Pendiente'}
                labelColor={isImpago ? '#dc2626' : hasPaymentDate ? '#0284c7' : '#d97706'}
                valueColor={isImpago ? '#991b1b' : hasPaymentDate ? '#0f172a' : '#92400e'}
                valueSize="clamp(15px, 3.5vw, 17px)"
              />
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: '#777', marginTop: 4 }}>
            {claim.created_at && (
              <span>
                <strong>Fecha de creación:</strong>{' '}
                {new Date(claim.created_at).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </span>
            )}
            {claim.presentation_date && (
              <span>
                <strong>Fecha de presentación:</strong> {formatDate(claim.presentation_date)}
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
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {claim.is_invoiced && <FacturadoBadge />}
          {isImpago && <ImpagoAlert />}
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
