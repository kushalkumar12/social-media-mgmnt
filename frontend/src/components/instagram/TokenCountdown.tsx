import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TokenCountdownProps {
  expiresAt?: string;
  showDetails?: boolean;
}

export const TokenCountdown: React.FC<TokenCountdownProps> = ({ expiresAt, showDetails = false }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <Clock size={13} />
        <span>No expiration configured</span>
      </div>
    );
  }

  const diff = new Date(expiresAt).getTime() - now;
  const expired = diff <= 0;

  if (expired) {
    return (
      <div
        style={{
          background: 'var(--accent-red-light)',
          border: '1px solid var(--accent-red-border)',
          borderRadius: 'var(--radius-md)',
          padding: showDetails ? '12px 14px' : '4px 10px',
          display: 'flex',
          flexDirection: showDetails ? 'column' : 'row',
          gap: '4px',
          color: 'var(--accent-red)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={13} /> Token Expired
          </span>
          {showDetails && (
            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--accent-red)', color: '#fff' }}>
              EXPIRED
            </span>
          )}
        </div>
        {showDetails && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Expired on: {new Date(expiresAt).toLocaleString()}
          </div>
        )}
      </div>
    );
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  const countdownText = `${days}d ${hours}h ${minutes}m ${seconds}s remaining`;

  if (!showDetails) {
    return (
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '0.75rem',
          color: 'var(--accent-green)',
          background: 'var(--accent-green-light)',
          padding: '2px 8px',
          borderRadius: '6px',
          border: '1px solid var(--accent-green-border)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: 600,
        }}
      >
        <Clock size={11} />
        {countdownText}
      </span>
    );
  }

  return (
    <div
      style={{
        background: 'var(--accent-green-light)',
        border: '1px solid var(--accent-green-border)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-green)' }}>
          <Clock size={14} />
          <span>Token Expiry & Live Countdown</span>
        </div>
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--accent-green)',
            color: '#FFFFFF',
          }}
        >
          ACTIVE
        </span>
      </div>

      <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#065F46', fontFamily: 'monospace' }}>
        {countdownText}
      </div>

      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        Expires on: {new Date(expiresAt).toLocaleString()}
      </div>
    </div>
  );
};
