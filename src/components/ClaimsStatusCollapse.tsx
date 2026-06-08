import type { ReactNode } from 'react';
import DashboardClaimCard from './DashboardClaimCard';

type Claim = {
  id: string | number;
  client_name?: string | null;
  claim_number?: string | number | null;
  type?: string;
  created_at?: string;
  updated_at?: string;
  producer_viewed_at?: string | null;
  companies?: { name?: string; logo_url?: string } | null;
  claim_statuses?: { name?: string; color?: string } | null;
};

type ClaimsStatusCollapseProps = {
  statusId: string;
  statusName: string;
  statusColor: string;
  claims?: Claim[];
  claimCount?: number;
  isExpanded: boolean;
  onToggle: () => void;
  children?: ReactNode;
};

export default function ClaimsStatusCollapse({
  statusName,
  statusColor,
  claims = [],
  claimCount,
  isExpanded,
  onToggle,
  children,
}: ClaimsStatusCollapseProps) {
  const count = claimCount ?? claims.length;
  return (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: 14,
        background: '#fff',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          border: 'none',
          background: isExpanded ? '#f8fafc' : '#fff',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f1f5f9';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isExpanded ? '#f8fafc' : '#fff';
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: statusColor,
            flexShrink: 0,
          }}
        />
        <span style={{ flex: 1, fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
          {statusName}
        </span>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: 999,
            background: '#e2e8f0',
            color: '#475569',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {count}
        </span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            flexShrink: 0,
            transition: 'transform 0.2s ease',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            color: '#64748b',
          }}
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isExpanded && (
        <div
          style={{
            padding: '0 12px 12px',
            display: 'grid',
            gap: 10,
            borderTop: '1px solid #f1f5f9',
          }}
          className="dashboard-claims-grid"
        >
          {children ??
            claims.map((claim) => (
              <DashboardClaimCard
                key={claim.id}
                claim={claim}
                showStatus
                statusName={claim.claim_statuses?.name}
                statusColor={claim.claim_statuses?.color}
              />
            ))}
        </div>
      )}
    </div>
  );
}
