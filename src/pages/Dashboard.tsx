import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyClaims } from '../services/claimsService';
import { isCurrentUserAdmin } from '../services/adminService';
import { claimTypeLabels } from '../constants/claimTypes';
import type { ClaimTypeLetter } from '../services/claimsService';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // filtros
  const [statusFilter, setStatusFilter] = useState<string>('all'); // status_id
  const [companyFilter, setCompanyFilter] = useState<string>('all'); // company_id
  const [q, setQ] = useState<string>(''); // búsqueda simple

  useEffect(() => {
    if (!user) return;
  
    async function loadClaims() {
      if (!user) return; // Guard against null user
      setLoading(true);
      setErrMsg(null);
  
      const { data, error } = await getMyClaims(user.id);
  
      if (error) {
        console.error('❌ getMyClaims error:', error);
        setErrMsg(error.message);
        setClaims([]);
      } else {
        setClaims(data || []);
      }
  
      setLoading(false);
    }
  
    loadClaims();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    isCurrentUserAdmin().then(setIsAdmin);
  }, [user]);

  const statusOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color?: string }>();
    for (const c of claims) {
      const s = c.claim_statuses;
      if (s?.id && !map.has(s.id)) map.set(s.id, s);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [claims]);

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

      if (query) {
        const haystack = [
          c.client_name,
          c.claim_number,
          c.description,
          c.companies?.name,
          c.claim_statuses?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [claims, statusFilter, companyFilter, q]);

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
            {isAdmin && (
              <Link
                to="/admin/claims"
                style={{
                  textDecoration: 'none',
                  padding: '10px 16px',
                  borderRadius: 10,
                  background: '#f1f5f9',
                  color: '#475569',
                  fontSize: 14,
                  fontWeight: 600,
                  border: '1px solid #e2e8f0',
                }}
              >
                Admin
              </Link>
            )}
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

        {/* Filtros mobile-first */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por cliente, nro, compañía..."
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
              {statusOptions.map((s) => (
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
                <p style={{ margin: '8px 0 0' }}>Probá cambiando estado, compañía o el texto de búsqueda.</p>
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: 14, display: 'grid', gap: 12 }} className="dashboard-claims-grid">
        {filteredClaims.map((claim) => (
          <Link
            key={claim.id}
            to={`/claims/${claim.id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
            className="dashboard-claim-card-link"
          >
            <div
              className="dashboard-claim-card"
              style={{
                border: '1px solid #e2e8f0',
                padding: 14,
                borderRadius: 14,
                background: '#fff',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 800, fontSize: 'clamp(14px, 4vw, 16px)', wordBreak: 'break-word' }}>
                    Reclamante: {claim.client_name}
                  </div>
                  {claim.type && claimTypeLabels[claim.type as ClaimTypeLetter] && (
                    <div style={{ fontSize: 13, color: '#667eea', fontWeight: 600 }}>
                      {claimTypeLabels[claim.type as ClaimTypeLetter]}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {claim.companies?.logo_url ? (
                      <img
                        src={claim.companies.logo_url}
                        alt={claim.companies.name}
                        style={{ width: 22, height: 22, borderRadius: 6, objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: '#eee',
                        }}
                      />
                    )}
                    <span style={{ fontSize: 13, color: '#444' }}>
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

                <span
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    backgroundColor: claim.claim_statuses?.color || '#6B7280',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 800,
                    height: 'fit-content',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {claim.claim_statuses?.name || 'Sin estado'}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
    </MainLayout>
  );
}
