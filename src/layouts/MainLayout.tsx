import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import UserProfile from '../components/UserProfile';
import Sidebar from '../components/Sidebar';
import logo from '../images/logo.png';

type Props = {
  children: ReactNode;
};

function MainLayout({ children }: Props) {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: '100%',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 70,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link
              to="/dashboard"
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <img
                src={logo}
                alt="Acuerdo Asegurado"
                style={{
                  height: 40,
                  width: 'auto',
                  filter: 'brightness(0) invert(1)',
                  objectFit: 'contain',
                }}
              />
              <span
                style={{
                  color: 'white',
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: '-0.5px',
                }}
              >
                Acuerdo Asegurado
              </span>
            </Link>
          </div>
          <UserProfile />
        </div>
      </header>

      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '24px', maxWidth: 'calc(100% - 260px)' }}>{children}</main>
      </div>
    </div>
  );
}

export default MainLayout;
