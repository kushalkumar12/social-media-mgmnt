import React from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';

interface InstagramPreviewProps {
  username?: string;
  mediaUrl?: string;
  mediaType?: string;
  caption?: string;
}

export const InstagramPreview: React.FC<InstagramPreviewProps> = ({
  username = 'your_brand',
  mediaUrl,
  mediaType = 'IMAGE',
  caption = 'Your caption preview will appear here with hashtags and handles...'
}) => {
  return (
    <div style={{
      width: '100%',
      maxWidth: '380px',
      background: '#000',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      overflow: 'hidden',
      boxShadow: '0 12px 40px rgba(0,0,0,0.6)'
    }}>
      {/* Instagram Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--insta-gradient)',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold' }}>
              {username.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{username}</div>
            <div style={{ fontSize: '0.7rem', color: '#8E8E8E' }}>Original post</div>
          </div>
        </div>
        <MoreHorizontal size={18} color="#8E8E8E" />
      </div>

      {/* Media Display */}
      <div style={{
        width: '100%',
        height: '360px',
        background: '#111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {mediaUrl ? (
          mediaType === 'VIDEO' || mediaType === 'REELS' ? (
            <video src={mediaUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <img src={mediaUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )
        ) : (
          <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📷</div>
            <div style={{ fontSize: '0.85rem' }}>Upload media to preview feed post</div>
          </div>
        )}
      </div>

      {/* Action Icons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
        <div style={{ display: 'flex', gap: '14px' }}>
          <Heart size={22} color="#fff" />
          <MessageCircle size={22} color="#fff" />
          <Send size={22} color="#fff" />
        </div>
        <Bookmark size={22} color="#fff" />
      </div>

      {/* Likes */}
      <div style={{ padding: '0 14px', fontSize: '0.85rem', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>
        1,420 likes
      </div>

      {/* Caption Preview */}
      <div style={{ padding: '0 14px 14px 14px', fontSize: '0.85rem', color: '#E0E0E0', lineHeight: '1.4' }}>
        <span style={{ fontWeight: 600, color: '#fff', marginRight: '6px' }}>{username}</span>
        <span>{caption}</span>
      </div>
    </div>
  );
};
