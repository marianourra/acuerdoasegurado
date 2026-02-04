import { Link } from 'react-router-dom';

type AdminNavProps = {
  active: 'claims' | 'producers' | 'companies' | 'transfers';
};

export default function AdminNav({ active }: AdminNavProps) {
  const linkStyle = (isActive: boolean) => ({
    padding: '8px 14px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none' as const,
    background: isActive ? '#667eea' : 'transparent',
    color: isActive ? '#fff' : '#64748b',
    border: isActive ? 'none' : '1px solid #e2e8f0',
  });

  return (
    <nav
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
        alignItems: 'center',
      }}
    >
      <Link to="/dashboard" style={{ fontSize: 14, color: '#667eea', fontWeight: 500, textDecoration: 'none', marginRight: 8 }}>
        ← Dashboard
      </Link>
      <span style={{ color: '#cbd5e1', marginRight: 4 }}>|</span>
      <Link to="/admin/claims" style={linkStyle(active === 'claims')}>
        Reclamos
      </Link>
      <Link to="/admin/producers" style={linkStyle(active === 'producers')}>
        Productores
      </Link>
      <Link to="/admin/companies" style={linkStyle(active === 'companies')}>
        Compañías
      </Link>
      <Link to="/admin/transfers" style={linkStyle(active === 'transfers')}>
        Transferencias
      </Link>
    </nav>
  );
}
