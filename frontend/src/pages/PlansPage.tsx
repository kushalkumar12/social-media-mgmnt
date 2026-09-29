import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserPlan } from '../types';
import { ShieldCheck, CheckCircle2, Zap, ArrowRight, Check } from 'lucide-react';

export const PlansPage: React.FC = () => {
  const { user, login } = useAuth();
  const [upgrading, setUpgrading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleUpgrade = async (plan: UserPlan) => {
    if (plan === 'MASTER') {
      alert('Master Plan (>40 accounts) requires custom onboarding. Contact sales at sales@instapulse.com');
      return;
    }

    setUpgrading(true);
    setMessage('');
    setError('');
    try {
      const res = await api.post('/auth/upgrade-plan', { plan });
      const currentToken = localStorage.getItem('instamngmt_token') || '';
      login({ accessToken: currentToken, refreshToken: '', user: res.data });
      setMessage(`Successfully upgraded your subscription plan to ${plan}! Account limit updated.`);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Upgrade failed.');
    } finally {
      setUpgrading(false);
    }
  };

  const plans = [
    {
      id: 'SINGLE' as UserPlan,
      name: 'Single User',
      limit: '1 Account',
      badge: 'Free Tier',
      price: 'Free 15-Day Trial',
      description: 'Ideal for individual creators managing 1 brand account.',
      features: ['1 Connected Instagram Account', 'Single Photo & Reels Scheduling', '15-Day Free Access', 'Basic Analytics'],
    },
    {
      id: 'LITE' as UserPlan,
      name: 'Lite Plan',
      limit: 'Up to 10 Accounts',
      badge: 'Popular for Agencies',
      price: '$29 / month',
      description: 'Ideal for small agencies & multi-brand managers.',
      features: ['Up to 10 Instagram Accounts', 'Multi-brand scheduling', 'Carousel & Reels auto-publish', 'Priority ShedLock Outbox Queue'],
    },
    {
      id: 'PRO' as UserPlan,
      name: 'Pro Plan',
      limit: 'Up to 40 Accounts',
      badge: 'High Growth',
      price: '$79 / month',
      description: 'For growing social media agencies managing multiple client stacks.',
      features: ['Up to 40 Instagram Accounts', 'Unlimited Scheduled Posts', 'Resilience4j Circuit Breaker', '24h Rate Limit Ledger Tracking'],
    },
    {
      id: 'MASTER' as UserPlan,
      name: 'Enterprise Master',
      limit: '40+ Accounts',
      badge: 'Enterprise',
      price: 'Custom Pricing',
      description: 'Custom scale for large enterprises & global media networks.',
      features: ['Custom Unlimited Accounts', 'Dedicated Worker Queue Pool', 'SLA Guarantee & Key Security', 'Dedicated Account Manager'],
    },
  ];

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Subscription Plans & Limits</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Scale your capacity to manage more Instagram Business and Creator accounts with automated publishing.
        </p>
      </div>

      {message && (
        <div
          style={{
            background: 'var(--accent-green-light)',
            border: '1px solid var(--accent-green-border)',
            color: 'var(--accent-green)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div
          style={{
            background: 'var(--accent-red-light)',
            border: '1px solid var(--accent-red-border)',
            color: 'var(--accent-red)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.88rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Active Subscription Banner */}
      {user && (
        <div
          className="glass-card"
          style={{
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            background: '#FFFFFF',
          }}
        >
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Current Active Tier</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>{user.plan} Plan</span>
              <span
                style={{
                  fontSize: '0.74rem',
                  padding: '2px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--primary-blue-light)',
                  color: 'var(--primary-blue)',
                  fontWeight: 700,
                  border: '1px solid #BFDBFE',
                }}
              >
                Limit: {user.accountLimit} Account{user.accountLimit > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {user.trialExpiresAt && (
            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              Trial Period Ends:{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {new Date(user.trialExpiresAt).toLocaleDateString()}
              </strong>
            </div>
          )}
        </div>
      )}

      {/* Plans Pricing Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
        }}
      >
        {plans.map((plan) => {
          const isCurrentPlan = user?.plan === plan.id;

          return (
            <div
              key={plan.id}
              className="glass-card"
              style={{
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                border: isCurrentPlan ? '2px solid var(--primary-blue)' : '1px solid var(--border-color)',
                position: 'relative',
              }}
            >
              {isCurrentPlan && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-11px',
                    left: '24px',
                    background: 'var(--primary-blue)',
                    color: '#fff',
                    padding: '2px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Current Plan
                </span>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{plan.name}</h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--primary-blue)', fontWeight: 700, marginTop: '2px' }}>
                    {plan.limit}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: '#F1F5F9',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {plan.badge}
                </span>
              </div>

              <div style={{ fontSize: '1.45rem', fontWeight: 800, margin: '8px 0 12px 0' }}>
                {plan.price}
              </div>

              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '20px' }}>
                {plan.description}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px', marginTop: 'auto' }}>
                {plan.features.map((feat, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <Check size={14} color="var(--accent-green)" style={{ flexShrink: 0 }} />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrentPlan || upgrading}
                className={isCurrentPlan ? 'btn-secondary' : 'btn-primary'}
                style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '0.88rem' }}
              >
                <span>{isCurrentPlan ? 'Active Plan' : upgrading ? 'Processing...' : 'Select Plan'}</span>
                {!isCurrentPlan && <ArrowRight size={15} />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
