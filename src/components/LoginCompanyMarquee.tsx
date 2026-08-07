import { useEffect, useMemo, useState } from 'react';
import { getCompanies, type Company } from '../services/companiesService';

type LoginLogoCompany = Company & { login_logo_url: string };

export default function LoginCompanyMarquee() {
  const [companies, setCompanies] = useState<LoginLogoCompany[]>([]);

  useEffect(() => {
    let cancelled = false;
    getCompanies().then(({ data }) => {
      if (cancelled || !data) return;
      setCompanies(
        data.filter((c): c is LoginLogoCompany => Boolean(c.login_logo_url?.trim()))
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Duplicamos la secuencia para un scroll infinito sin salto.
  const track = useMemo(() => {
    if (companies.length === 0) return [];
    const base =
      companies.length < 6
        ? [...companies, ...companies, ...companies]
        : [...companies];
    return [...base, ...base];
  }, [companies]);

  if (track.length === 0) return null;

  return (
    <div
      className="login-logo-marquee"
      aria-hidden
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: '58%',
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        maskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)',
      }}
    >
      <div
        className="login-logo-marquee-track"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 40,
          width: 'max-content',
          padding: '10px 0',
        }}
      >
        {track.map((company, index) => (
          <div
            key={`${company.id}-${index}`}
            style={{
              width: 72,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              opacity: 0.72,
              filter: 'drop-shadow(0 2px 8px rgba(15, 23, 42, 0.18))',
            }}
          >
            <img
              src={company.login_logo_url}
              alt=""
              loading="lazy"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes login-logo-marquee-scroll {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-50%, 0, 0); }
        }

        .login-logo-marquee-track {
          animation: login-logo-marquee-scroll 55s linear infinite;
          will-change: transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .login-logo-marquee-track {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
