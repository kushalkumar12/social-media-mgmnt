import React from 'react';
import { ScheduledPost } from '../../types';
import { StatusBadge } from '../StatusBadge';
import { X, Eye, Clock, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

interface PostAuditModalProps {
  post: ScheduledPost | null;
  onClose: () => void;
}

export const PostAuditModal: React.FC<PostAuditModalProps> = ({ post, onClose }) => {
  if (!post) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '640px', padding: 'var(--space-6)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2-5)' }}>
            <div
              style={{
                width: 'var(--target-compact-min)',
                height: 'var(--target-compact-min)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary-blue-light)',
                color: 'var(--primary-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Eye size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 'var(--text-title-sm)', fontWeight: 'var(--font-weight-bold)' }}>Publishing Diagnostics & Audit</h3>
              <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                Post #{post.id} &bull; @{post.instagramUsername}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="btn-icon-target"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Current State Summary */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 'var(--space-3)',
            background: '#F8FAFC',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3-5)',
            marginBottom: 'var(--space-5)',
          }}
        >
          <div>
            <div style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Status
            </div>
            <div style={{ marginTop: 'var(--space-1)' }}>
              <StatusBadge status={post.status} />
            </div>
          </div>

          <div>
            <div style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Format
            </div>
            <div style={{ fontSize: 'var(--text-secondary)', fontWeight: 700, marginTop: 'var(--space-0-5)', color: 'var(--primary-blue)' }}>
              {post.postType}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Scheduled For
            </div>
            <div className="text-numeric" style={{ fontSize: 'var(--text-secondary)', fontWeight: 600, marginTop: 'var(--space-0-5)' }}>
              {new Date(post.scheduledAt).toLocaleString()}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Retries Executed
            </div>
            <div className="text-numeric" style={{ fontSize: 'var(--text-secondary)', fontWeight: 700, marginTop: 'var(--space-0-5)' }}>
              {post.retryCount} / {post.maxAttempts || 3}
            </div>
          </div>
        </div>

        {/* Meta Container & Media IDs */}
        {(post.instagramContainerId || post.instagramMediaId) && (
          <div
            style={{
              background: '#F1F5F9',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3)',
              marginBottom: 'var(--space-5)',
              fontSize: 'var(--text-secondary)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-1-5)',
            }}
          >
            {post.instagramContainerId && (
              <div>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Meta Container ID: </span>
                <code className="text-numeric" style={{ fontFamily: 'monospace', color: 'var(--primary-blue)' }}>{post.instagramContainerId}</code>
              </div>
            )}
            {post.instagramMediaId && (
              <div>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Instagram Published Media ID: </span>
                <code className="text-numeric" style={{ fontFamily: 'monospace', color: 'var(--accent-green)' }}>{post.instagramMediaId}</code>
              </div>
            )}
          </div>
        )}

        {/* Failure Reason Alert */}
        {post.failureReason && (
          <div
            style={{
              background: 'var(--accent-red-light)',
              border: '1px solid var(--accent-red-border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-3-5)',
              color: 'var(--accent-red)',
              fontSize: 'var(--text-secondary)',
              marginBottom: 'var(--space-5)',
            }}
          >
            <strong>Last Error Message:</strong> {post.failureReason}
          </div>
        )}

        {/* Publishing Attempts Timeline */}
        <div>
          <h4 style={{ fontSize: 'var(--text-title-sm)', fontWeight: 700, marginBottom: 'var(--space-2-5)' }}>
            Publishing Outbox Attempts History
          </h4>

          {(!post.publishingAttempts || post.publishingAttempts.length === 0) ? (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-secondary)', background: '#F8FAFC', borderRadius: 'var(--radius-md)' }}>
              No worker attempts recorded yet. Post is in queue awaiting its scheduled time window.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: '240px', overflowY: 'auto' }}>
              {post.publishingAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-2-5) var(--space-3-5)',
                    fontSize: 'var(--text-secondary)',
                    background: attempt.errorMessage ? 'rgba(239, 68, 68, 0.03)' : 'rgba(5, 150, 105, 0.03)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                    <span style={{ fontWeight: 700 }}>
                      Attempt #{attempt.attemptNumber}: {attempt.operation}
                    </span>
                    <span className="text-numeric" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-micro)' }}>
                      {new Date(attempt.requestTimestamp || attempt.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {attempt.metaErrorCode && (
                    <div className="text-numeric" style={{ color: 'var(--accent-red)', fontWeight: 600, fontSize: 'var(--text-micro)' }}>
                      Meta Error Code: {attempt.metaErrorCode} {attempt.isRetryable ? '(Transient / Retryable)' : '(Terminal)'}
                    </div>
                  )}

                  {attempt.errorMessage && (
                    <div style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-0-5)' }}>
                      {attempt.errorMessage}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
          <button type="button" onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
