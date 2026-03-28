import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { useNotifications } from '@/hooks/useNotifications';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { HandReviewModal } from '@/components/coaching/HandReviewModal';
import { SharedSessionModal } from '@/components/coaching/SharedSessionModal';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconMenuButton } from '@/components/ui/IconMenuButton';

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, loading, markAsRead, markAsUnread, removeNotification } = useNotifications();
  const [selectedNotification, setSelectedNotification] = useState<typeof notifications[0] | null>(null);
  const [selectedSessionNotification, setSelectedSessionNotification] = useState<typeof notifications[0] | null>(null);
  const [sessionModalDefaultTab, setSessionModalDefaultTab] = useState<'summary' | 'tables' | 'hands'>('summary');
  const swipeBackRef = useSwipeBack({ fallbackPath: '/', screenName: 'Notifications' });

  const handleMarkAllAsRead = async () => {
    const unread = displayNotifications.filter(n => !n.is_read);
    if (unread.length === 0) return;
    for (const n of unread) {
      await markAsRead(n.id);
    }
    toast({ title: 'All notifications marked as read' });
  };

  // Deduplicate stack_check notifications: show only the most recent one
  const displayNotifications = useMemo(() => {
    const stackCheckNotifications = notifications.filter(n => n.type === 'stack_check');
    const mostRecentStackCheck = stackCheckNotifications.length > 0 
      ? stackCheckNotifications.reduce((latest, current) => 
          new Date(current.created_at) > new Date(latest.created_at) ? current : latest
        )
      : null;
    
    return notifications.filter(n => 
      n.type !== 'stack_check' || n.id === mostRecentStackCheck?.id
    );
  }, [notifications]);

  // Helper to validate session exists and check if it's still active
  const validateSessionExists = async (sessionId: string, notificationId: string): Promise<{ exists: boolean; isActive: boolean }> => {
    const { data: session } = await supabase
      .from('sessions')
      .select('id, is_active, status')
      .eq('id', sessionId)
      .maybeSingle();
    
    if (!session) {
      toast({ 
        title: 'This session is no longer available',
        variant: 'destructive'
      });
      await removeNotification(notificationId);
      return { exists: false, isActive: false };
    }
    return { 
      exists: true, 
      isActive: session.is_active === true && session.status === 'active' 
    };
  };

  // Helper to validate hand exists before opening modal
  const validateHandExists = async (handId: string, notificationId: string): Promise<boolean> => {
    const { data } = await supabase
      .from('session_hands_new')
      .select('id')
      .eq('id', handId)
      .maybeSingle();
    
    if (!data) {
      toast({ 
        title: 'This hand is no longer available',
        variant: 'destructive'
      });
      await removeNotification(notificationId);
      return false;
    }
    return true;
  };

  // Helper to validate shared session exists and coach still has access
  const validateSharedSessionExists = async (sessionId: string, notificationId: string): Promise<boolean> => {
    // Check session exists
    const { data: session } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .maybeSingle();
    
    if (!session) {
      toast({ 
        title: 'This session is no longer available',
        variant: 'destructive'
      });
      await removeNotification(notificationId);
      return false;
    }
    
    // Also verify the share still exists for this coach
    const { data: share } = await supabase
      .from('shared_sessions')
      .select('id')
      .eq('session_id', sessionId)
      .eq('coach_id', user?.id)
      .maybeSingle();
    
    if (!share) {
      toast({ 
        title: 'This session is no longer shared with you',
        variant: 'destructive'
      });
      await removeNotification(notificationId);
      return false;
    }
    
    return true;
  };

  // Helper to validate player's own session exists (for player-received notifications)
  const validatePlayerSessionExists = async (sessionId: string, notificationId: string): Promise<boolean> => {
    // Check session exists AND belongs to the current user (player owns it)
    const { data: session } = await supabase
      .from('sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .eq('user_id', user?.id)
      .maybeSingle();
    
    if (!session) {
      toast({ 
        title: 'This session is no longer available',
        variant: 'destructive'
      });
      await removeNotification(notificationId);
      return false;
    }
    
    return true;
  };

  // Helper to get the correct playerId based on notification type
  const getPlayerIdForNotification = (notification: typeof notifications[0]): string => {
    // For coach_feedback notifications, the recipient IS the player
    if (notification.type === 'coach_feedback') {
      return notification.recipient_user_id || '';
    }
    // For session_shared and hand_review_reminder, the sender IS the player
    return notification.sender_user_id || '';
  };


  // Helper to validate connection still exists
  const validateConnectionExists = async (notificationId: string, connectionId?: string | null): Promise<boolean> => {
    if (!connectionId) {
      // Can't validate without connection_id, allow navigation
      return true;
    }
    
    const { data } = await supabase
      .from('coach_student_connections')
      .select('id')
      .eq('id', connectionId)
      .maybeSingle();
    
    if (!data) {
      toast({ 
        title: 'This connection no longer exists',
        variant: 'destructive'
      });
      await removeNotification(notificationId);
      return false;
    }
    return true;
  };

  // Helper to validate player goal still exists
  const validateGoalExists = async (notificationId: string, goalId?: string | null): Promise<boolean> => {
    if (!goalId) {
      return true;
    }
    
    const { data } = await supabase
      .from('player_goals')
      .select('id')
      .eq('id', goalId)
      .maybeSingle();
    
    if (!data) {
      toast({ 
        title: 'This focus point is no longer available',
        variant: 'destructive'
      });
      await removeNotification(notificationId);
      return false;
    }
    return true;
  };

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    // First, verify the notification row itself still exists in DB
    const { data: notifExists } = await supabase
      .from('notifications')
      .select('id')
      .eq('id', notification.id)
      .maybeSingle();
    
    if (!notifExists) {
      // Notification was deleted - remove via hook (will handle local state)
      await removeNotification(notification.id);
      toast({ 
        title: 'This notification is no longer available',
        variant: 'destructive'
      });
      return;
    }
    
    // Mark as read
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // For coach_feedback notifications (player receives), open Session Summary → Hands tab
    if (notification.type === 'coach_feedback' && notification.session_id) {
      // Player owns the session - use player validation (not shared session validation)
      const exists = await validatePlayerSessionExists(notification.session_id, notification.id);
      if (exists) {
        setSessionModalDefaultTab('hands');
        setSelectedSessionNotification(notification);
      }
      return;
    }
    
    // For hand_uploaded notifications, validate hand exists then open modal
    if (notification.type === 'hand_uploaded' && notification.hand_id) {
      const exists = await validateHandExists(notification.hand_id, notification.id);
      if (exists) {
        setSelectedNotification(notification);
      }
      return;
    }
    
    // For hand_review_reminder notifications, open Session Summary → Hands tab
    if (notification.type === 'hand_review_reminder' && notification.session_id) {
      const exists = await validateSharedSessionExists(notification.session_id, notification.id);
      if (exists) {
        setSessionModalDefaultTab('hands');
        setSelectedSessionNotification(notification);
      }
      return;
    }
    
    // For feedback_seen notifications, validate hand exists then open modal (coach view)
    if (notification.type === 'feedback_seen' && notification.hand_id) {
      const exists = await validateHandExists(notification.hand_id, notification.id);
      if (exists) {
        setSelectedNotification(notification);
      }
      return;
    }
    
    // For session_shared notifications, validate session AND share exists
    if (notification.type === 'session_shared' && notification.session_id) {
      const exists = await validateSharedSessionExists(notification.session_id, notification.id);
      if (exists) {
        setSessionModalDefaultTab('summary');
        setSelectedSessionNotification(notification);
      }
      return;
    }
    
    // For connection_request notifications, validate connection exists
    if (notification.type === 'connection_request') {
      const notifWithConnection = notification as typeof notification & { connection_id?: string };
      const exists = await validateConnectionExists(notification.id, notifWithConnection.connection_id);
      if (exists) {
        navigate('/dashboard', { state: { focusSection: 'incoming-requests' } });
      }
      return;
    }
    
    // For connection_approved notifications, validate connection exists
    if (notification.type === 'connection_approved') {
      const notifWithConnection = notification as typeof notification & { connection_id?: string };
      const exists = await validateConnectionExists(notification.id, notifWithConnection.connection_id);
      if (exists) {
        navigate('/dashboard');
      }
      return;
    }
    
    // For stack_check notifications, validate session exists AND is active before navigation
    if (notification.type === 'stack_check' && notification.session_id) {
      const result = await validateSessionExists(notification.session_id, notification.id);
      if (result.exists) {
        if (result.isActive) {
          navigate(`/session/${notification.session_id}`, { 
            state: { openBBStackModal: true } 
          });
        } else {
          // Session ended - remove stale notification and redirect to details
          toast({ title: 'This session has ended' });
          await removeNotification(notification.id);
          navigate(`/session/${notification.session_id}/details`);
        }
      }
      return;
    }
    
    // For key_focus_point_created notifications, validate goal exists
    if (notification.type === 'key_focus_point_created') {
      const notifWithGoal = notification as typeof notification & { player_goal_id?: string };
      const exists = await validateGoalExists(notification.id, notifWithGoal.player_goal_id);
      if (exists) {
        navigate('/player-dashboard', { state: { scrollToFocusPoints: true } });
      }
      return;
    }
    
    // For live_session_still_active notifications, validate session exists AND is active
    if (notification.type === 'live_session_still_active' && notification.session_id) {
      const result = await validateSessionExists(notification.session_id, notification.id);
      if (result.exists) {
        if (result.isActive) {
          // Session still active - navigate to live session
          navigate(`/session/${notification.session_id}`);
        } else {
          // Session ended - remove stale notification and redirect to details
          toast({ title: 'This session has ended' });
          await removeNotification(notification.id);
          navigate(`/session/${notification.session_id}/details`);
        }
      }
      return;
    }
    
    // For multi_day_tournament_reminder notifications, validate session exists AND is active
    if (notification.type === 'multi_day_tournament_reminder' && notification.session_id) {
      const result = await validateSessionExists(notification.session_id, notification.id);
      if (result.exists) {
        if (result.isActive) {
          navigate(`/session/${notification.session_id}`);
        } else {
          // Session ended - remove stale notification and redirect to details
          toast({ title: 'This session has ended' });
          await removeNotification(notification.id);
          navigate(`/session/${notification.session_id}/details`);
        }
      }
      return;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'coach_feedback':
        return 'MessageSquare';
      case 'hand_uploaded':
        return 'Plus';
      case 'hand_review_reminder':
        return 'AlertCircle';
      case 'session_shared':
        return 'Share2';
      case 'connection_request':
        return 'UserPlus';
      case 'connection_approved':
        return 'UserCheck';
      case 'stack_check':
        return 'Clock';
      case 'key_focus_point_created':
        return 'Target';
      case 'live_session_still_active':
        return 'Timer';
      case 'multi_day_tournament_reminder':
        return 'Calendar';
      default:
        return 'Bell';
    }
  };
  
  // Determine if current user is viewing as coach (coach-targeted notification types)
  const COACH_VIEW_TYPES = ['hand_uploaded', 'hand_review_reminder', 'feedback_seen'];
  const isCoachView = selectedNotification ? COACH_VIEW_TYPES.includes(selectedNotification.type) : false;
  const playerId = isCoachView ? selectedNotification?.sender_user_id : user?.id;
  const coachId = isCoachView ? user?.id : selectedNotification?.sender_user_id;

  // Helper to render notification title with highlighted username
  const renderTitle = (title: string) => {
    // Pattern: "Username action..." or "Feedback from Username"
    const feedbackMatch = title.match(/^(Feedback from )(.+)$/);
    if (feedbackMatch) {
      return (
        <>
          {feedbackMatch[1]}
          <span className="text-primary">{feedbackMatch[2]}</span>
        </>
      );
    }
    
    // Pattern: "Username shared/uploaded..."
    const actionMatch = title.match(/^(\S+)( .+)$/);
    if (actionMatch) {
      return (
        <>
          <span className="text-primary">{actionMatch[1]}</span>
          {actionMatch[2]}
        </>
      );
    }
    
    return title;
  };

  return (
    <div ref={swipeBackRef} className="min-h-screen bg-gray-50 dark:bg-background">
      <header className="bg-white dark:bg-card shadow-sm header-safe pt-4">
        <div className="container mx-auto max-w-md px-4 pb-4">
          <div className="flex items-center">
            <Button
              onClick={() => navigate('/', { replace: true })}
              variant="outline"
              size="sm"
              className="text-poker-feltGreen border-poker-feltGreen hover:bg-poker-feltGreen hover:text-white"
            >
              <Icon name="ArrowLeft" size={16} />
            </Button>
            <h1 className="text-xl font-bold flex-1 text-center">Notifications</h1>
            <Button
              onClick={handleMarkAllAsRead}
              variant="outline"
              size="sm"
              className="text-poker-feltGreen border-poker-feltGreen hover:bg-poker-feltGreen hover:text-white"
              disabled={displayNotifications.length === 0 || displayNotifications.every(n => n.is_read)}
            >
              <Icon name="CheckCheck" size={16} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-md px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-poker-feltGreen"></div>
          </div>
        ) : displayNotifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <Icon name="BellOff" size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">No notifications yet</h3>
            <p className="text-gray-500 dark:text-muted-foreground">
              You'll see notifications here when coaches leave feedback or players share sessions with you.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayNotifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  notification.is_read
                    ? 'bg-white dark:bg-card border-green-200 hover:border-green-300'
                    : 'bg-white dark:bg-card border-red-200 hover:border-red-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                    notification.is_read ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    <Icon name={getNotificationIcon(notification.type)} size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium line-clamp-2 md:truncate md:line-clamp-none ${
                      notification.is_read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-foreground'
                    }`}>
                      {renderTitle(notification.title)}
                    </h3>
                    {notification.body && (
                      <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1 line-clamp-2">
                        {notification.body}
                      </p>
                    )}
                    {/* Bottom row: Timestamp left, Status + Arrow + Menu right */}
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs whitespace-nowrap ${
                          notification.is_read ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {notification.is_read ? 'Read' : 'New'}
                        </span>
                        <Icon name="ChevronRight" size={16} className="text-gray-400 dark:text-gray-500" />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <IconMenuButton aria-label="More options">
                              <Icon name="Ellipsis" size={20} className="text-muted-foreground" />
                            </IconMenuButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem
                              onClick={async (e) => {
                                e.stopPropagation();
                                await markAsUnread(notification.id);
                                toast({ title: 'Marked as unread' });
                              }}
                            >
                              <Icon name="MailOpen" size={16} className="mr-2" />
                              Mark as Unread
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={async (e) => {
                                e.stopPropagation();
                                await removeNotification(notification.id);
                                toast({ title: 'Notification deleted' });
                              }}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Icon name="Trash2" size={16} className="mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Hand Review Modal for coach feedback notifications */}
      <HandReviewModal
        open={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        handId={selectedNotification?.hand_id || undefined}
        sessionId={selectedNotification?.session_id || undefined}
        currentUserId={user?.id}
        playerId={playerId || ''}
        coachId={coachId || undefined}
        isCoach={isCoachView}
      />

      {/* Session Summary Modal for session_shared and hand_review_reminder notifications */}
      <SharedSessionModal
        isOpen={!!selectedSessionNotification}
        onClose={() => {
          setSelectedSessionNotification(null);
          setSessionModalDefaultTab('summary');
        }}
        sessionId={selectedSessionNotification?.session_id || ''}
        playerId={selectedSessionNotification ? getPlayerIdForNotification(selectedSessionNotification) : ''}
        defaultTab={sessionModalDefaultTab}
      />
    </div>
  );
}
