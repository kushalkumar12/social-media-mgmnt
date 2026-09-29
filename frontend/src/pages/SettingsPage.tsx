import React from 'react';
import { Shield, Webhook, Key, FileCheck, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Meta Compliance & Webhook Engine</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Production endpoints for Facebook App Review, User Deauthorization webhooks, and Data Deletion callbacks.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Webhook size={22} color="var(--insta-pink)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Meta Webhook Endpoints</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
            <div style={{ background: 'var(--bg-card-hover)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>GET /api/webhooks/instagram</div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Meta Graph API Challenge verification handshake endpoint</div>
            </div>

            <div style={{ background: 'var(--bg-card-hover)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 600, color: 'var(--accent-amber)' }}>POST /api/webhooks/deauthorize</div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Triggers account status DEAUTHORIZED & cancels pending posts when user removes app access</div>
            </div>

            <div style={{ background: 'var(--bg-card-hover)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 600, color: 'var(--accent-green)' }}>POST /api/webhooks/data-deletion</div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Returns confirmation URL & tracking code per Meta Data Privacy Guidelines</div>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <FileCheck size={22} color="var(--accent-green)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>App Review & Security Checklist</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={16} color="var(--accent-green)" />
              <span>Permission <code>instagram_content_publish</code> restricted scope check</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={16} color="var(--accent-green)" />
              <span>HMAC-SHA256 <code>appsecret_proof</code> attached to Graph API calls</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={16} color="var(--accent-green)" />
              <span>Envelope encryption for long-lived OAuth tokens (60-day expiry)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={16} color="var(--accent-green)" />
              <span>Transactional Outbox + ShedLock leader election for single publishing</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={16} color="var(--accent-green)" />
              <span>Rolling 24-hour rate limit ledger & exponential backoff retries</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
