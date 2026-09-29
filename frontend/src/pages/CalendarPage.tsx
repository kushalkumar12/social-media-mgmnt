import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ScheduledPost } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    // Fetch month range
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString();

    api.get(`/posts/calendar?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`)
      .then((res) => setPosts(res.data))
      .catch((err) => console.error(err))
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

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Publishing Calendar</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Visual schedule map of upcoming, published, and failed Instagram posts.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={handlePrevMonth} className="btn-secondary" style={{ padding: '8px 12px' }}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, minWidth: '160px', textAlign: 'center' }}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button onClick={handleNextMonth} className="btn-secondary" style={{ padding: '8px 12px' }}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>
        {/* Days Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '12px', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>

        {/* Days Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} style={{ minHeight: '100px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px dashed var(--border-color)' }} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayPosts = posts.filter((p) => {
              const pDate = new Date(p.scheduledAt);
              return pDate.getDate() === dayNum && pDate.getMonth() === currentDate.getMonth() && pDate.getFullYear() === currentDate.getFullYear();
            });

            return (
              <div key={dayNum} style={{
                minHeight: '100px',
                background: '#FFFFFF',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{dayNum}</div>
                {dayPosts.map((post) => (
                  <div key={post.id} style={{
                    background: 'var(--bg-card-hover)',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    borderLeft: '3px solid var(--insta-pink)',
                    border: '1px solid var(--border-color)',
                    borderLeftWidth: '3px',
                    borderLeftColor: 'var(--insta-pink)'
                  }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{post.instagramUsername}</div>
                    <StatusBadge status={post.status} />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
