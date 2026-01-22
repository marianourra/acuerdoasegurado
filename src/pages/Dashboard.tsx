import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyClaims } from '../services/claimsService';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // filtros
  const [statusFilter, setStatusFilter] = useState<string>('all'); // status_id
  const [companyFilter, setCompanyFilter] = useState<string>('all'); // company_id
  const [q, setQ] = useState<string>(''); // búsqueda simple

  useEffect(() => {
    if (!user) return;
  
    async function loadClaims() {
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

  if (authLoading) return <MainLayout><p style={{ padding: 16 }}>Cargando sesión...</p></MainLayout>;
  if (!user) return null;
  if (loading) return <MainLayout><p style={{ padding: 16 }}>Cargando reclamos...</p></MainLayout>;

  return (
    <MainLayout>
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#0f172a' }}>Mis reclamos</h1>
          <Link
            to="/claims/new"
            style={{
              textDecoration: 'none',
              padding: '12px 24px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontSize: 15,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.2s ease',
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
            Enviar nuevo reclamo
          </Link>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ddd' }}
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
              style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ddd' }}
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

        {errMsg && <p style={{ color: 'red' }}>Error cargando reclamos: {errMsg}</p>}

        {!errMsg && filteredClaims.length === 0 && <p>No hay reclamos con esos filtros.</p>}
      </div>

      <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
        {filteredClaims.map((claim) => (
          <Link
            key={claim.id}
            to={`/claims/${claim.id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div
              style={{
                border: '1px solid #ddd',
                padding: 14,
                borderRadius: 14,
                background: '#fff',
              }}
            >
              {/* Header card */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>
                    Reclamo #{claim.claim_number} — {claim.client_name}
                  </div>

                  {/* Compañía */}
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
                </div>

                {/* Badge estado */}
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

              {/* Body */}
              <div style={{ marginTop: 10, fontSize: 14, color: '#333' }}>
                {claim.description}
              </div>

              <div style={{ marginTop: 10, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 13, color: '#444' }}>
                  <strong>Monto reclamado:</strong> ${Number(claim.amount_claimed || 0).toLocaleString()}
                </div>

                {claim.amount_agreed != null && (
                  <div style={{ fontSize: 13, color: '#444' }}>
                    <strong>Acuerdo:</strong> ${Number(claim.amount_agreed).toLocaleString()}
                  </div>
                )}

                {claim.producer_profit != null && (
                  <div style={{ fontSize: 13, color: '#444' }}>
                    <strong>Profit:</strong> ${Number(claim.producer_profit).toLocaleString()}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 10, fontSize: 12, color: '#777' }}>
                Actualizado: {new Date(claim.updated_at || claim.created_at).toLocaleDateString()}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
    </MainLayout>
  );
}
