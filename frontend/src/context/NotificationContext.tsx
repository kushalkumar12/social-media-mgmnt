import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { NotificationItem } from '../types';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  activeToast: NotificationItem | null;
  dismissToast: () => void;
  triggerToast: (notification: NotificationItem) => void;
  showToast: (title: string, message: string, severity?: NotificationItem['severity'], link?: string) => void;
  fetchNotifications: (unreadOnly?: boolean) => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  clearAllRead: () => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  }, []);

  const triggerToast = useCallback((notification: NotificationItem) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setActiveToast(notification);
    toastTimerRef.current = setTimeout(() => {
      setActiveToast(null);
    }, 6000); // 6s duration
  }, []);

  const showToast = useCallback(
    (title: string, message: string, severity: NotificationItem['severity'] = 'INFO', link?: string) => {
      triggerToast({
        id: Date.now(),
        title,
        message,
        severity,
        link,
        type: 'SYSTEM_ALERT',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    },
    [triggerToast]
  );

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.debug('Failed to fetch unread count', err);
    }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(async (unreadOnly = false) => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await notificationService.getNotifications(unreadOnly, 0, 30);
      setNotifications(res.items);
      setUnreadCount(res.unreadCount);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (id: number) => {
    try {
      const updated = await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  }, []);

  const deleteNotification = useCallback(async (id: number) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => {
        const item = prev.find((n) => n.id === id);
        if (item && !item.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  }, []);

  const clearAllRead = useCallback(async () => {
    try {
      await notificationService.clearAllRead();
      setNotifications((prev) => prev.filter((n) => !n.isRead));
    } catch (err) {
      console.error('Failed to clear read notifications', err);
    }
  }, []);

  // Initialize and connect SSE stream when authenticated
  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Initial load
    fetchUnreadCount();
    fetchNotifications();

    // Setup SSE connection
    let isSubscribed = true;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connectSSE = () => {
      if (!isSubscribed) return;

      try {
        const sseUrl = `/api/notifications/stream`;
        const es = new EventSource(sseUrl);
        eventSourceRef.current = es;

        es.addEventListener('NOTIFICATION', (event: MessageEvent) => {
          try {
            const data: NotificationItem = JSON.parse(event.data);
            setNotifications((prev) => [data, ...prev.filter((n) => n.id !== data.id)]);
            setUnreadCount((prev) => prev + 1);
            triggerToast(data);
          } catch (e) {
            console.error('Failed to parse incoming notification event', e);
          }
        });

        es.addEventListener('UNREAD_COUNT', (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            setUnreadCount(data.unreadCount);
          } catch (e) {
            console.error('Failed to parse unread count event', e);
          }
        });

        es.onerror = () => {
          es.close();
          eventSourceRef.current = null;
          // Reconnect after 10s if still subscribed
          if (isSubscribed) {
            reconnectTimeout = setTimeout(connectSSE, 10000);
          }
        };
      } catch (err) {
        console.debug('SSE connection init error, falling back to polling', err);
        if (isSubscribed) {
          reconnectTimeout = setTimeout(connectSSE, 15000);
        }
      }
    };

    connectSSE();

    // Backup polling every 30 seconds
    const pollInterval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => {
      isSubscribed = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      clearInterval(pollInterval);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isAuthenticated, token, fetchUnreadCount, fetchNotifications, triggerToast]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        activeToast,
        dismissToast,
        triggerToast,
        showToast,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
