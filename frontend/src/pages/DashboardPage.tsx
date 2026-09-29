import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DashboardSummary } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Skeleton, MetricsGridSkeleton, ProgressiveImage } from '../components/common/Skeleton';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Instagram,
  PlusCircle,
  RefreshCw,
  Layers,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Debounced skeleton: eliminates flicker on fast connections
  const showSkeleton = useDelayedLoading(loading && !summary);

  const fetchSummary = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get('/dashboard');
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to load dashboard summary', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(() => fetchSummary(false), 15000); // 15-second polling interval
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Publishing Command Center</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Real-time telemetry on scheduled queues, Meta Graph API connection health, and publishing success rate.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => fetchSummary(true)}
            className="btn-secondary"
            disabled={refreshing}
            title="Refresh dashboard metrics"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <Link to="/posts/create" className="btn-primary">
            <PlusCircle size={16} />
            <span>Schedule Post</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      {showSkeleton ? (
        <MetricsGridSkeleton count={4} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-blue-light)',
              color: 'var(--primary-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Posts</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '2px', lineHeight: 1.1 }}>
              {summary?.totalPosts ?? 0}
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-md)',
              background: '#EFF6FF',
              color: 'var(--primary-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Queued / Pending</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '2px', lineHeight: 1.1, color: 'var(--primary-blue)' }}>
              {summary?.scheduledCount ?? 0}
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-green-light)',
              color: 'var(--accent-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Published</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '2px', lineHeight: 1.1, color: 'var(--accent-green)' }}>
              {summary?.publishedCount ?? 0}
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-red-light)',
              color: 'var(--accent-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Failures</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '2px', lineHeight: 1.1, color: 'var(--accent-red)' }}>
              {summary?.failedCount ?? 0}
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(225, 48, 108, 0.1)',
              color: 'var(--insta-pink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Instagram size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Connected Brands</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '2px', lineHeight: 1.1 }}>
              {summary?.accounts?.length ?? 0}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Main Content Grid: Responsive Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px',
        }}
      >
        {/* Upcoming Posts Feed */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Upcoming Scheduled Queue</h3>
            <Link to="/posts" style={{ fontSize: '0.82rem', color: 'var(--primary-blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {showSkeleton ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2-5)' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-2-5) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    background: '#F8FAFC',
                  }}
                >
                  <Skeleton width={40} height={40} borderRadius="var(--radius-sm)" />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-1-5)' }}>
                    <Skeleton width="45%" height={14} />
                    <Skeleton width="80%" height={12} />
                  </div>
                  <Skeleton width={60} height={20} borderRadius="var(--radius-full)" />
                </div>
              ))}
            </div>
          ) : !summary?.upcomingPosts || summary.upcomingPosts.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-secondary)', marginTop: 'auto', marginBottom: 'auto' }}>
              <Calendar size={36} color="var(--text-muted)" style={{ marginBottom: '10px' }} />
              <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>No posts scheduled in queue</div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Schedule individual posts or upload an Excel batch to automate publishing.
              </p>
              <Link to="/posts/create" className="btn-secondary" style={{ marginTop: '14px', display: 'inline-flex' }}>
                Schedule First Post
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {summary.upcomingPosts.slice(0, 5).map((post) => (
                <div
                  key={post.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    background: '#F8FAFC',
                  }}
                >
                  {post.mediaItems && post.mediaItems[0] ? (
                    <ProgressiveImage
                      src={post.mediaItems[0].cdnUrl}
                      alt="Thumbnail"
                      width={40}
                      height={40}
                      borderRadius="var(--radius-sm)"
                    />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      📷
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        @{post.instagramUsername}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--primary-blue)', fontWeight: 600 }}>
                        {post.postType}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginTop: '2px',
                      }}
                    >
                      {post.caption || 'No caption'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <StatusBadge status={post.status} />
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {new Date(post.scheduledAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Meta Graph API & Health Ledger */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Rate Limit & Resilience Card */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <ShieldCheck size={20} color="var(--accent-green)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Meta Rate Limit & Resilience</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Publishing Engine</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>ShedLock Leader Active</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Circuit Breaker</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>CLOSED (Normal)</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Outbox Retry Strategy</span>
                <span style={{ fontWeight: 600 }}>Exponential Backoff</span>
              </div>
            </div>
          </div>

          {/* Connected Accounts Quick List */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Instagram size={18} color="var(--insta-pink)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Connected Accounts</h3>
              </div>
              <Link to="/instagram/accounts" style={{ fontSize: '0.8rem', color: 'var(--primary-blue)', fontWeight: 600 }}>
                Manage
              </Link>
            </div>

            {showSkeleton ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <Skeleton height={42} borderRadius="var(--radius-sm)" />
                <Skeleton height={42} borderRadius="var(--radius-sm)" />
              </div>
            ) : !summary?.accounts || summary.accounts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                No accounts connected yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {summary.accounts.slice(0, 4).map((acc) => (
                  <div
                    key={acc.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: '#F8FAFC',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'var(--insta-gradient)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {acc.username.substring(0, 1).toUpperCase()}
                      </div>
                      <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>@{acc.username}</span>
                    </div>

                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: acc.status === 'ACTIVE' ? 'var(--accent-green)' : 'var(--accent-red)',
                      }}
                    >
                      {acc.status === 'ACTIVE' ? 'Active' : 'Expired'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
