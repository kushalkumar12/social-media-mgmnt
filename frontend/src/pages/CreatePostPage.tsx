import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { excelService, ExcelUploadResponse, ExcelRowPreview } from '../services/excelService';
import { InstagramAccount, Media, PostType } from '../types';
import { InstagramPreview } from '../components/InstagramPreview';
import { Calendar, Clock, Image, Video, Film, Layers, Upload, ArrowRight, FileSpreadsheet, Download, CheckCircle2, AlertTriangle, RefreshCw, CheckSquare, Square, ExternalLink, Eye } from 'lucide-react';

export const CreatePostPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SINGLE' | 'BULK_EXCEL'>('SINGLE');

  // Single Post State
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | ''>('');
  const [postType, setPostType] = useState<PostType>('SINGLE_IMAGE');
  const [selectedMediaIds, setSelectedMediaIds] = useState<number[]>([]);
  const [caption, setCaption] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Bulk Excel State
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelPreview, setExcelPreview] = useState<ExcelUploadResponse | null>(null);
  const [parsingExcel, setParsingExcel] = useState(false);
  const [committingExcel, setCommittingExcel] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [excelSuccessMsg, setExcelSuccessMsg] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    // Set default scheduledAt to 15 mins in future
    const future = new Date(Date.now() + 15 * 60 * 1000);
    const isoLocal = new Date(future.getTime() - future.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setScheduledAt(isoLocal);

    api.get('/instagram/accounts').then((res) => {
      setAccounts(res.data);
      if (res.data.length > 0) {
        setSelectedAccountId(res.data[0].id);
      }
    });

    api.get('/media').then((res) => {
      setMediaList(res.data);
      if (res.data.length > 0) {
        setSelectedMediaIds([res.data[0].id]);
      }
    });
  }, []);

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
    try {
      const res = await api.post('/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMediaList((prev) => [res.data, ...prev]);
      setSelectedMediaIds((prev) => [res.data.id, ...prev]);
    } catch (err: any) {
      alert('Upload failed: ' + (err.response?.data?.message || err.message));
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

  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) {
      setError('Please connect or select an Instagram account');
      return;
    }
    if (selectedMediaIds.length === 0) {
      setError('Please upload or select at least one media asset');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/posts', {
        instagramAccountId: Number(selectedAccountId),
        caption,
        postType,
        mediaIds: selectedMediaIds,
        scheduledAt: new Date(scheduledAt).toISOString(),
        timezone
      });
      navigate('/posts');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to schedule post');
    } finally {
      setLoading(false);
    }
  };

  // --- Bulk Excel Functions ---
  const handleDownloadTemplate = async () => {
    try {
      await excelService.downloadTemplate();
    } catch (err: any) {
      alert('Failed to download Excel template: ' + err.message);
    }
  };

  const handleExcelFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setExcelFile(file);
    setError('');
    setExcelSuccessMsg('');
    setParsingExcel(true);

    try {
      const res = await excelService.uploadExcel(file);
      setExcelPreview(res);
      // Auto select all valid rows by default
      const validIndices = res.rows.filter(r => r.valid).map(r => r.rowIndex);
      setSelectedRows(validIndices);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to parse uploaded Excel file');
      setExcelPreview(null);
    } finally {
      setParsingExcel(false);
    }
  };

  const toggleSelectRow = (rowIndex: number) => {
    if (selectedRows.includes(rowIndex)) {
      setSelectedRows(selectedRows.filter(i => i !== rowIndex));
    } else {
      setSelectedRows([...selectedRows, rowIndex]);
    }
  };

  const toggleSelectAllValid = () => {
    if (!excelPreview) return;
    const validIndices = excelPreview.rows.filter(r => r.valid).map(r => r.rowIndex);
    if (selectedRows.length === validIndices.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(validIndices);
    }
  };

  const handleCommitExcelBatch = async () => {
    if (!excelPreview) return;
    if (selectedRows.length === 0) {
      setError('Please select at least one valid row to schedule');
      return;
    }

    setCommittingExcel(true);
    setError('');
    try {
      const res = await excelService.commitBatch(
        excelPreview.batchId,
        selectedAccountId ? Number(selectedAccountId) : undefined,
        selectedRows
      );
      setExcelSuccessMsg(res.message);
      setTimeout(() => {
        navigate('/posts');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to commit bulk scheduling batch');
    } finally {
      setCommittingExcel(false);
    }
  };

  // Clicked Media Preview Popup State
  const [previewMedia, setPreviewMedia] = useState<{
    url: string;
    postType: string;
    name?: string;
  } | null>(null);

  const isVideoMedia = (url: string, postTypeStr?: string) => {
    if (!url) return false;
    const pt = (postTypeStr || '').toUpperCase();
    if (pt === 'REEL' || pt === 'REELS' || pt === 'VIDEO' || pt === 'SINGLE_VIDEO') return true;
    const cleanUrl = url.toLowerCase().split('?')[0];
    return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.m4v');
  };

  const selectedMediaObj = mediaList.find((m) => selectedMediaIds.includes(m.id));
  const selectedAccountObj = accounts.find((a) => a.id === selectedAccountId);

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      {/* Centered Media Preview Modal with Light Backdrop Blur */}
      {previewMedia && (
        <div
          onClick={() => setPreviewMedia(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '480px',
              background: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '20px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                  MEDIA PREVIEW
                </span>
                {previewMedia.name && (
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    • {previewMedia.name}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ background: 'var(--insta-gradient)', color: '#fff', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
                  {previewMedia.postType || 'MEDIA'}
                </span>
                <button
                  onClick={() => setPreviewMedia(null)}
                  style={{
                    background: 'var(--bg-card-hover)',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    borderRadius: '50%',
                    width: '26px',
                    height: '26px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 'bold'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Media Content */}
            <div style={{ width: '100%', height: '300px', borderRadius: '12px', overflow: 'hidden', background: '#090d16', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              {isVideoMedia(previewMedia.url, previewMedia.postType) ? (
                <video
                  src={previewMedia.url}
                  autoPlay
                  controls
                  loop
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <img
                  src={previewMedia.url}
                  alt="Media Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <span style={{ maxWidth: '340px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'monospace' }}>
                {previewMedia.url}
              </span>
              <a
                href={previewMedia.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--insta-pink)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
              >
                <span>Open Link</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Create & Schedule Content</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Schedule individual posts via media library or bulk import hundreds of posts via Excel spreadsheet.
        </p>
      </div>

      {/* Dual Option Mode Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('SINGLE')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: 'pointer',
            border: activeTab === 'SINGLE' ? 'none' : '1px solid var(--border-color)',
            background: activeTab === 'SINGLE' ? 'var(--insta-gradient)' : '#FFFFFF',
            color: activeTab === 'SINGLE' ? '#fff' : 'var(--text-secondary)',
            boxShadow: activeTab === 'SINGLE' ? '0 4px 16px rgba(225, 48, 108, 0.35)' : '0 1px 2px rgba(0,0,0,0.03)',
            transition: 'all 0.2s ease'
          }}
        >
          <Upload size={18} />
          <span>Option 1: Create Single Post (S3 Storage)</span>
        </button>

        <button
          onClick={() => setActiveTab('BULK_EXCEL')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: 'pointer',
            border: activeTab === 'BULK_EXCEL' ? 'none' : '1px solid var(--border-color)',
            background: activeTab === 'BULK_EXCEL' ? 'linear-gradient(135deg, #10B981, #059669)' : '#FFFFFF',
            color: activeTab === 'BULK_EXCEL' ? '#fff' : 'var(--text-secondary)',
            boxShadow: activeTab === 'BULK_EXCEL' ? '0 4px 16px rgba(16, 185, 129, 0.35)' : '0 1px 2px rgba(0,0,0,0.03)',
            transition: 'all 0.2s ease'
          }}
        >
          <FileSpreadsheet size={18} />
          <span>Option 2: Bulk Import via Excel (.xlsx)</span>
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#FCA5A5', padding: '14px', borderRadius: '12px', fontSize: '0.88rem' }}>
          {error}
        </div>
      )}

      {excelSuccessMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34D399', padding: '14px', borderRadius: '12px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={20} />
          <span>{excelSuccessMsg} Redirecting to Scheduled Posts...</span>
        </div>
      )}

      {/* --- TAB 1: SINGLE POST --- */}
      {activeTab === 'SINGLE' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px' }}>
          <form onSubmit={handleSubmitSingle} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-card" style={{ padding: '20px' }}>
              <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Target Instagram Account</label>
              {accounts.length === 0 ? (
                <div style={{ color: 'var(--accent-amber)', fontSize: '0.85rem' }}>
                  No active Instagram account connected. Please connect an account first.
                </div>
              ) : (
                <select
                  className="form-input"
                  style={{ width: '100%' }}
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>@{acc.username} ({acc.accountType})</option>
                  ))}
                </select>
              )}
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <label className="form-label" style={{ marginBottom: '12px', display: 'block' }}>Instagram Post Format</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {[
                  { type: 'SINGLE_IMAGE', label: 'Single Image', icon: Image },
                  { type: 'SINGLE_VIDEO', label: 'Single Video', icon: Video },
                  { type: 'REELS', label: 'Instagram Reel', icon: Film },
                  { type: 'CAROUSEL', label: 'Carousel (10x)', icon: Layers },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = postType === item.type;
                  return (
                    <div
                      key={item.type}
                      onClick={() => {
                        setPostType(item.type as PostType);
                        setSelectedMediaIds([]);
                      }}
                      style={{
                        padding: '14px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid var(--insta-pink)' : '1px solid var(--border-color)',
                        background: isSelected ? 'rgba(225, 48, 108, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Icon size={22} color={isSelected ? 'var(--insta-pink)' : 'var(--text-secondary)'} style={{ margin: '0 auto 6px auto' }} />
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: isSelected ? '#fff' : 'var(--text-secondary)' }}>{item.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <label className="form-label">Select or Upload Media Assets (S3 Storage)</label>
                <label className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer' }}>
                  <Upload size={14} />
                  <span>{uploading ? 'Uploading...' : 'Upload New File'}</span>
                  <input type="file" accept="image/*,video/*" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
                </label>
              </div>

              {mediaList.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                  No media uploaded yet. Click "Upload New File" to select an asset.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                  {mediaList.map((m) => {
                    const isSelected = selectedMediaIds.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleMediaSelect(m.id)}
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          position: 'relative',
                          cursor: 'pointer',
                          border: isSelected ? '3px solid var(--insta-pink)' : '1px solid var(--border-color)',
                          opacity: isSelected ? 1 : 0.6
                        }}
                      >
                        {m.mediaType === 'VIDEO' || m.mediaType === 'REELS' ? (
                          <video src={m.cdnUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <img src={m.cdnUrl} alt="Asset" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                        {isSelected && (
                          <div style={{ position: 'absolute', top: '4px', right: '4px', background: 'var(--insta-pink)', color: '#fff', width: '18px', height: '18px', borderRadius: '50%', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            ✓
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label className="form-label">Post Caption</label>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{caption.length} / 2200 chars</span>
              </div>
              <textarea
                className="form-input"
                rows={4}
                style={{ width: '100%', resize: 'vertical' }}
                placeholder="Write a captivating caption with hashtags #marketing #brand..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>

            <div className="glass-card" style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Schedule Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  style={{ width: '100%' }}
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Target Timezone</label>
                <select className="form-input" style={{ width: '100%' }} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                  <option value="UTC">UTC (+0:00)</option>
                  <option value="America/New_York">America/New_York (EST -5:00)</option>
                  <option value="Europe/London">Europe/London (GMT +0:00)</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '16px', justifyContent: 'center', fontSize: '1rem' }} disabled={loading}>
              <span>{loading ? 'Scheduling Job...' : 'Confirm & Schedule Post'}</span>
              <ArrowRight size={20} />
            </button>
          </form>

          {/* Live Mockup */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Live Instagram Mockup</h3>
            <InstagramPreview
              username={selectedAccountObj?.username || 'your_brand'}
              mediaUrl={selectedMediaObj?.cdnUrl}
              mediaType={selectedMediaObj?.mediaType}
              caption={caption || 'Your caption preview will appear here...'}
            />
          </div>
        </div>
      )}

      {/* --- TAB 2: BULK EXCEL IMPORT --- */}
      {activeTab === 'BULK_EXCEL' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Controls Banner */}
          <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Bulk Post Scheduling via Spreadsheet</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px' }}>
                Download the standardized template, add your direct media URLs (e.g. ImgBB / S3 links), captions, and schedule times, then upload back.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleDownloadTemplate}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
              >
                <Download size={18} color="var(--insta-purple)" />
                <span>Download Sample Excel Template (.xlsx)</span>
              </button>

              <label
                style={{
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: '#fff',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                }}
              >
                <Upload size={18} />
                <span>{parsingExcel ? 'Parsing Spreadsheet...' : 'Upload Excel File'}</span>
                <input type="file" accept=".xlsx, .xls" onChange={handleExcelFileSelect} style={{ display: 'none' }} disabled={parsingExcel} />
              </label>
            </div>
          </div>

          {/* Excel Preview & Multithreaded Commit Section */}
          {excelPreview && (
            <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Summary Metrics */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px 16px', borderRadius: '10px', fontSize: '0.85rem' }}>
                    Total Rows: <strong>{excelPreview.totalRows}</strong>
                  </div>
                  <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', padding: '10px 16px', borderRadius: '10px', fontSize: '0.85rem' }}>
                    Valid Records: <strong>{excelPreview.validRows}</strong>
                  </div>
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#FCA5A5', padding: '10px 16px', borderRadius: '10px', fontSize: '0.85rem' }}>
                    Errors Found: <strong>{excelPreview.errorRows}</strong>
                  </div>
                  <div style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', padding: '10px 16px', borderRadius: '10px', fontSize: '0.85rem' }}>
                    Selected for Import: <strong>{selectedRows.length}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={toggleSelectAllValid}
                    className="btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <CheckSquare size={16} />
                    <span>{selectedRows.length === excelPreview.validRows ? 'Deselect All' : 'Select All Valid'}</span>
                  </button>

                  <button
                    onClick={handleCommitExcelBatch}
                    disabled={committingExcel || selectedRows.length === 0}
                    style={{
                      background: 'linear-gradient(135deg, #833AB4, #FD1D1D)',
                      color: '#fff',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 16px rgba(225, 48, 108, 0.4)'
                    }}
                  >
                    <RefreshCw size={18} className={committingExcel ? 'animate-spin' : ''} />
                    <span>{committingExcel ? 'Processing Multithreaded Async Import...' : `Schedule (${selectedRows.length}) Selected Posts`}</span>
                  </button>
                </div>
              </div>

              {/* Data Preview Table */}
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.04)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '12px', width: '40px' }}>Select</th>
                      <th style={{ padding: '12px', width: '50px' }}>S.No</th>
                      <th style={{ padding: '12px' }}>Post Name</th>
                      <th style={{ padding: '12px' }}>Caption</th>
                      <th style={{ padding: '12px' }}>Schedule Time</th>
                      <th style={{ padding: '12px' }}>Media Source URL</th>
                      <th style={{ padding: '12px' }}>Type</th>
                      <th style={{ padding: '12px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {excelPreview.rows.map((row) => {
                      const isChecked = selectedRows.includes(row.rowIndex);
                      return (
                        <tr
                          key={row.rowIndex}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            background: !row.valid ? 'rgba(239, 68, 68, 0.05)' : isChecked ? 'rgba(16, 185, 129, 0.04)' : 'transparent'
                          }}
                        >
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectRow(row.rowIndex)}
                              disabled={!row.valid}
                              style={{ width: '16px', height: '16px', cursor: row.valid ? 'pointer' : 'not-allowed' }}
                            />
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>#{row.rowIndex}</td>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{row.name || 'Untitled Post'}</td>
                          <td style={{ padding: '12px', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {row.caption}
                          </td>
                          <td style={{ padding: '12px', fontFamily: 'monospace' }}>{row.scheduledTimeStr}</td>
                          <td style={{ padding: '12px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!row.mediaUrl) return;
                                setPreviewMedia({ url: row.mediaUrl, postType: row.postType, name: row.name });
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--insta-pink)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                textDecoration: 'underline',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                padding: 0
                              }}
                              title="Click to preview media"
                            >
                              <Eye size={14} />
                              <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {row.mediaUrl}
                              </span>
                            </button>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                              {row.postType}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            {row.valid ? (
                              <span style={{ color: '#34D399', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                <CheckCircle2 size={16} /> Valid
                              </span>
                            ) : (
                              <div style={{ color: '#FCA5A5', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                                  <AlertTriangle size={14} /> Invalid Row
                                </span>
                                {row.validationErrors.map((err, idx) => (
                                  <span key={idx}>• {err}</span>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
