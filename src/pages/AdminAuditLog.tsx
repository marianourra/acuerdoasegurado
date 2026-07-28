import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { ensureAdminAccess } from '../utils/adminAccess';
import {
  getClaimAuditLog,
  getAsistentesWithUser,
  type ClaimAuditRow,
} from '../services/claimAuditService';
import { getAdminProducers, type AdminProducerRow } from '../services/adminProducersService';
import { getAbogados, formatAbogadoName } from '../services/abogadosService';
import { getCompanies } from '../services/companiesService';
import { getClaimStatusesOrdered } from '../services/claimsService';
import { claimTypeLabels } from '../constants/claimTypes';
import type { ClaimTypeLetter } from '../services/claimsService';

const FIELD_LABELS: Record<string, string> = {
  claim_number: 'N° de reclamo',
  client_name: 'Nombre del reclamante',
  client_phone: 'Teléfono del reclamante',
  company_id: 'Compañía',
  client_company_id: 'Compañía del cliente',
  producer_id: 'Productor',
  status_id: 'Estado',
  type: 'Tipo de reclamo',
  amount_claimed: 'Monto reclamado',
  amount_agreed: 'Monto acordado',
  producer_profit: 'Ganancia del productor',
  fees_percent: '% de honorarios',
  fees: 'Honorarios',
  is_invoiced: 'Facturado',
  payment_date: 'Fecha de pago',
  presentation_date: 'Fecha de presentación',
  finished_at: 'Fecha de finalización',
  description: 'Descripción',
  claim_brief: 'Síntesis',
  internal_observations: 'Observaciones internas',
  taller_inspeccion: 'Taller / Inspección',
  observaciones_pas: 'Observaciones (visible al productor)',
  producer_updates: 'Novedades por fecha',
};

const MONEY_FIELDS = new Set(['amount_claimed', 'amount_agreed', 'producer_profit', 'fees']);

