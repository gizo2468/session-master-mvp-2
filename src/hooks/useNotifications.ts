import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Notification } from '@/services/notificationService';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Import dynamically to avoid issues during SSR/initial load
      const { fetchUserNotifications, getUnreadCount } = await import('@/services/notificationService');
      
      const [notifs, count] = await Promise.all([
        fetchUserNotifications(user.id),
        getUnreadCount(user.id)
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { markNotificationAsRead } = await import('@/services/notificationService');
      const success = await markNotificationAsRead(notificationId);
      if (success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      return success;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }, []);

  const markAsUnread = useCallback(async (notificationId: string) => {
    try {
      const { markNotificationAsUnread } = await import('@/services/notificationService');
      const success = await markNotificationAsUnread(notificationId);
      if (success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: false } : n)
        );
        setUnreadCount(prev => prev + 1);
      }
      return success;
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      return false;
    }
  }, []);

  const removeNotification = useCallback(async (notificationId: string) => {
    try {
      const { deleteNotification } = await import('@/services/notificationService');
      const notification = notifications.find(n => n.id === notificationId);
      const success = await deleteNotification(notificationId);
      if (success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (notification && !notification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
      return success;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }, [notifications]);

  // Initial load
  useEffect(() => {
    if (user?.id) {
      refresh();
    }
  }, [user?.id, refresh]);

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => {
            const updated = [newNotification, ...prev];
            // Keep only the 20 most recent notifications client-side
            return updated.slice(0, 20);
          });
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAsUnread,
    removeNotification,
    refresh
  };
};
