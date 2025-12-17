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
  // Validate required fields
  if (!data.recipient_user_id || !data.type || !data.title) {
    console.error('createNotification: Missing required fields', { 
      hasRecipient: !!data.recipient_user_id, 
      hasType: !!data.type, 
      hasTitle: !!data.title 
    });
    return null;
  }
  
  console.log('Creating notification with data:', data);
  
  try {
    // Build clean payload - only include defined fields to avoid null UUID issues
    const payload = {
      recipient_user_id: data.recipient_user_id,
      type: data.type,
      title: data.title,
      ...(data.sender_user_id && { sender_user_id: data.sender_user_id }),
      ...(data.body && { body: data.body }),
      ...(data.hand_id && { hand_id: data.hand_id }),
      ...(data.session_id && { session_id: data.session_id })
    };
    
    console.log('Inserting notification payload:', payload);
    
    // Insert without .select().single() to avoid RLS conflict
    // (sender can INSERT but cannot SELECT recipient's notification)
    const { error } = await supabase
      .from('notifications')
      .insert(payload);

    if (error) {
      console.error('Supabase error creating notification:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return null;
    }

    console.log('Notification created successfully');
    return { ...payload, id: 'pending', is_read: false, created_at: new Date().toISOString() } as Notification;
  } catch (error) {
    console.error('Exception in createNotification:', error);
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

export const markNotificationAsUnread = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: false })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as unread:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markNotificationAsUnread:', error);
    return false;
  }
};

export const deleteNotification = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteNotification:', error);
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
