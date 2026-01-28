import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';

export default function UserProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [producerName, setProducerName] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    async function loadProducerName() {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('producers')
        .select('name')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setProducerName(data.name);
      }
    }

    loadProducerName();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const getUserInitials = () => {
    if (producerName) {
      return producerName.charAt(0).toUpperCase();
    }
    if (!user?.email) return 'U';
    const email = user.email;
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase();
  };

  const getUserDisplayName = () => {
    if (producerName) {
      return producerName;
    }
    if (!user?.email) return 'Usuario';
    return user.email.split('@')[0];
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 12px',
          borderRadius: 12,
          border: 'none',
          background: 'rgba(255, 255, 255, 0.1)',
          color: 'white',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 500,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {getUserInitials()}
        </div>
        <span className="hide-mobile">{getUserDisplayName()}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            background: 'white',
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            minWidth: 200,
            overflow: 'hidden',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
              Usuario
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>
              {producerName || user?.email || 'Usuario'}
            </div>
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              navigate('/profile');
            }}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              color: '#334155',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f8fafc';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Mis datos
          </button>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              color: '#ef4444',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fef2f2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
