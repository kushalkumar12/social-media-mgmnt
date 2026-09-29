import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Media } from '../types';
import { Upload, Image, Trash2, CheckCircle2 } from 'lucide-react';

export const MediaPage: React.FC = () => {
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMedia = async () => {
    try {
      const res = await api.get('/media');
      setMediaItems(res.data);
    } catch (err) {
      console.error(err);
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

    setUploading(true);
    try {
      await api.post('/media', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchMedia();
    } catch (err: any) {
      alert('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this asset from storage?')) return;
    try {
      await api.delete(`/media/${id}`);
      fetchMedia();
    } catch (err: any) {
      alert('Failed to delete asset: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Media Asset Library</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Publicly accessible CDN media vault validated for Instagram Graph API publishing.
          </p>
        </div>
        <label className="btn-primary" style={{ cursor: 'pointer' }}>
          <Upload size={18} />
          <span>{uploading ? 'Uploading...' : 'Upload Media Asset'}</span>
          <input type="file" accept="image/*,video/*" onChange={handleUpload} style={{ display: 'none' }} disabled={uploading} />
        </label>
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading media gallery...</div>
        ) : mediaItems.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Image size={40} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
            <h3>No Media Uploaded Yet</h3>
            <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>Upload JPEG, PNG, or MP4 files to use in scheduled posts.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {mediaItems.map((item) => (
              <div key={item.id} className="glass-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '160px', background: '#000', overflow: 'hidden', position: 'relative' }}>
                  {item.mediaType === 'VIDEO' || item.mediaType === 'REELS' ? (
                    <video src={item.cdnUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <img src={item.cdnUrl} alt={item.fileName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                  <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', color: '#fff', fontWeight: 600 }}>
                    {item.mediaType}
                  </div>
                </div>

                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.fileName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {(item.fileSize / 1024 / 1024).toFixed(2)} MB &bull; {item.width}x{item.height} (Ratio: {item.aspectRatio?.toFixed(2)})
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '8px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} /> Public CDN Ready
                    </span>
                    <button onClick={() => handleDelete(item.id)} className="btn-danger" style={{ padding: '4px 8px' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
