import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { NotificationCenter } from './NotificationCenter';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarOpen = true }) => {
  const location = useLocation();
  const { unreadCount } = useNotifications();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    if (isNotificationOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isNotificationOpen]);

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
    <header className="main-content-header" style={{ position: 'relative' }}>
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

      {/* Right Header Status Telemetry & Notification Center */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Meta Status Pill */}
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

        {/* Notification Bell Dropdown Target */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setIsNotificationOpen((prev) => !prev)}
            style={{
              position: 'relative',
              background: isNotificationOpen ? 'var(--primary-blue-light)' : '#FFFFFF',
              border: isNotificationOpen ? '1px solid #BFDBFE' : '1px solid var(--border-color)',
              color: isNotificationOpen ? 'var(--primary-blue)' : 'var(--text-secondary)',
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Notifications"
            aria-label="View notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'var(--accent-red)',
                  color: '#FFFFFF',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  minWidth: '18px',
                  height: '18px',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  boxShadow: '0 0 0 2px #FFFFFF',
                  lineHeight: 1,
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <NotificationCenter
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
          />
        </div>
      </div>
    </header>
  );
};
