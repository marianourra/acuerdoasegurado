import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { isCurrentUserAdmin } from '../services/adminService';
import { getCompanies, createCompany } from '../services/companiesService';
import AdminNav from '../components/AdminNav';

export default function AdminCompanies() {
  const navigate = useNavigate();
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const admin = await isCurrentUserAdmin();
      if (cancelled) return;
      setAdminChecked(true);
      if (!admin) {
        navigate('/dashboard', { replace: true });
        return;
      }
      setIsAdmin(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    getCompanies()
      .then((res) => {
        if (res.error) {
          setError(res.error.message);
          setCompanies([]);
        } else {
          setCompanies(res.data ?? []);
        }
      })
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setSubmitError('El nombre es obligatorio.');
      return;
    }
    setSubmitLoading(true);
    setSubmitError(null);
    const { data, error: err } = await createCompany(trimmed);
    setSubmitLoading(false);
    if (err) {
      setSubmitError(err.message);
      return;
    }
    setSuccessMsg(`Compañía "${data?.name ?? trimmed}" creada.`);
    setName('');
    if (data) setCompanies((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  if (!adminChecked || !isAdmin) {
    return (
      <MainLayout>
        <LoadingSpinner text="Verificando acceso..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <AdminNav active="companies" />
        <h1 style={{ margin: '0 0 24px', fontSize: 'clamp(22px, 4vw, 26px)', fontWeight: 700, color: '#0f172a' }}>
          Admin — Alta de compañías
        </h1>

        {successMsg && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 10,
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#16a34a',
              fontSize: 14,
            }}
          >
            {successMsg}
          </div>
        )}

        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 10,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600, color: '#0f172a' }}>
            Nueva compañía
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {submitError && (
              <div style={{ padding: 10, borderRadius: 8, background: '#fef2f2', color: '#dc2626', fontSize: 13 }}>
                {submitError}
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                Nombre *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ej: San Corredor de Seguros"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 14,
                }}
              />
            </div>
            <button
              type="submit"
              disabled={submitLoading}
              style={{
                padding: '12px 20px',
                borderRadius: 10,
                border: 'none',
                background: submitLoading ? '#94a3b8' : '#667eea',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: submitLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {submitLoading ? 'Creando...' : 'Crear compañía'}
            </button>
          </form>
        </div>

        {loading ? (
          <LoadingSpinner text="Cargando listado..." size={48} inline />
        ) : companies.length > 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: '#0f172a' }}>
              Compañías ({companies.length})
            </h3>
            <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {companies.map((c) => (
                <li key={c.id} style={{ fontSize: 14, color: '#334155' }}>
                  {c.name}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </MainLayout>
  );
}
