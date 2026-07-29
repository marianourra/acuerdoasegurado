import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUserRole } from '../hooks/useUserRole';

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

type MenuItem = {
  path: string;
  label: string;
  match: (path: string) => boolean;
  icon: ReactNode;
};

type MenuGroup = {
  id: string;
  label: string;
  icon: ReactNode;
  children: MenuItem[];
};

type MenuEntry = { type: 'item'; item: MenuItem } | { type: 'group'; group: MenuGroup };

const claimsIcon = (
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
);

const statsIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4 16V10M8 16V6M12 16V12M16 16V4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const producersIcon = (
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
);

const asistentesIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10 10C12.2091 10 14 8.20914 14 6C14 3.79086 12.2091 2 10 2C7.79086 2 6 3.79086 6 6C6 8.20914 7.79086 10 10 10Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path d="M3 17c0-3 3.1-5 7-5s7 2 7 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M15 4l2 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const companiesIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4H16V16H4V4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M8 4V16M4 8H16M4 12H16" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const feesIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10 2v16M6 6h5.5a2.5 2.5 0 100-5H8M14 14H8.5a2.5 2.5 0 100 5H14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const emailIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 5.5C3 4.94772 3.44772 4.5 4 4.5H16C16.5523 4.5 17 4.94772 17 5.5V14.5C17 15.0523 16.5523 15.5 16 15.5H4C3.44772 15.5 3 15.0523 3 14.5V5.5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M3.5 5.5L10 10.5L16.5 5.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const auditIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M5 3h7l3 3v11a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M7 9h6M7 12h6M7 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const settingsIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M16.5 10a6.5 6.5 0 01-.2 1.5l1.5 1.2-1.5 2.6-1.8-.5a5.8 5.8 0 01-1.3.75L12.8 17H9.2l-.4-1.45a5.8 5.8 0 01-1.3-.75l-1.8.5-1.5-2.6 1.5-1.2A6.5 6.5 0 015.5 10c0-.5.07-1 .2-1.5L4.2 7.3 5.7 4.7l1.8.5c.4-.3.84-.55 1.3-.75L9.2 3h3.6l.4 1.45c.46.2.9.45 1.3.75l1.8-.5 1.5 2.6-1.5 1.2c.13.5.2 1 .2 1.5z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const chevronIcon = (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const producerMenuItems: MenuItem[] = [
  {
    path: '/dashboard',
    label: 'Mis reclamos',
    match: (path: string) =>
      path === '/dashboard' || (path.startsWith('/claims') && !path.startsWith('/statistics')),
    icon: claimsIcon,
  },
  {
    path: '/statistics',
    label: 'Estadísticas',
    match: (path: string) => path === '/statistics',
    icon: statsIcon,
  },
];

const adminMenuEntries: MenuEntry[] = [
  {
    type: 'item',
    item: {
      path: '/admin/claims',
      label: 'Reclamos',
      match: (path: string) => path.startsWith('/admin/claims'),
      icon: claimsIcon,
    },
  },
  {
    type: 'item',
    item: {
      path: '/admin/fees',
      label: 'Honorarios',
      match: (path: string) => path.startsWith('/admin/fees'),
      icon: feesIcon,
    },
  },
  {
    type: 'item',
    item: {
      path: '/statistics',
      label: 'Estadísticas',
      match: (path: string) => path === '/statistics',
      icon: statsIcon,
    },
  },
  {
    type: 'group',
    group: {
      id: 'parametrizacion',
      label: 'Parametrización',
      icon: settingsIcon,
      children: [
        {
          path: '/admin/producers',
          label: 'Productores',
          match: (path: string) => path.startsWith('/admin/producers'),
          icon: producersIcon,
        },
        {
          path: '/admin/asistentes',
          label: 'Asistentes',
          match: (path: string) => path.startsWith('/admin/asistentes'),
          icon: asistentesIcon,
        },
        {
          path: '/admin/companies',
          label: 'Compañías',
          match: (path: string) => path.startsWith('/admin/companies'),
          icon: companiesIcon,
        },
      ],
    },
  },
  {
    type: 'group',
    group: {
      id: 'auditoria',
      label: 'Auditoría',
      icon: auditIcon,
      children: [
        {
          path: '/admin/email-logs',
          label: 'Emails enviados',
          match: (path: string) => path.startsWith('/admin/email-logs'),
          icon: emailIcon,
        },
        {
          path: '/admin/audit',
          label: 'Auditoría reclamos',
          match: (path: string) => path.startsWith('/admin/audit'),
          icon: auditIcon,
        },
      ],
    },
  },
];

const asistenteMenuItems: MenuItem[] = [
  {
    path: '/admin/claims',
    label: 'Reclamos',
    match: (path: string) => path.startsWith('/admin/claims'),
    icon: claimsIcon,
  },
];

const linkBaseStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 24px',
  textDecoration: 'none' as const,
  fontSize: 15,
  transition: 'all 0.2s ease',
};

