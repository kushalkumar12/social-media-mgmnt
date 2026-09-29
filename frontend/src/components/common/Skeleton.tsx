import React, { useState } from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  circle?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  borderRadius,
  circle = false,
  className = '',
  style,
}) => {
  return (
    <span
      className={`skeleton ${circle ? 'skeleton-circle' : ''} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: circle ? '50%' : borderRadius,
        ...style,
      }}
      aria-hidden="true"
    />
  );
};

export const MetricsGridSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="glass-card"
          style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}
        >
          <Skeleton width={46} height={46} borderRadius="var(--radius-md)" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-1-5)' }}>
            <Skeleton width="60%" height={12} />
            <Skeleton width="40%" height={24} />
          </div>
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 6,
}) => {
  return (
    <div className="table-container">
      <table className="saas-table">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, c) => (
              <th key={c}>
                <Skeleton width={c === 0 ? '30px' : c === columns - 1 ? '70px' : '90px'} height={14} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c}>
                  <Skeleton
                    width={
                      c === 0 ? '24px' : c === 1 ? '160px' : c === columns - 1 ? '80px' : '100px'
                    }
                    height={16}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div
      className="glass-card"
      style={{
        padding: 'var(--space-5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      {/* Header with avatar & info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <Skeleton width={52} height={52} circle />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-1-5)' }}>
          <Skeleton width="70%" height={16} />
          <Skeleton width="40%" height={12} />
        </div>
        <Skeleton width={56} height={22} borderRadius="var(--radius-full)" />
      </div>

      {/* Stats bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          background: 'var(--bg-main)',
          padding: 'var(--space-3) var(--space-2)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Skeleton width={32} height={18} />
          <Skeleton width={40} height={10} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Skeleton width={40} height={18} />
          <Skeleton width={50} height={10} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Skeleton width={36} height={18} />
          <Skeleton width={50} height={10} />
        </div>
      </div>

      {/* Countdown pill */}
      <Skeleton width="100%" height={32} borderRadius="var(--radius-md)" />

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <Skeleton width="100%" height={36} borderRadius="var(--radius-md)" />
        <Skeleton width="100%" height={36} borderRadius="var(--radius-md)" />
        <Skeleton width={40} height={36} borderRadius="var(--radius-md)" />
      </div>
    </div>
  );
};

export const PageSkeleton: React.FC<{ titleWidth?: string }> = ({ titleWidth = '240px' }) => {
  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <Skeleton width={titleWidth} height={28} />
          <Skeleton width="340px" height={14} />
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2-5)' }}>
          <Skeleton width={100} height={40} borderRadius="var(--radius-md)" />
          <Skeleton width={130} height={40} borderRadius="var(--radius-md)" />
        </div>
      </div>

      {/* Content skeleton */}
      <MetricsGridSkeleton count={4} />

      <div
        className="glass-card"
        style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton width={180} height={20} />
          <Skeleton width={120} height={32} borderRadius="var(--radius-md)" />
        </div>
        <TableSkeleton rows={5} columns={5} />
      </div>
    </div>
  );
};

interface ProgressiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  fallbackText?: string;
  circle?: boolean;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  width,
  height,
  borderRadius = 'var(--radius-md)',
  fallbackText,
  circle = false,
  style,
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const containerStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: circle ? '50%' : borderRadius,
    ...style,
  };

  if (error || !src) {
    return (
      <div
        className="progressive-image-container"
        style={{
          ...containerStyle,
          background: 'var(--insta-gradient)',
          color: '#fff',
          fontWeight: 700,
          fontSize: '0.9rem',
        }}
      >
        {fallbackText ? fallbackText.substring(0, 2).toUpperCase() : alt.substring(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="progressive-image-container" style={containerStyle}>
      {!loaded && (
        <span
          className="skeleton progressive-image-skeleton"
          style={{ borderRadius: circle ? '50%' : borderRadius }}
        />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`progressive-image ${loaded ? 'loaded' : ''}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: circle ? '50%' : borderRadius,
        }}
        {...props}
      />
    </div>
  );
};
