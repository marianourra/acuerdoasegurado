import { Link, useLocation } from 'react-router-dom';
import { useAdminStatus } from '../hooks/useAdminStatus';

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

const producerMenuItems = [
  {
    path: '/dashboard',
    label: 'Mis reclamos',
    match: (path: string) => path === '/dashboard' || path.startsWith('/claims'),
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3 4C3 3.44772 3.44772 3 4 3H16C16.5523 3 17 3.44772 17 4V16C17 16.5523 16.5523 17 16 17H4C3.44772 17 3 16.5523 3 16V4Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7 8H13M7 12H13"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const adminMenuItems = [
  {
    path: '/admin/claims',
    label: 'Reclamos',
    match: (path: string) => path === '/admin/claims',
    icon: producerMenuItems[0].icon,
  },
  {
    path: '/admin/producers',
    label: 'Productores',
    match: (path: string) => path.startsWith('/admin/producers'),
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M10 10C12.2091 10 14 8.20914 14 6C14 3.79086 12.2091 2 10 2C7.79086 2 6 3.79086 6 6C6 8.20914 7.79086 10 10 10Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M4 18C4 14.6863 6.68629 12 10 12C13.3137 12 16 14.6863 16 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    path: '/admin/companies',
    label: 'Compañías',
    match: (path: string) => path.startsWith('/admin/companies'),
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M4 4H16V16H4V4Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M8 4V16M4 8H16M4 12H16" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  // Oculto temporalmente
  // {
  //   path: '/admin/transfers',
  //   label: 'Transferencias',
  //   match: (path: string) => path.startsWith('/admin/transfers'),
  //   icon: ( ... ),
  // },
];

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const location = useLocation();
  const isAdmin = useAdminStatus();
  const showAdminMenu = isAdmin ?? location.pathname.startsWith('/admin');
  const menuItems = showAdminMenu ? adminMenuItems : producerMenuItems;

  const renderNav = (onItemClick?: () => void) => (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {menuItems.map((item) => {
        const isActive = item.match(location.pathname);
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onItemClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 24px',
              textDecoration: 'none',
              color: isActive ? '#667eea' : '#64748b',
              background: isActive ? '#f0f4ff' : 'transparent',
              borderLeft: isActive ? '3px solid #667eea' : '3px solid transparent',
              fontWeight: isActive ? 600 : 500,
              fontSize: 15,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.color = '#334155';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#64748b';
              }
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <aside
        style={{
          width: 260,
          background: 'white',
          borderRight: '1px solid #e2e8f0',
          padding: '24px 0',
          height: 'calc(100vh - 70px)',
          position: 'sticky',
          top: 70,
          overflowY: 'auto',
          transition: 'transform 0.3s ease',
        }}
        className="sidebar-desktop"
      >
        {renderNav()}
      </aside>
      <aside
        style={{
          width: 260,
          background: 'white',
          borderRight: '1px solid #e2e8f0',
          padding: '24px 0',
          height: 'calc(100vh - 70px)',
          position: 'fixed',
          top: 70,
          left: 0,
          overflowY: 'auto',
          zIndex: 99,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
        }}
        className="sidebar-mobile"
      >
        {renderNav(onClose)}
      </aside>
    <style>{`
      @media (max-width: 768px) {
        .sidebar-desktop {
          display: none !important;
        }
      }
      @media (min-width: 769px) {
        .sidebar-mobile {
          display: none !important;
        }
      }
    `}</style>
    </>
  );
}
