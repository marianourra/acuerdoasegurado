import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { isCurrentUserAdmin } from '../services/adminService';
import {
  getAdminClaims,
  updateClaimById,
  deleteClaimById,
  type AdminClaimRow,
  type ClaimPatch,
} from '../services/adminClaimsService';
import { getCompanies } from '../services/companiesService';
import { getClaimStatusesOrdered } from '../services/claimsService';
import { claimTypeLabels } from '../constants/claimTypes';
import type { ClaimTypeLetter } from '../services/claimsService';
import AdminNav from '../components/AdminNav';

const formatDate = (date: string | null | undefined) =>
  date
    ? new Date(date).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—';

export default function AdminClaims() {
  const navigate = useNavigate();
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [claims, setClaims] = useState<AdminClaimRow[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [statuses, setStatuses] = useState<{ id: string; name: string; color: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ClaimPatch>({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [q, setQ] = useState<string>('');

  const filteredClaims = useMemo(() => {
    const query = q.trim().toLowerCase();
    return claims.filter((c) => {
      if (statusFilter !== 'all' && c.claim_statuses?.id !== statusFilter) return false;
      if (companyFilter !== 'all' && c.companies?.id !== companyFilter) return false;
      if (query) {
        const haystack = [
          c.client_name,
          (c as { claim_number?: string }).claim_number,
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
    Promise.all([
      getAdminClaims(),
      getCompanies(),
      getClaimStatusesOrdered(),
    ])
      .then(([claimsRes, companiesRes, statusesRes]) => {
        if (claimsRes.error) {
          setError(claimsRes.error.message);
          setClaims([]);
        } else {
          setClaims(claimsRes.data ?? []);
        }
        if (companiesRes.data) setCompanies(companiesRes.data);
        if (statusesRes.data)
          setStatuses(
            statusesRes.data.map((s) => ({
              id: s.id,
              name: s.name,
              color: s.color ?? null,
            }))
          );
      })
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const openEdit = (claim: AdminClaimRow) => {
    setEditingId(claim.id);
    setEditForm({
      status_id: claim.status_id,
      company_id: claim.company_id,
      amount_agreed: claim.amount_agreed ?? undefined,
      producer_profit: claim.producer_profit ?? undefined,
      payment_date: claim.payment_date ?? undefined,
      finished_at: claim.finished_at ?? undefined,
      description: claim.description ?? undefined,
    });
    setSaveError(null);
  };

  const closeEdit = () => {
    setEditingId(null);
    setSaveError(null);
  };

  const handleSaveEdit = async () => {
    if (editingId == null) return;
    setSaveLoading(true);
    setSaveError(null);
    const patch: ClaimPatch = {
      status_id: editForm.status_id,
      company_id: editForm.company_id,
      amount_agreed: editForm.amount_agreed ?? null,
      producer_profit: editForm.producer_profit ?? null,
      payment_date: editForm.payment_date || null,
      finished_at: editForm.finished_at || null,
      description: editForm.description ?? null,
    };
    const { error: err } = await updateClaimById(editingId, patch);
    setSaveLoading(false);
    if (err) {
      setSaveError(err.message);
      return;
    }
    setSuccessMsg('Reclamo actualizado.');
    closeEdit();
    const { data } = await getAdminClaims();
    if (data) setClaims(data);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleDelete = async (id: number, clientName: string) => {
    const ok = window.confirm(
      `¿Eliminar el reclamo de "${clientName}"? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    const { error: err } = await deleteClaimById(id);
    if (err) {
      setError(err.message);
      return;
    }
    setClaims((prev) => prev.filter((c) => c.id !== id));
    setSuccessMsg('Reclamo eliminado.');
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
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <AdminNav active="claims" />

        <h1
          style={{
            margin: '0 0 24px',
            fontSize: 'clamp(22px, 4vw, 26px)',
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          Admin — Reclamos
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
            <p style={{ margin: '8px 0 0', fontSize: 12, opacity: 0.9 }}>
              Si es un error de RLS: el admin debe tener una policy en <code>claims</code> que permita SELECT/UPDATE/DELETE cuando el usuario es admin (p. ej. usando <code>producers.is_admin = true</code>).
            </p>
          </div>
        )}

        {loading ? (
          <LoadingSpinner text="Cargando reclamos..." size={48} inline />
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginBottom: 16 }}>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por cliente, nro, compañía..."
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  fontSize: 14,
                }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14 }}
                >
                  <option value="all">Todos los estados</option>
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14 }}
                >
                  <option value="all">Todas las compañías</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredClaims.length === 0 && !error && (
                <p style={{ color: '#64748b', fontSize: 15 }}>
                  {claims.length === 0 ? 'No hay reclamos.' : 'Ningún reclamo coincide con los filtros.'}
                </p>
              )}
              {filteredClaims.map((claim) => (
              <div
                key={claim.id}
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  padding: 16,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gap: 12,
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>Cliente</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{claim.client_name ?? '—'}</div>
                    {claim.client_phone != null && claim.client_phone !== '' && (
                      <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{claim.client_phone}</div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>Compañía</div>
                    <div style={{ fontSize: 14, color: '#334155' }}>{claim.companies?.name ?? '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>Estado</div>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor: claim.claim_statuses?.color ?? '#64748b',
                        color: '#fff',
                      }}
                    >
                      {claim.claim_statuses?.name ?? '—'}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>Montos</div>
                    <div style={{ fontSize: 13, color: '#334155' }}>
                      Reclamado: {claim.amount_claimed != null ? `$${Number(claim.amount_claimed).toLocaleString()}` : '—'}
                    </div>
                    <div style={{ fontSize: 13, color: '#334155' }}>
                      Acuerdo: {claim.amount_agreed != null ? `$${Number(claim.amount_agreed).toLocaleString()}` : '—'}
                    </div>
                    <div style={{ fontSize: 13, color: '#334155' }}>
                      Beneficio: {claim.producer_profit != null ? `$${Number(claim.producer_profit).toLocaleString()}` : '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>Tipo</div>
                    <div style={{ fontSize: 13, color: '#334155' }}>
                      {claim.type && claimTypeLabels[claim.type as ClaimTypeLetter]
                        ? claimTypeLabels[claim.type as ClaimTypeLetter]
                        : claim.type ?? '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>Fechas</div>
                    <div style={{ fontSize: 13, color: '#334155' }}>Pago: {formatDate(claim.payment_date)}</div>
                    <div style={{ fontSize: 13, color: '#334155' }}>Fin: {formatDate(claim.finished_at)}</div>
                  </div>
                </div>
                <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => openEdit(claim)}
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
                  <button
                    type="button"
                    onClick={() => handleDelete(claim.id, claim.client_name ?? '')}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: '1px solid #dc2626',
                      background: '#fff',
                      color: '#dc2626',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
            </div>

        {/* Modal edición */}
        {editingId != null && (
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
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                Editar reclamo
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Estado
                  </label>
                  <select
                    value={editForm.status_id ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, status_id: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      fontSize: 14,
                    }}
                  >
                    {statuses.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Compañía
                  </label>
                  <select
                    value={editForm.company_id ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, company_id: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      fontSize: 14,
                    }}
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Monto acuerdo
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={editForm.amount_agreed ?? ''}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        amount_agreed: e.target.value === '' ? undefined : Number(e.target.value),
                      }))
                    }
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
                    Beneficio productor
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={editForm.producer_profit ?? ''}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        producer_profit: e.target.value === '' ? undefined : Number(e.target.value),
                      }))
                    }
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
                    Fecha de pago
                  </label>
                  <input
                    type="date"
                    value={
                      editForm.payment_date
                        ? new Date(editForm.payment_date).toISOString().slice(0, 10)
                        : ''
                    }
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, payment_date: e.target.value ? e.target.value : undefined }))
                    }
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
                    Fecha de finalización
                  </label>
                  <input
                    type="date"
                    value={
                      editForm.finished_at
                        ? new Date(editForm.finished_at).toISOString().slice(0, 10)
                        : ''
                    }
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, finished_at: e.target.value ? e.target.value : undefined }))
                    }
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
                    Observaciones
                  </label>
                  <textarea
                    value={editForm.description ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      fontSize: 14,
                      resize: 'vertical',
                    }}
                  />
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
                  {saveLoading ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        )}
          </>
        )}
    </div>
    </MainLayout>
  );
}
