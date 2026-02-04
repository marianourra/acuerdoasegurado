import { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyClaimById, getClaimStatusesOrdered, type ClaimStatusStep } from '../services/claimsService';
import { claimTypeLabels, documentationLists, getAttachDocumentationWhatsAppUrl } from '../constants/claimTypes';
import type { ClaimTypeLetter } from '../services/claimsService';
import MainLayout from '../layouts/MainLayout';
import LoadingSpinner from '../components/LoadingSpinner';

const formatDate = (date: string | null | undefined) =>
  date
    ? new Date(date).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—';

export default function ClaimDetail() {
  const { id } = useParams();
  const location = useLocation();
  const claimId = Number(id);
  const { user } = useAuth();
  const justCreated = (location.state as { justCreated?: boolean } | null)?.justCreated === true;

  const [claim, setClaim] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [showDocPopover, setShowDocPopover] = useState(false);
  const [statusSteps, setStatusSteps] = useState<ClaimStatusStep[]>([]);

  useEffect(() => {
    if (!user || !claimId) return;
    const userId = user.id;
    async function load() {
      setLoading(true);
      setErrMsg(null);
      const { data, error } = await getMyClaimById(userId, claimId);
      if (error) {
        setErrMsg(error.message);
        setClaim(null);
      } else {
        setClaim(data);
      }
      setLoading(false);
    }
    load();
  }, [user, claimId]);

  useEffect(() => {
    if (!claim) return;
    getClaimStatusesOrdered().then(({ data }) => {
      if (data && data.length) setStatusSteps(data);
    });
  }, [claim]);

  if (loading) {
    return (
      <MainLayout>
        <LoadingSpinner text="Cargando reclamo..." />
      </MainLayout>
    );
  }

  if (errMsg) {
    return (
      <MainLayout>
        <div style={{ maxWidth: 560 }}>
          <Link
            to="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 24,
              color: '#667eea',
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
            }}
          >
            ← Volver a Mis reclamos
          </Link>
          <div
            style={{
              padding: 24,
              borderRadius: 16,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              fontSize: 15,
            }}
          >
            No se pudo cargar el reclamo: {errMsg}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!claim) {
    return (
      <MainLayout>
        <div style={{ maxWidth: 560 }}>
          <Link
            to="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 24,
              color: '#667eea',
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
            }}
          >
            ← Volver a Mis reclamos
          </Link>
          <div
            style={{
              padding: 24,
              borderRadius: 16,
              background: '#fff',
              border: '1px solid #e2e8f0',
              color: '#64748b',
              fontSize: 15,
            }}
          >
            No se encontró el reclamo.
          </div>
        </div>
      </MainLayout>
    );
  }

  const claimType = (claim.type as ClaimTypeLetter | null) ?? null;
  const typeLabel = claimType ? claimTypeLabels[claimType] : null;
  const producerName = claim.producers?.name ?? '';
  const isAcordado =
    claim.status_id === 'feb85213-84b6-46cf-8872-faa3a6a1b01d' ||
    claim.claim_statuses?.id === 'feb85213-84b6-46cf-8872-faa3a6a1b01d';

  const handleAdjuntarDocumentacion = () => {
    if (!claimType) return;
    const url = getAttachDocumentationWhatsAppUrl({
      producerName,
      clientName: claim.client_name ?? '',
      claimType,
    });
    window.open(url, '_blank');
  };

  const linkBack = (
    <Link
      to="/dashboard"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
        color: '#667eea',
        fontWeight: 600,
        fontSize: 14,
        textDecoration: 'none',
      }}
    >
      ← Volver a Mis reclamos
    </Link>
  );

  return (
    <MainLayout>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {linkBack}

        {justCreated && (
          <div
            style={{
              marginBottom: 24,
              padding: 20,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
              border: '1px solid #7dd3fc',
              color: '#0c4a6e',
              fontSize: 15,
              lineHeight: 1.5,
            }}
          >
            <strong>Reclamo creado.</strong> Por favor adjuntá la documentación correspondiente (podés usar el botón «Adjuntar documentación» para enviarla por WhatsApp).
          </div>
        )}

        {/* Card principal */}
        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}
        >
          {/* Header del reclamo */}
          <div
            style={{
              padding: '24px 28px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 16,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#64748b',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                Reclamo #{claim.claim_number}
              </div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 'clamp(20px, 4vw, 26px)',
                  fontWeight: 700,
                  color: '#0f172a',
                  lineHeight: 1.3,
                  wordBreak: 'break-word',
                }}
              >
                {claim.client_name}
              </h1>
              {typeLabel && (
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: 10,
                    padding: '6px 12px',
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%)',
                    color: '#667eea',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {typeLabel}
                </span>
              )}
              <div
                style={{
                  marginTop: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: '#475569',
                  fontSize: 14,
                }}
              >
                {claim.companies?.logo_url ? (
                  <img
                    src={claim.companies.logo_url}
                    alt=""
                    style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: '#e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      color: '#94a3b8',
                    }}
                  >
                    {claim.companies?.name?.charAt(0) ?? 'C'}
                  </div>
                )}
                <span>{claim.companies?.name || 'Compañía'}</span>
              </div>
            </div>
            <span
              style={{
                padding: '8px 14px',
                borderRadius: 12,
                backgroundColor: claim.claim_statuses?.color || '#64748b',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              {claim.claim_statuses?.name || 'Sin estado'}
            </span>
          </div>

          {/* Timeline estados (azul; "Sin acuerdo" y "Judicializado" solo si el reclamo está en ese estado; Judicializado al final) */}
          {statusSteps.length > 0 && (() => {
            const currentStatusId = claim.status_id ?? claim.claim_statuses?.id ?? null;
            const judicializadoStep = statusSteps.find((s) => s.name === 'Judicializado');
            let filteredSteps = statusSteps.filter((s) => {
              if (s.name === 'Judicializado') return false;
              if (s.name === 'Sin acuerdo') return s.id === currentStatusId;
              return true;
            });
            if (currentStatusId && judicializadoStep && judicializadoStep.id === currentStatusId) {
              filteredSteps = [...filteredSteps, judicializadoStep];
            }
            if (filteredSteps.length === 0) return null;

            const currentIndex = currentStatusId
              ? filteredSteps.findIndex((s) => s.id === currentStatusId)
              : -1;
            const stepIndex = currentIndex >= 0 ? currentIndex : 0;
            const n = filteredSteps.length;
            const progressPercent =
              n <= 1
                ? 100
                : stepIndex === n - 1
                  ? 100
                  : ((stepIndex + 0.5) / n) * 100;

            const timelineBlue = '#2563eb';

            return (
              <div
                style={{
                  padding: '24px 28px',
                  borderBottom: '1px solid #f1f5f9',
                  background: 'linear-gradient(180deg, #fafbff 0%, #fff 100%)',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#64748b',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    marginBottom: 20,
                  }}
                >
                  Estado de la gestión
                </div>
                <div
                  style={{
                    position: 'relative',
                    paddingBottom: 36,
                  }}
                >
                  {/* Barra de fondo */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: 14,
                      height: 6,
                      borderRadius: 3,
                      background: '#e2e8f0',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${progressPercent}%`,
                        borderRadius: 3,
                        background: timelineBlue,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                  {/* Steps: grid de columnas iguales para alinear barra con círculos */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${filteredSteps.length}, 1fr)`,
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {filteredSteps.map((step, i) => {
                      const isCompleted = i < stepIndex;
                      const isCurrent = i === stepIndex;
                      return (
                        <div
                          key={step.id}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                          }}
                        >
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              background: isCompleted || isCurrent ? timelineBlue : '#e2e8f0',
                              border: isCurrent ? '3px solid #fff' : 'none',
                              boxShadow: isCurrent ? `0 0 0 2px ${timelineBlue}` : '0 2px 8px rgba(0,0,0,0.08)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              transition: 'background 0.3s ease, box-shadow 0.3s ease',
                            }}
                          >
                            {isCompleted && (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            )}
                          </div>
                          <span
                            style={{
                              marginTop: 10,
                              fontSize: 11,
                              fontWeight: isCurrent ? 700 : 600,
                              color: isCurrent ? '#0f172a' : isCompleted ? '#475569' : '#94a3b8',
                              textAlign: 'center',
                              lineHeight: 1.2,
                              maxWidth: 80,
                            }}
                          >
                            {step.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Acción WhatsApp + info documentación */}
          {claimType && (
            <div style={{ padding: '20px 28px', background: '#fafafa', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleAdjuntarDocumentacion}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 20px',
                  borderRadius: 12,
                  border: 'none',
                  background: '#25D366',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 211, 102, 0.45)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 211, 102, 0.35)';
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Adjuntar documentación
              </button>
              <div
                style={{ position: 'relative', display: 'inline-flex' }}
                onMouseEnter={() => setShowDocPopover(true)}
                onMouseLeave={() => setShowDocPopover(false)}
              >
                <button
                  type="button"
                  aria-label="Ver documentación necesaria"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                    color: '#64748b',
                    cursor: 'pointer',
                    transition: 'color 0.2s ease, background 0.2s ease, border-color 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f0f4ff';
                    e.currentTarget.style.color = '#667eea';
                    e.currentTarget.style.borderColor = '#c7d2fe';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.color = '#64748b';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                </button>
                {showDocPopover && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '100%',
                      marginTop: 8,
                      minWidth: 320,
                      maxWidth: 420,
                      padding: 16,
                      background: '#fff',
                      borderRadius: 14,
                      boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                      border: '1px solid #e2e8f0',
                      zIndex: 50,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 12 }}>
                      Documentación necesaria
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 20, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {documentationLists[claimType].map((item, i) => (
                        <li key={i} style={{ fontSize: 14, color: '#334155', lineHeight: 1.4, position: 'relative' }}>
                          <span style={{ position: 'absolute', left: -16, color: '#667eea', fontWeight: 600 }}>{i + 1}.</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contenido */}
          <div style={{ padding: '28px' }}>
            {/* Observaciones del reclamo */}
            <section style={{ marginBottom: 28 }}>
              <h3
                style={{
                  margin: '0 0 12px',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#64748b',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Observaciones del reclamo
              </h3>
              <div
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  fontSize: 15,
                  color: '#334155',
                  lineHeight: 1.6,
                  minHeight: 48,
                }}
              >
                {claim.description || '—'}
              </div>
            </section>

            {/* Montos (solo Acordado) */}
            {isAcordado && (
              <section style={{ marginBottom: 28 }}>
                <h3
                  style={{
                    margin: '0 0 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#64748b',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  Montos
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      padding: 20,
                      borderRadius: 16,
                      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                      border: '1px solid #bae6fd',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0369a1', marginBottom: 6 }}>
                      Monto acuerdo
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#0c4a6e' }}>
                      {claim.amount_agreed == null ? '—' : `$${Number(claim.amount_agreed).toLocaleString()}`}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: 20,
                      borderRadius: 16,
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                      border: '1px solid #bbf7d0',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#15803d', marginBottom: 6 }}>
                      Beneficio productor
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#14532d' }}>
                      {claim.producer_profit == null ? '—' : `$${Number(claim.producer_profit).toLocaleString()}`}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Fechas */}
            <section>
              <h3
                style={{
                  margin: '0 0 12px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#94a3b8',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Fechas
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 1,
                  background: '#f1f5f9',
                  borderRadius: 12,
                  padding: 1,
                  overflow: 'hidden',
                }}
              >
                {[
                  { label: 'Fecha de inicio', value: claim.created_at },
                  { label: 'Última actualización', value: claim.updated_at },
                  { label: 'Fecha de finalización', value: claim.finished_at },
                  { label: 'Fecha estimativa de pago', value: claim.payment_date },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      padding: '12px 14px',
                      background: '#fff',
                      borderRadius: 10,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8', marginBottom: 2 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#334155' }}>
                      {formatDate(value)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
