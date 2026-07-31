import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { getCurrentUserRole, getHomePathForRole } from '../services/roleService';
import {
  clearRememberedLogin,
  loadRememberedLogin,
  saveRememberedLogin,
} from '../utils/rememberLogin';
import logo from '../images/logo.png';
import backImage from '../images/back.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberCredentials, setRememberCredentials] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const remembered = loadRememberedLogin();
    if (remembered) {
      setEmail(remembered.email);
      setPassword(remembered.password);
      setRememberCredentials(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Traducir mensaje de error común
        if (error.message === 'Invalid login credentials') {
          setError('El mail y/o la contraseña son incorrectos');
        } else {
          setError(error.message);
        }
      } else {
        if (rememberCredentials) {
          saveRememberedLogin(email, password);
        } else {
          clearRememberedLogin();
        }
        const role = await getCurrentUserRole();
        navigate(getHomePathForRole(role));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch';
      setError(message);
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
      className="login-page"
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        overflow: 'hidden',
      }}
    >
      {/* Fondo: animación de ondas ~7s al cargar */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        <div
          className="login-bg-image"
          style={{
            position: 'absolute',
            inset: '-12%',
            backgroundImage: `url(${backImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <svg
          className="login-wave-layer login-wave-1"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <path
            d="M-80 520 C 180 420, 360 640, 620 540 C 880 440, 1080 620, 1520 480 L 1520 900 L -80 900 Z"
            fill="rgba(255,255,255,0.14)"
          />
        </svg>
        <svg
          className="login-wave-layer login-wave-2"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <path
            d="M-80 600 C 220 500, 420 700, 700 600 C 980 500, 1180 680, 1520 560 L 1520 900 L -80 900 Z"
            fill="rgba(255,255,255,0.1)"
          />
        </svg>
        <svg
          className="login-wave-layer login-wave-3"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <path
            d="M-80 680 C 260 600, 480 760, 780 680 C 1060 600, 1240 740, 1520 660 L 1520 900 L -80 900 Z"
            fill="rgba(255,255,255,0.08)"
          />
        </svg>
      </div>

      <div
        className="login-card"
        style={{
          position: 'relative',
          zIndex: 1,
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

        <form onSubmit={handleLogin} autoComplete="on">
          <div style={{ marginBottom: 20 }}>
            <label
              htmlFor="login-email"
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
              id="login-email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username email"
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
              htmlFor="login-password"
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
              id="login-password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
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

          <div
            style={{
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: '#475569',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={rememberCredentials}
                onChange={(e) => setRememberCredentials(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#667eea', cursor: 'pointer' }}
              />
              Recordar usuario y contraseña
            </label>
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

      <style>{`
        /* Animación única ~7s: las ondas del fondo fluyen y luego quedan quietas */
        @keyframes login-wave-flow {
          0% {
            transform: scale(1.12) translate3d(-4%, 2%, 0);
          }
          100% {
            transform: scale(1.04) translate3d(0, 0, 0);
          }
        }

        @keyframes login-wave-sweep-1 {
          0% {
            transform: translate3d(-6%, 4%, 0);
            opacity: 0;
          }
          25% { opacity: 0.9; }
          100% {
            transform: translate3d(0, 0, 0);
            opacity: 0.55;
          }
        }

        @keyframes login-wave-sweep-2 {
          0% {
            transform: translate3d(-8%, 6%, 0);
            opacity: 0;
          }
          30% { opacity: 0.85; }
          100% {
            transform: translate3d(0, 0, 0);
            opacity: 0.45;
          }
        }

        @keyframes login-wave-sweep-3 {
          0% {
            transform: translate3d(-10%, 8%, 0);
            opacity: 0;
          }
          35% { opacity: 0.75; }
          100% {
            transform: translate3d(0, 0, 0);
            opacity: 0.35;
          }
        }

        @keyframes login-card-enter {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .login-bg-image {
          animation: login-wave-flow 7s cubic-bezier(0.22, 0.61, 0.36, 1) both;
          will-change: transform;
        }

        .login-wave-layer {
          will-change: transform, opacity;
        }

        .login-wave-1 {
          animation: login-wave-sweep-1 6.6s cubic-bezier(0.22, 0.61, 0.36, 1) both;
        }

        .login-wave-2 {
          animation: login-wave-sweep-2 7s 0.15s cubic-bezier(0.22, 0.61, 0.36, 1) both;
        }

        .login-wave-3 {
          animation: login-wave-sweep-3 7.2s 0.25s cubic-bezier(0.22, 0.61, 0.36, 1) both;
        }

        .login-card {
          animation: login-card-enter 0.9s 0.2s ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .login-bg-image,
          .login-wave-1,
          .login-wave-2,
          .login-wave-3,
          .login-card {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
