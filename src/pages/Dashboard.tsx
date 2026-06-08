import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getMyClaims,
  getClaimStatusesOrdered,
  isFinalizedClaim,
  type ClaimStatusStep,
} from '../services/claimsService';
import { Link, useLocation } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import ClaimsStatusCollapse from '../components/ClaimsStatusCollapse';
import {
  GROUP_EN_TRAMITE,
  GROUP_FINALIZADOS,
  CLAIM_GROUP_META,
  DEFAULT_EXPANDED_SECTIONS,
} from '../constants/claimGroups';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [claims, setClaims] = useState<any[]>([]);
  const [allStatuses, setAllStatuses] = useState<ClaimStatusStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(DEFAULT_EXPANDED_SECTIONS);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [q, setQ] = useState<string>('');

  useEffect(() => {
    if (!user) return;

    async function loadClaims() {
      if (!user) return;
      setLoading(true);
      setErrMsg(null);

      const [claimsRes, statusesRes] = await Promise.all([
        getMyClaims(user.id),
        getClaimStatusesOrdered(),
      ]);

      if (claimsRes.error) {
        console.error('❌ getMyClaims error:', claimsRes.error);
        setErrMsg(claimsRes.error.message);
        setClaims([]);
      } else {
        setClaims(claimsRes.data || []);
      }

      if (statusesRes.error) {
        console.error('❌ getClaimStatusesOrdered error:', statusesRes.error);
      } else {
        setAllStatuses(statusesRes.data || []);
      }

      setLoading(false);
    }

    loadClaims();
  }, [user, location.pathname]);

  const companyOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; logo_url?: string }>();
    for (const c of claims) {
      const co = c.companies;
      if (co?.id && !map.has(co.id)) map.set(co.id, co);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [claims]);

  const filteredClaims = useMemo(() => {
    const query = q.trim().toLowerCase();

    return claims.filter((c) => {
      if (statusFilter !== 'all' && c.claim_statuses?.id !== statusFilter) return false;
      if (companyFilter !== 'all' && c.companies?.id !== companyFilter) return false;

      if (query && !(c.client_name ?? '').toLowerCase().includes(query)) return false;

      return true;
    });
  }, [claims, statusFilter, companyFilter, q]);

  const groupedSections = useMemo(() => {
    const enTramite: any[] = [];
    const finalizados: any[] = [];

    for (const claim of filteredClaims) {
      if (isFinalizedClaim(claim)) {
        finalizados.push(claim);
      } else {
        enTramite.push(claim);
      }
    }

    const sections: Array<{ id: string; name: string; color: string; claims: any[] }> = [];

    if (enTramite.length > 0) {
      sections.push({
        id: GROUP_EN_TRAMITE,
        ...CLAIM_GROUP_META[GROUP_EN_TRAMITE],
        claims: enTramite,
      });
    }

    if (finalizados.length > 0) {
      sections.push({
        id: GROUP_FINALIZADOS,
        ...CLAIM_GROUP_META[GROUP_FINALIZADOS],
        claims: finalizados,
      });
    }

    return sections;
  }, [filteredClaims]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  if (authLoading) return <MainLayout><LoadingSpinner text="Cargando sesión..." /></MainLayout>;
  if (!user) return null;
  if (loading) return <MainLayout><LoadingSpinner text="Cargando reclamos..." /></MainLayout>;

  return (
    <MainLayout>
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(24px, 5vw, 28px)', fontWeight: 700, color: '#0f172a' }}>Mis reclamos</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link
              to="/claims/new"
              style={{
                textDecoration: 'none',
                padding: '12px 20px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M10 4V16M4 10H16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Crear reclamo
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre del cliente"
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 10,
              border: '1px solid #ddd',
            }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ddd', fontSize: 14 }}
            >
              <option value="all">Todos los estados</option>
              {allStatuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ddd', fontSize: 14 }}
            >
              <option value="all">Todas las compañías</option>
              {companyOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {errMsg && (
          <div
            style={{
              padding: 14,
              borderRadius: 12,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              fontSize: 14,
            }}
          >
            Error al cargar reclamos: {errMsg}
          </div>
        )}

        {!errMsg && filteredClaims.length === 0 && (
          <div
            style={{
              marginTop: 8,
              padding: 32,
              borderRadius: 16,
              background: '#fff',
              border: '1px dashed #e2e8f0',
              textAlign: 'center',
              color: '#64748b',
              fontSize: 15,
            }}
          >
            {claims.length === 0 ? (
              <>
                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>📋</div>
                <p style={{ margin: 0, fontWeight: 500, color: '#475569' }}>Aún no tenés reclamos</p>
                <p style={{ margin: '8px 0 20px', maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>
                  Creá tu primer reclamo para empezar a gestionarlos desde acá.
                </p>
                <Link
                  to="/claims/new"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 20px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Crear reclamo
                </Link>
              </>
            ) : (
              <>
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>🔍</div>
                <p style={{ margin: 0, fontWeight: 500, color: '#475569' }}>Ningún reclamo coincide con los filtros</p>
                <p style={{ margin: '8px 0 0' }}>Probá cambiando estado, compañía o el nombre del cliente.</p>
              </>
            )}
          </div>
        )}
      </div>

      {groupedSections.length > 0 && (
        <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
          {groupedSections.map((section) => (
            <ClaimsStatusCollapse
              key={section.id}
              statusId={section.id}
              statusName={section.name}
              statusColor={section.color}
              claims={section.claims}
              isExpanded={expandedSections[section.id] !== false}
              onToggle={() => toggleSection(section.id)}
            />
          ))}
        </div>
      )}
    </div>
    </MainLayout>
  );
}
