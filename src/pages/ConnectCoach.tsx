
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCoachStudent } from '@/context/CoachStudentContext';
import Icon from '@/components/ui/Lucide';
import ConnectWithCoach from '@/components/coaching/ConnectWithCoach';
import CoachConnection from '@/components/coaching/CoachConnection';
import CreateStudentProfileForm from '@/components/coaching/CreateStudentProfileForm';

const ConnectCoach = () => {
  const navigate = useNavigate();
  const { isStudent, studentProfile } = useCoachStudent();
  
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
          <h1 className="text-2xl font-serif font-bold text-poker-black">Connect with a Coach</h1>
          <p className="text-gray-500 text-sm mt-1">Get personalized poker coaching</p>
        </header>
        
        {!isStudent && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Student Profile</CardTitle>
              <CardDescription>Create your student profile to connect with a coach</CardDescription>
            </CardHeader>
            <CardContent>
              <CreateStudentProfileForm />
            </CardContent>
          </Card>
        )}
        
        {isStudent && studentProfile && (
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-xl">{studentProfile.displayName}</CardTitle>
                <CardDescription>Student Profile</CardDescription>
              </CardHeader>
            </Card>
            
            <CoachConnection />
            <ConnectWithCoach />
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectCoach;
