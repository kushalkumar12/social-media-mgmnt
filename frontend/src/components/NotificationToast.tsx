import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { CheckCircle2, AlertTriangle, XCircle, Info, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotificationToast: React.FC = () => {
  const { activeToast, dismissToast, markAsRead } = useNotifications();
  const navigate = useNavigate();

  if (!activeToast) return null;

  const handleClick = () => {
    if (activeToast.id) {
      markAsRead(activeToast.id);
    }
    if (activeToast.link) {
      navigate(activeToast.link);
    }
    dismissToast();
  };

  const getSeverityStyles = () => {
    switch (activeToast.severity) {
      case 'SUCCESS':
        return {
          icon: <CheckCircle2 size={18} color="var(--accent-green)" />,
          border: '1px solid var(--accent-green-border)',
          background: 'rgba(255, 255, 255, 0.98)',
          accent: 'var(--accent-green)',
        };
      case 'ERROR':
        return {
          icon: <XCircle size={18} color="var(--accent-red)" />,
          border: '1px solid var(--accent-red-border)',
          background: 'rgba(255, 255, 255, 0.98)',
          accent: 'var(--accent-red)',
        };
      case 'WARNING':
        return {
          icon: <AlertTriangle size={18} color="var(--accent-amber)" />,
          border: '1px solid var(--accent-amber-border)',
          background: 'rgba(255, 255, 255, 0.98)',
          accent: 'var(--accent-amber)',
        };
      default:
        return {
          icon: <Info size={18} color="var(--primary-blue)" />,
          border: '1px solid var(--border-color)',
          background: 'rgba(255, 255, 255, 0.98)',
          accent: 'var(--primary-blue)',
        };
    }
  };

  const styles = getSeverityStyles();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        maxWidth: '400px',
        width: 'calc(100vw - 48px)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 16px 36px rgba(15, 23, 42, 0.18), 0 2px 8px rgba(15, 23, 42, 0.08)',
        border: styles.border,
        background: styles.background,
        backdropFilter: 'blur(12px)',
        padding: '16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        animation: 'slideInRightBottom 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: activeToast.link ? 'pointer' : 'default',
      }}
      onClick={activeToast.link ? handleClick : undefined}
    >
      <div style={{ flexShrink: 0, marginTop: '2px' }}>{styles.icon}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <h4
            style={{
              fontSize: '0.88rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {activeToast.title}
          </h4>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Just now</span>
        </div>

        <p
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            margin: '4px 0 0 0',
            lineHeight: 1.4,
          }}
        >
          {activeToast.message}
        </p>

        {activeToast.link && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              color: styles.accent,
              fontWeight: 600,
              marginTop: '6px',
            }}
          >
            <span>View Details</span>
            <ExternalLink size={12} />
          </div>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          dismissToast();
        }}
        style={{
          background: 'none',
          border: 'none',
          padding: '2px',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius-sm)',
          flexShrink: 0,
        }}
        title="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
};
