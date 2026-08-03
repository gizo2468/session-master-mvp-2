
import React from 'react';
import { useCoachStudent } from '@/context/CoachStudentContext';
import { useToast } from '@/hooks/use-toast';

const ConnectionNotification: React.FC = () => {
  const { pendingRequests } = useCoachStudent();
  const { toast } = useToast();
  
  // Check for pending requests on component mount
  React.useEffect(() => {
    if (pendingRequests.length > 0) {
    }
  }, []);

  // No visible UI - this is just for notifications
  return null;
};

export default ConnectionNotification;
