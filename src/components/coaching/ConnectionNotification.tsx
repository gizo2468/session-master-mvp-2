
import React from 'react';
import { useCoachStudent } from '@/context/CoachStudentContext';
import { useToast } from '@/hooks/use-toast';

const ConnectionNotification: React.FC = () => {
  const { pendingRequests } = useCoachStudent();
  const { toast } = useToast();
  
  // Check for pending requests on component mount
  React.useEffect(() => {
    if (pendingRequests.length > 0) {
      toast({
        title: `${pendingRequests.length} Pending Request${pendingRequests.length > 1 ? 's' : ''}`,
        description: "You have players waiting to connect with you",
        duration: 2000, // Using the standard 2 second duration
      });
    }
  }, []);

  // No visible UI - this is just for notifications
  return null;
};

export default ConnectionNotification;
