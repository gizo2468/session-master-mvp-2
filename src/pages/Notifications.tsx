import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, loading, markAsRead } = useNotifications();

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    // Mark as read first
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate to the related content if we have a hand_id
    if (notification.hand_id) {
      let sessionId = notification.session_id;
      
      // If no session_id stored, fetch it from the hand
      if (!sessionId) {
        const { data: handData } = await supabase
          .from('session_hands_new')
          .select('session_id')
          .eq('id', notification.hand_id)
          .maybeSingle();
        sessionId = handData?.session_id;
      }
      
      if (sessionId) {
        navigate(`/session/${sessionId}/details`, {
          state: { openHandId: notification.hand_id }
        });
      } else {
        toast({ title: "Could not find hand details", variant: "destructive" });
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'coach_feedback':
        return 'MessageSquare';
      case 'session_shared':
        return 'Share2';
      default:
        return 'Bell';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
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
            <div className="text-gray-400 mb-4">
              <Icon name="BellOff" size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
            <p className="text-gray-500">
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
                    ? 'bg-white border-green-200 hover:border-green-300'
                    : 'bg-white border-red-200 hover:border-red-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                    notification.is_read ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    <Icon name={getNotificationIcon(notification.type)} size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`font-medium truncate ${
                        notification.is_read ? 'text-gray-700' : 'text-gray-900'
                      }`}>
                        {notification.title}
                      </h3>
                      <span className={`text-xs whitespace-nowrap ${
                        notification.is_read ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {notification.is_read ? 'Read' : 'New'}
                      </span>
                    </div>
                    {notification.body && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {notification.body}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-gray-400 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
