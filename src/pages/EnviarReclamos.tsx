import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import MainLayout from '../layouts/MainLayout';

type ClaimType = 'autos' | 'lesiones' | 'otra-propiedad' | null;

const documentationLists = {
  autos: [
    'Foto de ambos lados de la cédula de identificación del vehículo',
    'Foto de ambos lados del registro de conducir',
    'Foto DNI ambos lados del titular del rodado (en caso de persona jurídica, copia del estatuto y acta de designación de autoridades)',
    'Presupuesto de reparación',
    'Fotos de los daños del vehículo, incluida alguna donde se vea la patente',
    'Constancia de cobertura',
    'Denuncia de siniestro',
    'Constancia CBU bancaria del titular del vehículo',
  ],
  lesiones: [
    'Foto DNI ambos lados del damnificado',
    'Denuncia policial (si aplica)',
    'Certificados médicos o copia de historia clínica',
    'Tickets o facturas de gastos médicos',
    'Recibo de sueldo',
    'Constancia CBU bancaria del damnificado',
  ],
  'otra-propiedad': [
    'Título o documentación de la propiedad',
    'Foto ambos lados DNI del titular de la propiedad dañada',
    'Presupuesto o factura de reparación del daño',
    'Fotos de los daños',
    'Constancia CBU bancaria del propietario',
  ],
};

