import React from 'react';
import { PostStatus } from '../types';
import { CheckCircle2, Clock, AlertTriangle, XCircle, RefreshCw, Layers } from 'lucide-react';

interface StatusBadgeProps {
  status: PostStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'PUBLISHED':
      return (
        <span className="badge badge-published">
          <CheckCircle2 size={12} />
          Published
        </span>
      );
    case 'SCHEDULED':
      return (
        <span className="badge badge-scheduled">
          <Clock size={12} />
          Scheduled
        </span>
      );
    case 'QUEUED':
      return (
        <span className="badge badge-queued">
          <Layers size={12} />
          Queued
        </span>
      );
    case 'CREATING_CONTAINER':
    case 'CONTAINER_PROCESSING':
    case 'PUBLISHING':
      return (
        <span className="badge badge-processing">
          <RefreshCw size={12} style={{ animation: 'spin 1.5s linear infinite' }} />
          Processing
        </span>
      );
    case 'FAILED_RETRYABLE':
      return (
        <span className="badge badge-failed">
          <RefreshCw size={12} />
          Retry Pending
        </span>
      );
    case 'FAILED_TERMINAL':
      return (
        <span className="badge badge-failed">
          <AlertTriangle size={12} />
          Failed
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="badge badge-cancelled">
          <XCircle size={12} />
          Cancelled
        </span>
      );
    default:
      return <span className="badge badge-cancelled">{status}</span>;
  }
};
