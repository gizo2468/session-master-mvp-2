
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCoachStudent } from '@/context/CoachStudentContext';
import { useAuth } from '@/context/AuthContext';
import Icon from '@/components/ui/Lucide';
import GenerateCodeButton from '@/components/coaching/GenerateCodeButton';
import ConnectionCodeDisplay from '@/components/coaching/ConnectionCodeDisplay';
import PendingRequestsList from '@/components/coaching/PendingRequestsList';
import StudentsList from '@/components/coaching/StudentsList';
import CreateCoachProfileForm from '@/components/coaching/CreateCoachProfileForm';
import { coachTiers, hasFeatureAccess, isAtStudentLimit, getMaxStudents } from '@/utils/coachTiers';
import FeatureLockOverlay from '@/components/coaching/FeatureLockOverlay';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const CoachProfile = () => {
  const navigate = useNavigate();
  const { isCoach, coachProfile, students } = useCoachStudent();
  const { user } = useAuth();
  
  // Get coach tier information
  const coachTier = user?.coachTier || 'free';
  const tierDetails = coachTiers[coachTier];
  const studentCount = students.length;
  const maxStudents = getMaxStudents(coachTier);
  const studentPercentage = maxStudents > 0 ? (studentCount / maxStudents) * 100 : 0;
  const atStudentLimit = isAtStudentLimit(coachTier, studentCount);
  
  // Handle plan badge click
  const handlePlanBadgeClick = () => {
    navigate('/coach-upgrade');
  };
  
  // Helper function to get the appropriate plan badge variant
  const getPlanBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'free': return 'planFree';
      case 'starter': return 'planStarter';
      case 'pro': return 'planPro';
      case 'elite': return 'planElite';
      default: return 'planFree';
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-md px-4 py-8">
        <header className="mb-8">
          <button 
            onClick={() => navigate('/')} 
            className="text-poker-feltGreen mb-4 flex items-center gap-1 hover:underline"
          >
            <Icon name="ArrowLeft" size={16} />
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-bold text-poker-black">Coach Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your players and connection codes</p>
        </header>
        
        {!isCoach && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Become a Coach</CardTitle>
              <CardDescription>Create your coach profile to connect with players</CardDescription>
            </CardHeader>
            <CardContent>
              <CreateCoachProfileForm />
            </CardContent>
          </Card>
        )}
        
        {isCoach && coachProfile && (
          <div>
            {/* Coach tier info card */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{coachProfile.displayName}</CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          onClick={handlePlanBadgeClick}
                          variant={getPlanBadgeVariant(coachTier)}
                        >
                          {tierDetails.name}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to change plan</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {coachProfile.bio && (
                  <CardDescription>{coachProfile.bio}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Student Capacity</span>
                      <span className={atStudentLimit ? "text-red-600 font-medium" : ""}>
                        {studentCount} / {maxStudents} students
                      </span>
                    </div>
                    <Progress 
                      value={studentPercentage} 
                      className={`h-2 ${
                        studentPercentage > 90 ? 'bg-red-100' : 
                        studentPercentage > 70 ? 'bg-amber-100' : 'bg-gray-100'
                      }`} 
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <GenerateCodeButton />
                    {coachTier === 'free' && (
                      <Button 
                        onClick={handlePlanBadgeClick}
                        variant="default"
                        className="w-full bg-poker-gold hover:bg-poker-darkGold"
                      >
                        <Icon name="package-plus" size={16} className="mr-2" />
                        Upgrade Plan
                      </Button>
                    )}
                  </div>
                  
                  {coachProfile.students.length > 0 && (
                    <Button 
                      onClick={() => navigate('/coach-dashboard')}
                      variant="outline"
                      className="w-full mt-2"
                    >
                      Go to Coach Dashboard
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Connection Code Component wrapped with overlay if at student limit */}
            <div className="relative">
              <ConnectionCodeDisplay />
              {atStudentLimit && (
                <FeatureLockOverlay featureName="Additional Students" />
              )}
            </div>
            
            {/* Pending Requests Component */}
            <PendingRequestsList />
            
            {/* Students List Component */}
            <StudentsList />
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachProfile;
