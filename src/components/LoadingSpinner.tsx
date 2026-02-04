import logoUrl from '../images/logo.png';

type LoadingSpinnerProps = {
  /** Texto debajo del logo (ej: "Cargando reclamos...") */
  text?: string;
  /** Tamaño del logo en píxeles. Por defecto 56. */
  size?: number;
  /** Si se muestra dentro de un contenedor con título (menos minHeight). */
  inline?: boolean;
};

export default function LoadingSpinner({ text = 'Cargando...', size = 56, inline = false }: LoadingSpinnerProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        minHeight: inline ? undefined : '40vh',
        color: '#64748b',
        fontSize: 16,
      }}
    >
      <div className="loading-spinner-3d-wrap" style={{ perspective: 280 }}>
        <img
          src={logoUrl}
          alt=""
          className="loading-spinner-logo"
          style={{
            width: size,
            height: size,
            objectFit: 'contain',
          }}
        />
      </div>
      {text && <span>{text}</span>}
      <style>{`
        .loading-spinner-3d-wrap {
          display: inline-flex;
          transform-style: preserve-3d;
        }
        .loading-spinner-logo {
          animation: loading-spinner-rotate-y 1.2s linear infinite;
          transform-style: preserve-3d;
          backface-visibility: visible;
        }
        @keyframes loading-spinner-rotate-y {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(360deg); }
        }
      `}</style>
    </div>
  );
}
