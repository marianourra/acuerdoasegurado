import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../images/logo.png';
import backImage from '../images/back.png';

const GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
const LOGO_FILTER =
  'brightness(0) saturate(100%) invert(40%) sepia(90%) saturate(2000%) hue-rotate(230deg) brightness(0.95) contrast(1.1)';
const WHATSAPP_NUMBER = '542235698202';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  'Hola, quiero sumarme como productor/organizador a Acuerdo Asegurado.'
)}`;

function Icon({ path, size = 24 }: { path: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {path.split('|').map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

const ICONS = {
  upload: 'M12 3v12|M8 7l4-4 4 4|M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2',
  track: 'M3 12h4l3 8 4-16 3 8h4',
  trace: 'M9 3v18|M4 8h5|M4 16h5|M14 6h6|M14 12h6|M14 18h6',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9|M13.7 21a2 2 0 0 1-3.4 0',
  chart: 'M3 3v18h18|M7 15l3-3 3 3 4-5',
  team: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2|M9 7a4 4 0 1 0 0 0.01|M23 21v-2a4 4 0 0 0-3-3.87|M16 3.13a4 4 0 0 1 0 7.75',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  handshake: 'M12 8l-3 3 3 3 3-3-3-3|M2 12l4-4 3 3|M22 12l-4-4-3 3|M6 15l3 3|M18 15l-3 3',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z|M12 6v6l4 2',
  check: 'M20 6L9 17l-5-5',
};

type Feature = {
  id: string;
  icon: string;
  title: string;
  description: string;
  bullets: string[];
};

const FEATURES: Feature[] = [
  {
    id: 'carga',
    icon: ICONS.upload,
    title: 'Carga de reclamos simple',
    description: 'Alta guiada de reclamos en minutos, con la documentación necesaria según el tipo de siniestro.',
    bullets: ['Formulario claro y guiado', 'Tipos de reclamo predefinidos', 'Adjuntá documentación por WhatsApp'],
  },
  {
    id: 'seguimiento',
    icon: ICONS.track,
    title: 'Seguimiento en tiempo real',
    description: 'Consultá el estado de cada reclamo cuando quieras, con una línea de tiempo clara de la gestión.',
    bullets: ['Estados siempre actualizados', 'Línea de tiempo visual', 'Alertas de novedades'],
  },
  {
    id: 'trazabilidad',
    icon: ICONS.trace,
    title: 'Trazabilidad total',
    description: 'Cada movimiento del estudio queda registrado: presentación, novedades fechadas y resultados.',
    bullets: ['Historial fechado de la gestión', 'Novedades del expediente', 'Fechas clave a la vista'],
  },
  {
    id: 'notificaciones',
    icon: ICONS.bell,
    title: 'Notificaciones automáticas',
    description: 'Te avisamos por email apenas conseguimos un acuerdo en el reclamo de tu cliente.',
    bullets: ['Aviso automático al acordar', 'Sin perseguir respuestas', 'Información al instante'],
  },
  {
    id: 'estadisticas',
    icon: ICONS.chart,
    title: 'Estadísticas de tu cartera',
    description: 'Métricas de tu cartera: reclamos activos, finalizados y tiempos de resolución.',
    bullets: ['Panel de estadísticas', 'Comparativa por compañía', 'Tiempos de cierre'],
  },
  {
    id: 'gestion',
    icon: ICONS.team,
    title: 'Gestión integral del estudio',
    description: 'Nosotros llevamos adelante la gestión legal; vos seguís todo desde la plataforma.',
    bullets: ['Equipo jurídico especializado', 'Abogados y asistentes dedicados', 'Vos siempre informado'],
  },
];

const STEPS = [
  {
    icon: ICONS.upload,
    title: 'Cargás el reclamo',
    description: 'Ingresás los datos de tu cliente y del siniestro en la plataforma, en pocos minutos.',
  },
  {
    icon: ICONS.handshake,
    title: 'El estudio gestiona',
    description: 'Nuestro equipo presenta y negocia el reclamo ante la aseguradora.',
  },
  {
    icon: ICONS.track,
    title: 'Seguís el avance',
    description: 'Ves estados, novedades y fechas en tiempo real, con total trazabilidad.',
  },
  {
    icon: ICONS.bell,
    title: 'Te notificamos el acuerdo',
    description: 'Cuando conseguimos el acuerdo, te avisamos por email automáticamente.',
  },
];

function StatCounter({ target, suffix, label }: { target: number; suffix?: string; label: string }) {
  const [val, setVal] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setStarted(true)),
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let raf = 0;
    const dur = 1200;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, target]);

  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div
        style={{
          fontSize: 'clamp(34px, 6vw, 48px)',
          fontWeight: 900,
          background: GRADIENT,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1,
        }}
      >
        {val}
        {suffix}
      </div>
      <div style={{ marginTop: 10, fontSize: 14, color: '#64748b', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function PrimaryButton({ children, to, onClick }: { children: React.ReactNode; to?: string; onClick?: () => void }) {
  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '14px 28px',
    borderRadius: 12,
    border: 'none',
    background: GRADIENT,
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'none',
    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.35)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  };
  const hover = (e: React.MouseEvent<HTMLElement>, on: boolean) => {
    e.currentTarget.style.transform = on ? 'translateY(-2px)' : 'translateY(0)';
    e.currentTarget.style.boxShadow = on
      ? '0 12px 30px rgba(102, 126, 234, 0.45)'
      : '0 8px 24px rgba(102, 126, 234, 0.35)';
  };
  if (to) {
    return (
      <Link to={to} style={style} onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} style={style} onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
      {children}
    </button>
  );
}

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '6px 14px',
        borderRadius: 999,
        background: '#eef2ff',
        color: '#4338ca',
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        marginBottom: 16,
      }}
    >
      {children}
    </span>
  );
}

export default function LandingProducers() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setActiveStep((s) => (s + 1) % STEPS.length), 3500);
    return () => clearInterval(timer);
  }, []);

  const feature = FEATURES[activeFeature];

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif", color: '#0f172a', background: '#fff' }}>
      <style>{`
        @keyframes lpFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .lp-fade { animation: lpFadeUp 0.6s ease both; }
        .lp-card { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
        .lp-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(15,23,42,0.10); border-color: #c7d2fe !important; }
        .lp-nav-links a { transition: color 0.2s ease; }
        .lp-nav-links a:hover { color: #4338ca !important; }
        @media (max-width: 900px) {
          .lp-hero-grid { grid-template-columns: 1fr !important; }
          .lp-feature-grid { grid-template-columns: 1fr !important; }
          .lp-nav-links { display: none !important; }
          .lp-hero-visual { display: none !important; }
        }
      `}</style>

      {/* NAV */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #eef2f7',
        }}
      >
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={logo} alt="Acuerdo Asegurado" style={{ height: 38, width: 'auto', filter: LOGO_FILTER, objectFit: 'contain' }} />
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px' }}>
              <span style={{ color: '#8fa3f0' }}>A</span>
              <span style={{ background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>cuerdo </span>
              <span style={{ color: '#8fa3f0' }}>A</span>
              <span style={{ background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>segurado</span>
            </span>
          </div>
          <nav className="lp-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {[
              { id: 'servicios', label: 'Servicios' },
              { id: 'como-funciona', label: 'Cómo funciona' },
              { id: 'estudio', label: 'El estudio' },
            ].map((l) => (
              <a
                key={l.id}
                onClick={() => scrollToId(l.id)}
                style={{ cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#475569' }}
              >
                {l.label}
              </a>
            ))}
          </nav>
          <Link
            to="/login"
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              background: GRADIENT,
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(102,126,234,0.35)',
            }}
          >
            Ingresar
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          backgroundImage: `linear-gradient(180deg, rgba(248,250,252,0.92) 0%, rgba(255,255,255,0.96) 100%), url(${backImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="lp-hero-grid" style={{ maxWidth: 1160, margin: '0 auto', padding: '72px 24px 80px', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 48, alignItems: 'center' }}>
          <div className="lp-fade">
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 999,
                background: '#fff',
                border: '1px solid #e2e8f0',
                color: '#4338ca',
                fontSize: 13,
                fontWeight: 700,
                boxShadow: '0 2px 10px rgba(15,23,42,0.05)',
                marginBottom: 22,
              }}
            >
              <span style={{ color: '#764ba2' }}><Icon path={ICONS.shield} size={16} /></span>
              +15 años de experiencia en Responsabilidad Civil y Seguros
            </span>
            <h1 style={{ fontSize: 'clamp(34px, 6vw, 56px)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-1.2px', margin: '0 0 20px' }}>
              La gestión de los reclamos de tus clientes,{' '}
              <span style={{ background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                con total trazabilidad
              </span>
            </h1>
            <p style={{ fontSize: 'clamp(16px, 2.4vw, 19px)', color: '#475569', lineHeight: 1.6, margin: '0 0 32px', maxWidth: 560 }}>
              Somos un estudio jurídico especializado. Vos cargás el reclamo, nosotros lo gestionamos, y seguís cada
              avance en tiempo real desde una plataforma pensada para organizadores y productores de seguros.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <PrimaryButton to="/login">Acceder a la plataforma</PrimaryButton>
              <button
                type="button"
                onClick={() => scrollToId('servicios')}
                style={{
                  padding: '14px 28px',
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  color: '#334155',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Conocer los servicios
              </button>
            </div>
          </div>

          {/* Visual: mock de tarjeta de reclamo */}
          <div className="lp-hero-visual lp-fade" style={{ position: 'relative' }}>
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 24px 60px rgba(15,23,42,0.14)', padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>RECLAMO #10428</div>
                <span style={{ padding: '5px 12px', borderRadius: 999, background: '#16a34a', color: '#fff', fontSize: 12, fontWeight: 800 }}>Acordado</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>María González</div>
              <div style={{ fontSize: 14, color: '#667eea', fontWeight: 600, marginBottom: 18 }}>Accidente de tránsito</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
                {[1, 1, 1, 1].map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i < 4 ? '#2563eb' : '#e2e8f0' }} />
                ))}
              </div>
              {[
                { label: 'Presentación', value: '12/03/2026' },
                { label: 'Última novedad', value: 'Acuerdo alcanzado con la aseguradora' },
                { label: 'Monto acordado', value: '$ 1.850.000' },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderTop: '1px solid #f1f5f9', fontSize: 14 }}>
                  <span style={{ color: '#94a3b8', fontWeight: 600 }}>{row.label}</span>
                  <span style={{ color: '#334155', fontWeight: 700, textAlign: 'right' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ background: '#fff', borderTop: '1px solid #eef2f7', borderBottom: '1px solid #eef2f7' }}>
        <div
          style={{
            maxWidth: 1160,
            margin: '0 auto',
            padding: '44px 24px',
            display: 'grid',
            gap: 24,
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          }}
        >
          <StatCounter target={15} suffix="+" label="Años de experiencia" />
          <StatCounter target={100} suffix="%" label="Trazabilidad de la gestión" />
          <StatCounter target={24} suffix="/7" label="Seguimiento disponible" />
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 'clamp(20px, 3.4vw, 26px)',
                fontWeight: 900,
                background: GRADIENT,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1.2,
              }}
            >
              RC y Seguros
            </div>
            <div style={{ marginTop: 10, fontSize: 14, color: '#64748b', fontWeight: 600 }}>Especialización exclusiva</div>
          </div>
        </div>
      </section>

      {/* SERVICIOS / FUNCIONALIDADES (interactivo) */}
      <section id="servicios" style={{ background: '#f8fafc', padding: '80px 0' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <SectionTag>Servicios y funcionalidades</SectionTag>
            <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 40px)', fontWeight: 900, letterSpacing: '-0.8px', margin: '0 0 12px' }}>
              Todo lo que necesitás para gestionar reclamos
            </h2>
            <p style={{ fontSize: 17, color: '#64748b', maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>
              Una plataforma pensada para que delegues la gestión legal sin perder el control ni la visibilidad.
            </p>
          </div>

          <div className="lp-feature-grid" style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 28, alignItems: 'stretch' }}>
            {/* Lista de features */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FEATURES.map((f, i) => {
                const active = i === activeFeature;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setActiveFeature(i)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      textAlign: 'left',
                      padding: '16px 18px',
                      borderRadius: 14,
                      border: active ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
                      background: active ? '#fff' : 'transparent',
                      boxShadow: active ? '0 10px 30px rgba(102,126,234,0.12)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        flexShrink: 0,
                        background: active ? GRADIENT : '#eef2ff',
                        color: active ? '#fff' : '#4338ca',
                      }}
                    >
                      <Icon path={f.icon} size={22} />
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: active ? '#0f172a' : '#475569' }}>{f.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Detalle del feature activo */}
            <div
              key={feature.id}
              className="lp-fade"
              style={{
                background: '#fff',
                borderRadius: 20,
                border: '1px solid #e2e8f0',
                padding: 'clamp(24px, 4vw, 40px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 18, background: GRADIENT, color: '#fff', marginBottom: 22 }}>
                <Icon path={feature.icon} size={32} />
              </span>
              <h3 style={{ fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 800, margin: '0 0 12px' }}>{feature.title}</h3>
              <p style={{ fontSize: 17, color: '#64748b', lineHeight: 1.6, margin: '0 0 24px' }}>{feature.description}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {feature.bullets.map((b) => (
                  <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, color: '#334155', fontWeight: 600 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 999, background: '#dcfce7', color: '#16a34a', flexShrink: 0 }}>
                      <Icon path={ICONS.check} size={16} />
                    </span>
                    {b}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA (stepper interactivo) */}
      <section id="como-funciona" style={{ background: '#fff', padding: '80px 0' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <SectionTag>Cómo funciona</SectionTag>
            <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 40px)', fontWeight: 900, letterSpacing: '-0.8px', margin: '0 0 12px' }}>
              Simple para vos, integral de nuestra parte
            </h2>
          </div>

          <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {STEPS.map((step, i) => {
              const active = i === activeStep;
              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => setActiveStep(i)}
                  style={{
                    position: 'relative',
                    textAlign: 'left',
                    padding: 26,
                    borderRadius: 18,
                    border: active ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
                    background: active ? 'linear-gradient(180deg, #f5f3ff 0%, #fff 100%)' : '#fff',
                    boxShadow: active ? '0 14px 34px rgba(102,126,234,0.15)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    transform: active ? 'translateY(-4px)' : 'translateY(0)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 14, background: active ? GRADIENT : '#eef2ff', color: active ? '#fff' : '#4338ca' }}>
                      <Icon path={step.icon} size={24} />
                    </span>
                    <span style={{ fontSize: 32, fontWeight: 900, color: active ? '#c7d2fe' : '#e2e8f0' }}>{i + 1}</span>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px' }}>{step.title}</h3>
                  <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.55, margin: 0 }}>{step.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* EL ESTUDIO + ACUERDOS A MEDIDA */}
      <section id="estudio" style={{ background: '#0f172a', padding: '80px 0', color: '#fff' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px' }}>
          <div className="lp-feature-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
            <div>
              <span style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 999, background: 'rgba(143,163,240,0.18)', color: '#a5b4fc', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 18 }}>
                El estudio
              </span>
              <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 40px)', fontWeight: 900, letterSpacing: '-0.8px', margin: '0 0 20px', lineHeight: 1.15 }}>
                Especialistas en Responsabilidad Civil y Seguros
              </h2>
              <p style={{ fontSize: 17, color: '#cbd5e1', lineHeight: 1.7, margin: '0 0 22px' }}>
                Con <strong style={{ color: '#fff' }}>más de 15 años de experiencia</strong>, acompañamos a
                organizadores y productores gestionando los reclamos de sus clientes de principio a fin. Nuestro
                equipo de abogados y asistentes se ocupa de toda la gestión legal, mientras vos mantenés la
                trazabilidad completa desde la plataforma.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {['Abogados especializados', 'Gestión de principio a fin', 'Trato directo y cercano'].map((t) => (
                  <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
                    <span style={{ color: '#34d399' }}><Icon path={ICONS.check} size={16} /></span>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, rgba(102,126,234,0.20) 0%, rgba(118,75,162,0.20) 100%)', border: '1px solid rgba(143,163,240,0.3)', borderRadius: 24, padding: 'clamp(28px, 4vw, 40px)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 60, height: 60, borderRadius: 16, background: GRADIENT, color: '#fff', marginBottom: 22 }}>
                <Icon path={ICONS.handshake} size={30} />
              </span>
              <h3 style={{ fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 800, margin: '0 0 14px' }}>Acuerdos comerciales a medida</h3>
              <p style={{ fontSize: 16, color: '#cbd5e1', lineHeight: 1.7, margin: '0 0 20px' }}>
                Trabajamos con esquemas de colaboración pensados para cada cartera. Definimos juntos las condiciones
                que mejor se adapten a tu volumen y a tu forma de trabajo, de manera transparente y personalizada.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#a5b4fc', fontWeight: 600 }}>
                <Icon path={ICONS.shield} size={18} />
                Condiciones conversadas de forma directa y confidencial
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ background: '#f8fafc', padding: '80px 0' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 900, letterSpacing: '-0.8px', margin: '0 0 16px' }}>
            Sumate como organizador o productor
          </h2>
          <p style={{ fontSize: 18, color: '#64748b', lineHeight: 1.6, margin: '0 0 32px' }}>
            Empezá a gestionar los reclamos de tus clientes con el respaldo de un estudio especializado y la
            tranquilidad de seguir cada paso en tiempo real.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <PrimaryButton to="/login">Acceder a la plataforma</PrimaryButton>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 28px',
                borderRadius: 12,
                border: '1px solid #bbf7d0',
                background: '#f0fdf4',
                color: '#15803d',
                fontSize: 16,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Solicitar acceso
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#fff', borderTop: '1px solid #eef2f7' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '32px 24px', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={logo} alt="Acuerdo Asegurado" style={{ height: 32, width: 'auto', filter: LOGO_FILTER, objectFit: 'contain' }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#334155' }}>Acuerdo Asegurado</span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
            Acuerdos claros. Resultados seguros. · © 2026 Acuerdo Asegurado
          </p>
        </div>
      </footer>
    </div>
  );
}
