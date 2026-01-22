import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import logo from '../images/logo.png';
import backImage from '../images/back.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const navigate = useNavigate();

  // ✅ TEST de conectividad al cargar la pantalla
  useEffect(() => {
    (async () => {
      console.log('🔎 ENV URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log(
        '🔎 ENV KEY exists?:',
        Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)
      );

      const res = await supabase.auth.getSession();
      console.log('✅ getSession result:', res);
    })();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('➡️ intentanto login con:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('✅ login data:', data);
      console.log('❌ login error:', error);

      if (error) {
        // Traducir mensaje de error común
        if (error.message === 'Invalid login credentials') {
          setError('El mail y/o la contraseña son incorrectos');
        } else {
          setError(error.message);
        }
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('🚨 EXCEPTION (failed to fetch probable):', err);
      setError(err?.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError(null);
    setResetSuccess(false);

    try {
      // Configurar la URL de redirección para HashRouter
      // Debe incluir el hash route para que funcione con HashRouter
      // Usar window.location.href para obtener la URL completa actual, luego construir la de reset
      const baseUrl = window.location.origin;
      const redirectUrl = `${baseUrl}/#/reset-password`;
      
      console.log('🔗 Enviando email de recuperación:');
      console.log('  - Email:', resetEmail);
      console.log('  - redirectTo:', redirectUrl);
      console.log('  - window.location.origin:', window.location.origin);
      
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: redirectUrl,
      });
      
      console.log('  - Resultado:', error ? `Error: ${error.message}` : 'Email enviado correctamente');

      if (error) {
        setResetError(error.message);
      } else {
        setResetSuccess(true);
        setResetEmail('');
      }
    } catch (err: any) {
      console.error('🚨 Error al enviar email de recuperación:', err);
      setResetError(err?.message || 'Error al enviar el email de recuperación');
    } finally {
      setResetLoading(false);
    }
  };

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
              fontSize: 'clamp(28px, 6vw, 36px)',
              fontWeight: 800,
              letterSpacing: '-0.6px',
              marginBottom: 4,
              fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                color: '#8fa3f0',
              }}
            >
              A
            </span>
            <span
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              cuerdo
            </span>
            <span
              style={{
                color: '#8fa3f0',
              }}
            >
              A
            </span>
            <span
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              segurado
            </span>
          </h1>
          <p
            style={{
              fontSize: 16,
              color: '#64748b',
              lineHeight: 1.6,
              marginTop: 4,
            }}
          >
            Acuerdos claros. Resultados seguros.
          </p>
        </div>

        <form onSubmit={handleLogin}>
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
              Email
            </label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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

          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 500,
                color: '#334155',
                marginBottom: 8,
              }}
            >
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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

          <div style={{ marginBottom: 24, textAlign: 'right' }}>
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(true);
                setResetEmail(email);
                setError(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
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
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        {showForgotPassword && (
          <div
            style={{
              marginTop: 24,
              padding: 24,
              background: '#f8fafc',
              borderRadius: 16,
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#0f172a',
                }}
              >
                Recuperar contraseña
              </h3>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail('');
                  setResetError(null);
                  setResetSuccess(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontSize: 20,
                  padding: 0,
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>

            {resetSuccess ? (
              <div
                style={{
                  padding: '16px',
                  borderRadius: 12,
                  background: '#f0fdf4',
                  border: '1px solid #86efac',
                  color: '#166534',
                  fontSize: 14,
                }}
              >
                <p style={{ margin: 0, marginBottom: 8, fontWeight: 600 }}>
                  ✓ Email enviado correctamente
                </p>
                <p style={{ margin: 0, fontSize: 13 }}>
                  Revisa tu bandeja de entrada. Te enviamos un enlace para restablecer tu contraseña.
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#334155',
                      marginBottom: 8,
                    }}
                  >
                    Ingresa tu email
                  </label>
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '2px solid #e2e8f0',
                      fontSize: 14,
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

                {resetError && (
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#dc2626',
                      fontSize: 13,
                      marginBottom: 16,
                    }}
                  >
                    {resetError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: 10,
                      border: 'none',
                      background: resetLoading
                        ? '#cbd5e1'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: resetLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {resetLoading ? 'Enviando...' : 'Enviar enlace'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail('');
                      setResetError(null);
                      setResetSuccess(false);
                    }}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      background: 'white',
                      color: '#64748b',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
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
