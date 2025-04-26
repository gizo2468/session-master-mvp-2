
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { useCoachStudent } from '@/context/CoachStudentContext';
import { Separator } from '@/components/ui/separator';

const CoachingNav = () => {
  const { isCoach, isStudent, pendingRequests } = useCoachStudent();
  
  return (
    <div className="mt-8">
      <Separator className="my-4" />
      <div className="flex justify-center gap-4">
        {isCoach ? (
          <Link to="/coach-dashboard">
            <Button 
              variant="poker" 
              size="sm" 
              className="flex items-center gap-2"
            >
              <Icon name="User" size={16} />
              Coach Dashboard
              {pendingRequests.length > 0 && (
                <span className="bg-white text-poker-feltGreen text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </Button>
          </Link>
        ) : (
          <Link to="/coach-profile">
            <Button 
              variant={isCoach ? "poker" : "outline"} 
              size="sm" 
              className="flex items-center gap-2"
            >
              <Icon name="User" size={16} />
              Coach
              {isCoach && pendingRequests.length > 0 && (
                <span className="bg-white text-poker-feltGreen text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </Button>
          </Link>
        )}
        
        <Link to="/connect-coach">
          <Button 
            variant={isStudent ? "poker" : "outline"} 
            size="sm"
            className="flex items-center gap-2"
          >
            <Icon name="Link" size={16} />
            Student
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default CoachingNav;
