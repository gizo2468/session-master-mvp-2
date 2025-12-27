import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { HandReviewModal } from '@/components/coaching/HandReviewModal';
import { SharedSessionModal } from '@/components/coaching/SharedSessionModal';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, loading, markAsRead, markAsUnread, removeNotification } = useNotifications();
  const [selectedNotification, setSelectedNotification] = useState<typeof notifications[0] | null>(null);
  const [selectedSessionNotification, setSelectedSessionNotification] = useState<typeof notifications[0] | null>(null);

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    // Mark as read first
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // For coach_feedback notifications, open Hand Review modal directly (player viewing)
    if (notification.type === 'coach_feedback' && notification.hand_id) {
      setSelectedNotification(notification);
    }
    
    // For hand_uploaded notifications, open Hand Review modal (coach viewing)
    if (notification.type === 'hand_uploaded' && notification.hand_id) {
      setSelectedNotification(notification);
    }
    
    // For session_shared notifications, open Session Summary modal (coach viewing)
    if (notification.type === 'session_shared' && notification.session_id) {
      setSelectedSessionNotification(notification);
    }
    
    // For connection_request notifications, navigate to Dashboard incoming requests
    if (notification.type === 'connection_request') {
      navigate('/dashboard', { state: { focusSection: 'incoming-requests' } });
    }
    
    // For connection_approved notifications, navigate to Dashboard
    if (notification.type === 'connection_approved') {
      navigate('/dashboard');
    }
    
    // For stack_check notifications, navigate to Live Session and auto-open BB/Stack modal
    if (notification.type === 'stack_check' && notification.session_id) {
      navigate(`/session/${notification.session_id}`, { 
        state: { openBBStackModal: true } 
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'coach_feedback':
        return 'MessageSquare';
      case 'hand_uploaded':
        return 'Plus';
      case 'session_shared':
        return 'Share2';
      case 'connection_request':
        return 'UserPlus';
      case 'connection_approved':
        return 'UserCheck';
      case 'stack_check':
        return 'Clock';
      default:
        return 'Bell';
    }
  };
  
  // Determine if current user is viewing as coach (they received hand_uploaded notification)
  const isCoachView = selectedNotification?.type === 'hand_uploaded';
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
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="container mx-auto max-w-md px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="sm"
              className="text-poker-feltGreen border-poker-feltGreen hover:bg-poker-feltGreen hover:text-white"
            >
              <Icon name="ArrowLeft" size={16} />
            </Button>
            <h1 className="text-xl font-bold">Notifications</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-md px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-poker-feltGreen"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Icon name="BellOff" size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No notifications yet</h3>
            <p className="text-muted-foreground">
              You'll see notifications here when coaches leave feedback or players share sessions with you.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  notification.is_read
                    ? 'bg-card border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700'
                    : 'bg-card border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                    notification.is_read ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  }`}>
                    <Icon name={getNotificationIcon(notification.type)} size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium line-clamp-2 md:truncate md:line-clamp-none ${
                      notification.is_read ? 'text-muted-foreground' : 'text-foreground'
                    }`}>
                      {renderTitle(notification.title)}
                    </h3>
                    {notification.body && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.body}
                      </p>
                    )}
                    {/* Bottom row: Timestamp left, Status + Arrow + Menu right */}
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs whitespace-nowrap ${
                          notification.is_read ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {notification.is_read ? 'Read' : 'New'}
                        </span>
                        <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 rounded hover:bg-muted transition-colors"
                              aria-label="More options"
                            >
                              <Icon name="Ellipsis" size={16} className="text-muted-foreground" />
                            </button>
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

      {/* Session Summary Modal for session_shared notifications */}
      <SharedSessionModal
        isOpen={!!selectedSessionNotification}
        onClose={() => setSelectedSessionNotification(null)}
        sessionId={selectedSessionNotification?.session_id || ''}
        playerId={selectedSessionNotification?.sender_user_id || ''}
      />
    </div>
  );
}
