import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { InstagramAccount } from '../../types';
import { TokenCountdown } from './TokenCountdown';
import {
  Instagram,
  X,
  CheckCircle2,
  XCircle,
  Tag,
  Copy,
  Check,
  Key,
  Edit3,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
} from 'lucide-react';

interface ProfilePreviewModalProps {
  account: InstagramAccount | null;
  onClose: () => void;
  onRefresh: (id: number) => void;
  onEditKey: (account: InstagramAccount) => void;
  onDisconnect: (id: number) => void;
  isRefreshing: boolean;
}

export const ProfilePreviewModal: React.FC<ProfilePreviewModalProps> = ({
  account,
  onClose,
  onRefresh,
  onEditKey,
  onDisconnect,
  isRefreshing,
}) => {
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (account) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [account, onClose]);

  if (!account) return null;

  const isActive = account.status === 'ACTIVE';

  const handleCopyUserId = () => {
    navigator.clipboard.writeText(account.igUserId);
    setCopiedUserId(true);
    setTimeout(() => setCopiedUserId(false), 2000);
  };

  const handleCopyKey = () => {
    if (!account.accessToken) return;
    navigator.clipboard.writeText(account.accessToken);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ zIndex: 10000 }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '480px',
          maxHeight: 'min(90vh, 760px)',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header Bar */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-color)',
            background: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Instagram size={20} color="var(--insta-pink)" />
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              @{account.username}
            </span>
            <span
              style={{
                background: isActive ? 'var(--accent-green-light)' : 'var(--accent-red-light)',
                color: isActive ? 'var(--accent-green)' : 'var(--accent-red)',
                border: isActive ? '1px solid var(--accent-green-border)' : '1px solid var(--accent-red-border)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.72rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
              <span>{isActive ? 'Active' : 'Expired'}</span>
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            title="Close dialog (Esc)"
            className="btn-icon-target"
            style={{
              background: '#F1F5F9',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ padding: 'var(--space-5)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Profile Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
            {/* DP with Story Ring */}
            <div
              style={{
                width: '82px',
                height: '82px',
                minWidth: '82px',
                borderRadius: '50%',
                background: 'var(--insta-gradient)',
                padding: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(225, 48, 108, 0.25)',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  padding: '2px',
                  overflow: 'hidden',
                }}
              >
                {account.profilePictureUrl ? (
                  <img
                    src={account.profilePictureUrl}
                    alt={account.username}
                    referrerPolicy="no-referrer"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: 'var(--insta-gradient)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.4rem',
                      borderRadius: '50%',
                    }}
                  >
                    {account.username.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Stats Trio */}
            <div
              style={{
                display: 'flex',
                flex: 1,
                justifyContent: 'space-around',
                textAlign: 'center',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-3) var(--space-2-5)',
              }}
            >
              <div>
                <div className="text-numeric" style={{ fontSize: 'var(--text-title-sm)', fontWeight: 800 }}>
                  {account.mediaCount ?? 0}
                </div>
                <div style={{ fontSize: 'var(--text-micro)', color: 'var(--text-secondary)' }}>Posts</div>
              </div>
              <div>
                <div className="text-numeric" style={{ fontSize: 'var(--text-title-sm)', fontWeight: 800 }}>
                  {(account.followersCount ?? 0) >= 1000
                    ? `${((account.followersCount ?? 0) / 1000).toFixed(1)}k`
                    : (account.followersCount ?? 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 'var(--text-micro)', color: 'var(--text-secondary)' }}>Followers</div>
              </div>
              <div>
                <div className="text-numeric" style={{ fontSize: 'var(--text-title-sm)', fontWeight: 800 }}>
                  {(account.followingCount ?? 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 'var(--text-micro)', color: 'var(--text-secondary)' }}>Following</div>
              </div>
            </div>
          </div>

          {/* Tags & Bio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, fontSize: '1rem' }}>{account.username}</span>
              <span
                style={{
                  background: '#F1F5F9',
                  color: 'var(--text-secondary)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {account.category || 'Creator & Business'}
              </span>
              <span
                style={{
                  background: 'var(--primary-blue-light)',
                  color: 'var(--primary-blue)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                #{account.accountType || 'BUSINESS'}
              </span>
            </div>

            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0, whiteSpace: 'pre-line' }}>
              {account.biography || 'Connected Instagram Business Profile.'}
            </p>
          </div>

          {/* User ID Box */}
          <div
            style={{
              background: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Meta User ID
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '2px', fontFamily: 'monospace' }}>
                {account.igUserId}
              </div>
            </div>
            <button
              onClick={handleCopyUserId}
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px' }}
            >
              {copiedUserId ? <Check size={13} color="var(--accent-green)" /> : <Copy size={13} />}
              <span>{copiedUserId ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          {/* Access Token Box */}
          <div
            style={{
              background: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Key size={12} color="var(--primary-blue)" />
                <span>Meta Access Token</span>
              </div>
              <button
                onClick={() => onEditKey(account)}
                className="btn-ghost"
                style={{ padding: '2px 8px', fontSize: '0.75rem', color: 'var(--primary-blue)', gap: '4px' }}
              >
                <Edit3 size={12} />
                <span>Edit Key</span>
              </button>
            </div>

            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                wordBreak: 'break-all',
                gap: '8px',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {showKey
                  ? account.accessToken || 'No key loaded'
                  : account.accessToken
                  ? `${account.accessToken.slice(0, 8)}••••••••••••••••${account.accessToken.slice(-4)}`
                  : '••••••••••••••••••••'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                <button
                  onClick={() => setShowKey(!showKey)}
                  title={showKey ? 'Hide Token' : 'Reveal Token'}
                  style={{ padding: '2px', color: 'var(--text-muted)' }}
                >
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                {account.accessToken && (
                  <button
                    onClick={handleCopyKey}
                    title="Copy Token"
                    style={{ padding: '2px', color: 'var(--text-muted)' }}
                  >
                    {copiedKey ? <Check size={15} color="var(--accent-green)" /> : <Copy size={15} />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Isolated Live Token Countdown */}
          <TokenCountdown expiresAt={account.tokenExpiresAt} showDetails={true} />

          {/* Action Buttons Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
            <button
              onClick={() => onRefresh(account.id)}
              disabled={isRefreshing}
              className="btn-primary"
              style={{ minHeight: 'var(--height-control-md)', fontSize: 'var(--text-secondary)', gap: 'var(--space-1-5)' }}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Token'}</span>
            </button>

            <button
              onClick={() => onEditKey(account)}
              className="btn-secondary"
              style={{ minHeight: 'var(--height-control-md)', fontSize: 'var(--text-secondary)', gap: 'var(--space-1-5)' }}
            >
              <Key size={14} />
              <span>Edit Key</span>
            </button>

            <button
              onClick={() => onDisconnect(account.id)}
              className="btn-danger"
              style={{ minHeight: 'var(--height-control-md)', fontSize: 'var(--text-secondary)', gap: 'var(--space-1-5)' }}
            >
              <Trash2 size={14} />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
