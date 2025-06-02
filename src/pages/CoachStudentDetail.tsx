
import React, { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCoachStudent } from '@/context/CoachStudentContext';
import { useAuth } from '@/context/AuthContext';
import Icon from '@/components/ui/Lucide';
import { StudentSessions } from '@/components/coaching/StudentSessions';
import { StudentSessionStats } from '@/components/coaching/StudentSessionStats';
import { StudentReviews } from '@/components/coaching/StudentReviews';

const CoachStudentDetail = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { studentId } = useParams<{ studentId: string }>();
  const { students, isCoach, loading } = useCoachStudent();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  // Find the student
  const student = students.find(s => s.id === studentId);
  
  console.log('🔍 CoachStudentDetail: Looking for student:', studentId);
  console.log('🔍 Available students:', students);
  console.log('🔍 Found student:', student);
  console.log('🔍 Is coach:', isCoach);
  console.log('🔍 Current user:', user?.id);

  useEffect(() => {
    // Redirect if not authorized or student not found
    if (!loading && (!isCoach || !student)) {
      console.log('❌ Redirecting: Not authorized or student not found');
      navigate('/coach-dashboard');
    }
  }, [isCoach, student, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader" className="mx-auto mb-4 h-8 w-8 animate-spin text-poker-feltGreen" />
          <p className="text-gray-600">Loading student details...</p>
        </div>
      </div>
    );
  }

  if (!isCoach || !student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Icon name="AlertCircle" className="mx-auto mb-4 h-8 w-8 text-red-500" />
            <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              {!isCoach ? "You don't have coach permissions." : "Student not found in your connections."}
            </p>
            <Button onClick={() => navigate('/coach-dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Determine which tab to display based on query parameter
  const defaultTab = tabParam === 'reviews' ? 'reviews' : 'sessions';
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-4xl px-4 py-8">
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
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-poker-black">{student.displayName}</h1>
              <p className="text-gray-500 text-sm">
                Connected since {new Date(student.createdAt).toLocaleDateString()}
              </p>
              {student.email && (
                <p className="text-gray-400 text-xs">{student.email}</p>
              )}
              {/* Debug info for development */}
              <div className="text-xs text-blue-600 mt-1 p-1 bg-blue-50 rounded">
                Student ID: {student.id} | Coach ID: {user?.id}
              </div>
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
            <StudentSessions studentId={student.id} />
          </TabsContent>
          
          <TabsContent value="reviews">
            <StudentReviews studentId={student.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CoachStudentDetail;
