import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import UserProfile from '../components/UserProfile';
import Sidebar from '../components/Sidebar';
import logo from '../images/logo.png';

type Props = {
  children: ReactNode;
};

function MainLayout({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '0 16px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                display: 'none',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: 8,
                padding: '8px',
                cursor: 'pointer',
                color: 'white',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              className="mobile-menu-button"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
              </svg>
            </button>
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
                className="hide-mobile"
              >
                Acuerdo Asegurado
              </span>
            </Link>
          </div>
          <UserProfile />
        </div>
      </header>

      <div style={{ display: 'flex', position: 'relative' }}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              top: 70,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 98,
            }}
            className="mobile-overlay"
          />
        )}
        <main
          style={{
            flex: 1,
            padding: '16px',
            width: '100%',
            maxWidth: '100%',
          }}
          className="main-content"
        >
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-button {
            display: flex !important;
          }
          .main-content {
            padding: 12px !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-overlay {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default MainLayout;
