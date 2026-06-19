import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { ensureStaffClaimsAccess } from '../utils/adminAccess';
import {
  getAdminClaims,
  getAsistenteClaims,
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
import ClearFiltersButton from '../components/ClearFiltersButton';
import { parseLocalDate } from '../utils/dateUtils';
import {
  GROUP_EN_TRAMITE,
  GROUP_FINALIZADOS,
  GROUP_ACORDADO_PENDIENTE_PAGO,
  ADMIN_CLAIM_GROUP_META,
  ADMIN_DEFAULT_EXPANDED_SECTIONS,
} from '../constants/claimGroups';

type AdminClaimsSortField = 'created_at' | 'presentation_date';
type SortDirection = 'asc' | 'desc';

function claimSortTimestamp(claim: AdminClaimRow, field: AdminClaimsSortField): number | null {
  if (field === 'created_at') {
    const time = new Date(claim.created_at).getTime();
    return Number.isNaN(time) ? null : time;
  }
  const date = parseLocalDate(claim.presentation_date);
  return date ? date.getTime() : null;
}

function sortAdminClaims(
  rows: AdminClaimRow[],
  field: AdminClaimsSortField,
  direction: SortDirection
): AdminClaimRow[] {
  return [...rows].sort((a, b) => {
    const aVal = claimSortTimestamp(a, field);
    const bVal = claimSortTimestamp(b, field);
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    return direction === 'asc' ? aVal - bVal : bVal - aVal;
  });
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: 12,
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  fontSize: 14,
};

const CLAIMS_LIST_PATH = '/admin/claims';
const NEW_CLAIM_PATH = '/admin/claims/new';

export default function ClaimsManagementPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [scopedAsistenteId, setScopedAsistenteId] = useState<string | null>(null);

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
  const [asistenteFilter, setAsistenteFilter] = useState<string>('all');
  const [q, setQ] = useState<string>('');
  const [sortField, setSortField] = useState<AdminClaimsSortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const showAsistenteFilter = isAdminUser;

  const visibleClaims = useMemo(() => {
    if (isAdminUser || !scopedAsistenteId) return claims;
    return claims.filter((c) => c.asistente_id === scopedAsistenteId);
  }, [claims, isAdminUser, scopedAsistenteId]);

  const filteredClaims = useMemo(() => {
    const query = q.trim().toLowerCase();
    return visibleClaims.filter((c) => {
      if (statusFilter !== 'all' && c.claim_statuses?.id !== statusFilter) return false;
      if (companyFilter !== 'all' && c.companies?.id !== companyFilter) return false;
      if (producerFilter === 'none') {
        if (c.producer_id) return false;
      } else if (producerFilter !== 'all' && String(c.producer_id) !== producerFilter) {
        return false;
      }
      if (showAsistenteFilter) {
        if (asistenteFilter === 'none') {
          if (c.asistente_id) return false;
        } else if (asistenteFilter !== 'all' && c.asistente_id !== asistenteFilter) {
          return false;
        }
      }
      if (query) {
        const haystack = [
          c.client_name,
          c.claim_number,
          c.description,
          c.companies?.name,
          c.claim_statuses?.name,
          c.producers?.name,
          c.asistentes?.nombre,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [visibleClaims, statusFilter, companyFilter, producerFilter, asistenteFilter, q, showAsistenteFilter]);

  const sortedClaims = useMemo(
    () => sortAdminClaims(filteredClaims, sortField, sortDirection),
    [filteredClaims, sortField, sortDirection]
  );

  const hasActiveFilters =
    statusFilter !== 'all' ||
    companyFilter !== 'all' ||
    producerFilter !== 'all' ||
    (showAsistenteFilter && asistenteFilter !== 'all') ||
    q.trim() !== '';

  const clearFilters = () => {
    setStatusFilter('all');
    setCompanyFilter('all');
    setProducerFilter('all');
    setAsistenteFilter('all');
    setQ('');
  };

  const groupedSections = useMemo(() => {
    const enTramite: AdminClaimRow[] = [];
    const acordadoPendiente: AdminClaimRow[] = [];
    const finalizados: AdminClaimRow[] = [];

    for (const claim of sortedClaims) {
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
  }, [sortedClaims]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const loadClaims = async (asistenteScopeId: string | null, adminScope: boolean) => {
    if (adminScope) return getAdminClaims();
    if (!asistenteScopeId) {
      return { data: [] as AdminClaimRow[], error: { message: 'No se encontró el asistente.' } };
    }
    return getAsistenteClaims(asistenteScopeId);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const access = await ensureStaffClaimsAccess(navigate);
      if (cancelled) return;
      setAccessChecked(true);
      if (!access.allowed) return;
      setHasAccess(true);
      setIsAdminUser(access.isAdmin);
      setScopedAsistenteId(access.asistenteId);
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (!hasAccess) return;
    if (!isAdminUser && !scopedAsistenteId) return;

    setLoading(true);
    setError(null);
    Promise.all([
      loadClaims(scopedAsistenteId, isAdminUser),
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
        if (statusesRes.data) {
          setStatuses(
            statusesRes.data.map((s) => ({
              id: s.id,
              name: s.name,
              color: s.color ?? null,
            }))
          );
        }
        if (producersRes.data) setProducers(producersRes.data);
        if (asistentesRes.data) setAsistentes(asistentesRes.data);
        if (abogadosRes.data) setAbogados(abogadosRes.data);
      })
      .finally(() => setLoading(false));
  }, [hasAccess, isAdminUser, scopedAsistenteId]);

  useEffect(() => {
    const state = location.state as { claimCreated?: boolean; claimId?: number } | null;
    if (state?.claimCreated) {
      setSuccessMsg(
        state.claimId != null
          ? `Reclamo #${state.claimId} creado correctamente.`
          : 'Reclamo creado correctamente.'
      );
      navigate(CLAIMS_LIST_PATH, { replace: true, state: null });
      const t = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [location.state, navigate]);

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
    if (scopedAsistenteId) {
      patch.asistente_id = scopedAsistenteId;
    }
    const { error: err } = await updateClaimById(editingClaim.id, patch);
    setSaveLoading(false);
    if (err) {
      setSaveError(err.message);
      return;
    }
    setSuccessMsg('Reclamo actualizado.');
    closeEdit();
    const { data } = await loadClaims(scopedAsistenteId, isAdminUser);
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

  if (!accessChecked || !hasAccess) {
    return (
      <MainLayout>
        <LoadingSpinner text="Verificando acceso..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(22px, 4vw, 26px)',
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            Admin — Reclamos
          </h1>
          <Link
            to={NEW_CLAIM_PATH}
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
              whiteSpace: 'nowrap',
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
              Si es un error de RLS: verificá las políticas en <code>claims</code> para admin o asistentes.
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
                  <option value="none">Sin productor</option>
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
                {showAsistenteFilter && (
                  <select
                    value={asistenteFilter}
                    onChange={(e) => setAsistenteFilter(e.target.value)}
                    style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14 }}
                  >
                    <option value="all">Todos los asistentes</option>
                    <option value="none">Sin asistente</option>
                    {asistentes.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as AdminClaimsSortField)}
                  style={selectStyle}
                >
                  <option value="created_at">Ordenar por fecha de inicio</option>
                  <option value="presentation_date">Ordenar por fecha de presentación</option>
                </select>
                <select
                  value={sortDirection}
                  onChange={(e) => setSortDirection(e.target.value as SortDirection)}
                  style={selectStyle}
                >
                  <option value="desc">Descendente (más recientes primero)</option>
                  <option value="asc">Ascendente (más antiguos primero)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <ClearFiltersButton onClick={clearFilters} disabled={!hasActiveFilters} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredClaims.length === 0 && !error && (
                <p style={{ color: '#64748b', fontSize: 15 }}>
                  {visibleClaims.length === 0 ? 'No hay reclamos.' : 'Ningún reclamo coincide con los filtros.'}
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
                lockAsistenteId={scopedAsistenteId}
              />
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
