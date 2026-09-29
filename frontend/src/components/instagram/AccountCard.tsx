import React from 'react';
import { InstagramAccount } from '../../types';
import { RefreshCw, Key, Trash2 } from 'lucide-react';
import { ProgressiveImage } from '../common/Skeleton';

interface AccountCardProps {
  account: InstagramAccount;
  isSelected: boolean;
  isSelectMode: boolean;
  isRefreshing: boolean;
  onSelect: (id: number) => void;
  onOpenProfile: (account: InstagramAccount) => void;
  onRefresh: (id: number) => void;
  onEditKey: (account: InstagramAccount) => void;
  onDisconnect: (id: number) => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  isSelected,
  isSelectMode,
  isRefreshing,
  onSelect,
  onOpenProfile,
  onRefresh,
  onEditKey,
  onDisconnect,
}) => {
  const isExpired = account.status === 'TOKEN_EXPIRED';

  const handleClick = () => {
    if (isSelectMode) {
      onSelect(account.id);
    } else {
      onOpenProfile(account);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        cursor: 'pointer',
        padding: 'var(--space-3) var(--space-2)',
        borderRadius: 'var(--radius-lg)',
        background: isSelected ? 'rgba(37, 99, 235, 0.05)' : 'transparent',
        border: isSelected ? '1px solid rgba(37, 99, 235, 0.3)' : '1px solid transparent',
        transition: 'all var(--transition-fast)',
      }}
      title="Click to view Instagram Profile details"
    >
      {/* Checkbox Overlay in Select Mode */}
      {isSelectMode && (
        <div
          style={{ position: 'absolute', top: 'var(--space-2)', right: 'var(--space-3)', zIndex: 10 }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(account.id)}
            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-blue)' }}
          />
        </div>
      )}

      {/* DP Circle Ring Container */}
      <div
        style={{
          width: '74px',
          height: '74px',
          borderRadius: '50%',
          border: isSelected
            ? '3px solid var(--primary-blue)'
            : isExpired
            ? '3px solid var(--accent-red)'
            : '3px solid #E1306C',
          padding: '3px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isExpired ? 'var(--accent-red-light)' : 'rgba(225, 48, 108, 0.04)',
          boxShadow: isSelected
            ? '0 0 14px rgba(37, 99, 235, 0.4)'
            : '0 3px 10px rgba(0, 0, 0, 0.08)',
          position: 'relative',
          transition: 'transform var(--transition-fast)',
        }}
      >
        {/* Avatar Circle */}
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: 'var(--insta-gradient)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'var(--font-weight-bold)',
            fontSize: '1.25rem',
            overflow: 'hidden',
          }}
        >
          {account.profilePictureUrl ? (
            <ProgressiveImage
              src={account.profilePictureUrl}
              alt={account.username}
              circle
              referrerPolicy="no-referrer"
              fallbackText={account.username}
              width="100%"
              height="100%"
            />
          ) : (
            account.username.substring(0, 2).toUpperCase()
          )}
        </div>

        {/* Token Expired Warning Dot */}
        {isExpired && (
          <div
            style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              background: 'var(--accent-red)',
              color: '#FFFFFF',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 800,
              border: '2px solid #FFFFFF',
              boxShadow: '0 2px 4px rgba(220, 38, 38, 0.35)',
            }}
            title="Token Expired! Re-authentication required"
          >
            !
          </div>
        )}
      </div>

      {/* Username string below DP */}
      <span
        style={{
          marginTop: 'var(--space-2)',
          fontSize: 'var(--text-secondary)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--text-primary)',
          textAlign: 'center',
          maxWidth: '120px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        @{account.username}
      </span>

      {/* Followers pill */}
      <span className="text-numeric" style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)', marginTop: '2px' }}>
        {account.followersCount != null
          ? `${(account.followersCount / 1000).toFixed(1)}k followers`
          : 'Brand Account'}
      </span>

      {/* Action buttons toolbar with WCAG minimum click envelope */}
      {!isSelectMode && (
        <div style={{ display: 'flex', gap: 'var(--space-1)', marginTop: 'var(--space-2)' }} onClick={(e) => e.stopPropagation()}>
          {/* Refresh Token Button */}
          <button
            onClick={() => onRefresh(account.id)}
            title="Refresh Token & Profile Metadata"
            disabled={isRefreshing}
            className="btn-icon-target"
            style={{
              background: 'var(--accent-green-light)',
              border: '1px solid var(--accent-green-border)',
              color: 'var(--accent-green)',
            }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          </button>

          {/* Update Token Key Button */}
          <button
            onClick={() => onEditKey(account)}
            title="Update Access Token / Secret Key"
            className="btn-icon-target"
            style={{
              background: 'var(--primary-blue-light)',
              border: '1px solid #BFDBFE',
              color: 'var(--primary-blue)',
            }}
          >
            <Key size={14} />
          </button>

          {/* Disconnect Button */}
          <button
            onClick={() => onDisconnect(account.id)}
            title="Disconnect Account"
            className="btn-icon-target btn-danger"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
