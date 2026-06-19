import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCompanies } from '../services/companiesService';
import { getDefaultStatusId, createClaim } from '../services/claimsService';
import { getAdminProducers } from '../services/adminProducersService';
import { ensureStaffClaimsAccess } from '../utils/adminAccess';
import { claimTypeKeyToLetter, type ClaimTypeKey } from '../constants/claimTypes';
import DocumentationSectionsList from '../components/DocumentationSectionsList';
import MainLayout from '../layouts/MainLayout';
import LoadingSpinner from '../components/LoadingSpinner';

type ClaimType = ClaimTypeKey | null;

const CLAIMS_LIST_PATH = '/admin/claims';

export default function StaffNewClaimPage() {
  const navigate = useNavigate();

  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [linkedAsistenteId, setLinkedAsistenteId] = useState<string | null>(null);

  const [selectedType, setSelectedType] = useState<ClaimType>(null);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [producers, setProducers] = useState<{ id: number; name: string | null }[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState<string | null>(null);

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [producerId, setProducerId] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const access = await ensureStaffClaimsAccess(navigate);
      if (cancelled) return;
      setAccessChecked(true);
      if (!access.allowed) return;
      setHasAccess(true);
      setLinkedAsistenteId(access.asistenteId);
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (!hasAccess) return;
    (async () => {
      setCompaniesLoading(true);
      setCompaniesError(null);
      const [companiesRes, producersRes] = await Promise.all([
        getCompanies(),
        getAdminProducers(),
      ]);
      if (companiesRes.error) {
        setCompaniesError(companiesRes.error.message);
        setCompanies([]);
      } else {
        setCompanies(companiesRes.data ?? []);
        if (companiesRes.data?.length) setCompanyId(companiesRes.data[0].id);
      }
      if (producersRes.data) setProducers(producersRes.data);
      setCompaniesLoading(false);
    })();
  }, [hasAccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = clientName.trim();
    const phone = clientPhone.trim();
    if (!name) {
      setSubmitError('El nombre del reclamante es obligatorio.');
      return;
    }
    if (!phone) {
      setSubmitError('El teléfono del reclamante es obligatorio.');
      return;
    }
    if (!selectedType) {
      setSubmitError('Debe seleccionar el tipo de reclamo.');
      return;
    }
    if (!companyId) {
      setSubmitError('Debe seleccionar una compañía.');
      return;
    }

    setSubmitLoading(true);
    setSubmitError(null);

    try {
      const statusRes = await getDefaultStatusId();
      if (statusRes.error || !statusRes.data) {
        setSubmitError(statusRes.error?.message ?? 'No se pudo obtener el estado por defecto.');
        setSubmitLoading(false);
        return;
      }

      const { data: created, error } = await createClaim({
        producer_id: producerId || null,
        company_id: companyId,
        status_id: statusRes.data,
        client_name: name,
        type: claimTypeKeyToLetter[selectedType],
        client_phone: phone,
        asistente_id: linkedAsistenteId ?? undefined,
      });

      if (error) {
        setSubmitError(error.message);
        setSubmitLoading(false);
        return;
      }

      const claimId = (created as { id: number } | null)?.id;
      if (claimId != null) {
        navigate(CLAIMS_LIST_PATH, { state: { claimCreated: true, claimId } });
        return;
      }

      setSuccess(true);
      setSelectedType(null);
      setClientName('');
      setClientPhone('');
      setProducerId('');
      setCompanyId(companies[0]?.id ?? '');
      setSubmitLoading(false);
    } catch {
      setSubmitError('Error inesperado al crear el reclamo.');
      setSubmitLoading(false);
    }
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
      <div className="new-claim-page" style={{ maxWidth: 480, margin: '0 auto' }}>
        <Link
          to={CLAIMS_LIST_PATH}
          style={{
            display: 'inline-block',
            marginBottom: 16,
            textDecoration: 'none',
            color: '#667eea',
            fontWeight: 500,
            fontSize: 14,
          }}
        >
          ← Volver a reclamos
        </Link>

        <h1
          style={{
            margin: '0 0 24px',
            fontSize: 'clamp(22px, 5vw, 26px)',
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          Crear reclamo
        </h1>

        {companiesError && (
          <div
            style={{
              padding: 16,
              marginBottom: 24,
              borderRadius: 12,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              fontSize: 14,
            }}
          >
            {companiesError}
          </div>
        )}

        <div className="new-claim-type-row">
          <div
            className="new-claim-type-column"
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 16,
              padding: 'clamp(20px, 4vw, 32px)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              marginBottom: 24,
            }}
          >
            <h2 style={{ margin: 0, marginBottom: 24, fontSize: 20, fontWeight: 600, color: '#0f172a' }}>
              Selecciona el tipo de reclamo
            </h2>
            <div className="new-claim-type-buttons">
              {(
                [
                  ['autos', 'Daños a autos'],
                  ['lesiones', 'Lesiones'],
                  ['danos-y-lesiones', 'Daños y lesiones'],
                  ['otra-propiedad', 'Daños a otra propiedad'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedType(key)}
                  style={{
                    padding: '20px 24px',
                    borderRadius: 12,
                    border: selectedType === key ? '2px solid #667eea' : '2px solid #e2e8f0',
                    background: selectedType === key ? '#f0f4ff' : '#fff',
                    color: selectedType === key ? '#667eea' : '#64748b',
                    fontSize: 16,
                    fontWeight: selectedType === key ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div
            className="new-claim-doc-column"
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 16,
              padding: 'clamp(20px, 4vw, 32px)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              marginBottom: 24,
              minHeight: 200,
            }}
          >
            <h2 style={{ margin: 0, marginBottom: 20, fontSize: 20, fontWeight: 600, color: '#0f172a' }}>
              Documentación a tener presente
            </h2>
            {selectedType ? (
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20 }}>
                <DocumentationSectionsList type={claimTypeKeyToLetter[selectedType]} />
              </div>
            ) : (
              <p style={{ color: '#64748b', fontSize: 15, margin: 0 }}>
                Selecciona un tipo de reclamo para ver la documentación recomendada.
              </p>
            )}
          </div>
        </div>

        {selectedType && (
          <>
            {companiesLoading ? (
              <LoadingSpinner text="Cargando datos…" size={48} inline />
            ) : (
              <form
                onSubmit={handleSubmit}
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 16,
                  padding: 'clamp(20px, 4vw, 28px)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                {submitError && (
                  <div
                    style={{
                      marginBottom: 20,
                      padding: 14,
                      borderRadius: 10,
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#dc2626',
                      fontSize: 14,
                    }}
                  >
                    {submitError}
                  </div>
                )}

                {success && (
                  <div
                    style={{
                      marginBottom: 20,
                      padding: 14,
                      borderRadius: 10,
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      color: '#16a34a',
                      fontSize: 14,
                    }}
                  >
                    Reclamo creado correctamente.
                  </div>
                )}

                <div style={{ marginBottom: 20 }}>
                  <label htmlFor="client_name" style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#334155', marginBottom: 8 }}>
                    Nombre reclamante
                  </label>
                  <input
                    id="client_name"
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nombre del reclamante"
                    autoComplete="name"
                    style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 16, boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label htmlFor="client_phone" style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#334155', marginBottom: 8 }}>
                    Teléfono reclamante
                  </label>
                  <input
                    id="client_phone"
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Ej: +54 11 1234-5678"
                    autoComplete="tel"
                    style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 16, boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label htmlFor="producer_id" style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#334155', marginBottom: 8 }}>
                    Productor (opcional)
                  </label>
                  <select
                    id="producer_id"
                    value={producerId}
                    onChange={(e) => setProducerId(e.target.value)}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 16, background: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="">Sin productor asignado</option>
                    {producers.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.name ?? `Productor #${p.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label htmlFor="company_id" style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#334155', marginBottom: 8 }}>
                    Compañía a reclamar
                  </label>
                  <select
                    id="company_id"
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    disabled={!companies.length}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 16, background: '#fff', boxSizing: 'border-box' }}
                  >
                    {!companies.length && <option value="">Sin compañías</option>}
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitLoading || !companies.length}
                  style={{
                    width: '100%',
                    padding: 16,
                    borderRadius: 12,
                    border: 'none',
                    background: submitLoading || !companies.length ? '#cbd5e1' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: submitLoading || !companies.length ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submitLoading ? 'Creando reclamo…' : 'Crear reclamo'}
                </button>
              </form>
            )}
          </>
        )}

        <style>{`
          .new-claim-type-row { display: flex; flex-direction: column; gap: 0; }
          .new-claim-type-buttons { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
          @media (min-width: 769px) {
            .new-claim-page { max-width: 960px !important; }
            .new-claim-type-row { display: grid; grid-template-columns: 280px 1fr; gap: 24px; align-items: start; }
            .new-claim-type-column { margin-bottom: 0 !important; }
            .new-claim-type-buttons { display: flex; flex-direction: column; gap: 12px; }
            .new-claim-doc-column { margin-bottom: 0 !important; }
          }
        `}</style>
      </div>
    </MainLayout>
  );
}
