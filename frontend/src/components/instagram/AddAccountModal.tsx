import React, { useState } from 'react';
import { api } from '../../services/api';
import { X, RefreshCw, Instagram, CheckCircle2 } from 'lucide-react';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [userId, setUserId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [verifiedDetails, setVerifiedDetails] = useState<{
    userId: string;
    accessToken: string;
    username: string;
    profilePictureUrl?: string;
    followersCount: number;
    followingCount: number;
    valid: boolean;
  } | null>(null);

  if (!isOpen) return null;

  const handleVerify = async () => {
    if (!userId.trim() || !accessToken.trim()) {
      setError('Please provide both Instagram User ID and Meta Access Token.');
      return;
    }

    setVerifying(true);
    setError('');
    try {
      const res = await api.post('/instagram/verify-details', {
        userId: userId.trim(),
        accessToken: accessToken.trim(),
      });
      setVerifiedDetails(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed. Please check your credentials with Meta Graph API.');
      setVerifiedDetails(null);
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!verifiedDetails || !verifiedDetails.valid) return;

    setSaving(true);
    setError('');
    try {
      await api.post('/instagram/connect', {
        code: verifiedDetails.accessToken,
        userId: verifiedDetails.userId,
        username: verifiedDetails.username,
        profilePictureUrl: verifiedDetails.profilePictureUrl,
        followersCount: verifiedDetails.followersCount,
        followingCount: verifiedDetails.followingCount,
        facebookPageId: 'page_' + verifiedDetails.userId,
      });
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save account.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setUserId('');
    setAccessToken('');
    setVerifiedDetails(null);
    setError('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '480px', padding: '28px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          aria-label="Close dialog"
          className="btn-icon-target"
          style={{
            position: 'absolute',
            top: 'var(--space-4)',
            right: 'var(--space-4)',
            color: 'var(--text-secondary)',
          }}
        >
          <X size={18} />
        </button>

        {/* Centered Preview Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2-5)', marginBottom: 'var(--space-5)' }}>
          <div
            style={{
              width: '88px',
              height: '88px',
              borderRadius: 'var(--radius-full)',
              border: verifiedDetails ? '3px solid var(--accent-green)' : '3px solid var(--border-color)',
              padding: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#FFFFFF',
              boxShadow: verifiedDetails ? '0 0 16px rgba(5, 150, 105, 0.25)' : 'none',
              transition: 'all var(--transition-fast)',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 'var(--radius-full)',
                background: verifiedDetails ? 'var(--insta-gradient)' : '#F1F5F9',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
                fontWeight: 700,
                overflow: 'hidden',
              }}
            >
              {verifiedDetails?.profilePictureUrl ? (
                <img
                  src={verifiedDetails.profilePictureUrl}
                  alt={verifiedDetails.username}
                  referrerPolicy="no-referrer"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : verifiedDetails ? (
                verifiedDetails.username.substring(0, 2).toUpperCase()
              ) : (
                <Instagram size={36} color="var(--text-muted)" />
              )}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: 'var(--text-title-sm)', fontWeight: 'var(--font-weight-bold)' }}>
              {verifiedDetails ? `@${verifiedDetails.username}` : 'Connect Instagram Account'}
            </h3>
            <p style={{ fontSize: 'var(--text-caption)', color: verifiedDetails ? 'var(--accent-green)' : 'var(--text-secondary)', marginTop: 'var(--space-0-5)', fontWeight: 500 }}>
              {verifiedDetails ? (
                <span className="text-numeric">
                  {(verifiedDetails.followersCount / 1000).toFixed(1)}k Followers &bull; {verifiedDetails.followingCount.toLocaleString()} Following
                </span>
              ) : (
                'Enter your Graph API User ID and Access Token to link.'
              )}
            </p>
          </div>
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
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3-5)' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="add-account-userid">User ID</label>
            <input
              id="add-account-userid"
              type="text"
              className="form-input"
              placeholder="e.g. 178414000123"
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setVerifiedDetails(null);
                setError('');
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="add-account-token">Access Token</label>
            <input
              id="add-account-token"
              type="password"
              className="form-input"
              placeholder="e.g. EAAG..."
              value={accessToken}
              onChange={(e) => {
                setAccessToken(e.target.value);
                setVerifiedDetails(null);
                setError('');
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2-5)', marginTop: 'var(--space-6)' }}>
          <button
            type="button"
            onClick={handleVerify}
            disabled={!userId.trim() || !accessToken.trim() || verifying}
            className="btn-secondary"
            style={{ gap: 'var(--space-1-5)' }}
          >
            <RefreshCw size={15} className={verifying ? 'animate-spin' : ''} />
            <span>{verifying ? 'Verifying...' : 'Verify Details'}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!verifiedDetails || !verifiedDetails.valid || saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Connect Account'}
          </button>
        </div>
      </div>
    </div>
  );
};
