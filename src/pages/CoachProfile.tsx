
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCoachStudent } from '@/context/CoachStudentContext';
import Icon from '@/components/ui/Lucide';
import GenerateCodeButton from '@/components/coaching/GenerateCodeButton';
import ConnectionCodeDisplay from '@/components/coaching/ConnectionCodeDisplay';
import PendingRequestsList from '@/components/coaching/PendingRequestsList';
import StudentsList from '@/components/coaching/StudentsList';
import CreateCoachProfileForm from '@/components/coaching/CreateCoachProfileForm';

const CoachProfile = () => {
  const navigate = useNavigate();
  const { isCoach, coachProfile } = useCoachStudent();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-md px-4 py-8">
        <header className="mb-8">
          <button 
            onClick={() => navigate('/')} 
            className="text-poker-feltGreen mb-4 flex items-center gap-1 hover:underline"
          >
            <Icon name="arrow-left" size={16} />
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-serif font-bold text-poker-black">Coach Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your students and connection codes</p>
        </header>
        
        {!isCoach && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Become a Coach</CardTitle>
              <CardDescription>Create your coach profile to connect with students</CardDescription>
            </CardHeader>
            <CardContent>
              <CreateCoachProfileForm />
            </CardContent>
          </Card>
        )}
        
        {isCoach && coachProfile && (
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-xl">{coachProfile.displayName}</CardTitle>
                {coachProfile.bio && (
                  <CardDescription>{coachProfile.bio}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <GenerateCodeButton />
              </CardContent>
            </Card>
            
            <ConnectionCodeDisplay />
            <PendingRequestsList />
            <StudentsList />
            
            <div className="mt-10 flex justify-center">
              <Button 
                onClick={() => navigate('/connect-coach')}
                variant="outline"
              >
                Switch to Student View
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachProfile;
