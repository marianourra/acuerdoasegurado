import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { isCurrentUserAdmin } from '../services/adminService';
import { getAdminProducers } from '../services/adminProducersService';
import { getAdminTransfers, createTransfer, type AdminTransferRow } from '../services/transfersService';
import AdminNav from '../components/AdminNav';
import { formatDateLocal, getTodayLocalYYYYMMDD } from '../utils/dateUtils';

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  fontSize: 14,
} as const;

const labelStyle = {
  display: 'block' as const,
  fontSize: 12,
  fontWeight: 600,
  color: '#475569',
  marginBottom: 4,
};

export default function AdminTransfers() {
  const navigate = useNavigate();
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [producers, setProducers] = useState<{ id: number; name: string | null }[]>([]);
  const [transfers, setTransfers] = useState<AdminTransferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [form, setForm] = useState<{
    producer_id: string;
    transfer_date: string;
    amount: number;
    currency: string;
    method: string;
    reference: string;
    notes: string;
  }>({
    producer_id: '',
    transfer_date: getTodayLocalYYYYMMDD(),
    amount: 0,
    currency: 'ARS',
    method: '',
    reference: '',
    notes: '',
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
    Promise.all([getAdminProducers(), getAdminTransfers()])
      .then(([producersRes, transfersRes]) => {
        if (producersRes.error) {
          setError(producersRes.error.message);
          setProducers([]);
        } else {
          setProducers((producersRes.data ?? []).map((p) => ({ id: p.id, name: p.name })));
        }
        if (transfersRes.error) {
          if (!producersRes.error) setError(transfersRes.error.message);
          setTransfers([]);
        } else {
          setTransfers(transfersRes.data ?? []);
        }
      })
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const producerSelect = formEl.elements.namedItem('producer_id') as HTMLSelectElement | null;
    const rawProducerId = producerSelect?.value?.trim() ?? '';
    if (!rawProducerId) {
      setSubmitError('Seleccioná un productor.');
      return;
    }
    const producerId = /^\d+$/.test(rawProducerId) ? Number(rawProducerId) : rawProducerId;
    if (!form.transfer_date.trim()) {
      setSubmitError('La fecha es obligatoria.');
      return;
    }
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setSubmitError('El monto debe ser mayor a 0.');
      return;
    }
    setSubmitLoading(true);
    setSubmitError(null);
    const { data, error: err } = await createTransfer({
      producer_id: producerId,
      transfer_date: form.transfer_date,
      amount,
      currency: form.currency?.trim() || 'ARS',
      method: form.method?.trim() || undefined,
      reference: form.reference?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
    });
    setSubmitLoading(false);
    if (err) {
      setSubmitError(err.message);
      return;
    }
    const producerName = producers.find((p) => String(p.id) === String(producerId))?.name ?? 'Productor';
    setSuccessMsg(`Transferencia de ${amount.toLocaleString('es-AR')} ${form.currency || 'ARS'} registrada para ${producerName}.`);
    setForm((f) => ({
      ...f,
      producer_id: '',
      amount: 0,
      reference: '',
      notes: '',
    }));
    if (data) {
      setTransfers((prev) => [
        {
          id: data.id,
          producer_id: data.producer_id,
          transfer_date: data.transfer_date,
          amount: data.amount,
          currency: data.currency,
          method: data.method,
          reference: data.reference,
          notes: data.notes,
          producers: { name: producerName },
        },
        ...prev,
      ]);
    }
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const formatAmount = (amount: number, currency: string) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency || 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

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
        <AdminNav active="transfers" />
        <h1 style={{ margin: '0 0 24px', fontSize: 'clamp(22px, 4vw, 26px)', fontWeight: 700, color: '#0f172a' }}>
          Admin — Transferencias de pagos
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
            Nueva transferencia
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {submitError && (
              <div style={{ padding: 10, borderRadius: 8, background: '#fef2f2', color: '#dc2626', fontSize: 13 }}>
                {submitError}
              </div>
            )}
            <div>
              <label style={labelStyle}>Productor *</label>
              <select
                name="producer_id"
                value={form.producer_id}
                onChange={(e) => setForm((f) => ({ ...f, producer_id: e.target.value }))}
                required
                style={inputStyle}
              >
                <option value="">Seleccionar productor</option>
                {producers.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name ?? `ID ${p.id}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Fecha *</label>
              <input
                type="date"
                value={form.transfer_date}
                onChange={(e) => setForm((f) => ({ ...f, transfer_date: e.target.value }))}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Monto *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount || ''}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value === '' ? 0 : Number(e.target.value) }))}
                required
                placeholder="0,00"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Moneda</label>
              <input
                type="text"
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                placeholder="ARS"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Método / Referencia</label>
              <input
                type="text"
                value={form.reference}
                onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                placeholder="Ej: Nro de operación"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Notas</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Opcional"
                style={{ ...inputStyle, resize: 'vertical' }}
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
              {submitLoading ? 'Guardando...' : 'Registrar transferencia'}
            </button>
          </form>
        </div>

        {loading ? (
          <LoadingSpinner text="Cargando listado..." size={48} inline />
        ) : transfers.length > 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: '#0f172a' }}>
              Últimas transferencias ({transfers.length})
            </h3>
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {transfers.map((t) => (
                <li
                  key={t.id}
                  style={{
                    padding: '12px 14px',
                    background: '#f8fafc',
                    borderRadius: 10,
                    fontSize: 14,
                    color: '#334155',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <strong>{t.producers?.name ?? `Productor #${t.producer_id}`}</strong>
                  {' — '}
                  {formatDateLocal(t.transfer_date)}
                  {' · '}
                  {formatAmount(t.amount, t.currency)}
                  {t.reference && ` · ${t.reference}`}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p style={{ color: '#64748b', fontSize: 14 }}>No hay transferencias registradas.</p>
        )}
      </div>
    </MainLayout>
  );
}