function formatDateTime(value: string): string {
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMoney(n: number): string {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}

function truncate(text: string, max = 140): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

type Maps = {
  producersByUser: Map<string, { name: string; is_admin: boolean }>;
  producersById: Map<string, string>;
  asistentesByUser: Map<string, string>;
  asistentesById: Map<string, string>;
  abogadosById: Map<string, string>;
  companiesById: Map<string, string>;
  statusesById: Map<string, string>;
};

function resolveValue(field: string, value: unknown, maps: Maps): string {
  if (value === null || value === undefined || value === '') return '(vacío)';

  switch (field) {
    case 'company_id':
    case 'client_company_id':
      return maps.companiesById.get(String(value)) ?? String(value);
    case 'producer_id':
      return maps.producersById.get(String(value)) ?? String(value);
    case 'status_id':
      return maps.statusesById.get(String(value)) ?? String(value);
    case 'asistente_id':
      return maps.asistentesById.get(String(value)) ?? String(value);
    case 'abogado_id':
      return maps.abogadosById.get(String(value)) ?? String(value);
    case 'is_invoiced':
      return value ? 'Sí' : 'No';
    case 'type':
      return claimTypeLabels[value as ClaimTypeLetter] ?? String(value);
    case 'producer_updates': {
      if (Array.isArray(value)) return `${value.length} novedad${value.length !== 1 ? 'es' : ''}`;
      return '(actualizado)';
    }
    case 'fees_percent':
      return `${value}%`;
    default:
      if (MONEY_FIELDS.has(field) && typeof value === 'number') return formatMoney(value);
      return truncate(String(value));
  }
}

function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

function ActionBadge({ action }: { action: ClaimAuditRow['action'] }) {
  const map: Record<ClaimAuditRow['action'], { label: string; bg: string; color: string; border: string }> = {
    insert: { label: 'Creación', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
    update: { label: 'Modificación', bg: '#fefce8', color: '#a16207', border: '#fde68a' },
    delete: { label: 'Eliminación', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  };
  const s = map[action];
  return (
    <span
      style={{
        padding: '2px 10px',
        borderRadius: 999,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  if (!role || role === '—') return null;
  const isAdmin = role === 'Administrador';
  const isAsis = role === 'Asistente';
  const bg = isAdmin ? '#ede9fe' : isAsis ? '#ecfeff' : '#f1f5f9';
  const color = isAdmin ? '#5b21b6' : isAsis ? '#0e7490' : '#475569';
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 999,
        background: bg,
        color,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {role}
    </span>
  );
}

export default function AdminAuditLog() {
  const navigate = useNavigate();
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [logs, setLogs] = useState<ClaimAuditRow[]>([]);
  const [producers, setProducers] = useState<AdminProducerRow[]>([]);
  const [asistentes, setAsistentes] = useState<{ id: string; nombre: string; user_id: string | null }[]>([]);
  const [abogados, setAbogados] = useState<{ id: string; nombre: string; apellido: string }[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [statuses, setStatuses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');

  const maps = useMemo<Maps>(() => {
    const producersByUser = new Map<string, { name: string; is_admin: boolean }>();
    const producersById = new Map<string, string>();
    for (const p of producers) {
      if (p.user_id) producersByUser.set(p.user_id, { name: p.name ?? 'Sin nombre', is_admin: !!p.is_admin });
      producersById.set(p.id, p.name ?? 'Sin nombre');
    }
    const asistentesByUser = new Map<string, string>();
    const asistentesById = new Map<string, string>();
    for (const a of asistentes) {
      if (a.user_id) asistentesByUser.set(a.user_id, a.nombre);
      asistentesById.set(a.id, a.nombre);
    }
    const abogadosById = new Map<string, string>();
    for (const a of abogados) abogadosById.set(a.id, formatAbogadoName(a));
    const companiesById = new Map<string, string>();
    for (const c of companies) companiesById.set(c.id, c.name);
    const statusesById = new Map<string, string>();
    for (const s of statuses) statusesById.set(s.id, s.name);
    return {
      producersByUser,
      producersById,
      asistentesByUser,
      asistentesById,
      abogadosById,
      companiesById,
      statusesById,
    };
  }, [producers, asistentes, abogados, companies, statuses]);

  const resolveActor = (actorId: string | null): { name: string; role: string } => {
    if (!actorId) return { name: 'Sistema', role: '—' };
    const prod = maps.producersByUser.get(actorId);
    if (prod) return { name: prod.name, role: prod.is_admin ? 'Administrador' : 'Productor' };
    const asis = maps.asistentesByUser.get(actorId);
    if (asis) return { name: asis, role: 'Asistente' };
    return { name: 'Usuario desconocido', role: '—' };
  };

  const resolvedLogs = useMemo(() => {
    return logs.map((row) => {
      const actor = resolveActor(row.actor_id);
      const changeItems = (row.changes ?? []).map((c) => ({
        label: fieldLabel(c.field),
        oldText: resolveValue(c.field, c.old, maps),
        newText: resolveValue(c.field, c.new, maps),
      }));
      const searchText = [
        actor.name,
        actor.role,
        row.claim_number,
        row.client_name,
        ...changeItems.map((ci) => ci.label),
        ...changeItems.map((ci) => ci.newText),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return { row, actor, changeItems, searchText };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, maps]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return resolvedLogs;
    return resolvedLogs.filter((r) => r.searchText.includes(query));
  }, [resolvedLogs, q]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    const [logsRes, producersRes, asisRes, abogadosRes, companiesRes, statusesRes] = await Promise.all([
      getClaimAuditLog(),
      getAdminProducers(),
      getAsistentesWithUser(),
      getAbogados(),
      getCompanies(),
      getClaimStatusesOrdered(),
    ]);
    if (logsRes.error) {
      setError(logsRes.error.message);
      setLogs([]);
    } else {
      setLogs(logsRes.data ?? []);
    }
    if (producersRes.data) setProducers(producersRes.data);
    if (asisRes.data) setAsistentes(asisRes.data);
    if (abogadosRes.data) setAbogados(abogadosRes.data);
    if (companiesRes.data) setCompanies(companiesRes.data);
    if (statusesRes.data) setStatuses(statusesRes.data.map((s) => ({ id: s.id, name: s.name })));
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
    loadAll();
  }, [isAdmin]);

  if (!adminChecked || !isAdmin) {
    return (
      <MainLayout>
        <LoadingSpinner text="Verificando acceso..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 8,
          }}
        >
          <h1 style={{ margin: 0, fontSize: 'clamp(22px, 4vw, 26px)', fontWeight: 700, color: '#0f172a' }}>
            Admin — Auditoría de reclamos
          </h1>
          <button
            type="button"
            onClick={loadAll}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              border: '1px solid #667eea',
              background: '#fff',
              color: '#667eea',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Actualizar
          </button>
        </div>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>
          Registro de cambios en los reclamos: quién los realizó (admin, asistente o productor), fecha y
          hora, y qué dato se modificó (valor anterior y nuevo).
        </p>

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
          placeholder="Buscar por usuario, reclamante, N° de reclamo o campo modificado..."
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
          <LoadingSpinner text="Cargando auditoría..." size={48} inline />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
              {filtered.length} de {resolvedLogs.length} registro{resolvedLogs.length !== 1 ? 's' : ''}
            </p>
            {filtered.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: 15 }}>
                {resolvedLogs.length === 0
                  ? 'Todavía no hay cambios registrados.'
                  : 'Ningún registro coincide con la búsqueda.'}
              </p>
            ) : (
              filtered.map(({ row, actor, changeItems }) => (
                <div
                  key={row.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 14,
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <ActionBadge action={row.action} />
                      <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{actor.name}</span>
                      <RoleBadge role={actor.role} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                      {formatDateTime(row.created_at)}
                    </div>
                  </div>

                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>
                    Reclamo{row.claim_number ? ` N° ${row.claim_number}` : ''}
                    {row.client_name ? ` — ${row.client_name}` : ''}
                    {row.claim_id != null ? ` (ID ${row.claim_id})` : ''}
                  </div>

                  {row.action === 'update' && changeItems.length > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {changeItems.map((ci, idx) => (
                        <div
                          key={idx}
                          style={{
                            fontSize: 13,
                            color: '#334155',
                            background: '#f8fafc',
                            border: '1px solid #eef2f7',
                            borderRadius: 8,
                            padding: '8px 10px',
                          }}
                        >
                          <span style={{ fontWeight: 700 }}>{ci.label}: </span>
                          <span style={{ color: '#94a3b8', textDecoration: 'line-through' }}>{ci.oldText}</span>
                          <span style={{ margin: '0 6px', color: '#94a3b8' }}>→</span>
                          <span style={{ color: '#0f172a', fontWeight: 600 }}>{ci.newText}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {row.action === 'insert' && (
                    <div style={{ marginTop: 8, fontSize: 13, color: '#334155' }}>Se creó el reclamo.</div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
