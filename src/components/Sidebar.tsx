import { Link, useLocation } from 'react-router-dom';

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const location = useLocation();

  const menuItems = [
    {
      path: '/dashboard',
      label: 'Mis reclamos',
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
    {
      path: '/benefits',
      label: 'Mis beneficios',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10 2L12.09 8.26L18 10L12.09 11.74L10 18L7.91 11.74L2 10L7.91 8.26L10 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      path: '/payments',
      label: 'Mis pagos',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4 4H16C17.1046 4 18 4.89543 18 6V14C18 15.1046 17.1046 16 16 16H4C2.89543 16 2 15.1046 2 14V6C2 4.89543 2.89543 4 4 4Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 8H18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 12H7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 12H14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

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
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {menuItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path === '/dashboard' && location.pathname.startsWith('/claims')) ||
            (item.path === '/benefits' && location.pathname.startsWith('/benefits')) ||
            (item.path === '/payments' && location.pathname.startsWith('/payments'));
          return (
            <Link
              key={item.path}
              to={item.path}
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
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {menuItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path === '/dashboard' && location.pathname.startsWith('/claims')) ||
            (item.path === '/benefits' && location.pathname.startsWith('/benefits')) ||
            (item.path === '/payments' && location.pathname.startsWith('/payments'));
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
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
