import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Media } from '../types';
import { Upload, Image as ImageIcon, Trash2, CheckCircle2, Film, AlertCircle } from 'lucide-react';
import { Skeleton, ProgressiveImage } from '../components/common/Skeleton';

export const MediaPage: React.FC = () => {
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMedia = async () => {
    try {
      const res = await api.get('/media');
      setMediaItems(res.data);
    } catch (err) {
      console.error('Failed to load media assets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mediaType', file.type.startsWith('video') ? 'VIDEO' : 'IMAGE');

    setUploading(true);
    setError('');
    try {
      await api.post('/media', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchMedia();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Media asset upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this asset permanently from storage?')) return;
    // Optimistic UI: remove immediately
    const previousMedia = [...mediaItems];
    setMediaItems((prev) => prev.filter((m) => m.id !== id));
    try {
      await api.delete(`/media/${id}`);
    } catch (err: any) {
      setMediaItems(previousMedia);
      alert('Delete failed: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Media Asset Vault</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            High-performance CDN media repository validated for Meta Graph API publishing.
          </p>
        </div>

        <label className="btn-primary" style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}>
          <Upload size={16} />
          <span>{uploading ? 'Uploading File...' : 'Upload Media Asset'}</span>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleUpload}
            style={{ display: 'none' }}
            disabled={uploading}
          />
        </label>
      </div>

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

      {/* Media Grid */}
      <div className="glass-card" style={{ padding: '24px' }}>
        {loading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '18px',
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden',
                  background: '#FFFFFF',
                }}
              >
                <Skeleton height={160} borderRadius="0" />
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Skeleton width="75%" height={14} />
                  <Skeleton width="45%" height={11} />
                </div>
              </div>
            ))}
          </div>
        ) : mediaItems.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <ImageIcon size={44} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>No Media Assets Uploaded Yet</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '6px auto 16px auto', maxWidth: '380px' }}>
              Upload JPEG, PNG, or MP4 video files to store them in the CDN repository for Instagram posts and Reels.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '18px',
            }}
          >
            {mediaItems.map((item) => {
              const isVideo = item.mediaType === 'VIDEO' || item.mediaType === 'REELS';

              return (
                <div
                  key={item.id}
                  style={{
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    background: '#FFFFFF',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <div
                    style={{
                      height: '160px',
                      background: '#0F172A',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isVideo ? (
                      <video
                        src={item.cdnUrl}
                        controls
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <ProgressiveImage
                        src={item.cdnUrl}
                        alt={item.fileName}
                        width="100%"
                        height="100%"
                      />
                    )}

                    <span
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.7rem',
                        color: '#FFFFFF',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {isVideo ? <Film size={11} /> : <ImageIcon size={11} />}
                      <span>{item.mediaType}</span>
                    </span>
                  </div>

                  <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                    <div
                      style={{
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={item.fileName}
                    >
                      {item.fileName}
                    </div>

                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      {(item.fileSize / (1024 * 1024)).toFixed(2)} MB &bull; {item.width || '—'}x{item.height || '—'}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 'auto',
                        paddingTop: '8px',
                        borderTop: '1px solid var(--border-color)',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--accent-green)',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <CheckCircle2 size={12} /> CDN Verified
                      </span>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="btn-danger"
                        style={{ padding: '4px 8px' }}
                        title="Delete asset"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
