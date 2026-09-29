import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ScheduledPost } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Skeleton } from '../components/common/Skeleton';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CalendarPage: React.FC = () => {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    setLoading(true);
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString();

    api.get(`/posts/calendar?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`)
      .then((res) => setPosts(res.data))
      .catch((err) => console.error('Failed to load calendar events', err))
      .finally(() => setLoading(false));
  }, [currentDate]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Publishing Calendar</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Visual schedule map of upcoming, published, and failed Instagram posts.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={handleToday} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.82rem' }}>
            Today
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '2px' }}>
            <button
              onClick={handlePrevMonth}
              aria-label="Previous Month"
              style={{ padding: '6px 8px', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}
            >
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, minWidth: '150px', textAlign: 'center' }}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button
              onClick={handleNextMonth}
              aria-label="Next Month"
              style={{ padding: '6px 8px', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <Link to="/posts/create" className="btn-primary">
            <PlusCircle size={16} />
            <span className="hide-on-mobile">Create Post</span>
          </Link>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="glass-card" style={{ padding: '20px', overflowX: 'auto' }}>
        <div style={{ minWidth: '780px' }}>
          {/* Days Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '8px',
              marginBottom: '10px',
              textAlign: 'center',
              fontWeight: 600,
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
            }}
          >
            {dayHeaders.map((d) => (
              <div key={d} style={{ padding: '4px' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {/* Previous month trailing days */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div
                key={`empty-${i}`}
                style={{
                  minHeight: '110px',
                  background: 'var(--bg-main)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--border-color)',
                  opacity: 0.5,
                }}
              />
            ))}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isCurrentDay =
                today.getDate() === dayNum &&
                today.getMonth() === currentDate.getMonth() &&
                today.getFullYear() === currentDate.getFullYear();

              const dayPosts = posts.filter((p) => {
                const pDate = new Date(p.scheduledAt);
                return (
                  pDate.getDate() === dayNum &&
                  pDate.getMonth() === currentDate.getMonth() &&
                  pDate.getFullYear() === currentDate.getFullYear()
                );
              });

              return (
                <div
                  key={dayNum}
                  style={{
                    minHeight: '110px',
                    background: '#FFFFFF',
                    border: isCurrentDay ? '2px solid var(--primary-blue)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: isCurrentDay ? 'var(--primary-blue)' : 'var(--text-secondary)',
                        width: isCurrentDay ? '22px' : 'auto',
                        height: isCurrentDay ? '22px' : 'auto',
                        borderRadius: isCurrentDay ? '50%' : 'none',
                        background: isCurrentDay ? 'var(--primary-blue-light)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {dayNum}
                    </span>
                    {dayPosts.length > 0 && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                        }}
                      >
                        {dayPosts.length} post{dayPosts.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Day Posts List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', maxHeight: '100px' }}>
                    {loading ? (
                      <Skeleton height={18} borderRadius="4px" />
                    ) : (
                      dayPosts.map((post) => (
                        <div
                          key={post.id}
                          style={{
                            background: 'var(--bg-main)',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          borderLeft: post.status === 'PUBLISHED' ? '3px solid var(--accent-green)' : '3px solid var(--primary-blue)',
                          border: '1px solid var(--border-color)',
                          borderLeftWidth: '3px',
                        }}
                        title={`@${post.instagramUsername}: ${post.caption || 'No caption'}`}
                      >
                        <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          @{post.instagramUsername}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          <span>{new Date(post.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span style={{ fontWeight: 600 }}>{post.postType}</span>
                        </div>
                      </div>
                    )))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
