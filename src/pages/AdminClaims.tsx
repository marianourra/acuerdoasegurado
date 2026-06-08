import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { isCurrentUserAdmin } from '../services/adminService';
import {
  getAdminClaims,
  updateClaimById,
  deleteClaimById,
  claimToEditForm,
  buildSavePatch,
  type AdminClaimRow,
  type ClaimPatch,
} from '../services/adminClaimsService';
import { getCompanies } from '../services/companiesService';
import { getClaimStatusesOrdered, isAcordadoClaim, isFinalizedClaim } from '../services/claimsService';
import { getAdminProducers } from '../services/adminProducersService';
import { getAsistentes, type Asistente } from '../services/asistentesService';
import { getAbogados, type Abogado } from '../services/abogadosService';
import AdminClaimCard from '../components/AdminClaimCard';
import AdminClaimEditModal from '../components/AdminClaimEditModal';
import ClaimsStatusCollapse from '../components/ClaimsStatusCollapse';
import {
  GROUP_EN_TRAMITE,
  GROUP_FINALIZADOS,
  GROUP_ACORDADO_PENDIENTE_PAGO,
  ADMIN_CLAIM_GROUP_META,
  ADMIN_DEFAULT_EXPANDED_SECTIONS,
} from '../constants/claimGroups';

export default function AdminClaims() {
  const navigate = useNavigate();
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [claims, setClaims] = useState<AdminClaimRow[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [producers, setProducers] = useState<{ id: number; name: string | null }[]>([]);
  const [statuses, setStatuses] = useState<{ id: string; name: string; color: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [editingClaim, setEditingClaim] = useState<AdminClaimRow | null>(null);
  const [editForm, setEditForm] = useState<ClaimPatch>({});
  const [asistentes, setAsistentes] = useState<Asistente[]>([]);
  const [abogados, setAbogados] = useState<Abogado[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(ADMIN_DEFAULT_EXPANDED_SECTIONS);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [producerFilter, setProducerFilter] = useState<string>('all');
  const [q, setQ] = useState<string>('');

  const filteredClaims = useMemo(() => {
    const query = q.trim().toLowerCase();
    return claims.filter((c) => {
      if (statusFilter !== 'all' && c.claim_statuses?.id !== statusFilter) return false;
      if (companyFilter !== 'all' && c.companies?.id !== companyFilter) return false;
      if (producerFilter !== 'all' && String(c.producer_id) !== producerFilter) return false;
      if (query) {
        const haystack = [
          c.client_name,
          c.claim_number,
          c.description,
          c.companies?.name,
          c.claim_statuses?.name,
          c.producers?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [claims, statusFilter, companyFilter, producerFilter, q]);

  const groupedSections = useMemo(() => {
    const enTramite: AdminClaimRow[] = [];
    const acordadoPendiente: AdminClaimRow[] = [];
    const finalizados: AdminClaimRow[] = [];

    for (const claim of filteredClaims) {
      if (isAcordadoClaim(claim)) {
        acordadoPendiente.push(claim);
      } else if (isFinalizedClaim(claim)) {
        finalizados.push(claim);
      } else {
        enTramite.push(claim);
      }
    }

    const sections: Array<{ id: string; name: string; color: string; claims: AdminClaimRow[] }> = [];

    if (enTramite.length > 0) {
      sections.push({
        id: GROUP_EN_TRAMITE,
        ...ADMIN_CLAIM_GROUP_META[GROUP_EN_TRAMITE],
        claims: enTramite,
      });
    }

    if (acordadoPendiente.length > 0) {
      sections.push({
        id: GROUP_ACORDADO_PENDIENTE_PAGO,
        ...ADMIN_CLAIM_GROUP_META[GROUP_ACORDADO_PENDIENTE_PAGO],
        claims: acordadoPendiente,
      });
    }

    if (finalizados.length > 0) {
      sections.push({
        id: GROUP_FINALIZADOS,
        ...ADMIN_CLAIM_GROUP_META[GROUP_FINALIZADOS],
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
      getAdminProducers(),
      getAsistentes(),
      getAbogados(),
    ])
      .then(([claimsRes, companiesRes, statusesRes, producersRes, asistentesRes, abogadosRes]) => {
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
        if (producersRes.data) setProducers(producersRes.data);
        if (asistentesRes.data) setAsistentes(asistentesRes.data);
        if (abogadosRes.data) setAbogados(abogadosRes.data);
      })
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const openEdit = (claim: AdminClaimRow) => {
    setEditingClaim(claim);
    setEditForm(claimToEditForm(claim));
    setSaveError(null);
  };

  const closeEdit = () => {
    setEditingClaim(null);
    setSaveError(null);
  };

  const handleSaveEdit = async () => {
    if (editingClaim == null) return;
    setSaveLoading(true);
    setSaveError(null);
    const patch = buildSavePatch(editForm);
    const { error: err } = await updateClaimById(editingClaim.id, patch);
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
                  value={producerFilter}
                  onChange={(e) => setProducerFilter(e.target.value)}
                  style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14 }}
                >
                  <option value="all">Todos los productores</option>
                  {producers.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name ?? `Productor #${p.id}`}
                    </option>
                  ))}
                </select>
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
              {groupedSections.map((section) => (
                <ClaimsStatusCollapse
                  key={section.id}
                  statusId={section.id}
                  statusName={section.name}
                  statusColor={section.color}
                  claimCount={section.claims.length}
                  isExpanded={expandedSections[section.id] !== false}
                  onToggle={() => toggleSection(section.id)}
                >
                  {section.claims.map((claim) => (
                    <AdminClaimCard
                      key={claim.id}
                      claim={claim}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </ClaimsStatusCollapse>
              ))}
            </div>

        {editingClaim != null && (
          <AdminClaimEditModal
            claim={editingClaim}
            editForm={editForm}
            setEditForm={setEditForm}
            companies={companies}
            producers={producers}
            statuses={statuses}
            asistentes={asistentes}
            abogados={abogados}
            saveLoading={saveLoading}
            saveError={saveError}
            onClose={closeEdit}
            onSave={handleSaveEdit}
          />
        )}
          </>
        )}
    </div>
    </MainLayout>
  );
}
