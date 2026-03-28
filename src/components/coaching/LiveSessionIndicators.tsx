
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCoachStudent } from '@/context/CoachStudentContext';
import Icon from '@/components/ui/Lucide';

const LiveSessionIndicators = () => {
  const navigate = useNavigate();
  const { students } = useCoachStudent();
  
  // In a real app, we would track live sessions with a real-time database
  // For this demo, we'll simulate with random students being "live"
  const liveStudents = students.filter((_, index) => index % 3 === 0); // Every third student is "live"
  
  if (liveStudents.length === 0) {
    return null; // Don't show the component if no students are live
  }
  
  return (
    <Card className="border-poker-gold">
      <CardHeader className="bg-poker-gold/10">
        <CardTitle className="flex items-center gap-2 text-poker-gold">
          <div className="relative">
            <Icon name="Bell" />
            <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-2 h-2"></span>
          </div>
          <span>Live Sessions</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {liveStudents.map(student => (
            <div key={student.id} className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium">{student.displayName}</span>
                <span className="text-xs text-gray-500 dark:text-muted-foreground">Started 12 minutes ago</span>
              </div>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => navigate(`/coach/student/${student.id}/live`)}
                className="text-xs"
              >
                Join Session
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveSessionIndicators;
