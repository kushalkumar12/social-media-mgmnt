import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Instagram, LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header style={{
      height: '70px',
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          background: 'var(--insta-gradient)',
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(225, 48, 108, 0.3)'
        }}>
          <Instagram size={22} color="#fff" />
        </div>
        <div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', background: 'var(--insta-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            InstaPulse
          </span>
        </div>
      </div>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-card-hover)', padding: '6px 14px', borderRadius: '30px', border: '1px solid var(--border-color)' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--insta-gradient)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</span>
          </div>

          <button onClick={logout} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </header>
  );
};
