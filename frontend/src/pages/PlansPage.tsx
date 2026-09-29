import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserPlan } from '../types';
import { ShieldCheck, CheckCircle2, Zap, ArrowRight, Mail, Star } from 'lucide-react';

export const PlansPage: React.FC = () => {
  const { user, login } = useAuth();
  const [upgrading, setUpgrading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpgrade = async (plan: UserPlan) => {
    if (plan === 'MASTER') {
      alert('Master Plan (>40 accounts) requires custom onboarding. Please contact sales at sales@instapulse.com');
      return;
    }

    setUpgrading(true);
    setMessage('');
    try {
      const res = await api.post('/auth/upgrade-plan', { plan });
      const currentToken = localStorage.getItem('instamngmt_token') || '';
      login({ accessToken: currentToken, refreshToken: '', user: res.data });
      setMessage(`Successfully upgraded your subscription plan to ${plan}! Account limit updated.`);
    } catch (err: any) {
      alert('Upgrade failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpgrading(false);
    }
  };

  const plans = [
    {
      id: 'SINGLE',
      name: 'Single User',
      limit: '1 Account',
      badge: 'Current Default',
      price: 'Free 15-Day Trial',
      description: 'Ideal for individual creators managing 1 brand account.',
      features: ['1 Connected Instagram Account', 'Post Scheduling & Reels', '15-Day Free Access', 'Basic Analytics']
    },
    {
      id: 'LITE',
      name: 'Lite Plan',
      limit: 'Up to 10 Accounts',
      badge: 'Popular for Agencies',
      price: 'Direct Payment',
      description: 'Ideal for small agencies & multi-brand managers.',
      features: ['Up to 10 Instagram Accounts', 'Multi-brand scheduling', 'Carousel & Reels auto-publish', 'Priority ShedLock Outbox']
    },
    {
      id: 'PRO',
      name: 'Pro Plan',
      limit: 'Up to 40 Accounts',
      badge: 'High Growth',
      price: 'Direct Payment',
      description: 'For growing social media agencies managing multiple client stacks.',
      features: ['Up to 40 Instagram Accounts', 'Unlimited Scheduled Posts', 'Resilience4j Circuit Breaker', '24h Rate Limit Ledger']
    },
    {
      id: 'MASTER',
      name: 'Master Enterprise',
      limit: '40+ Accounts',
      badge: 'Enterprise',
      price: 'Contact Sales',
      description: 'Custom scale for large enterprises & global media networks.',
      features: ['Custom Unlimited Accounts', 'Dedicated Worker Queue Pool', 'SLA Guarantee & Dedicated Key Security', 'Manual / Custom Process']
    }
  ];

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Subscription Plans & Account Limits</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Upgrade your plan to connect and manage multiple Instagram Business & Creator accounts.
        </p>
      </div>

      {message && (
        <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#047857', padding: '14px', borderRadius: '10px', fontSize: '0.9rem' }}>
          {message}
        </div>
      )}

      {user && (
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, rgba(225, 48, 108, 0.08) 0%, rgba(37, 99, 235, 0.08) 100%)', border: '1px solid var(--border-color)' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Current Active Subscription</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>{user.plan} Plan</span>
              <span style={{ fontSize: '0.75rem', padding: '2px 10px', borderRadius: '20px', background: 'var(--insta-pink)', color: '#fff' }}>
                Limit: {user.accountLimit} Account{user.accountLimit > 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--accent-green)', fontWeight: 600 }}>
            {user.trialExpiresAt && `Trial Expires: ${new Date(user.trialExpiresAt).toLocaleDateString()}`}
          </div>
        </div>
      )}

      {/* Plans Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        {plans.map((p) => {
          const isCurrent = user?.plan === p.id;
          return (
            <div key={p.id} className="glass-card" style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              border: isCurrent ? '2px solid var(--insta-pink)' : '1px solid var(--border-color)',
              position: 'relative'
            }}>
              {isCurrent && (
                <div style={{ position: 'absolute', top: '-12px', right: '20px', background: 'var(--insta-pink)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '2px 10px', borderRadius: '10px', textTransform: 'uppercase' }}>
                  Active Plan
                </div>
              )}

              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{p.name}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--insta-pink)', margin: '8px 0 4px 0' }}>{p.limit}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--accent-blue)', fontWeight: 600, marginBottom: '12px' }}>{p.price}</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '20px' }}>{p.description}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', flex: 1 }}>
                {p.features.map((feat, idx) => (
                  <div key={idx} style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={14} color="var(--accent-green)" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {isCurrent ? (
                <button className="btn-secondary" disabled style={{ width: '100%', justifyContent: 'center', opacity: 0.7 }}>
                  Current Active Plan
                </button>
              ) : p.id === 'MASTER' ? (
                <button onClick={() => handleUpgrade('MASTER')} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                  <Mail size={16} />
                  Contact Sales Team
                </button>
              ) : (
                <button onClick={() => handleUpgrade(p.id as UserPlan)} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={upgrading}>
                  <span>Upgrade to {p.name}</span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
