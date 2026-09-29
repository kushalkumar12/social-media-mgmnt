import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { AccountGroupDTO } from '../../services/groupService';
import { InstagramAccount, Media, PostType } from '../../types';
import { InstagramPreview } from '../InstagramPreview';
import {
  Calendar,
  Clock,
  Image as ImageIcon,
  Film,
  Layers,
  Upload,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertCircle,
  Users,
  User,
} from 'lucide-react';

interface SinglePostFormProps {
  accounts: InstagramAccount[];
  groups?: AccountGroupDTO[];
  mediaList: Media[];
  onMediaUploaded: (newMedia: Media) => void;
  onPreviewMedia: (media: { url: string; postType: string; name?: string }) => void;
}

export const SinglePostForm: React.FC<SinglePostFormProps> = ({
  accounts,
  groups = [],
  mediaList,
  onMediaUploaded,
  onPreviewMedia,
}) => {
  const navigate = useNavigate();

  const [targetType, setTargetType] = useState<'ACCOUNT' | 'GROUP'>(
    groups && groups.length > 0 ? 'GROUP' : 'ACCOUNT'
  );
  const [selectedAccountId, setSelectedAccountId] = useState<number | ''>(
    accounts.length > 0 ? accounts[0].id : ''
  );
  const [selectedGroupId, setSelectedGroupId] = useState<number | ''>(
    groups && groups.length > 0 ? groups[0].id : ''
  );
  const [postType, setPostType] = useState<PostType>('SINGLE_IMAGE');
  const [selectedMediaIds, setSelectedMediaIds] = useState<number[]>(
    mediaList.length > 0 ? [mediaList[0].id] : []
  );
  const [caption, setCaption] = useState('');
  const [scheduledAt, setScheduledAt] = useState(() => {
    const future = new Date(Date.now() + 15 * 60 * 1000);
    return new Date(future.getTime() - future.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append('file', file);
    if (file.type.startsWith('video')) {
      formData.append('mediaType', postType === 'REELS' ? 'REELS' : 'VIDEO');
    } else {
      formData.append('mediaType', 'IMAGE');
    }

    setUploading(true);
    setError('');
    try {
      const res = await api.post('/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onMediaUploaded(res.data);
      if (postType === 'CAROUSEL') {
        setSelectedMediaIds((prev) => [...prev, res.data.id]);
      } else {
        setSelectedMediaIds([res.data.id]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Media upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleMediaSelect = (id: number) => {
    if (postType === 'CAROUSEL') {
      if (selectedMediaIds.includes(id)) {
        setSelectedMediaIds(selectedMediaIds.filter((mId) => mId !== id));
      } else {
        if (selectedMediaIds.length >= 10) {
          alert('Instagram Carousel allows a maximum of 10 items');
          return;
        }
        setSelectedMediaIds([...selectedMediaIds, id]);
      }
    } else {
      setSelectedMediaIds([id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetType === 'GROUP' && !selectedGroupId) {
      setError('Please select an Account Group to publish to.');
      return;
    }
    if (targetType === 'ACCOUNT' && !selectedAccountId) {
      setError('Please select an Instagram account to publish to.');
      return;
    }
    if (selectedMediaIds.length === 0) {
      setError('Please select or upload at least one media asset.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post('/posts', {
        instagramAccountId: targetType === 'ACCOUNT' ? Number(selectedAccountId) : undefined,
        accountGroupId: targetType === 'GROUP' ? Number(selectedGroupId) : undefined,
        caption,
        postType,
        mediaIds: selectedMediaIds,
        scheduledAt: new Date(scheduledAt).toISOString(),
        timezone,
      });
      navigate('/posts');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to schedule post.');
    } finally {
      setLoading(false);
    }
  };

  const selectedAccountObj = accounts.find((a) => a.id === Number(selectedAccountId));
  const selectedGroupObj = groups.find((g) => g.id === Number(selectedGroupId));
  const selectedMediaObj = mediaList.find((m) => selectedMediaIds.includes(m.id));

  const previewUsername = targetType === 'GROUP'
    ? (selectedGroupObj ? `${selectedGroupObj.groupName} (${selectedGroupObj.memberCount} accounts)` : 'group_publish')
    : (selectedAccountObj?.username || 'your_brand');

  const postTypeOptions: { type: PostType; label: string; icon: any }[] = [
    { type: 'SINGLE_IMAGE', label: 'Single Photo', icon: ImageIcon },
    { type: 'REELS', label: 'Instagram Reel', icon: Film },
    { type: 'CAROUSEL', label: 'Multi-Media Carousel', icon: Layers },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)', gap: '32px' }} className="single-post-grid">
      {/* Left Form Column */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {error && (
          <div
            style={{
              background: 'var(--accent-red-light)',
              border: '1px solid var(--accent-red-border)',
              color: 'var(--accent-red)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Target Selector: Account Group vs Single Account */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>
              Publishing Target
            </label>
            <div
              style={{
                display: 'inline-flex',
                background: '#E2E8F0',
                padding: '2px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <button
                type="button"
                onClick={() => setTargetType('GROUP')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-xs)',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  background: targetType === 'GROUP' ? '#FFFFFF' : 'transparent',
                  color: targetType === 'GROUP' ? 'var(--primary-blue)' : 'var(--text-secondary)',
                  boxShadow: targetType === 'GROUP' ? 'var(--shadow-xs)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Users size={13} />
                <span>Account Group</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetType('ACCOUNT')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-xs)',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  background: targetType === 'ACCOUNT' ? '#FFFFFF' : 'transparent',
                  color: targetType === 'ACCOUNT' ? 'var(--primary-blue)' : 'var(--text-secondary)',
                  boxShadow: targetType === 'ACCOUNT' ? 'var(--shadow-xs)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <User size={13} />
                <span>Single Account</span>
              </button>
            </div>
          </div>

          {targetType === 'GROUP' ? (
            groups && groups.length > 0 ? (
              <select
                id="select-ig-group"
                className="form-select"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                required
              >
                <option value="" disabled>
                  Select account group...
                </option>
                {groups.map((grp) => (
                  <option key={grp.id} value={grp.id}>
                    👥 {grp.groupName} ({grp.memberCount} account{grp.memberCount === 1 ? '' : 's'})
                  </option>
                ))}
              </select>
            ) : (
              <div
                style={{
                  padding: '10px 14px',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--accent-red)',
                  fontSize: '0.84rem',
                }}
              >
                No account groups found. Please create one in Account Management.
              </div>
            )
          ) : (
            <select
              id="select-ig-account"
              className="form-select"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(Number(e.target.value))}
              required
            >
              <option value="" disabled>
                Select connected Instagram account...
              </option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  @{acc.username} {acc.status === 'TOKEN_EXPIRED' ? '(Token Expired)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 2. Post Type Selector */}
        <div>
          <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>
            Publishing Format
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            {postTypeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = postType === opt.type;
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setPostType(opt.type)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '12px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--primary-blue)' : '1px solid var(--border-color)',
                    background: isSelected ? 'var(--primary-blue-light)' : '#FFFFFF',
                    color: isSelected ? 'var(--primary-blue)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <Icon size={20} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Media Asset Upload & Selection */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>
              Media Assets {postType === 'CAROUSEL' && `(${selectedMediaIds.length} / 10 selected)`}
            </label>
            <label
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.78rem', cursor: 'pointer', gap: '6px' }}
            >
              <Upload size={13} />
              <span>{uploading ? 'Uploading...' : 'Upload New'}</span>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                disabled={uploading}
              />
            </label>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
              gap: '10px',
              maxHeight: '190px',
              overflowY: 'auto',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '10px',
              background: '#F8FAFC',
            }}
          >
            {mediaList.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                No media uploaded yet. Click "Upload New" above.
              </div>
            ) : (
              mediaList.map((m) => {
                const isSelected = selectedMediaIds.includes(m.id);
                const isVid = m.mediaType === 'VIDEO' || m.mediaType === 'REELS';

                return (
                  <div
                    key={m.id}
                    onClick={() => handleMediaSelect(m.id)}
                    style={{
                      height: '88px',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      position: 'relative',
                      cursor: 'pointer',
                      border: isSelected ? '3px solid var(--primary-blue)' : '1px solid var(--border-color)',
                      boxShadow: isSelected ? '0 0 10px rgba(37, 99, 235, 0.3)' : 'none',
                    }}
                  >
                    {isVid ? (
                      <video src={m.cdnUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <img src={m.cdnUrl} alt={m.fileName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}

                    {/* Preview eye icon */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreviewMedia({ url: m.cdnUrl, postType: m.mediaType, name: m.fileName });
                      }}
                      title="Enlarge preview"
                      style={{
                        position: 'absolute',
                        top: '4px',
                        left: '4px',
                        background: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        borderRadius: '50%',
                        padding: '4px',
                        display: 'flex',
                      }}
                    >
                      <Eye size={11} />
                    </button>

                    {isSelected && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '4px',
                          right: '4px',
                          background: 'var(--primary-blue)',
                          color: '#fff',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CheckCircle2 size={12} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 4. Caption Input */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label" htmlFor="post-caption" style={{ marginBottom: 0 }}>
              Caption & Hashtags
            </label>
            <span style={{ fontSize: '0.74rem', color: caption.length > 2200 ? 'var(--accent-red)' : 'var(--text-muted)' }}>
              {caption.length} / 2,200 characters
            </span>
          </div>
          <textarea
            id="post-caption"
            className="form-textarea"
            rows={4}
            placeholder="Write an engaging Instagram caption with hashtags... #digital #creator"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>

        {/* 5. Schedule Timestamp & Timezone */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="schedule-time">
              Schedule Date & Time
            </label>
            <input
              id="schedule-time"
              type="datetime-local"
              className="form-input"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="schedule-timezone">
              Timezone
            </label>
            <select
              id="schedule-timezone"
              className="form-select"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="UTC">UTC (Universal)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST)</option>
              <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || (targetType === 'ACCOUNT' ? !selectedAccountId : !selectedGroupId) || selectedMediaIds.length === 0}
          className="btn-primary"
          style={{ width: '100%', padding: '12px', fontSize: '0.95rem', marginTop: '6px' }}
        >
          <span>
            {loading
              ? 'Submitting to Outbox...'
              : targetType === 'GROUP'
              ? `Schedule to Group (${selectedGroupObj?.memberCount || 0} accounts)`
              : 'Schedule Instagram Post'}
          </span>
          <ArrowRight size={18} />
        </button>
      </form>

      {/* Right Column: Mobile Live Instagram Mockup */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>
          Live Instagram Feed Preview
        </div>
        <InstagramPreview
          username={previewUsername}
          mediaUrl={selectedMediaObj?.cdnUrl}
          mediaType={postType === 'REELS' ? 'REELS' : 'IMAGE'}
          caption={caption || 'Your caption preview will appear here with hashtags and handles...'}
        />
      </div>
    </div>
  );
};
