import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  recipient_user_id: string;
  sender_user_id: string | null;
  type: string;
  title: string;
  body: string | null;
  hand_id: string | null;
  session_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface CreateNotificationData {
  recipient_user_id: string;
  sender_user_id?: string | null;
  type: string;
  title: string;
  body?: string | null;
  hand_id?: string | null;
  session_id?: string | null;
}

export const createNotification = async (data: CreateNotificationData): Promise<Notification | null> => {
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    return notification as Notification;
  } catch (error) {
    console.error('Error in createNotification:', error);
    return null;
  }
};

export const fetchUserNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return (data || []) as Notification[];
  } catch (error) {
    console.error('Error in fetchUserNotifications:', error);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
    return false;
  }
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getUnreadCount:', error);
    return 0;
  }
};
