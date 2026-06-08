/** Tamaño estándar del logo en tarjetas de reclamos (productor y admin). */
export const COMPANY_LOGO_CARD_SIZE = 40;

type CompanyLogoProps = {
  name?: string | null;
  logoUrl?: string | null;
  size?: number;
  borderRadius?: number;
};

export default function CompanyLogo({
  name,
  logoUrl,
  size = COMPANY_LOGO_CARD_SIZE,
  borderRadius = 8,
}: CompanyLogoProps) {
  const boxStyle = {
    width: size,
    height: size,
    borderRadius,
    flexShrink: 0,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
  } as const;

  if (logoUrl) {
    return (
      <div style={{ ...boxStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
        <img
          src={logoUrl}
          alt={name ?? 'Compañía'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        ...boxStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.max(12, size * 0.4),
        fontWeight: 700,
        color: '#94a3b8',
      }}
    >
      {name?.charAt(0)?.toUpperCase() ?? 'C'}
    </div>
  );
}
