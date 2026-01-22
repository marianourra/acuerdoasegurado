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
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>
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
            <strong>Descripción</strong>
            <div style={{ marginTop: 4 }}>{claim.description}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <strong>Monto reclamado</strong>
              <div style={{ marginTop: 4 }}>
                ${Number(claim.amount_claimed || 0).toLocaleString()}
              </div>
            </div>

            <div>
              <strong>Monto acuerdo</strong>
              <div style={{ marginTop: 4 }}>
                {claim.amount_agreed == null
                  ? '—'
                  : `$${Number(claim.amount_agreed).toLocaleString()}`}
              </div>
            </div>

            <div>
              <strong>Profit productor</strong>
              <div style={{ marginTop: 4 }}>
                {claim.producer_profit == null
                  ? '—'
                  : `$${Number(claim.producer_profit).toLocaleString()}`}
              </div>
            </div>

            <div>
              <strong>Última actualización</strong>
              <div style={{ marginTop: 4 }}>
                {new Date(claim.updated_at || claim.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </MainLayout>
  );
}
