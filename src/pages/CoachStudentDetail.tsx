import React, { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCoachStudent } from '@/context/CoachStudentContext';
import Icon from '@/components/ui/Lucide';
import { StudentSessions } from '@/components/coaching/StudentSessions';
import { StudentSessionStats } from '@/components/coaching/StudentSessionStats';
import { StudentReviews } from '@/components/coaching/StudentReviews';
import { EnhancedStudentSessions } from '@/components/coaching/EnhancedStudentSessions';
import { EnhancedStudentReviews } from '@/components/coaching/EnhancedStudentReviews';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const CoachStudentDetail = () => {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const { students, isCoach } = useCoachStudent();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  // Find the student
  const student = students.find(s => s.id === studentId);
  
  if (!isCoach || !student) {
    navigate('/coach-dashboard');
    return null;
  }
  
  // Determine which tab to display based on query parameter
  const defaultTab = tabParam === 'reviews' ? 'reviews' : 'sessions';
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-4xl px-4 pb-8 content-safe">
        <header className="mb-8">
          <button 
            onClick={() => navigate('/coach-dashboard')} 
            className="text-poker-feltGreen mb-4 flex items-center gap-1 hover:underline"
          >
            <Icon name="arrow-left" size={16} />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 bg-poker-feltGreen rounded-full flex items-center justify-center text-white text-xl">
              {student.displayName.substring(0, 1).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-poker-black">{student.displayName}</h1>
              <p className="text-gray-500 text-sm">
                Connected since {new Date(student.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </header>
        
        <Tabs defaultValue={defaultTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="sessions" className="flex items-center gap-1">
              <Icon name="clock" size={16} />
              <span>Sessions</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-1">
              <Icon name="message-square" size={16} />
              <span>Reviews</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="sessions">
            <StudentSessionStats studentId={student.id} />
            <EnhancedStudentSessions studentId={student.id} />
          </TabsContent>
          
          <TabsContent value="reviews">
            <EnhancedStudentReviews studentId={student.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CoachStudentDetail;
