import React from 'react';
import { Webhook, FileCheck, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Meta Compliance & Webhook Engine</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Production endpoints for Facebook App Review, User Deauthorization webhooks, and Data Deletion callbacks.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(225, 48, 108, 0.1)',
                color: 'var(--insta-pink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Webhook size={18} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Meta Webhook Endpoints</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
            <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 600, color: 'var(--primary-blue)', fontFamily: 'monospace' }}>
                GET /api/webhooks/instagram
              </div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.8rem' }}>
                Meta Graph API Challenge verification handshake endpoint
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 600, color: 'var(--accent-amber)', fontFamily: 'monospace' }}>
                POST /api/webhooks/deauthorize
              </div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.8rem' }}>
                Triggers account status DEAUTHORIZED & cancels pending posts when user removes app access
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 600, color: 'var(--accent-green)', fontFamily: 'monospace' }}>
                POST /api/webhooks/data-deletion
              </div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.8rem' }}>
                Returns confirmation URL & tracking code per Meta Data Privacy Guidelines
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-green-light)',
                color: 'var(--accent-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileCheck size={18} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>App Review & Security Checklist</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <CheckCircle2 size={16} color="var(--accent-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ color: 'var(--text-secondary)' }}>
                Permission <code style={{ color: 'var(--primary-blue)', background: '#F1F5F9', padding: '2px 4px', borderRadius: '4px' }}>instagram_content_publish</code> restricted scope check
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <CheckCircle2 size={16} color="var(--accent-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ color: 'var(--text-secondary)' }}>
                HMAC-SHA256 <code style={{ color: 'var(--primary-blue)', background: '#F1F5F9', padding: '2px 4px', borderRadius: '4px' }}>appsecret_proof</code> attached to all Graph API calls
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <CheckCircle2 size={16} color="var(--accent-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ color: 'var(--text-secondary)' }}>
                Envelope encryption for long-lived OAuth tokens (60-day expiry)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <CheckCircle2 size={16} color="var(--accent-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ color: 'var(--text-secondary)' }}>
                Transactional Outbox + ShedLock leader election for single publishing
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <CheckCircle2 size={16} color="var(--accent-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ color: 'var(--text-secondary)' }}>
                Rolling 24-hour rate limit ledger & exponential backoff retries
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
