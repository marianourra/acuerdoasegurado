import { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyClaimById } from '../services/claimsService';
import { claimTypeLabels, getAttachDocumentationWhatsAppUrl } from '../constants/claimTypes';
import type { ClaimTypeLetter } from '../services/claimsService';
import MainLayout from '../layouts/MainLayout';

export default function ClaimDetail() {
  const { id } = useParams();
  const location = useLocation();
  const claimId = Number(id);
  const { user } = useAuth();
  const justCreated = (location.state as { justCreated?: boolean } | null)?.justCreated === true;

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

  const claimType = (claim.type as ClaimTypeLetter | null) ?? null;
  const typeLabel = claimType ? claimTypeLabels[claimType] : null;
  const producerName = claim.producers?.name ?? '';

  const handleAdjuntarDocumentacion = () => {
    if (!claimType) return;
    const url = getAttachDocumentationWhatsAppUrl({
      producerName,
      clientName: claim.client_name ?? '',
      claimType,
    });
    window.open(url, '_blank');
  };

  return (
    <MainLayout>
    <div>
      <Link to="/dashboard" style={{ textDecoration: 'none' }}>
        ← Volver
      </Link>

      {justCreated && (
        <div
          style={{
            marginTop: 12,
            padding: 16,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
            border: '1px solid #7dd3fc',
            color: '#0c4a6e',
            fontSize: 15,
          }}
        >
          <strong>Reclamo creado.</strong> Por favor adjuntá la documentación correspondiente a este tipo de reclamo (podés usar el botón «Adjuntar documentación» para enviarla por WhatsApp).
        </div>
      )}

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

            {typeLabel && (
              <div style={{ marginTop: 6, fontSize: 14, color: '#667eea', fontWeight: 600 }}>
                {typeLabel}
              </div>
            )}

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

        {claimType && (
          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              onClick={handleAdjuntarDocumentacion}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 10,
                border: 'none',
                background: '#25D366',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(37, 211, 102, 0.4)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Adjuntar documentación
            </button>
          </div>
        )}

        <hr style={{ margin: '16px 0', borderColor: '#eee' }} />

        <div style={{ display: 'grid', gap: 10 }}>
          <div>
            <strong>Observaciones</strong>
            <div style={{ marginTop: 4 }}>{claim.description}</div>
          </div>

          {/* Bloque destacado: Montos — solo si estado es Acordado */}
          {(claim.status_id === 'feb85213-84b6-46cf-8872-faa3a6a1b01d' || claim.claim_statuses?.id === 'feb85213-84b6-46cf-8872-faa3a6a1b01d') && (
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
          )}

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
              <div>
                <strong style={{ fontSize: 13, color: '#374151' }}>Fecha estimada de pago</strong>
                <div style={{ marginTop: 4, fontSize: 14, color: '#4b5563' }}>
                  {claim.payment_date
                    ? new Date(claim.payment_date).toLocaleDateString('es-AR', {
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
