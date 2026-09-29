import React, { useState } from 'react';
import { api } from '../../services/api';
import { InstagramAccount } from '../../types';
import { X, Key, RefreshCw } from 'lucide-react';

interface UpdateTokenModalProps {
  account: InstagramAccount | null;
  onClose: () => void;
  onSuccess: (updatedAccount: InstagramAccount) => void;
}

export const UpdateTokenModal: React.FC<UpdateTokenModalProps> = ({
  account,
  onClose,
  onSuccess,
}) => {
  const [newToken, setNewToken] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  if (!account) return null;

  const handleUpdate = async () => {
    if (!newToken.trim()) {
      setError('Please paste a valid Meta Access Token.');
      return;
    }

    setUpdating(true);
    setError('');
    try {
      const res = await api.put(`/instagram/accounts/${account.id}/token`, {
        accessToken: newToken.trim(),
      });
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to verify new token with Meta Graph API.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '520px', padding: 'var(--space-6)' }}
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
              <Key size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 'var(--text-title-sm)', fontWeight: 'var(--font-weight-bold)' }}>Update Access Token</h3>
              <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                @{account.username} ({account.igUserId})
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
              padding: 'var(--space-2-5) var(--space-3-5)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-secondary)',
              marginBottom: 'var(--space-4)',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <label className="form-label" htmlFor="new-access-token">New Meta Access Token</label>
          <textarea
            id="new-access-token"
            className="form-textarea"
            rows={4}
            style={{ fontFamily: 'monospace', fontSize: 'var(--text-caption)', resize: 'vertical' }}
            placeholder="Paste renewed Meta User/Page Access Token here..."
            value={newToken}
            onChange={(e) => setNewToken(e.target.value)}
          />
          <div style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)' }}>
            Ensure token has required scopes: <code>instagram_basic</code>, <code>instagram_content_publish</code>.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2-5)', marginTop: 'var(--space-6)' }}>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpdate}
            disabled={!newToken.trim() || updating}
            className="btn-primary"
            style={{ gap: 'var(--space-1-5)' }}
          >
            <RefreshCw size={14} className={updating ? 'animate-spin' : ''} />
            <span>{updating ? 'Verifying with Meta...' : 'Verify & Save Token'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