function NavLinkItem({
  item,
  pathname,
  onItemClick,
  nested = false,
}: {
  item: MenuItem;
  pathname: string;
  onItemClick?: () => void;
  nested?: boolean;
}) {
  const isActive = item.match(pathname);
  return (
    <Link
      to={item.path}
      onClick={onItemClick}
      style={{
        ...linkBaseStyle,
        padding: nested ? '10px 24px 10px 40px' : '12px 24px',
        color: isActive ? '#667eea' : '#64748b',
        background: isActive ? '#f0f4ff' : 'transparent',
        borderLeft: isActive ? '3px solid #667eea' : '3px solid transparent',
        fontWeight: isActive ? 600 : 500,
        fontSize: nested ? 14 : 15,
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
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const location = useLocation();
  const { role, loading } = useUserRole();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const isAdminMenu = (() => {
    if (!loading) return role === 'admin';
    return location.pathname.startsWith('/admin') && !location.pathname.startsWith('/asistente');
  })();

  const flatMenuItems = (() => {
    if (!loading) {
      if (role === 'asistente') return asistenteMenuItems;
      if (role === 'admin') return null;
      return producerMenuItems;
    }
    if (location.pathname.startsWith('/asistente')) return asistenteMenuItems;
    if (location.pathname.startsWith('/admin')) return null;
    return producerMenuItems;
  })();

  // Abrir automáticamente el submenú que contiene la ruta activa.
  useEffect(() => {
    if (!isAdminMenu) return;
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const entry of adminMenuEntries) {
        if (entry.type !== 'group') continue;
        const hasActive = entry.group.children.some((c) => c.match(location.pathname));
        if (hasActive) next[entry.group.id] = true;
      }
      return next;
    });
  }, [location.pathname, isAdminMenu]);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderAdminNav = (onItemClick?: () => void) => (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {adminMenuEntries.map((entry) => {
        if (entry.type === 'item') {
          return (
            <NavLinkItem
              key={entry.item.path}
              item={entry.item}
              pathname={location.pathname}
              onItemClick={onItemClick}
            />
          );
        }

        const { group } = entry;
        const isOpenGroup = !!openGroups[group.id];
        const hasActiveChild = group.children.some((c) => c.match(location.pathname));

        return (
          <div key={group.id}>
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              aria-expanded={isOpenGroup}
              style={{
                ...linkBaseStyle,
                width: '100%',
                boxSizing: 'border-box',
                border: 'none',
                borderLeft: hasActiveChild ? '3px solid #667eea' : '3px solid transparent',
                background: hasActiveChild && !isOpenGroup ? '#f8fafc' : 'transparent',
                color: hasActiveChild ? '#667eea' : '#64748b',
                fontWeight: hasActiveChild ? 600 : 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (!hasActiveChild) {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.color = '#334155';
                }
              }}
              onMouseLeave={(e) => {
                if (!hasActiveChild) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#64748b';
                } else if (!isOpenGroup) {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.color = '#667eea';
                }
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>{group.icon}</span>
              <span style={{ flex: 1 }}>{group.label}</span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  transform: isOpenGroup ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              >
                {chevronIcon}
              </span>
            </button>
            {isOpenGroup && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: 4 }}>
                {group.children.map((child) => (
                  <NavLinkItem
                    key={child.path}
                    item={child}
                    pathname={location.pathname}
                    onItemClick={onItemClick}
                    nested
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  const renderFlatNav = (items: MenuItem[], onItemClick?: () => void) => (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {items.map((item) => (
        <NavLinkItem key={item.path} item={item} pathname={location.pathname} onItemClick={onItemClick} />
      ))}
    </nav>
  );

  const renderNav = (onItemClick?: () => void) => {
    if (flatMenuItems === null || isAdminMenu) return renderAdminNav(onItemClick);
    return renderFlatNav(flatMenuItems, onItemClick);
  };

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
