import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { groupService, AccountGroupDTO } from '../services/groupService';
import { InstagramAccount, Media } from '../types';
import { SinglePostForm } from '../components/post/SinglePostForm';
import { BulkExcelImport } from '../components/post/BulkExcelImport';
import { MediaPreviewModal } from '../components/post/MediaPreviewModal';
import { PlusCircle, FileSpreadsheet } from 'lucide-react';

export const CreatePostPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SINGLE' | 'BULK_EXCEL'>('SINGLE');
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [groups, setGroups] = useState<AccountGroupDTO[]>([]);
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);

  // Lightbox preview modal
  const [previewMedia, setPreviewMedia] = useState<{
    url: string;
    postType: string;
    name?: string;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      api.get('/instagram/accounts'),
      api.get('/media'),
      groupService.getGroups().catch((err) => {
        console.warn('Failed to load groups', err);
        return [];
      })
    ])
      .then(([accRes, mediaRes, groupsData]) => {
        setAccounts(accRes.data);
        setMediaList(mediaRes.data);
        setGroups(Array.isArray(groupsData) ? groupsData : []);
      })
      .catch((err) => {
        console.error('Failed to load accounts or media', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleMediaUploaded = (newMedia: Media) => {
    setMediaList((prev) => [newMedia, ...prev]);
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Create & Schedule Content</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Author individual feed posts, carousels, and Reels, or batch-import monthly schedules with Excel.
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'inline-flex',
            background: '#F1F5F9',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <button
            onClick={() => setActiveTab('SINGLE')}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: activeTab === 'SINGLE' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'SINGLE' ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'SINGLE' ? 'var(--shadow-xs)' : 'none',
              transition: 'all var(--transition-fast)',
            }}
          >
            <PlusCircle size={16} color={activeTab === 'SINGLE' ? 'var(--insta-pink)' : 'currentColor'} />
            <span>Single Post Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('BULK_EXCEL')}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: activeTab === 'BULK_EXCEL' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'BULK_EXCEL' ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'BULK_EXCEL' ? 'var(--shadow-xs)' : 'none',
              transition: 'all var(--transition-fast)',
            }}
          >
            <FileSpreadsheet size={16} color={activeTab === 'BULK_EXCEL' ? 'var(--primary-blue)' : 'currentColor'} />
            <span>Bulk Excel Ingestion</span>
          </button>
        </div>
      </div>

      {/* Main Tab Panel */}
      <div className="glass-card" style={{ padding: '28px' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading publishing studio assets...
          </div>
        ) : activeTab === 'SINGLE' ? (
          <SinglePostForm
            accounts={accounts}
            groups={groups}
            mediaList={mediaList}
            onMediaUploaded={handleMediaUploaded}
            onPreviewMedia={setPreviewMedia}
          />
        ) : (
          <BulkExcelImport
            accounts={accounts}
            groups={groups}
            onPreviewMedia={setPreviewMedia}
          />
        )}
      </div>

      {/* Lightbox Media Preview */}
      <MediaPreviewModal media={previewMedia} onClose={() => setPreviewMedia(null)} />
    </div>
  );
};
