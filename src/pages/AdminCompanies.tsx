import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import CompanyLogo from '../components/CompanyLogo';
import { ensureAdminAccess } from '../utils/adminAccess';
import {
  getCompanies,
  createCompany,
  updateCompany,
  type Company,
} from '../services/companiesService';

export default function AdminCompanies() {
  const navigate = useNavigate();
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editName, setEditName] = useState('');
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const filteredCompanies = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return companies;
    return companies.filter((c) => c.name.toLowerCase().includes(query));
  }, [companies, q]);

  const loadCompanies = async () => {
    setLoading(true);
    setError(null);
    const res = await getCompanies();
    if (res.error) {
      setError(res.error.message);
      setCompanies([]);
    } else {
      setCompanies(res.data ?? []);
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
    loadCompanies();
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
    const { data, error: err } = await createCompany(trimmed, logoUrl.trim() || null);
    setSubmitLoading(false);
    if (err) {
      setSubmitError(err.message);
      return;
    }
    setSuccessMsg(`Compañía "${data?.name ?? trimmed}" creada.`);
    setName('');
    setLogoUrl('');
    setShowCreateForm(false);
    await loadCompanies();
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const openEdit = (company: Company) => {
    setEditingCompany(company);
    setEditName(company.name);
    setEditLogoUrl(company.logo_url ?? '');
    setSaveError(null);
  };

  const closeEdit = () => {
    setEditingCompany(null);
    setSaveError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingCompany) return;
    setSaveLoading(true);
    setSaveError(null);
    const { error: err } = await updateCompany(editingCompany.id, {
      name: editName,
      logo_url: editLogoUrl.trim() || null,
    });
    setSaveLoading(false);
    if (err) {
      setSaveError(err.message);
      return;
    }
    setSuccessMsg(`Compañía "${editName.trim()}" actualizada.`);
    closeEdit();
    await loadCompanies();
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
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
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
            Admin — Compañías
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
            {showCreateForm ? 'Ocultar formulario' : '+ Nueva compañía'}
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
          placeholder="Buscar compañía..."
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
          <LoadingSpinner text="Cargando listado..." size={48} inline />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {filteredCompanies.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: 15 }}>
                {companies.length === 0 ? 'No hay compañías.' : 'Ninguna compañía coincide con la búsqueda.'}
              </p>
            ) : (
              filteredCompanies.map((c) => (
                <div
                  key={c.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 14,
                    padding: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <CompanyLogo name={c.name} logoUrl={c.logo_url} size={36} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{c.name}</div>
                      {c.logo_url && (
                        <div
                          style={{
                            fontSize: 11,
                            color: '#94a3b8',
                            marginTop: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {c.logo_url}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
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
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  URL del logo (opcional)
                </label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
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
        )}

        {editingCompany != null && (
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
                maxWidth: 480,
                width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                Editar compañía
              </h2>

              {saveError && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: 10,
                    borderRadius: 8,
                    background: '#fef2f2',
                    color: '#dc2626',
                    fontSize: 13,
                  }}
                >
                  {saveError}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <CompanyLogo name={editName} logoUrl={editLogoUrl} size={48} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
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
                    URL del logo
                  </label>
                  <input
                    type="url"
                    value={editLogoUrl}
                    onChange={(e) => setEditLogoUrl(e.target.value)}
                    placeholder="https://..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748b' }}>
                    Subí el archivo en Supabase → Storage → <code>company-logos</code>, copiá la URL
                    pública y pegala acá.
                  </p>
                </div>
              </div>

              <div style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={closeEdit}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                    color: '#475569',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={saveLoading}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 8,
                    border: 'none',
                    background: saveLoading ? '#94a3b8' : '#667eea',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: saveLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saveLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
