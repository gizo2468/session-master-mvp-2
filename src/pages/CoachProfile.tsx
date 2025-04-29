
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCoachStudent } from '@/context/CoachStudentContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
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
  const { t } = useLanguage();
  
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
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-md px-4 py-8">
        <header className="mb-8">
          <button 
            onClick={() => navigate('/')} 
            className="text-poker-feltGreen mb-4 flex items-center gap-1 hover:underline"
          >
            <Icon name="ArrowLeft" size={16} />
            <span>{t('back')}</span>
          </button>
          <h1 className="text-2xl font-serif font-bold text-poker-black">{t('coach_profile')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('manage_your_students')}</p>
        </header>
        
        {!isCoach && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t('become_coach')}</CardTitle>
              <CardDescription>{t('create_account')}</CardDescription>
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
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">{coachProfile.displayName}</CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          onClick={handlePlanBadgeClick}
                          className={`
                            cursor-pointer transition-all hover:ring-2 hover:ring-opacity-50
                            ${coachTier === 'free' ? 'bg-gray-500 hover:bg-gray-600 hover:ring-gray-400' : 
                            coachTier === 'starter' ? 'bg-blue-500 hover:bg-blue-600 hover:ring-blue-400' :
                            coachTier === 'pro' ? 'bg-poker-gold hover:bg-poker-darkGold hover:ring-poker-gold' :
                            'bg-purple-600 hover:bg-purple-700 hover:ring-purple-500'}
                          `}
                        >
                          {tierDetails.name}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('upgrade_plan')}</p>
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
                      <span>{t('student_capacity')}</span>
                      <span className={atStudentLimit ? "text-red-600 font-medium" : ""}>
                        {studentCount} / {maxStudents} {t('students').toLowerCase()}
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
                        onClick={() => navigate('/coach-upgrade')}
                        variant="default"
                        className="w-full bg-poker-gold hover:bg-poker-darkGold"
                      >
                        <Icon name="package-plus" size={16} className="mr-2" />
                        {t('upgrade_plan')}
                      </Button>
                    )}
                  </div>
                  
                  {coachProfile.students.length > 0 && (
                    <Button 
                      onClick={() => navigate('/coach-dashboard')}
                      variant="outline"
                      className="w-full mt-2"
                    >
                      {t('coach_dashboard')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Connection Code Component wrapped with overlay if at student limit */}
            <div className="relative">
              <ConnectionCodeDisplay />
              {atStudentLimit && (
                <FeatureLockOverlay featureName={t('student_slots')} />
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
