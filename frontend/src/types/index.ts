export type PostStatus = 
  | 'DRAFT'
  | 'SCHEDULED'
  | 'QUEUED'
  | 'CREATING_CONTAINER'
  | 'CONTAINER_PROCESSING'
  | 'READY_TO_PUBLISH'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'FAILED_RETRYABLE'
  | 'FAILED_TERMINAL'
  | 'CANCELLED'
  | 'EXPIRED';

export type PostType = 'SINGLE_IMAGE' | 'SINGLE_VIDEO' | 'REELS' | 'CAROUSEL' | 'STORY';
export type MediaType = 'IMAGE' | 'VIDEO' | 'REELS' | 'CAROUSEL_ITEM';
export type AccountStatus = 'ACTIVE' | 'TOKEN_EXPIRED' | 'DEAUTHORIZED' | 'REVOKED';
export type UserPlan = 'SINGLE' | 'LITE' | 'PRO' | 'MASTER';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  plan: UserPlan;
  accountLimit: number;
  trialExpiresAt?: string;
  emailVerified: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface GenericResponse {
  success: boolean;
  message: string;
  debugOtp?: string;
  debugResetToken?: string;
}

export interface InstagramAccount {
  id: number;
  facebookPageId?: string;
  igUserId: string;
  username: string;
  profilePictureUrl?: string;
  followersCount?: number;
  followingCount?: number;
  mediaCount?: number;
  biography?: string;
  category?: string;
  accountType: string;
  status: AccountStatus;
  tokenExpiresAt?: string;
  lastRefreshedAt?: string;
  connectedAt: string;
  scopesGranted: string[];
  accessToken?: string;
}

export interface Media {
  id: number;
  fileName: string;
  mediaType: MediaType;
  cdnUrl: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  aspectRatio?: number;
  createdAt: string;
}

export interface PublishingAttempt {
  id: number;
  attemptNumber: number;
  operation: string;
  requestTimestamp: string;
  responseStatus?: number;
  metaErrorCode?: string;
  isRetryable?: boolean;
  responseBody?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface ScheduledPost {
  id: number;
  instagramAccountId: number;
  instagramUsername: string;
  caption?: string;
  postType: PostType;
  idempotencyKey: string;
  scheduledAt: string;
  timezone?: string;
  status: PostStatus;
  instagramContainerId?: string;
  instagramMediaId?: string;
  publishedAt?: string;
  failureReason?: string;
  retryCount: number;
  maxAttempts: number;
  nextAttemptAt?: string;
  mediaItems: Media[];
  createdAt: string;
  publishingAttempts: PublishingAttempt[];
}

export interface DashboardSummary {
  totalPosts: number;
  scheduledCount: number;
  publishedCount: number;
  failedCount: number;
  draftCount: number;
  upcomingPosts: ScheduledPost[];
  accounts: InstagramAccount[];
}

export type NotificationType =
  | 'POST_PUBLISHED'
  | 'POST_FAILED'
  | 'POST_RETRYING'
  | 'RATE_LIMIT_WARNING'
  | 'CIRCUIT_BREAKER_ACTIVE'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_REFRESH_FAILED'
  | 'ACCOUNT_CONNECTED'
  | 'ACCOUNT_DISCONNECTED'
  | 'BULK_IMPORT_COMPLETED'
  | 'SYSTEM_ALERT';

export type NotificationSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  severity: NotificationSeverity;
  isRead: boolean;
  link?: string;
  metadata?: string;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  unreadCount: number;
}

