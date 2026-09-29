import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { ScheduledPost, PostStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { EditPostModal } from '../components/post/EditPostModal';
import { PostAuditModal } from '../components/post/PostAuditModal';
import { TableSkeleton, ProgressiveImage } from '../components/common/Skeleton';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import {
  RefreshCw,
  XCircle,
  Trash2,
  Eye,
  PlusCircle,
  Calendar,
  Send,
  Edit3,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type FilterTab = 'ALL' | 'SCHEDULED' | 'PUBLISHED' | 'PROCESSING' | 'FAILED' | 'CANCELLED';

export const PostsPage: React.FC = () => {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [publishingId, setPublishingId] = useState<number | null>(null);

  // Debounced skeleton: eliminates flicker on fast connections
  const showSkeleton = useDelayedLoading(loading && posts.length === 0);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modals State
  const [selectedAuditPost, setSelectedAuditPost] = useState<ScheduledPost | null>(null);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);

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

  const handleCancel = async (id: number) => {
    if (!window.confirm('Cancel this scheduled post?')) return;
    // Optimistic UI: update local post status immediately
    const previousPosts = [...posts];
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'CANCELLED' as PostStatus } : p))
    );
    try {
      await api.post(`/posts/${id}/cancel`);
    } catch (err: any) {
      // Revert if API fails
      setPosts(previousPosts);
      alert('Failed to cancel post: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Permanently delete this scheduled post record?')) return;
    // Optimistic UI: remove from list immediately
    const previousPosts = [...posts];
    setPosts((prev) => prev.filter((p) => p.id !== id));
    try {
      await api.delete(`/posts/${id}`);
    } catch (err: any) {
      // Revert if API fails
      setPosts(previousPosts);
      alert('Failed to delete post: ' + (err.response?.data?.message || err.message));
    }
  };

  // Status Filter Helpers
  const statusCounts = useMemo(() => {
    return {
      ALL: posts.length,
      SCHEDULED: posts.filter((p) => p.status === 'SCHEDULED' || p.status === 'QUEUED').length,
      PUBLISHED: posts.filter((p) => p.status === 'PUBLISHED').length,
      PROCESSING: posts.filter(
        (p) =>
          p.status === 'CREATING_CONTAINER' ||
          p.status === 'CONTAINER_PROCESSING' ||
          p.status === 'PUBLISHING'
      ).length,
      FAILED: posts.filter(
        (p) => p.status === 'FAILED_RETRYABLE' || p.status === 'FAILED_TERMINAL'
      ).length,
      CANCELLED: posts.filter((p) => p.status === 'CANCELLED' || p.status === 'EXPIRED').length,
    };
  }, [posts]);

  const filteredPosts = useMemo(() => {
    let result = posts;

    // Filter by tab
    if (activeTab === 'SCHEDULED') {
      result = result.filter((p) => p.status === 'SCHEDULED' || p.status === 'QUEUED');
    } else if (activeTab === 'PUBLISHED') {
      result = result.filter((p) => p.status === 'PUBLISHED');
    } else if (activeTab === 'PROCESSING') {
      result = result.filter(
        (p) =>
          p.status === 'CREATING_CONTAINER' ||
          p.status === 'CONTAINER_PROCESSING' ||
          p.status === 'PUBLISHING'
      );
    } else if (activeTab === 'FAILED') {
      result = result.filter(
        (p) => p.status === 'FAILED_RETRYABLE' || p.status === 'FAILED_TERMINAL'
      );
    } else if (activeTab === 'CANCELLED') {
      result = result.filter((p) => p.status === 'CANCELLED' || p.status === 'EXPIRED');
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          (p.caption && p.caption.toLowerCase().includes(q)) ||
          p.instagramUsername.toLowerCase().includes(q) ||
          p.postType.toLowerCase().includes(q)
      );
    }

    return result;
  }, [posts, activeTab, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPosts.slice(start, start + pageSize);
  }, [filteredPosts, currentPage, pageSize]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, pageSize]);

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1>Scheduled & Published Posts</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
            Lifecycle management, caption editing, immediate publishing dispatch, and Meta Graph API outbox logs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2-5)' }}>
          <button onClick={fetchPosts} className="btn-secondary" title="Refresh posts" disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <Link to="/posts/create" className="btn-primary">
            <PlusCircle size={16} />
            <span>Create Post</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="glass-card" style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3-5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          {/* Status Tabs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              overflowX: 'auto',
              paddingBottom: '2px',
              maxWidth: '100%',
            }}
          >
            {(
              [
                { tab: 'ALL', label: 'All Posts' },
                { tab: 'SCHEDULED', label: 'Scheduled' },
                { tab: 'PUBLISHED', label: 'Published' },
                { tab: 'PROCESSING', label: 'Processing' },
                { tab: 'FAILED', label: 'Failed' },
                { tab: 'CANCELLED', label: 'Cancelled' },
              ] as { tab: FilterTab; label: string }[]
            ).map(({ tab, label }) => {
              const isActive = activeTab === tab;
              const count = statusCounts[tab];
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: 'var(--space-1-5) var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--text-badge)',
                    fontWeight: isActive ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
                    background: isActive ? 'var(--primary-blue)' : 'transparent',
                    color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-1-5)',
                    whiteSpace: 'nowrap',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <span>{label}</span>
                  <span
                    className="text-numeric"
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                      padding: '1px var(--space-1-5)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--text-micro)',
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
            <input
              type="text"
              placeholder="Search caption, username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{
                paddingLeft: '34px',
                width: '220px',
                borderRadius: 'var(--radius-full)',
                minHeight: 'var(--target-compact-min)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Table / Data View */}
      <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
        {showSkeleton ? (
          <TableSkeleton rows={pageSize > 10 ? 8 : pageSize} columns={7} />
        ) : filteredPosts.length === 0 ? (
          <div style={{ padding: 'var(--space-12) var(--space-6)', textAlign: 'center' }}>
            <Calendar size={44} color="var(--text-muted)" style={{ marginBottom: 'var(--space-3)' }} />
            <h3 style={{ fontSize: 'var(--text-title-sm)', fontWeight: 'var(--font-weight-bold)' }}>
              {searchQuery ? 'No matching posts found' : 'No Posts in this Category'}
            </h3>
            <p className="prose-readable" style={{ margin: 'var(--space-1-5) auto var(--space-4) auto' }}>
              {searchQuery
                ? `No posts matched "${searchQuery}". Clear your search query to see all posts.`
                : 'Create and schedule posts to streamline your Instagram marketing strategy.'}
            </p>
            <Link to="/posts/create" className="btn-primary">
              <PlusCircle size={16} />
              <span>Schedule New Post</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="table-container">
              <table className="saas-table">
                <thead>
                  <tr>
                    <th style={{ width: '64px' }}>Asset</th>
                    <th>Instagram Handle</th>
                    <th style={{ width: '32%' }}>Caption</th>
                    <th>Format</th>
                    <th>Scheduled For</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPosts.map((post) => (
                    <tr key={post.id}>
                      <td>
                        {post.mediaItems && post.mediaItems[0] ? (
                          <ProgressiveImage
                            src={post.mediaItems[0].cdnUrl}
                            alt="Media thumbnail"
                            width={40}
                            height={40}
                            borderRadius="var(--radius-sm)"
                          />
                        ) : (
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: 'var(--radius-sm)',
                              background: '#F1F5F9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.2rem',
                            }}
                          >
                            📷
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>
                        @{post.instagramUsername}
                      </td>
                      <td>
                        <div
                          style={{
                            maxWidth: '280px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: 'var(--text-secondary)',
                            color: 'var(--text-secondary)',
                          }}
                          title={post.caption}
                        >
                          {post.caption || <span style={{ color: 'var(--text-muted)' }}>No caption</span>}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: 'var(--text-badge)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--primary-blue)',
                            background: 'var(--primary-blue-light)',
                            padding: 'var(--space-0-5) var(--space-2)',
                            borderRadius: 'var(--radius-xs)',
                          }}
                        >
                          {post.postType}
                        </span>
                      </td>
                      <td className="text-numeric" style={{ fontSize: 'var(--text-secondary)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                        {new Date(post.scheduledAt).toLocaleString()}
                      </td>
                      <td>
                        <StatusBadge status={post.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 'var(--space-1)' }}>
                          {/* Publish Now Button with Accessible Hit Envelope */}
                          {(post.status === 'SCHEDULED' || post.status === 'FAILED_RETRYABLE') && (
                            <button
                              onClick={() => handlePublishNow(post.id)}
                              disabled={publishingId === post.id}
                              className="btn-icon-target"
                              style={{ background: 'var(--accent-green-light)', color: 'var(--accent-green)', border: '1px solid var(--accent-green-border)' }}
                              title="Publish immediately to Instagram"
                            >
                              <Send size={15} className={publishingId === post.id ? 'animate-spin' : ''} />
                            </button>
                          )}

                          {/* Edit Details Button */}
                          {(post.status === 'SCHEDULED' || post.status === 'FAILED_RETRYABLE') && (
                            <button
                              onClick={() => setEditingPost(post)}
                              className="btn-icon-target"
                              style={{ background: 'var(--primary-blue-light)', color: 'var(--primary-blue)', border: '1px solid #BFDBFE' }}
                              title="Edit post caption & schedule time"
                            >
                              <Edit3 size={15} />
                            </button>
                          )}

                          {/* Inspect Diagnostics / Outbox Log */}
                          <button
                            onClick={() => setSelectedAuditPost(post)}
                            className="btn-icon-target"
                            style={{ background: '#FFFFFF', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                            title="Inspect Meta Graph API diagnostics & outbox log"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Retry Button */}
                          {(post.status === 'FAILED_RETRYABLE' || post.status === 'FAILED_TERMINAL') && (
                            <button
                              onClick={() => handleRetry(post.id)}
                              className="btn-icon-target"
                              style={{ background: 'var(--accent-amber-light)', color: 'var(--accent-amber)', border: '1px solid var(--accent-amber-border)' }}
                              title="Retry publishing"
                            >
                              <RefreshCw size={15} />
                            </button>
                          )}

                          {/* Cancel Button */}
                          {post.status === 'SCHEDULED' && (
                            <button
                              onClick={() => handleCancel(post.id)}
                              className="btn-icon-target"
                              style={{ background: 'var(--accent-red-light)', color: 'var(--accent-red)', border: '1px solid var(--accent-red-border)' }}
                              title="Cancel scheduled post"
                            >
                              <XCircle size={15} />
                            </button>
                          )}

                          {/* Delete Record Button */}
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="btn-icon-target btn-danger"
                            title="Delete post record"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls with Tabular Numbers */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 'var(--space-3)',
                paddingTop: 'var(--space-2)',
              }}
            >
              <div style={{ fontSize: 'var(--text-secondary)', color: 'var(--text-secondary)' }}>
                Showing <strong className="text-numeric">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                <strong className="text-numeric">{Math.min(currentPage * pageSize, filteredPosts.length)}</strong> of{' '}
                <strong className="text-numeric">{filteredPosts.length}</strong> posts
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)', marginRight: 'var(--space-2-5)' }}>
                  <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="form-select"
                    style={{ width: 'auto', padding: '0 var(--space-2)', minHeight: 'var(--height-control-sm)', fontSize: 'var(--text-caption)' }}
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary"
                  style={{ minHeight: 'var(--height-control-sm)', padding: '0 var(--space-2-5)', fontSize: 'var(--text-caption)' }}
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>

                <span className="text-numeric" style={{ fontSize: 'var(--text-secondary)', fontWeight: 'var(--font-weight-semibold)', padding: '0 var(--space-1)' }}>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-secondary"
                  style={{ minHeight: 'var(--height-control-sm)', padding: '0 var(--space-2-5)', fontSize: 'var(--text-caption)' }}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Post Modal */}
      <EditPostModal
        post={editingPost}
        onClose={() => setEditingPost(null)}
        onSuccess={fetchPosts}
      />

      {/* Audit Log Modal */}
      <PostAuditModal
        post={selectedAuditPost}
        onClose={() => setSelectedAuditPost(null)}
      />
    </div>
  );
};
