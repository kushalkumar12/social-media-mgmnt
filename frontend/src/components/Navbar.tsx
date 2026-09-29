import React from 'react';
import { useLocation } from 'react-router-dom';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarOpen = true }) => {
  const location = useLocation();

  // Map route to friendly breadcrumb title
  const getPageTitle = (path: string): string => {
    if (path.startsWith('/dashboard')) return 'Publishing Command Center';
    if (path.startsWith('/posts/create')) return 'Create New Post';
    if (path.startsWith('/posts')) return 'Scheduled Posts & Queues';
    if (path.startsWith('/calendar')) return 'Editorial Calendar';
    if (path.startsWith('/media')) return 'Media Assets Library';
    if (path.startsWith('/instagram/accounts')) return 'Account Management';
    if (path.startsWith('/plans')) return 'Subscription Plans';
    if (path.startsWith('/settings')) return 'Meta Compliance & Webhooks';
    if (path.startsWith('/admin/settings')) return 'Site Administration';
    return 'Dashboard';
  };

  return (
    <header className="main-content-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Dynamic Context Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isSidebarOpen && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: 600,
              }}
              className="hide-on-mobile"
            >
              <span>InstaPulse</span>
              <span>/</span>
            </div>
          )}
          <span
            style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            {getPageTitle(location.pathname)}
          </span>
        </div>
      </div>

      {/* Right Header Status Telemetry */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--accent-green-light)',
            color: 'var(--accent-green)',
            border: '1px solid var(--accent-green-border)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.72rem',
            fontWeight: 600,
          }}
          title="Meta Graph API v19.0 Connection Healthy"
        >
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-green)',
              boxShadow: '0 0 6px var(--accent-green)',
            }}
          />
          <span className="hide-on-mobile">Meta Graph API v19.0 Active</span>
          <span style={{ display: 'none' }} className="show-on-mobile-inline">Active</span>
        </div>
      </div>
    </header>
  );
};
