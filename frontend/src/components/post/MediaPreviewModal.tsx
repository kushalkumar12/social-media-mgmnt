import React from 'react';
import { X, ExternalLink, Image as ImageIcon, Film } from 'lucide-react';

interface MediaPreviewModalProps {
  media: {
    url: string;
    postType: string;
    name?: string;
  } | null;
  onClose: () => void;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({ media, onClose }) => {
  if (!media) return null;

  const isVideo = (url: string, postTypeStr?: string) => {
    if (!url) return false;
    const pt = (postTypeStr || '').toUpperCase();
    if (pt === 'REEL' || pt === 'REELS' || pt === 'VIDEO' || pt === 'SINGLE_VIDEO') return true;
    const cleanUrl = url.toLowerCase().split('?')[0];
    return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.m4v');
  };

  const video = isVideo(media.url, media.postType);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '520px',
          padding: 0,
          background: '#0F172A',
          color: '#FFFFFF',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(15, 23, 42, 0.95)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {video ? <Film size={18} color="#60A5FA" /> : <ImageIcon size={18} color="#F472B6" />}
            <span style={{ fontSize: '0.9rem', fontWeight: 600, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {media.name || 'Media Asset Preview'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <a
              href={media.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open full URL in new tab"
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ExternalLink size={16} />
            </a>
            <button
              onClick={onClose}
              title="Close preview"
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Media Container */}
        <div
          style={{
            minHeight: '320px',
            maxHeight: '480px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000000',
            overflow: 'hidden',
          }}
        >
          {video ? (
            <video
              src={media.url}
              controls
              autoPlay
              playsInline
              style={{ width: '100%', maxHeight: '480px', objectFit: 'contain' }}
            />
          ) : (
            <img
              src={media.url}
              alt="Preview"
              style={{ width: '100%', maxHeight: '480px', objectFit: 'contain' }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
