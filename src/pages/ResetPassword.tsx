import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import logo from '../images/logo.png';
import backImage from '../images/back.png';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Función para extraer tokens del hash
    const extractTokensFromHash = (hash: string) => {
      let accessToken: string | null = null;
      let type: string | null = null;
      let refreshToken: string | null = null;

      if (hash.includes('access_token')) {
        const accessTokenMatch = hash.match(/[#&?]access_token=([^&]+)/);
        const typeMatch = hash.match(/[#&?]type=([^&]+)/);
        const refreshTokenMatch = hash.match(/[#&?]refresh_token=([^&]+)/);
        
        if (accessTokenMatch) accessToken = decodeURIComponent(accessTokenMatch[1]);
        if (typeMatch) type = decodeURIComponent(typeMatch[1]);
        if (refreshTokenMatch) refreshToken = decodeURIComponent(refreshTokenMatch[1]);
      }

      return { accessToken, type, refreshToken };
    };

    // Manejar la redirección de Supabase cuando viene del email
    const handleAuthCallback = async () => {
      try {
        const fullHash = window.location.hash;
        const { accessToken, type, refreshToken } = extractTokensFromHash(fullHash);

        // Si encontramos tokens de recuperación, establecer la sesión
        if (type === 'recovery' && accessToken && refreshToken) {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!mounted) return;

          if (sessionError) {
            console.error('Error estableciendo sesión:', sessionError);
            setError('El enlace de recuperación no es válido o ha expirado.');
            setVerifying(false);
            return;
          }

          // Obtener el email del usuario autenticado
          if (sessionData?.user?.email) {
            setUserEmail(sessionData.user.email);
          }

          // Limpiar el hash de la URL para seguridad, manteniendo solo la ruta
          window.history.replaceState(null, '', window.location.pathname + '#/reset-password');
          
          setVerifying(false);
        } else {
          // Verificar si ya hay una sesión activa
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (!mounted) return;

          if (sessionError) {
            console.error('Error obteniendo sesión:', sessionError);
          }
          
          if (session?.user) {
            setUserEmail(session.user.email || null);
            setVerifying(false);
          } else {
            setError('El enlace de recuperación no es válido o ha expirado. Por favor, solicita un nuevo enlace desde la pantalla de login.');
            setVerifying(false);
          }
        }
      } catch (err: any) {
        if (!mounted) return;
        console.error('Error verificando token:', err);
        setError('Error al verificar el enlace de recuperación. Por favor, intenta nuevamente.');
        setVerifying(false);
      }
    };

    // Escuchar cambios en el estado de autenticación de Supabase
    // Esto captura casos donde Supabase maneja la redirección automáticamente
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'PASSWORD_RECOVERY' && session?.user) {
        setUserEmail(session.user.email || null);
        setVerifying(false);
        // Limpiar el hash
        window.history.replaceState(null, '', window.location.pathname + '#/reset-password');
      }
    });

    // Procesar la URL actual
    handleAuthCallback();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Validación adicional de seguridad
    if (password.length > 72) {
      setError('La contraseña no puede exceder 72 caracteres');
      return;
    }

    setLoading(true);

    try {
      // Verificar que el usuario tenga una sesión válida
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setError('Tu sesión ha expirado. Por favor, solicita un nuevo enlace de recuperación.');
        setLoading(false);
        return;
      }

      // Actualizar SOLO la contraseña del usuario
      // No se pueden modificar otros datos del usuario en esta pantalla
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        // Traducir errores comunes
        if (updateError.message.includes('same password')) {
          setError('La nueva contraseña debe ser diferente a la anterior');
        } else if (updateError.message.includes('password')) {
          setError('La contraseña no cumple con los requisitos de seguridad');
        } else {
          setError(updateError.message);
        }
      } else {
        // Cerrar sesión después de actualizar la contraseña por seguridad
        await supabase.auth.signOut();
        
        setSuccess(true);
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err: any) {
      console.error('🚨 Error al restablecer contraseña:', err);
      setError(err?.message || 'Error al restablecer la contraseña. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: `url(${backImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          padding: 20,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 440,
            background: 'white',
            borderRadius: 24,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            padding: 'clamp(32px, 6vw, 48px)',
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#64748b' }}>Verificando enlace...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `url(${backImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'white',
          borderRadius: 24,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          padding: 'clamp(32px, 6vw, 48px)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <img
              src={logo}
              alt="Acuerdo Asegurado"
              style={{
                height: 80,
                width: 'auto',
                filter:
                  'brightness(0) saturate(100%) invert(40%) sepia(90%) saturate(2000%) hue-rotate(230deg) brightness(0.95) contrast(1.1)',
                objectFit: 'contain',
              }}
            />
          </div>
          <h1
            style={{
              fontSize: 'clamp(24px, 5vw, 28px)',
              fontWeight: 700,
              color: '#0f172a',
              marginBottom: 8,
            }}
          >
            Restablecer contraseña
          </h1>
          <p
            style={{
              fontSize: 14,
              color: '#64748b',
              lineHeight: 1.6,
            }}
          >
            {userEmail ? `Ingresa tu nueva contraseña para ${userEmail}` : 'Ingresa tu nueva contraseña'}
          </p>
        </div>

        {success ? (
          <div
            style={{
              padding: '20px',
              borderRadius: 12,
              background: '#f0fdf4',
              border: '1px solid #86efac',
              color: '#166534',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: 0, marginBottom: 8, fontWeight: 600, fontSize: 16 }}>
              ✓ Contraseña actualizada correctamente
            </p>
            <p style={{ margin: 0, fontSize: 14, marginBottom: 16 }}>
              Serás redirigido al login en unos segundos...
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: '#10b981',
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#059669';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#10b981';
              }}
            >
              Ir al login ahora
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#334155',
                  marginBottom: 8,
                }}
              >
                Nueva contraseña
              </label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: '2px solid #e2e8f0',
                  fontSize: 15,
                  transition: 'all 0.2s ease',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
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
                Confirmar contraseña
              </label>
              <input
                type="password"
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: '2px solid #e2e8f0',
                  fontSize: 15,
                  transition: 'all 0.2s ease',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  fontSize: 14,
                  marginBottom: 20,
                }}
              >
                {error}
              </div>
            )}

            {!error && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  color: '#0369a1',
                  fontSize: 13,
                  marginBottom: 20,
                }}
              >
                <strong>Seguridad:</strong> Solo puedes actualizar tu contraseña en esta pantalla. 
                Otros datos de tu cuenta no se pueden modificar aquí.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 12,
                border: 'none',
                background: loading
                  ? '#cbd5e1'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: 16,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: loading
                  ? 'none'
                  : '0 4px 12px rgba(102, 126, 234, 0.4)',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                }
              }}
            >
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </form>
        )}

        <div
          style={{
            marginTop: 32,
            paddingTop: 24,
            borderTop: '1px solid #e2e8f0',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: '#94a3b8',
              margin: 0,
            }}
          >
            © 2026 Acuerdo Asegurado. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
