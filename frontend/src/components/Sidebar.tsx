import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Calendar, PlusCircle, Image, Instagram, Settings, ListOrdered, CreditCard, Shield } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

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

  return (
    <aside style={{
      width: '240px',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      boxShadow: '1px 0 3px rgba(0, 0, 0, 0.02)'
    }}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isAdminItem = item.path === '/admin/settings';
        return (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '0.9rem',
              fontWeight: isActive ? 700 : isAdminItem ? 700 : 500,
              color: isActive ? '#fff' : isAdminItem ? '#7C3AED' : 'var(--text-secondary)',
              background: isActive
                ? (isAdminItem ? 'linear-gradient(135deg, #833AB4, #FD1D1D)' : 'var(--insta-gradient)')
                : (isAdminItem ? 'rgba(124, 58, 237, 0.08)' : 'transparent'),
              border: isAdminItem && !isActive ? '1px solid rgba(124, 58, 237, 0.2)' : 'none',
              boxShadow: isActive ? '0 4px 14px rgba(225, 48, 108, 0.3)' : 'none',
              transition: 'all 0.2s ease'
            })}
          >
            <Icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </aside>
  );
};
