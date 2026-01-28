import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyClaimById } from '../services/claimsService';
import MainLayout from '../layouts/MainLayout';

export default function ClaimDetail() {
  const { id } = useParams();
  const claimId = Number(id);
  const { user } = useAuth();

  const [claim, setClaim] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !claimId) return;

    const userId = user.id;

    async function load() {
      setLoading(true);
      setErrMsg(null);

      const { data, error } = await getMyClaimById(userId, claimId);

      if (error) {
        console.error(error);
        setErrMsg(error.message);
        setClaim(null);
      } else {
        setClaim(data);
      }

      setLoading(false);
    }

    load();
  }, [user?.id, claimId]);

  if (loading) return <MainLayout><p style={{ padding: 16 }}>Cargando reclamo...</p></MainLayout>;

  if (errMsg) {
    return (
      <MainLayout>
        <div>
          <Link to="/dashboard" style={{ textDecoration: 'none', color: '#667eea', fontWeight: 500 }}>← Volver</Link>
          <p style={{ color: 'red', marginTop: 16 }}>Error: {errMsg}</p>
        </div>
      </MainLayout>
    );
  }

  if (!claim) {
    return (
      <MainLayout>
        <div>
          <Link to="/dashboard" style={{ textDecoration: 'none', color: '#667eea', fontWeight: 500 }}>← Volver</Link>
          <p style={{ marginTop: 16 }}>No se encontró el reclamo.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
    <div>
      <Link to="/dashboard" style={{ textDecoration: 'none' }}>
        ← Volver
      </Link>

      <div
        style={{
          marginTop: 12,
          border: '1px solid #ddd',
          padding: 16,
          borderRadius: 16,
          background: '#fff',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h2 style={{ margin: 0, fontSize: 'clamp(18px, 4vw, 24px)', wordBreak: 'break-word' }}>
              Reclamo #{claim.claim_number} — {claim.client_name}
            </h2>

            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              {claim.companies?.logo_url ? (
                <img
                  src={claim.companies.logo_url}
                  alt={claim.companies.name}
                  style={{ width: 26, height: 26, borderRadius: 8, objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: 26, height: 26, borderRadius: 8, background: '#eee' }} />
              )}
              <span style={{ color: '#444' }}>{claim.companies?.name || 'Compañía'}</span>
            </div>
          </div>

          <span
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              backgroundColor: claim.claim_statuses?.color || '#6B7280',
              color: '#fff',
              fontSize: 12,
              fontWeight: 800,
              height: 'fit-content',
              whiteSpace: 'nowrap',
            }}
          >
            {claim.claim_statuses?.name || 'Sin estado'}
          </span>
        </div>

        <hr style={{ margin: '16px 0', borderColor: '#eee' }} />

        <div style={{ display: 'grid', gap: 10 }}>
          <div>
            <strong>Observaciones</strong>
            <div style={{ marginTop: 4 }}>{claim.description}</div>
          </div>

          {/* Bloque destacado: Montos */}
          <div
            style={{
              marginTop: 24,
              padding: 20,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              border: '1px solid #7dd3fc',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 24,
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: '#0369a1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Monto acuerdo
              </div>
              <div style={{ marginTop: 6, fontSize: 22, fontWeight: 700, color: '#0c4a6e' }}>
                {claim.amount_agreed == null
                  ? '—'
                  : `$${Number(claim.amount_agreed).toLocaleString()}`}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#0369a1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Beneficio productor
              </div>
              <div style={{ marginTop: 6, fontSize: 22, fontWeight: 700, color: '#0c4a6e' }}>
                {claim.producer_profit == null
                  ? '—'
                  : `$${Number(claim.producer_profit).toLocaleString()}`}
              </div>
            </div>
          </div>

          {/* Fechas */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Fechas
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <div>
                <strong style={{ fontSize: 13, color: '#374151' }}>Fecha de inicio</strong>
                <div style={{ marginTop: 4, fontSize: 14, color: '#4b5563' }}>
                  {claim.created_at
                    ? new Date(claim.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : '—'}
                </div>
              </div>
              <div>
                <strong style={{ fontSize: 13, color: '#374151' }}>Última actualización</strong>
                <div style={{ marginTop: 4, fontSize: 14, color: '#4b5563' }}>
                  {claim.updated_at
                    ? new Date(claim.updated_at).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : '—'}
                </div>
              </div>
              <div>
                <strong style={{ fontSize: 13, color: '#374151' }}>Fecha de finalización</strong>
                <div style={{ marginTop: 4, fontSize: 14, color: '#4b5563' }}>
                  {claim.finished_at
                    ? new Date(claim.finished_at).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </MainLayout>
  );
}
