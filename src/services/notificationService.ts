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
  connection_id: string | null;
  player_goal_id: string | null;
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
  player_goal_id?: string | null;
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
    
    // Cleanup old notifications beyond the 20-item limit (async, non-blocking)
    cleanupOldNotifications(data.recipient_user_id).catch(err => 
      console.error('Background cleanup failed:', err)
    );
    
    return { ...payload, id: 'pending', is_read: false, created_at: new Date().toISOString() } as Notification;
  } catch (error) {
    console.error('Exception in createNotification:', error);
    return null;
  }
};

const NOTIFICATION_LIMIT = 20;

export const fetchUserNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(NOTIFICATION_LIMIT);

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

/**
 * Cleans up old notifications beyond the limit.
 * Keeps only the most recent NOTIFICATION_LIMIT notifications per user.
 */
export const cleanupOldNotifications = async (userId: string): Promise<void> => {
  try {
    // Get the IDs of the notifications to keep (the newest ones)
    const { data: keepNotifications, error: fetchError } = await supabase
      .from('notifications')
      .select('id')
      .eq('recipient_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(NOTIFICATION_LIMIT);

    if (fetchError || !keepNotifications) {
      console.error('Error fetching notifications for cleanup:', fetchError);
      return;
    }

    // If we have fewer than the limit, no cleanup needed
    if (keepNotifications.length < NOTIFICATION_LIMIT) return;

    const keepIds = keepNotifications.map(n => n.id);

    // Delete all notifications NOT in the keep list
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('recipient_user_id', userId)
      .not('id', 'in', `(${keepIds.join(',')})`);

    if (deleteError) {
      console.error('Error deleting old notifications:', deleteError);
    }
  } catch (error) {
    console.error('Error in cleanupOldNotifications:', error);
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

/**
 * Validates if a notification's target content still exists.
 * Returns false if the target is missing/deleted.
 */
export const validateNotificationTarget = async (notification: Notification): Promise<boolean> => {
  try {
    // Session-based notifications
    if (notification.session_id && [
      'session_shared', 
      'stack_check', 
      'live_session_still_active', 
      'multi_day_tournament_reminder'
    ].includes(notification.type)) {
      const { data } = await supabase
        .from('sessions')
        .select('id')
        .eq('id', notification.session_id)
        .maybeSingle();
      if (!data) return false;
    }

    // Hand-based notifications
    if (notification.hand_id && [
      'coach_feedback', 
      'hand_uploaded', 
      'hand_review_reminder'
    ].includes(notification.type)) {
      const { data } = await supabase
        .from('session_hands_new')
        .select('id')
        .eq('id', notification.hand_id)
        .maybeSingle();
      if (!data) return false;
    }

    // Connection-based notifications (check via connection_id if present)
    if (notification.type === 'connection_request' || notification.type === 'connection_approved') {
      // These reference a connection - if connection_id is stored, check it
      // Otherwise we can't validate without the connection_id field
      const notifWithConnectionId = notification as Notification & { connection_id?: string };
      if (notifWithConnectionId.connection_id) {
        const { data } = await supabase
          .from('coach_student_connections')
          .select('id')
          .eq('id', notifWithConnectionId.connection_id)
          .maybeSingle();
        if (!data) return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error validating notification target:', error);
    return true; // On error, assume valid to avoid accidental deletion
  }
};

/**
 * Filters out stale notifications and deletes them in the background.
 * Returns only valid notifications.
 */
export const filterStaleNotifications = async (notifications: Notification[]): Promise<Notification[]> => {
  const validNotifications: Notification[] = [];
  const staleIds: string[] = [];

  // Process in parallel for performance
  const validationResults = await Promise.all(
    notifications.map(async (notification) => ({
      notification,
      isValid: await validateNotificationTarget(notification)
    }))
  );

  for (const { notification, isValid } of validationResults) {
    if (isValid) {
      validNotifications.push(notification);
    } else {
      staleIds.push(notification.id);
    }
  }

  // Delete stale notifications in background (non-blocking)
  if (staleIds.length > 0) {
    console.log(`Cleaning up ${staleIds.length} stale notifications`);
    Promise.all(staleIds.map(id => deleteNotification(id))).catch(err =>
      console.error('Error cleaning up stale notifications:', err)
    );
  }

  return validNotifications;
};