export default function EnviarReclamos() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<ClaimType>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [producerName, setProducerName] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<{
    clientName?: string;
    phoneNumber?: string;
  }>({});

  useEffect(() => {
    async function loadProducerName() {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('producers')
        .select('name')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setProducerName(data.name);
      }
    }

    loadProducerName();
  }, [user]);

  const handleSendWhatsApp = () => {
    if (!selectedType) return;

    // Validar campos obligatorios
    const errors: { clientName?: string; phoneNumber?: string } = {};
    
    if (!clientName.trim()) {
      errors.clientName = 'El nombre del asegurado es obligatorio';
    }
    
    if (!phoneNumber.trim()) {
      errors.phoneNumber = 'El teléfono de contacto es obligatorio';
    }

    // Si hay errores, mostrarlos y no enviar
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Limpiar errores si todo está bien
    setValidationErrors({});

    const typeLabels = {
      autos: 'Daños a automotor',
      lesiones: 'Lesiones',
      'otra-propiedad': 'Daños a otra propiedad',
    };

    let message = `Hola, quiero enviar un nuevo reclamo.\n\nTipo de reclamo: ${typeLabels[selectedType]}\n\n`;
    
    if (producerName) {
      message += `PAS: ${producerName}\n`;
    }
    
    message += `Nombre del asegurado: ${clientName.trim()}\n`;
    message += `Teléfono de contacto del asegurado: ${phoneNumber.trim()}\n`;

    const whatsappUrl = `https://wa.me/542235698202?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

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
          ← Volver a Mis reclamos
        </Link>

        <h1 style={{ margin: 0, fontSize: 'clamp(24px, 5vw, 28px)', fontWeight: 700, color: '#0f172a', marginBottom: 32 }}>
          Enviar nuevo reclamo
        </h1>

        <div
          style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: 'clamp(20px, 4vw, 32px)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            marginBottom: 32,
          }}
        >
          <h2
            style={{
              margin: 0,
              marginBottom: 24,
              fontSize: 20,
              fontWeight: 600,
              color: '#0f172a',
            }}
          >
            Selecciona el tipo de reclamo
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            <button
              onClick={() => setSelectedType('autos')}
              style={{
                padding: '20px 24px',
                borderRadius: 12,
                border: selectedType === 'autos' ? '2px solid #667eea' : '2px solid #e2e8f0',
                background: selectedType === 'autos' ? '#f0f4ff' : 'white',
                color: selectedType === 'autos' ? '#667eea' : '#64748b',
                fontSize: 16,
                fontWeight: selectedType === 'autos' ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center',
              }}
              onMouseEnter={(e) => {
                if (selectedType !== 'autos') {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.background = '#f8fafc';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedType !== 'autos') {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = 'white';
                }
              }}
            >
              Daños a autos
            </button>

            <button
              onClick={() => setSelectedType('lesiones')}
              style={{
                padding: '20px 24px',
                borderRadius: 12,
                border: selectedType === 'lesiones' ? '2px solid #667eea' : '2px solid #e2e8f0',
                background: selectedType === 'lesiones' ? '#f0f4ff' : 'white',
                color: selectedType === 'lesiones' ? '#667eea' : '#64748b',
                fontSize: 16,
                fontWeight: selectedType === 'lesiones' ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center',
              }}
              onMouseEnter={(e) => {
                if (selectedType !== 'lesiones') {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.background = '#f8fafc';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedType !== 'lesiones') {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = 'white';
                }
              }}
            >
              Lesiones
            </button>

            <button
              onClick={() => setSelectedType('otra-propiedad')}
              style={{
                padding: '20px 24px',
                borderRadius: 12,
                border: selectedType === 'otra-propiedad' ? '2px solid #667eea' : '2px solid #e2e8f0',
                background: selectedType === 'otra-propiedad' ? '#f0f4ff' : 'white',
                color: selectedType === 'otra-propiedad' ? '#667eea' : '#64748b',
                fontSize: 16,
                fontWeight: selectedType === 'otra-propiedad' ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center',
              }}
              onMouseEnter={(e) => {
                if (selectedType !== 'otra-propiedad') {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.background = '#f8fafc';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedType !== 'otra-propiedad') {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = 'white';
                }
              }}
            >
              Daños a otra propiedad
            </button>
          </div>
        </div>

        {selectedType && (
          <div
          style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: 'clamp(20px, 4vw, 32px)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            marginBottom: 32,
          }}
          >
            <h2
              style={{
                margin: 0,
                marginBottom: 20,
                fontSize: 20,
                fontWeight: 600,
                color: '#0f172a',
              }}
            >
              Documentación a tener presente
            </h2>

            <div
              style={{
                background: '#f8fafc',
                borderRadius: 12,
                padding: 20,
                marginBottom: 24,
              }}
            >
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 20,
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {documentationLists[selectedType].map((doc, index) => (
                  <li
                    key={index}
                    style={{
                      fontSize: 15,
                      color: '#334155',
                      position: 'relative',
                      paddingLeft: 24,
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        left: 0,
                        color: '#667eea',
                        fontWeight: 600,
                      }}
                    >
                      {index + 1}.
                    </span>
                    {doc}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#334155',
                    marginBottom: 8,
                  }}
                >
                  Nombre del asegurado <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    // Limpiar error cuando el usuario empieza a escribir
                    if (validationErrors.clientName) {
                      setValidationErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.clientName;
                        return newErrors;
                      });
                    }
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: validationErrors.clientName ? '2px solid #dc2626' : '2px solid #e2e8f0',
                    fontSize: 15,
                    transition: 'all 0.2s ease',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = validationErrors.clientName ? '#dc2626' : '#667eea';
                    e.currentTarget.style.boxShadow = validationErrors.clientName 
                      ? '0 0 0 3px rgba(220, 38, 38, 0.1)' 
                      : '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = validationErrors.clientName ? '#dc2626' : '#e2e8f0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                {validationErrors.clientName && (
                  <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4, margin: 0 }}>
                    {validationErrors.clientName}
                  </p>
                )}
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#334155',
                    marginBottom: 8,
                  }}
                >
                  Teléfono de contacto del asegurado <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="tel"
                  placeholder="Ej: +54 11 1234-5678"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    // Limpiar error cuando el usuario empieza a escribir
                    if (validationErrors.phoneNumber) {
                      setValidationErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.phoneNumber;
                        return newErrors;
                      });
                    }
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: validationErrors.phoneNumber ? '2px solid #dc2626' : '2px solid #e2e8f0',
                    fontSize: 15,
                    transition: 'all 0.2s ease',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = validationErrors.phoneNumber ? '#dc2626' : '#667eea';
                    e.currentTarget.style.boxShadow = validationErrors.phoneNumber 
                      ? '0 0 0 3px rgba(220, 38, 38, 0.1)' 
                      : '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = validationErrors.phoneNumber ? '#dc2626' : '#e2e8f0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                {validationErrors.phoneNumber && (
                  <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4, margin: 0 }}>
                    {validationErrors.phoneNumber}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleSendWhatsApp}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Enviar reclamo
            </button>

            <div
              style={{
                marginTop: 20,
                padding: '14px 16px',
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: '#0369a1',
                  lineHeight: 1.5,
                }}
              >
                Los nuevos reclamos serán visualizados dentro de las 48hs de enviados.
              </p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
