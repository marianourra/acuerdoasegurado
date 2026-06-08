import { Link } from 'react-router-dom';
import { claimTypeLabels } from '../constants/claimTypes';
import { hasClaimUnreadUpdates, type ClaimTypeLetter } from '../services/claimsService';
import CompanyLogo from './CompanyLogo';

type DashboardClaimCardProps = {
  claim: {
    id: string | number;
    client_name?: string | null;
    claim_number?: string | number | null;
    type?: string;
    created_at?: string;
    updated_at?: string;
    producer_viewed_at?: string | null;
    companies?: { name?: string; logo_url?: string } | null;
  };
  showStatus?: boolean;
  statusName?: string;
  statusColor?: string;
};

function UnreadBadge() {
  return (
    <span
      className="claim-unread-badge"
      aria-label="Hay novedades"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: 999,
        background: '#ecfdf5',
        color: '#16a34a',
        flexShrink: 0,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
      </svg>
    </span>
  );
}

function StatusBadge({ name, color }: { name?: string; color?: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '6px 10px',
        borderRadius: 999,
        backgroundColor: color || '#6B7280',
        color: '#fff',
        fontSize: 12,
        fontWeight: 800,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        maxWidth: 160,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
      title={name || 'Sin estado'}
    >
      {name || 'Sin estado'}
    </span>
  );
}

export default function DashboardClaimCard({
  claim,
  showStatus = false,
  statusName,
  statusColor,
}: DashboardClaimCardProps) {
  const hasUnread = hasClaimUnreadUpdates(claim);
  const showMeta = showStatus || hasUnread;

  return (
    <Link
      to={`/claims/${claim.id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      className="dashboard-claim-card-link"
    >
      <div
        className="dashboard-claim-card"
        style={{
          border: hasUnread ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
          padding: 14,
          borderRadius: 14,
          background: hasUnread ? '#f0fdf4' : '#fff',
          boxShadow: hasUnread ? '0 0 0 1px rgba(22, 163, 74, 0.1)' : 'none',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 0 }}>
            {claim.claim_number != null && claim.claim_number !== '' && (
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: '0.03em' }}>
                ID reclamo: <span style={{ color: '#334155' }}>{claim.claim_number}</span>
              </div>
            )}
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
            </div>
          </div>

          {showMeta && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 6,
                flexShrink: 0,
              }}
            >
              {hasUnread && <UnreadBadge />}
              {showStatus && <StatusBadge name={statusName} color={statusColor} />}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
