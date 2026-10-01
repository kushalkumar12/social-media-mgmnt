import { api } from './api';
import { NotificationItem, NotificationListResponse } from '../types';

export const notificationService = {
  async getNotifications(unreadOnly = false, page = 0, size = 15): Promise<NotificationListResponse> {
    const res = await api.get<NotificationListResponse>('/notifications', {
      params: { unreadOnly, page, size },
    });
    return res.data;
  },

  async getUnreadCount(): Promise<number> {
    const res = await api.get<{ unreadCount: number }>('/notifications/unread-count');
    return res.data.unreadCount;
  },

  async markAsRead(id: number): Promise<NotificationItem> {
    const res = await api.put<NotificationItem>(`/notifications/${id}/read`);
    return res.data;
  },

  async markAllAsRead(): Promise<void> {
    await api.put('/notifications/mark-all-read');
  },

  async deleteNotification(id: number): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },

  async clearAllRead(): Promise<void> {
    await api.delete('/notifications/clear-all');
  },
};
