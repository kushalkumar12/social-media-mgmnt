import React, { useEffect } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  PlusCircle,
  Image,
  Instagram,
  Settings,
  ListOrdered,
  CreditCard,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // On small mobile screens, auto-close expanded sidebar when route changes
  useEffect(() => {
    if (window.innerWidth <= 900 && isOpen) {
      onToggle();
    }
  }, [location.pathname]);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/posts', label: 'Scheduled Posts', icon: ListOrdered },
    { path: '/posts/create', label: 'Create Post', icon: PlusCircle },
    { path: '/calendar', label: 'Calendar View', icon: Calendar },
    { path: '/media', label: 'Media Library', icon: Image },
    { path: '/instagram/accounts', label: 'Account Management', icon: Instagram },
    { path: '/plans', label: 'Upgrade Plans', icon: CreditCard },
    { path: '/settings', label: 'Meta Compliance', icon: Settings },
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ path: '/admin/settings', label: 'Site Admin Settings', icon: Shield });
  }

  // Get user initials (e.g., "KU" for "Kushal")
  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <>
      {/* Mobile Drawer Backdrop when open */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="sidebar-backdrop"
          aria-hidden="true"
        />
      )}

      <aside
        className={`app-sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}
        aria-label="Application Navigation Rail"
      >
        <div className="sidebar-inner">
          {/* Top Logo & Toggle Header */}
          <div className="sidebar-header">
            {isOpen ? (
              <>
                <Link
                  to="/dashboard"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    textDecoration: 'none',
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      background: 'var(--insta-gradient)',
                      width: '32px',
                      height: '32px',
                      borderRadius: '9px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(225, 48, 108, 0.25)',
                      flexShrink: 0,
                    }}
                  >
                    <Instagram size={18} color="#fff" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 800,
                        fontFamily: 'var(--font-family-display)',
                        background: 'var(--insta-gradient)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        lineHeight: 1.15,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      InstaPulse
                    </span>
                    <span
                      style={{
                        fontSize: '0.64rem',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        lineHeight: 1,
                      }}
                    >
                      SAAS PLATFORM
                    </span>
                  </div>
                </Link>

                <button
                  onClick={onToggle}
                  className="chatgpt-toggle-btn"
                  title="Collapse menu to icons (Ctrl + [)"
                  aria-label="Collapse menu"
                >
                  <PanelLeftClose size={18} />
                </button>
              </>
            ) : (
              /* Closed / Symbols-only Rail Header: Instagram icon morphs to expand icon on hover */
              <div
                className="sidebar-header-rail"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative',
                  width: '100%',
                }}
              >
                <button
                  type="button"
                  onClick={onToggle}
                  className="rail-logo-btn"
                  title="Expand menu (Ctrl + [)"
                  aria-label="Expand menu"
                >
                  <Instagram size={20} className="rail-instagram-icon" />
                  <PanelLeftOpen size={20} className="rail-expand-icon" />
                </button>
                <div className="sidebar-tooltip">Expand Menu (Ctrl + [)</div>
              </div>
            )}
          </div>

          {/* Navigation Menu List: Shows Icons in both Open and Closed states */}
          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isAdminItem = item.path === '/admin/settings';
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-nav-item ${isActive ? 'active' : ''} ${
                      isAdminItem ? 'admin-item' : ''
                    }`
                  }
                >
                  <Icon size={19} style={{ flexShrink: 0 }} />
                  {isOpen ? (
                    <span className="nav-label" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.label}
                    </span>
                  ) : (
                    <div className="sidebar-tooltip" role="tooltip">
                      {item.label}
                    </div>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* User Profile Card at Bottom-Left */}
          {user && (
            isOpen ? (
              /* Expanded Profile Card */
              <div className="sidebar-profile">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <div className="sidebar-avatar" title={user.name}>
                    {userInitials}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      minWidth: 0,
                      overflow: 'hidden',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={user.name}
                    >
                      {user.name}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          color: 'var(--text-muted)',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {user.plan} Plan
                      </span>
                      {user.role === 'ADMIN' && (
                        <span
                          style={{
                            background: 'rgba(124, 58, 237, 0.12)',
                            color: '#7C3AED',
                            padding: '1px 4px',
                            borderRadius: '4px',
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            lineHeight: 1,
                          }}
                        >
                          ADMIN
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="sidebar-logout-btn"
                  title="Sign out of account"
                  aria-label="Sign out of account"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              /* Closed / Symbols-only Profile Avatar */
              <div
                className="sidebar-profile-rail"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '10px 0',
                  marginTop: 'auto',
                  borderTop: '1px solid var(--border-color)',
                  position: 'relative',
                  cursor: 'pointer',
                  width: '100%',
                }}
                onClick={logout}
                title={`Signed in as ${user.name} (${user.plan} Plan) • Click to Sign Out`}
              >
                <div className="sidebar-avatar" style={{ width: '36px', height: '36px' }}>
                  {userInitials}
                </div>
                <div className="sidebar-tooltip">
                  {user.name} ({user.plan} Plan) • Sign Out
                </div>
              </div>
            )
          )}
        </div>
      </aside>
    </>
  );
};
