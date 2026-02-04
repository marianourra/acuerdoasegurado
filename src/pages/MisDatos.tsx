import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProducerData, updateProducerData } from '../services/producerService';
import MainLayout from '../layouts/MainLayout';
import LoadingSpinner from '../components/LoadingSpinner';

/** Convierte el valor del CBU a string de dígitos, evitando notación científica cuando viene como número */
function cbuToDisplay(value: unknown): string {
  if (value == null || value === '') return '';
  if (typeof value === 'string') return value.replace(/\D/g, '');
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '';
    // Evitar notación científica: usar toLocaleString con fullwide para números grandes
    return value.toLocaleString('fullwide', { useGrouping: false }).replace(/\D/g, '');
  }
  return String(value).replace(/\D/g, '');
}

export default function MisDatos() {
  const { user, loading: authLoading } = useAuth();
  const [producerData, setProducerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    cbu: '',
  });

  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    phone?: string;
    cbu?: string;
  }>({});

  const loadData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await getProducerData(user.id);

    if (fetchError) {
      console.error('❌ Error cargando datos:', fetchError);
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    if (data) {
      setProducerData(data);
      setFormData({
        email: data.email || '',
        phone: data.phone != null ? String(data.phone) : '',
        cbu: cbuToDisplay(data.cbu),
      });
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!producerData) return;

    setSaving(true);
    setError(null);
    setSuccess(false);
    setValidationErrors({});

    // Validar CBU si tiene valor - asegurar que sea string
    const cbuValue = formData.cbu != null ? String(formData.cbu) : '';
    const cbuTrimmed = cbuValue.trim();
    if (cbuTrimmed && !validateCBU(cbuTrimmed)) {
      setValidationErrors({ cbu: 'El CBU debe tener exactamente 22 dígitos' });
      setSaving(false);
      return;
    }

    const updates: { email?: string; phone?: string | null; cbu?: string } = {};

    // Actualizar teléfono si cambió
    const phoneTrimmed = (formData.phone != null ? String(formData.phone) : '').trim();
    const currentPhone = (producerData.phone != null ? String(producerData.phone) : '').trim();
    if (phoneTrimmed !== currentPhone) {
      updates.phone = phoneTrimmed === '' ? null : phoneTrimmed;
    }

    // Solo actualizar CBU si tiene 22 dígitos o si se está borrando (vacío)
    const currentCbu = cbuToDisplay(producerData.cbu);
    if (cbuTrimmed !== currentCbu) {
      if (cbuTrimmed === '') {
        // Permitir borrar el CBU
        updates.cbu = null as any;
      } else if (validateCBU(cbuTrimmed)) {
        updates.cbu = cbuTrimmed;
      }
    }

    if (Object.keys(updates).length === 0) {
      setSaving(false);
      return;
    }

    try {
      if (!user) {
        setError('No se pudo identificar al usuario. Por favor, recargue la página.');
        setSaving(false);
        return;
      }

      console.log('Actualizando con:', updates);
      const { data, error: updateError } = await updateProducerData(producerData.id, updates, user.id);

      if (updateError) {
        console.error('❌ Error actualizando datos:', updateError);
        setError(updateError.message || 'Error al actualizar los datos. Por favor, intente nuevamente.');
        setSaving(false);
        return;
      }

      if (data) {
        console.log('Datos actualizados:', data);
      // Actualizar el estado local
      setProducerData(data);
      setFormData({
        email: data.email || '',
        phone: data.phone != null ? String(data.phone) : '',
        cbu: cbuToDisplay(data.cbu),
      });
        setSuccess(true);
        
        // Recargar los datos desde la base de datos para confirmar
        setTimeout(async () => {
          try {
            await loadData();
          } catch (err) {
            console.error('Error al recargar datos:', err);
          } finally {
            setSuccess(false);
            setSaving(false);
          }
        }, 1500);
      } else {
        setError('No se recibieron datos actualizados. Por favor, recargue la página.');
        setSaving(false);
      }
    } catch (err) {
      console.error('Error inesperado:', err);
      setError('Ocurrió un error inesperado. Por favor, intente nuevamente.');
      setSaving(false);
    }
  };

  const validateCBU = (cbu: string): boolean => {
    // CBU debe tener exactamente 22 dígitos
    const digitsOnly = cbu.replace(/\D/g, '');
    return digitsOnly.length === 22;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Limpiar errores de validación cuando el usuario empieza a escribir
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof typeof validationErrors];
        return newErrors;
      });
    }

    // Para CBU, solo permitir números
    if (name === 'cbu') {
      const digitsOnly = value.replace(/\D/g, '');
      setFormData((prev) => ({
        ...prev,
        [name]: digitsOnly,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  if (authLoading || loading) {
    return (
      <MainLayout>
        <LoadingSpinner text="Cargando datos..." />
      </MainLayout>
    );
  }

  if (!user) return null;

  return (
    <MainLayout>
      <div>
        <Link
          to="/dashboard"
          style={{
            textDecoration: 'none',
            color: '#667eea',
            fontWeight: 500,
            fontSize: 14,
            display: 'inline-block',
            marginBottom: 24,
          }}
        >
          ← Volver al dashboard
        </Link>

        <h1 style={{ margin: 0, fontSize: 'clamp(24px, 5vw, 28px)', fontWeight: 700, color: '#0f172a', marginBottom: 32 }}>
          Mis datos
        </h1>

        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 12,
              padding: '16px',
              marginBottom: 24,
              color: '#dc2626',
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 12,
              padding: '16px',
              marginBottom: 24,
              color: '#16a34a',
              fontSize: 14,
            }}
          >
            Datos actualizados correctamente
          </div>
        )}

        <div
          style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: 'clamp(20px, 4vw, 32px)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#334155',
                  marginBottom: 8,
                }}
              >
                Nombre
              </label>
              <input
                type="text"
                value={producerData?.name || ''}
                disabled
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: '2px solid #e2e8f0',
                  fontSize: 15,
                  background: '#f8fafc',
                  color: '#64748b',
                  cursor: 'not-allowed',
                }}
              />
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 4, margin: 0 }}>
                El nombre no se puede modificar
              </p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#334155',
                  marginBottom: 8,
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={producerData?.email || formData.email || ''}
                disabled
                readOnly
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: '2px solid #e2e8f0',
                  fontSize: 15,
                  background: '#f8fafc',
                  color: '#64748b',
                  cursor: 'not-allowed',
                }}
              />
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 4, margin: 0 }}>
                El correo electrónico no se puede modificar por ahora
              </p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#334155',
                  marginBottom: 8,
                }}
              >
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                value={String(formData.phone || '')}
                onChange={handleChange}
                placeholder="Ej: +54 11 1234-5678"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: validationErrors.phone ? '2px solid #dc2626' : '2px solid #e2e8f0',
                  fontSize: 15,
                  transition: 'all 0.2s ease',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = validationErrors.phone ? '#dc2626' : '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              {validationErrors.phone && (
                <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4, margin: 0 }}>
                  {validationErrors.phone}
                </p>
              )}
            </div>

            <div style={{ marginBottom: 32 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#334155',
                  marginBottom: 8,
                }}
              >
                CBU
              </label>
              <input
                type="text"
                name="cbu"
                value={cbuToDisplay(formData.cbu)}
                onChange={handleChange}
                placeholder="Ej: 1234567890123456789012"
                maxLength={22}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: validationErrors.cbu ? '2px solid #dc2626' : '2px solid #e2e8f0',
                  fontSize: 15,
                  transition: 'all 0.2s ease',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = validationErrors.cbu ? '#dc2626' : '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              {validationErrors.cbu ? (
                <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4, margin: 0 }}>
                  {validationErrors.cbu}
                </p>
              ) : (
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 4, margin: 0 }}>
                  Clave Bancaria Uniforme (22 dígitos) {formData.cbu && String(formData.cbu).length > 0 && `- ${String(formData.cbu).length}/22`}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 12,
                border: 'none',
                background: saving
                  ? '#cbd5e1'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: 16,
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: saving ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              onMouseEnter={(e) => {
                if (!saving) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!saving) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                }
              }}
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
