import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { useNotifications } from '@/hooks/useNotifications';

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  return (
    <Button
      onClick={() => navigate('/notifications')}
      variant="outline"
      size="sm"
      className="relative text-poker-feltGreen border-poker-feltGreen hover:bg-poker-feltGreen hover:text-white"
    >
      <Icon name="Bell" size={16} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Button>
  );
};

export default NotificationBell;
