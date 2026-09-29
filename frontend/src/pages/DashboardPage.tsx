import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DashboardSummary } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, AlertTriangle, Instagram, PlusCircle, RefreshCw, Zap, Layers } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/dashboard');
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to load dashboard summary', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 10000); // Live poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>Loading Dashboard Overview...</div>;
  }

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Publishing Command Center</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Real-time status of Instagram scheduled posts, Meta Graph API status, and rate limit ledger.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={fetchSummary} className="btn-secondary">
            <RefreshCw size={16} />
            Refresh Status
          </button>
          <Link to="/posts/create" className="btn-primary">
            <PlusCircle size={18} />
            Schedule New Post
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', color: '#A78BFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Scheduled Posts</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '2px' }}>{summary?.totalPosts || 0}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Scheduled / Queued</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '2px' }}>{summary?.scheduledCount || 0}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Successfully Published</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '2px' }}>{summary?.publishedCount || 0}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#FCA5A5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Publishing Failures</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '2px' }}>{summary?.failedCount || 0}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(193, 53, 132, 0.15)', color: 'var(--insta-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Instagram size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Connected Brands</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '2px' }}>{summary?.accounts.length || 0}</div>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Upcoming Posts Feed */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Upcoming Scheduled Queue</h3>
            <Link to="/posts" style={{ fontSize: '0.85rem', color: 'var(--insta-pink)', fontWeight: 600 }}>View All Posts &rarr;</Link>
          </div>

          {!summary?.upcomingPosts || summary.upcomingPosts.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Calendar size={36} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
              <div>No scheduled posts in the queue right now.</div>
              <Link to="/posts/create" className="btn-primary" style={{ marginTop: '16px' }}>Create Scheduled Post</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {summary.upcomingPosts.map((post) => (
                <div key={post.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  background: 'var(--bg-card-hover)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {post.mediaItems && post.mediaItems[0] ? (
                      <img src={post.mediaItems[0].cdnUrl} alt="Thumbnail" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>📷</div>
                    )}
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {post.caption ? (post.caption.length > 40 ? post.caption.substring(0, 40) + '...' : post.caption) : 'Untitled Post'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        @{post.instagramUsername} &bull; {new Date(post.scheduledAt).toLocaleString()} ({post.timezone || 'UTC'})
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={post.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Connected Accounts & Meta Engine Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Connected Instagram Accounts</h3>
            {summary?.accounts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: '0.85rem' }}>No Instagram Professional account connected yet.</p>
                <Link to="/instagram/accounts" className="btn-secondary" style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}>Connect Instagram</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {summary?.accounts.map((acc) => (
                  <div key={acc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-card-hover)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--insta-gradient)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
                        {acc.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>@{acc.username}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-green)' }}>Token Active (60d)</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(16,185,129,0.12)', color: '#047857', border: '1px solid rgba(16,185,129,0.25)', fontWeight: 600 }}>Connected</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(225, 48, 108, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Zap size={20} color="var(--insta-pink)" />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Meta Graph API & Outbox Health</h4>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Publishing engine running with leader-elected ShedLock outbox poller, circuit breaker resilience, and exponential backoff retry.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
