import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { ensureAdminAccess } from '../utils/adminAccess';
import {
  getAdminAsistentes,
  createAsistenteUser,
  updateAdminAsistente,
  asistenteToEditForm,
  type AdminAsistenteRow,
  type CreateAsistenteParams,
  type UpdateAsistenteParams,
} from '../services/adminAsistentesService';

const emptyCreateForm = (): CreateAsistenteParams & { password: string } => ({
  email: '',
  password: '',
  nombre: '',
});

export default function AdminAsistentes() {
  const navigate = useNavigate();
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [asistentes, setAsistentes] = useState<AdminAsistenteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState(emptyCreateForm);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editingAsistente, setEditingAsistente] = useState<AdminAsistenteRow | null>(null);
  const [editForm, setEditForm] = useState<UpdateAsistenteParams>({ nombre: '', email: '' });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const filteredAsistentes = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return asistentes;
    return asistentes.filter((a) => {
      const haystack = [a.nombre, a.email, a.id].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [asistentes, q]);

  const loadAsistentes = async () => {
    setLoading(true);
    setError(null);
    const res = await getAdminAsistentes();
    if (res.error) {
      setError(res.error.message);
      setAsistentes([]);
    } else {
      setAsistentes(res.data ?? []);
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
    loadAsistentes();
  }, [isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password || !form.nombre.trim()) {
      setSubmitError('Email, contraseña y nombre son obligatorios.');
      return;
    }
    if (form.password.length < 6) {
      setSubmitError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setSubmitLoading(true);
    setSubmitError(null);
    const { data, error: err } = await createAsistenteUser({
      email: form.email.trim(),
      password: form.password,
      nombre: form.nombre.trim(),
    });
    setSubmitLoading(false);
    if (err) {
      setSubmitError(err.message);
      return;
    }
    setSuccessMsg(
      `Asistente "${data?.nombre ?? form.nombre}" creado. Debe usar el email y la contraseña para iniciar sesión.`
    );
    setForm(emptyCreateForm());
    setShowCreateForm(false);
    await loadAsistentes();
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const openEdit = (asistente: AdminAsistenteRow) => {
    setEditingAsistente(asistente);
    setEditForm(asistenteToEditForm(asistente));
    setSaveError(null);
  };

  const closeEdit = () => {
    setEditingAsistente(null);
    setSaveError(null);
  };

  const handleSaveEdit = async () => {
    if (editingAsistente == null) return;
    if (!editForm.nombre.trim() || !editForm.email.trim()) {
      setSaveError('Nombre y email son obligatorios.');
      return;
    }
    setSaveLoading(true);
    setSaveError(null);
    const { error: err } = await updateAdminAsistente(editingAsistente.id, {
      nombre: editForm.nombre.trim(),
      email: editForm.email.trim(),
    });
    setSaveLoading(false);
    if (err) {
      setSaveError(err.message);
      return;
    }
    setSuccessMsg(`Asistente "${editForm.nombre.trim()}" actualizado.`);
    closeEdit();
    await loadAsistentes();
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
            Admin — Asistentes
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
            {showCreateForm ? 'Ocultar formulario' : '+ Nuevo asistente'}
          </button>
        </div>

        {successMsg && (
          <div style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontSize: 14 }}>
            {successMsg}
          </div>
        )}

        {error && (
          <div style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 14 }}>
            {error}
          </div>
        )}

        {showCreateForm && (
          <form
            onSubmit={handleSubmit}
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: 20,
              marginBottom: 20,
              display: 'grid',
              gap: 12,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Crear cuenta de asistente</h2>
            {submitError && (
              <div style={{ padding: 10, borderRadius: 8, background: '#fef2f2', color: '#dc2626', fontSize: 13 }}>
                {submitError}
              </div>
            )}
            <input
              type="text"
              placeholder="Nombre completo"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              style={{ padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14 }}
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              style={{ padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14 }}
            />
            <input
              type="password"
              placeholder="Contraseña (mín. 6 caracteres)"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              style={{ padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14 }}
            />
            <button
              type="submit"
              disabled={submitLoading}
              style={{
                padding: 12,
                borderRadius: 10,
                border: 'none',
                background: submitLoading ? '#cbd5e1' : '#667eea',
                color: '#fff',
                fontWeight: 600,
                cursor: submitLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {submitLoading ? 'Creando…' : 'Crear asistente'}
            </button>
          </form>
        )}

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, email o ID..."
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
          <LoadingSpinner text="Cargando asistentes..." size={48} inline />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredAsistentes.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: 15 }}>
                {asistentes.length === 0 ? 'No hay asistentes.' : 'Ningún asistente coincide con la búsqueda.'}
              </p>
            ) : (
              filteredAsistentes.map((a) => (
                <div
                  key={a.id}
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
                      <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{a.nombre}</span>
                      {a.user_id ? (
                        <span style={{ padding: '2px 8px', borderRadius: 999, background: '#dcfce7', color: '#166534', fontSize: 11, fontWeight: 700 }}>
                          Con acceso
                        </span>
                      ) : (
                        <span style={{ padding: '2px 8px', borderRadius: 999, background: '#f1f5f9', color: '#64748b', fontSize: 11, fontWeight: 700 }}>
                          Sin login
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{a.email ?? '—'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEdit(a)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: '1px solid #667eea',
                      background: '#fff',
                      color: '#667eea',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Editar
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {editingAsistente != null && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              padding: 16,
            }}
            onClick={(e) => e.target === e.currentTarget && closeEdit()}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: 16,
                padding: 24,
                maxWidth: 420,
                width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>Editar asistente</h2>
              {saveError && (
                <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: '#fef2f2', color: '#dc2626', fontSize: 13 }}>
                  {saveError}
                </div>
              )}
              <div style={{ display: 'grid', gap: 12 }}>
                <input
                  type="text"
                  value={editForm.nombre}
                  onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))}
                  placeholder="Nombre"
                  style={{ padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14 }}
                />
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="Email"
                  style={{ padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeEdit} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={saveLoading}
                  style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#667eea', color: '#fff', fontWeight: 600, cursor: saveLoading ? 'not-allowed' : 'pointer' }}
                >
                  {saveLoading ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
