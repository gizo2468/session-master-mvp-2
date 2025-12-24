
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { useCoachStudent } from '@/context/CoachStudentContext';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';

const CoachingNav = () => {
  const { user, isLoading: authLoading } = useAuth();
  
  // Handle cases where context might not be available
  let pendingRequests = [];
  try {
    const coachStudentContext = useCoachStudent();
    pendingRequests = coachStudentContext?.pendingRequests || [];
  } catch (error) {
    // CoachStudent context not available, using defaults
  }
  
  // Don't render anything if auth is still loading or user is not available
  if (authLoading || !user) {
    return null;
  }
  
  // Render navigation based on user role
  
  return (
    <div className="mt-8">
      <Separator className="my-4" />
      <div className="flex flex-col items-center gap-3">
        {user.role === 'coach' ? (
          <Link to="/coach-dashboard">
            <Button 
              variant="poker" 
              size="sm" 
              className="flex items-center gap-2"
            >
              <Icon name="BarChart2" size={16} />
              Coach Dashboard
              {pendingRequests.length > 0 && (
                <span className="bg-white text-poker-feltGreen text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </Button>
          </Link>
        ) : (
          <Link to="/player-dashboard">
            <Button 
              variant="poker" 
              size="sm" 
              className="flex items-center gap-2"
            >
              <Icon name="User" size={16} />
              Player Dashboard
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default CoachingNav;
