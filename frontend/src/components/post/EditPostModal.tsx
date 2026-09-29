import React, { useState, useEffect } from 'react';
import { ScheduledPost } from '../../types';
import { api } from '../../services/api';
import { X, Edit3, Calendar } from 'lucide-react';

interface EditPostModalProps {
  post: ScheduledPost | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({ post, onClose, onSuccess }) => {
  const [caption, setCaption] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (post) {
      setCaption(post.caption || '');
      if (post.scheduledAt) {
        const dt = new Date(post.scheduledAt);
        const localIso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setScheduledAt(localIso);
      } else {
        setScheduledAt('');
      }
      setError('');
    }
  }, [post]);

  if (!post) return null;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/posts/${post.id}`, {
        caption,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update scheduled post.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '540px', padding: 'var(--space-6)' }}
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
              <Edit3 size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 'var(--text-title-sm)', fontWeight: 'var(--font-weight-bold)' }}>
                Edit Scheduled Post
              </h3>
              <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                @{post.instagramUsername} &bull; ID #{post.id}
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

        {error && (
          <div
            style={{
              background: 'var(--accent-red-light)',
              border: '1px solid var(--accent-red-border)',
              color: 'var(--accent-red)',
              padding: 'var(--space-3) var(--space-3-5)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-secondary)',
              marginBottom: 'var(--space-4)',
            }}
          >
            {error}
          </div>
        )}

        {/* Media Thumbnail Banner */}
        {post.mediaItems && post.mediaItems.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              background: '#F8FAFC',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-2-5) var(--space-3-5)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <img
              src={post.mediaItems[0].cdnUrl}
              alt="Post asset"
              style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
            />
            <div>
              <div style={{ fontSize: 'var(--text-secondary)', fontWeight: 'var(--font-weight-semibold)' }}>
                {post.mediaItems[0].fileName}
              </div>
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)' }}>
                {post.postType} &bull; {post.mediaItems.length} asset{post.mediaItems.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="edit-post-caption">
              Caption
            </label>
            <textarea
              id="edit-post-caption"
              className="form-textarea"
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Edit caption..."
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="edit-scheduled-time">
              Scheduled Date & Time
            </label>
            <input
              id="edit-scheduled-time"
              type="datetime-local"
              className="form-input"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2-5)', marginTop: 'var(--space-6)' }}>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
