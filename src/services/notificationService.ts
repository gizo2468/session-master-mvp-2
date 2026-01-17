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
  feedback_id: string | null;
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
  feedback_id?: string | null;
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
      ...(data.session_id && { session_id: data.session_id }),
      ...(data.feedback_id && { feedback_id: data.feedback_id })
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

// Notification types that require an active session to be valid
const ACTIVE_SESSION_NOTIFICATION_TYPES = [
  'live_session_still_active',
  'multi_day_tournament_reminder',
  'stack_check'
];

/**
 * Validates if a notification's target content still exists.
 * ID-based validation: checks ANY notification with a target ID, regardless of type.
 * For "active session" notifications, also verifies the session is still active.
 * Returns false if the target is missing/deleted/inaccessible/ended.
 */
export const validateNotificationTarget = async (notification: Notification): Promise<boolean> => {
  try {
    // Check session if session_id exists (ANY notification with session_id)
    if (notification.session_id) {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, is_active, status')
        .eq('id', notification.session_id)
        .maybeSingle();
      // If error (RLS denied) or no data, target is inaccessible
      if (error || !data) return false;
      
      // For "active session" notification types, session must actually be active
      if (ACTIVE_SESSION_NOTIFICATION_TYPES.includes(notification.type)) {
        if (!data.is_active || data.status !== 'active') {
          return false; // Session ended, notification is stale
        }
      }
    }

    // Check hand if hand_id exists (ANY notification with hand_id)
    if (notification.hand_id) {
      const { data, error } = await supabase
        .from('session_hands_new')
        .select('id')
        .eq('id', notification.hand_id)
        .maybeSingle();
      if (error || !data) return false;
    }

    // Check connection if connection_id exists
    if (notification.connection_id) {
      const { data, error } = await supabase
        .from('coach_student_connections')
        .select('id')
        .eq('id', notification.connection_id)
        .maybeSingle();
      if (error || !data) return false;
    }

    // Check player goal if player_goal_id exists
    if (notification.player_goal_id) {
      const { data, error } = await supabase
        .from('player_goals')
        .select('id')
        .eq('id', notification.player_goal_id)
        .maybeSingle();
      if (error || !data) return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating notification target:', error);
    // On exception, treat as invalid to prevent navigation to error pages
    return false;
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

/**
 * Deletes a notification by feedback_id and sender_user_id.
 * Used when a student unlikes feedback to remove the "feedback_seen" notification.
 */
export const deleteNotificationByFeedbackId = async (
  feedbackId: string,
  senderId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('feedback_id', feedbackId)
      .eq('sender_user_id', senderId)
      .eq('type', 'feedback_seen');

    if (error) {
      console.error('Error deleting notification by feedback_id:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteNotificationByFeedbackId:', error);
    return false;
  }
};
