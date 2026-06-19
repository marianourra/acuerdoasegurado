import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import AdminProducerEditModal from '../components/AdminProducerEditModal';
import { ensureAdminAccess } from '../utils/adminAccess';
import {
  getAdminProducers,
  createProducer,
  updateAdminProducer,
  producerToEditForm,
  type AdminProducerRow,
  type CreateProducerParams,
  type UpdateProducerParams,
} from '../services/adminProducersService';

const emptyCreateForm = (): CreateProducerParams & { password: string } => ({
  email: '',
  password: '',
  name: '',
  phone: '',
  cbu: '',
  is_admin: false,
});

export default function AdminProducers() {
  const navigate = useNavigate();
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [producers, setProducers] = useState<AdminProducerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState(emptyCreateForm);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editingProducer, setEditingProducer] = useState<AdminProducerRow | null>(null);
  const [editForm, setEditForm] = useState<UpdateProducerParams>({
    name: '',
    email: '',
    phone: '',
    cbu: '',
    is_admin: false,
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const filteredProducers = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return producers;
    return producers.filter((p) => {
      const haystack = [p.name, p.email, p.phone, p.cbu, String(p.id)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [producers, q]);

  const loadProducers = async () => {
    setLoading(true);
    setError(null);
    const res = await getAdminProducers();
    if (res.error) {
      setError(res.error.message);
      setProducers([]);
    } else {
      setProducers(res.data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const allowed = await ensureAdminAccess(navigate);
      if (cancelled) return;
      setAdminChecked(true);
      if (allowed) setIsAdmin(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    loadProducers();
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
    setSuccessMsg(
      `Productor "${data?.name ?? form.name}" creado. Debe usar el email y la contraseña para iniciar sesión.`
    );
    setForm(emptyCreateForm());
    setShowCreateForm(false);
    await loadProducers();
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const openEdit = (producer: AdminProducerRow) => {
    setEditingProducer(producer);
    setEditForm(producerToEditForm(producer));
    setSaveError(null);
  };

  const closeEdit = () => {
    setEditingProducer(null);
    setSaveError(null);
  };

  const handleSaveEdit = async () => {
    if (editingProducer == null) return;
    if (!editForm.name.trim() || !editForm.email.trim()) {
      setSaveError('Nombre y email son obligatorios.');
      return;
    }
    setSaveLoading(true);
    setSaveError(null);
    const { error: err } = await updateAdminProducer(editingProducer.id, {
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      phone: editForm.phone?.trim() || null,
      cbu: editForm.cbu?.trim() || null,
      is_admin: editForm.is_admin ?? false,
    });
    setSaveLoading(false);
    if (err) {
      setSaveError(err.message);
      return;
    }
    setSuccessMsg(`Productor "${editForm.name.trim()}" actualizado.`);
    closeEdit();
    await loadProducers();
    setTimeout(() => setSuccessMsg(null), 4000);
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
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <h1 style={{ margin: 0, fontSize: 'clamp(22px, 4vw, 26px)', fontWeight: 700, color: '#0f172a' }}>
            Admin — Productores
          </h1>
          <button
            type="button"
            onClick={() => setShowCreateForm((v) => !v)}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              border: 'none',
              background: '#667eea',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {showCreateForm ? 'Ocultar formulario' : '+ Nuevo productor'}
          </button>
        </div>

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

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, email, teléfono, CBU o ID..."
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            fontSize: 14,
            marginBottom: 16,
            boxSizing: 'border-box',
          }}
        />

        {loading ? (
          <LoadingSpinner text="Cargando productores..." size={48} inline />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
              {filteredProducers.length} de {producers.length} productor{producers.length !== 1 ? 'es' : ''}
            </p>
            {filteredProducers.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: 15 }}>
                {producers.length === 0 ? 'No hay productores.' : 'Ningún productor coincide con la búsqueda.'}
              </p>
            ) : (
              filteredProducers.map((p) => (
                <div
                  key={p.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 14,
                    padding: 14,
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 12,
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
                        {p.name ?? 'Sin nombre'}
                      </span>
                      {p.is_admin && (
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 999,
                            background: '#ede9fe',
                            color: '#5b21b6',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          Admin
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{p.email ?? '—'}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
                      {p.phone && <span>Tel: {p.phone}</span>}
                      {p.cbu && <span>CBU: {p.cbu}</span>}
                      <span>ID: {p.id}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: '1px solid #667eea',
                      background: '#fff',
                      color: '#667eea',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    Editar
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {showCreateForm && (
          <div
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 16,
              padding: 24,
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
                    boxSizing: 'border-box',
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
                    boxSizing: 'border-box',
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
                    boxSizing: 'border-box',
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
                    boxSizing: 'border-box',
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
                    boxSizing: 'border-box',
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
        )}

        {editingProducer != null && (
          <AdminProducerEditModal
            producer={editingProducer}
            editForm={editForm}
            setEditForm={setEditForm}
            saveLoading={saveLoading}
            saveError={saveError}
            onClose={closeEdit}
            onSave={handleSaveEdit}
          />
        )}
      </div>
    </MainLayout>
  );
}
