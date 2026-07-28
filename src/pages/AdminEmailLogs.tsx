import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { ensureAdminAccess } from '../utils/adminAccess';
import { getEmailLogs, type EmailLogRow } from '../services/emailLogsService';

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

function StatusBadge({ status }: { status: EmailLogRow['status'] }) {
  const ok = status === 'sent';
  return (
    <span
      style={{
        padding: '2px 10px',
        borderRadius: 999,
        background: ok ? '#f0fdf4' : '#fef2f2',
        color: ok ? '#16a34a' : '#dc2626',
        border: `1px solid ${ok ? '#bbf7d0' : '#fecaca'}`,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {ok ? 'Enviado' : 'Falló'}
    </span>
  );
}

export default function AdminEmailLogs() {
  const navigate = useNavigate();
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [logs, setLogs] = useState<EmailLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');

  const filteredLogs = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return logs;
    return logs.filter((l) => {
      const haystack = [l.recipient_email, l.recipient_name, l.client_name, l.claim_number, l.subject, l.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [logs, q]);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    const res = await getEmailLogs();
    if (res.error) {
      setError(res.error.message);
      setLogs([]);
    } else {
      setLogs(res.data ?? []);
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
    loadLogs();
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
            Admin — Emails enviados
          </h1>
          <button
            type="button"
            onClick={loadLogs}
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
          Registro de notificaciones enviadas a los productores (ej. reclamos que pasan a Acordado), con
          fecha y hora de envío.
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
          placeholder="Buscar por email, nombre, reclamante, N° de reclamo o asunto..."
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
          <LoadingSpinner text="Cargando registro de emails..." size={48} inline />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
              {filteredLogs.length} de {logs.length} email{logs.length !== 1 ? 's' : ''}
            </p>
            {filteredLogs.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: 15 }}>
                {logs.length === 0
                  ? 'Todavía no se registraron emails enviados.'
                  : 'Ningún email coincide con la búsqueda.'}
              </p>
            ) : (
              filteredLogs.map((l) => (
                <div
                  key={l.id}
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
                  <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <StatusBadge status={l.status} />
                      <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
                        {l.recipient_name || l.recipient_email}
                      </span>
                    </div>
                    {l.recipient_name && (
                      <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{l.recipient_email}</div>
                    )}
                    <div style={{ fontSize: 13, color: '#334155', marginTop: 6 }}>{l.subject ?? '—'}</div>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 12,
                        fontSize: 12,
                        color: '#94a3b8',
                        marginTop: 6,
                      }}
                    >
                      {l.client_name && <span>Reclamante: {l.client_name}</span>}
                      {l.claim_number && <span>Reclamo N° {l.claim_number}</span>}
                      {l.claim_id != null && <span>ID reclamo: {l.claim_id}</span>}
                    </div>
                    {l.status === 'failed' && l.error && (
                      <div style={{ fontSize: 12, color: '#dc2626', marginTop: 6, wordBreak: 'break-word' }}>
                        Error: {l.error}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                      {formatDateTime(l.created_at)}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>fecha y hora de envío</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
