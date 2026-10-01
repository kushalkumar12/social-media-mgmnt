import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { NotificationItem, NotificationSeverity } from '../types';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  CheckCheck,
  Trash2,
  X,
  ExternalLink,
  BellOff,
  Radio,
} from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllRead,
    loading,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const navigate = useNavigate();

  if (!isOpen) return null;

  const filteredItems = activeTab === 'UNREAD'
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const formatRelativeTime = (timestamp: string): string => {
    try {
      const now = new Date();
      const date = new Date(timestamp);
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      if (diffSec < 172800) return 'Yesterday';
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const getSeverityIcon = (severity: NotificationSeverity) => {
    switch (severity) {
      case 'SUCCESS':
        return (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-green-light)',
              color: 'var(--accent-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={16} />
          </div>
        );
      case 'ERROR':
        return (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-red-light)',
              color: 'var(--accent-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <XCircle size={16} />
          </div>
        );
      case 'WARNING':
        return (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-amber-light)',
              color: 'var(--accent-amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={16} />
          </div>
        );
      default:
        return (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-blue-light)',
              color: 'var(--primary-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Info size={16} />
          </div>
        );
    }
  };

  const handleItemClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    if (item.link) {
      navigate(item.link);
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 10px)',
        right: '0',
        width: '400px',
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: '520px',
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 48px rgba(15, 23, 42, 0.16), 0 4px 12px rgba(15, 23, 42, 0.08)',
        border: '1px solid var(--border-color)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fadeInDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 18px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#F8FAFC',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ fontSize: '0.96rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                background: 'var(--primary-blue)',
                color: '#FFFFFF',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {unreadCount} new
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="btn-icon-target"
              style={{
                fontSize: '0.75rem',
                color: 'var(--primary-blue)',
                background: 'var(--primary-blue-light)',
                border: '1px solid #BFDBFE',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
              }}
              title="Mark all as read"
            >
              <CheckCheck size={14} />
              <span style={{ fontWeight: 600 }}>Mark all read</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="btn-icon-target"
            style={{ color: 'var(--text-muted)', padding: '4px' }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          background: '#FFFFFF',
          padding: '0 16px',
        }}
      >
        <button
          onClick={() => setActiveTab('ALL')}
          style={{
            padding: '10px 14px',
            border: 'none',
            background: 'none',
            fontSize: '0.82rem',
            fontWeight: activeTab === 'ALL' ? 700 : 500,
            color: activeTab === 'ALL' ? 'var(--primary-blue)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'ALL' ? '2px solid var(--primary-blue)' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          All ({notifications.length})
        </button>

        <button
          onClick={() => setActiveTab('UNREAD')}
          style={{
            padding: '10px 14px',
            border: 'none',
            background: 'none',
            fontSize: '0.82rem',
            fontWeight: activeTab === 'UNREAD' ? 700 : 500,
            color: activeTab === 'UNREAD' ? 'var(--primary-blue)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'UNREAD' ? '2px solid var(--primary-blue)' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          Unread ({unreadCount})
        </button>

        {notifications.some((n) => n.isRead) && (
          <button
            onClick={() => clearAllRead()}
            style={{
              marginLeft: 'auto',
              border: 'none',
              background: 'none',
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
            title="Clear all read notifications"
          >
            <Trash2 size={12} />
            <span>Clear read</span>
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', maxHeight: '380px', padding: '8px' }}>
        {loading && notifications.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            Loading alerts...
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <BellOff size={32} color="var(--text-muted)" style={{ marginBottom: '8px', opacity: 0.6 }} />
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {activeTab === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
            </div>
            <p style={{ fontSize: '0.78rem', marginTop: '4px' }}>
              Publishing events, token updates, and system alerts will appear here in real time.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: item.isRead ? '#FFFFFF' : '#EFF6FF',
                  border: item.isRead ? '1px solid var(--border-color)' : '1px solid #BFDBFE',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  cursor: item.link ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                {getSeverityIcon(item.severity)}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.84rem',
                          fontWeight: item.isRead ? 600 : 700,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {item.title}
                      </span>
                      {!item.isRead && (
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: 'var(--primary-blue)',
                            display: 'inline-block',
                          }}
                        />
                      )}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      margin: '3px 0 0 0',
                      lineHeight: 1.35,
                      wordBreak: 'break-word',
                    }}
                  >
                    {item.message}
                  </p>

                  {item.link && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.72rem',
                        color: 'var(--primary-blue)',
                        fontWeight: 600,
                        marginTop: '4px',
                      }}
                    >
                      <span>Action Link</span>
                      <ExternalLink size={10} />
                    </div>
                  )}
                </div>

                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {!item.isRead && (
                    <button
                      onClick={() => markAsRead(item.id)}
                      className="btn-icon-target"
                      style={{
                        padding: '4px',
                        color: 'var(--text-muted)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      title="Mark as read"
                    >
                      <CheckCheck size={14} />
                    </button>
                  )}

                  <button
                    onClick={() => deleteNotification(item.id)}
                    className="btn-icon-target"
                    style={{
                      padding: '4px',
                      color: 'var(--text-muted)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    title="Delete notification"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--border-color)',
          background: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Radio size={12} color="var(--accent-green)" />
          <span>Real-time SSE active</span>
        </div>
        <span>InstaPulse Telemetry</span>
      </div>
    </div>
  );
};
