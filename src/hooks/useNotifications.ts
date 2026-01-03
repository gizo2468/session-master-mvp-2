import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import type { Notification } from '@/services/notificationService';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Track processed notification IDs to prevent duplicates from real-time subscription
  const processedIdsRef = useRef<Set<string>>(new Set());

  // Update iOS app badge using @capawesome/capacitor-badge
  const updateBadgeCount = useCallback(async (count: number) => {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
      try {
        const { Badge } = await import('@capawesome/capacitor-badge');
        await Badge.set({ count: Math.max(0, count) });
      } catch (error) {
        console.error('Error updating badge:', error);
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Import dynamically to avoid issues during SSR/initial load
      const { fetchUserNotifications, getUnreadCount, filterStaleNotifications } = await import('@/services/notificationService');
      
      const [rawNotifs, count] = await Promise.all([
        fetchUserNotifications(user.id),
        getUnreadCount(user.id)
      ]);
      
      // Filter out stale notifications (deleted sessions/hands/connections)
      const validNotifs = await filterStaleNotifications(rawNotifs);
      
      // Calculate accurate unread count after filtering
      const validUnreadCount = validNotifs.filter(n => !n.is_read).length;
      
      // Update processed IDs with fetched notifications
      validNotifs.forEach(n => processedIdsRef.current.add(n.id));
      
      setNotifications(validNotifs);
      setUnreadCount(validUnreadCount);
      
      // Update iOS badge
      updateBadgeCount(validUnreadCount);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, updateBadgeCount]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { markNotificationAsRead } = await import('@/services/notificationService');
      const success = await markNotificationAsRead(notificationId);
      if (success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => {
          const newCount = Math.max(0, prev - 1);
          updateBadgeCount(newCount);
          return newCount;
        });
      }
      return success;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }, [updateBadgeCount]);

  const markAsUnread = useCallback(async (notificationId: string) => {
    try {
      const { markNotificationAsUnread } = await import('@/services/notificationService');
      const success = await markNotificationAsUnread(notificationId);
      if (success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: false } : n)
        );
        setUnreadCount(prev => {
          const newCount = prev + 1;
          updateBadgeCount(newCount);
          return newCount;
        });
      }
      return success;
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      return false;
    }
  }, [updateBadgeCount]);

  const removeNotification = useCallback(async (notificationId: string) => {
    try {
      const { deleteNotification } = await import('@/services/notificationService');
      const notification = notifications.find(n => n.id === notificationId);
      const success = await deleteNotification(notificationId);
      if (success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        // Also remove from processed IDs so it can be re-added if needed
        processedIdsRef.current.delete(notificationId);
        if (notification && !notification.is_read) {
          setUnreadCount(prev => {
            const newCount = Math.max(0, prev - 1);
            updateBadgeCount(newCount);
            return newCount;
          });
        }
      }
      return success;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }, [notifications, updateBadgeCount]);

  // Initial load
  useEffect(() => {
    if (user?.id) {
      refresh();
    }
  }, [user?.id, refresh]);

  // Real-time subscription for new notifications AND deletions
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
        async (payload) => {
          const newNotification = payload.new as Notification;
          
          // Skip if we've already processed this notification ID
          if (processedIdsRef.current.has(newNotification.id)) {
            console.log('Duplicate notification ignored:', newNotification.id);
            return;
          }
          
          // Validate the notification target before adding to state
          const { validateNotificationTarget, deleteNotification } = await import('@/services/notificationService');
          const isValid = await validateNotificationTarget(newNotification);
          
          if (!isValid) {
            console.log('Stale notification received via realtime, deleting:', newNotification.id);
            deleteNotification(newNotification.id).catch(console.error);
            return;
          }
          
          // Mark as processed
          processedIdsRef.current.add(newNotification.id);
          
          // Prevent the set from growing unbounded
          if (processedIdsRef.current.size > 100) {
            const arr = Array.from(processedIdsRef.current);
            processedIdsRef.current = new Set(arr.slice(-50));
          }
          
          setNotifications(prev => {
            // Double-check state as well (race condition guard)
            if (prev.some(n => n.id === newNotification.id)) {
              return prev;
            }
            const updated = [newNotification, ...prev];
            // Keep only the 20 most recent notifications client-side
            return updated.slice(0, 20);
          });
          
          setUnreadCount(prev => {
            const newCount = prev + 1;
            updateBadgeCount(newCount);
            return newCount;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_user_id=eq.${user.id}`
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          if (!deletedId) return;
          
          // Remove from local state
          setNotifications(prev => {
            const notification = prev.find(n => n.id === deletedId);
            if (notification && !notification.is_read) {
              setUnreadCount(prevCount => {
                const newCount = Math.max(0, prevCount - 1);
                updateBadgeCount(newCount);
                return newCount;
              });
            }
            return prev.filter(n => n.id !== deletedId);
          });
          
          // Remove from processed IDs
          processedIdsRef.current.delete(deletedId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, updateBadgeCount]);

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
