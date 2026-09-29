import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ScheduledPost } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { RefreshCw, XCircle, Trash2, Eye, PlusCircle, Calendar, Send, Edit3, Lock, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PostsPage: React.FC = () => {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);

  // Edit modal state
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [editCaption, setEditCaption] = useState<string>('');
  const [editScheduledAt, setEditScheduledAt] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [publishingId, setPublishingId] = useState<number | null>(null);

  const fetchPosts = async () => {
    try {
      const res = await api.get('/posts');
      setPosts(res.data);
    } catch (err) {
      console.error('Failed to load posts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleRetry = async (id: number) => {
    try {
      await api.post(`/posts/${id}/retry`);
      fetchPosts();
    } catch (err: any) {
      alert('Failed to retry post: ' + (err.response?.data?.message || err.message));
    }
  };

  const handlePublishNow = async (id: number) => {
    if (!window.confirm('Publish this post to Instagram immediately?')) return;
    setPublishingId(id);
    try {
      await api.post(`/posts/${id}/publish-now`);
      fetchPosts();
    } catch (err: any) {
      alert('Failed to publish post: ' + (err.response?.data?.message || err.message));
    } finally {
      setPublishingId(null);
    }
  };

  const handleOpenEditModal = (post: ScheduledPost) => {
    setEditingPost(post);
    setEditCaption(post.caption || '');
    if (post.scheduledAt) {
      const dt = new Date(post.scheduledAt);
      const localIso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setEditScheduledAt(localIso);
    } else {
      setEditScheduledAt('');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;
    setSavingEdit(true);
    try {
      await api.put(`/posts/${editingPost.id}`, {
        caption: editCaption,
        scheduledAt: editScheduledAt ? new Date(editScheduledAt).toISOString() : null
      });
      setEditingPost(null);
      fetchPosts();
    } catch (err: any) {
      alert('Failed to update scheduled post: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled post?')) return;
    try {
      await api.post(`/posts/${id}/cancel`);
      fetchPosts();
    } catch (err: any) {
      alert('Failed to cancel post: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this post record permanently?')) return;
    try {
      await api.delete(`/posts/${id}`);
      fetchPosts();
    } catch (err: any) {
      alert('Failed to delete post: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Scheduled & Published Posts</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Manage post scheduling lifecycle, edit captions/times, trigger instant publishing, and inspect Meta container logs.
          </p>
        </div>
        <Link to="/posts/create" className="btn-primary">
          <PlusCircle size={18} />
          Create Scheduled Post
        </Link>
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>Loading scheduled posts...</div>
        ) : posts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Calendar size={40} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
            <h3>No Scheduled Posts Found</h3>
            <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>Schedule your first Instagram post to see it here.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px' }}>Media</th>
                  <th style={{ padding: '12px' }}>Account</th>
                  <th style={{ padding: '12px' }}>Caption</th>
                  <th style={{ padding: '12px' }}>Type</th>
                  <th style={{ padding: '12px' }}>Scheduled At</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px' }}>
                      {post.mediaItems && post.mediaItems[0] ? (
                        <img src={post.mediaItems[0].cdnUrl} alt="Media" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📷</div>
                      )}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>@{post.instagramUsername}</td>
                    <td style={{ padding: '12px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {post.caption || 'No caption'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--accent-blue)', fontWeight: 600 }}>{post.postType}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                      {new Date(post.scheduledAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <StatusBadge status={post.status} />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        {/* Publish Now Button */}
                        {(post.status === 'SCHEDULED' || post.status === 'FAILED_RETRYABLE') && (
                          <button
                            onClick={() => handlePublishNow(post.id)}
                            disabled={publishingId === post.id}
                            className="btn-primary"
                            style={{
                              padding: '6px 10px',
                              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                              border: 'none',
                              color: '#FFFFFF'
                            }}
                            title="Publish Now Immediately"
                          >
                            <Send size={16} />
                          </button>
                        )}

                        {/* Edit Button */}
                        {(post.status === 'SCHEDULED' || post.status === 'FAILED_RETRYABLE') && (
                          <button
                            onClick={() => handleOpenEditModal(post)}
                            className="btn-secondary"
                            style={{ padding: '6px 10px', color: '#60A5FA' }}
                            title="Edit Post Details & Schedule Time"
                          >
                            <Edit3 size={16} />
                          </button>
                        )}

                        {/* Inspect Audit Log */}
                        <button onClick={() => setSelectedPost(post)} className="btn-secondary" style={{ padding: '6px 10px' }} title="Inspect Audit Log">
                          <Eye size={16} />
                        </button>

                        {(post.status === 'FAILED_RETRYABLE' || post.status === 'FAILED_TERMINAL') && (
                          <button onClick={() => handleRetry(post.id)} className="btn-primary" style={{ padding: '6px 10px', background: 'var(--accent-amber)' }} title="Retry Post">
                            <RefreshCw size={16} />
                          </button>
                        )}

                        {post.status === 'SCHEDULED' && (
                          <button onClick={() => handleCancel(post.id)} className="btn-secondary" style={{ padding: '6px 10px', color: '#FCA5A5' }} title="Cancel Post">
                            <XCircle size={16} />
                          </button>
                        )}

                        <button onClick={() => handleDelete(post.id)} className="btn-danger" style={{ padding: '6px 10px' }} title="Delete Record">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Scheduled Post Modal */}
      {editingPost && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card animate-fade" style={{ width: '100%', maxWidth: '560px', padding: '28px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={20} color="var(--accent-blue)" />
                Edit Scheduled Post
              </h3>
              <button onClick={() => setEditingPost(null)} className="btn-secondary" style={{ padding: '4px 10px' }}>✕</button>
            </div>

            {/* Read-only Media Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border-color)',
              marginBottom: '20px'
            }}>
              {editingPost.mediaItems && editingPost.mediaItems[0] ? (
                <img src={editingPost.mediaItems[0].cdnUrl} alt="Source" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📷</div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Account: @{editingPost.instagramUsername}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <Lock size={12} color="#FBBF24" />
                  Source media locked (Image/Reel source cannot be changed)
                </div>
              </div>
            </div>

            {/* Editable Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Caption / Hashtags
                </label>
                <textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  rows={4}
                  className="form-input"
                  style={{
                    width: '100%',
                    resize: 'vertical'
                  }}
                  placeholder="Enter updated caption or hashtags..."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Schedule Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={editScheduledAt}
                  onChange={(e) => setEditScheduledAt(e.target.value)}
                  className="form-input"
                  style={{
                    width: '100%'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="btn-secondary"
                  style={{ padding: '10px 18px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="btn-primary"
                  style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <CheckCircle2 size={16} />
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {selectedPost && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card animate-fade" style={{ width: '100%', maxWidth: '650px', padding: '28px', maxHeight: '85vh', overflowY: 'auto', background: '#FFFFFF', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Post Execution Audit Inspector</h3>
              <button onClick={() => setSelectedPost(null)} className="btn-secondary" style={{ padding: '4px 10px' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', marginBottom: '20px', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', padding: '14px', borderRadius: '10px' }}>
              <div><strong>Idempotency Key:</strong> <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{selectedPost.idempotencyKey}</div></div>
              <div><strong>Meta Container ID:</strong> <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--accent-blue)', fontWeight: 600 }}>{selectedPost.instagramContainerId || 'Not Created Yet'}</div></div>
              <div><strong>Published Media ID:</strong> <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--accent-green)', fontWeight: 600 }}>{selectedPost.instagramMediaId || 'N/A'}</div></div>
              <div><strong>Attempts Count:</strong> {selectedPost.retryCount} / {selectedPost.maxAttempts}</div>
            </div>

            {selectedPost.failureReason && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#B91C1C', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px' }}>
                <strong>Failure Cause:</strong> {selectedPost.failureReason}
              </div>
            )}

            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>Attempt Trace Log</h4>
            {!selectedPost.publishingAttempts || selectedPost.publishingAttempts.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No execution attempts logged yet. Post is queued for poller execution.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedPost.publishingAttempts.map((attempt) => (
                  <div key={attempt.id} style={{ background: 'var(--bg-card-hover)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <span>Attempt #{attempt.attemptNumber} &bull; {attempt.operation}</span>
                      <span style={{ color: attempt.responseStatus === 200 ? 'var(--accent-green)' : 'var(--accent-red)' }}>HTTP {attempt.responseStatus || 500}</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Timestamp: {new Date(attempt.requestTimestamp).toLocaleString()}
                    </div>
                    {attempt.responseBody && (
                      <div style={{ marginTop: '6px', background: '#0F172A', padding: '6px 10px', borderRadius: '4px', color: '#34D399', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {attempt.responseBody}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
