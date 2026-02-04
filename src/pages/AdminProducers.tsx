import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { isCurrentUserAdmin } from '../services/adminService';
import { getAdminProducers, createProducer, type CreateProducerParams } from '../services/adminProducersService';
import AdminNav from '../components/AdminNav';

export default function AdminProducers() {
  const navigate = useNavigate();
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [producers, setProducers] = useState<{ id: number; name: string | null; email: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [form, setForm] = useState<CreateProducerParams & { password: string }>({
    email: '',
    password: '',
    name: '',
    phone: '',
    cbu: '',
    is_admin: false,
  });
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
    getAdminProducers()
      .then((res) => {
        if (res.error) {
          setError(res.error.message);
          setProducers([]);
        } else {
          setProducers(
            (res.data ?? []).map((p) => ({
              id: p.id,
              name: p.name,
              email: p.email,
            }))
          );
        }
      })
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password || !form.name.trim()) {
      setSubmitError('Email, contraseña y nombre son obligatorios.');
      return;
    }
    if (form.password.length < 6) {
      setSubmitError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setSubmitLoading(true);
    setSubmitError(null);
    const { data, error: err } = await createProducer({
      email: form.email.trim(),
      password: form.password,
      name: form.name.trim(),
      phone: form.phone?.trim() || undefined,
      cbu: form.cbu?.trim() || undefined,
      is_admin: form.is_admin,
    });
    setSubmitLoading(false);
    if (err) {
      setSubmitError(err.message);
      return;
    }
    setSuccessMsg(`Productor "${data?.name ?? form.name}" creado. Debe usar el email y la contraseña para iniciar sesión.`);
    setForm({ email: '', password: '', name: '', phone: '', cbu: '', is_admin: false });
    if (data) setProducers((prev) => [...prev, { id: data.id, name: data.name, email: data.email }]);
    setTimeout(() => setSuccessMsg(null), 5000);
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
        <AdminNav active="producers" />
        <h1 style={{ margin: '0 0 24px', fontSize: 'clamp(22px, 4vw, 26px)', fontWeight: 700, color: '#0f172a' }}>
          Admin — Alta de productores
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
            Nuevo productor
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
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 14,
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                Email *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 14,
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                Contraseña temporal *
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 14,
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                Teléfono
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 14,
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                CBU (22 dígitos)
              </label>
              <input
                type="text"
                value={form.cbu}
                onChange={(e) => setForm((f) => ({ ...f, cbu: e.target.value.replace(/\D/g, '').slice(0, 22) }))}
                maxLength={22}
                placeholder="Opcional"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 14,
                }}
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.is_admin}
                onChange={(e) => setForm((f) => ({ ...f, is_admin: e.target.checked }))}
              />
              <span style={{ fontSize: 14, color: '#334155' }}>Es administrador</span>
            </label>
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
              {submitLoading ? 'Creando...' : 'Crear productor'}
            </button>
          </form>
        </div>

        {loading ? (
          <LoadingSpinner text="Cargando listado..." size={48} inline />
        ) : producers.length > 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: '#0f172a' }}>
              Productores ({producers.length})
            </h3>
            <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {producers.map((p) => (
                <li key={p.id} style={{ fontSize: 14, color: '#334155' }}>
                  <strong>{p.name ?? 'Sin nombre'}</strong> — {p.email ?? '—'}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </MainLayout>
  );
}
