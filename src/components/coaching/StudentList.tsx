
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCoachStudent } from '@/context/CoachStudentContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Icon from '@/components/ui/Lucide';

const StudentList = () => {
  const navigate = useNavigate();
  const { students, removeStudent } = useCoachStudent();
  const [showDemoStudent, setShowDemoStudent] = useState(true);

  if (students.length === 0) {
    return (
      <div className="space-y-3">
        {showDemoStudent && (
          <div className="p-3 border rounded-md bg-gray-50 border-dashed relative">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-400 rounded-full flex items-center justify-center text-white">
                  A
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-600">Alex Student</h3>
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                      Demo
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-400">
                    0 sessions • Example connection
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDemoStudent(false)}
                className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                aria-label="Remove demo student"
              >
                <Icon name="x" size={16} />
              </Button>
            </div>
          </div>
        )}
        
        <div className="text-center py-4 text-gray-500">
          <p className="text-sm">You don't have any connected students yet.</p>
          <p className="text-xs mt-1">Share your connection code to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {students.map((student) => (
          <div
            key={student.id}
            className="border rounded-lg p-4 hover:border-poker-gold transition-colors"
          >
            <div className="flex justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-poker-feltGreen rounded-full flex items-center justify-center text-white">
                  {student.displayName.substring(0, 1).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-medium">{student.displayName}</h3>
                  <div className="text-xs text-gray-500">
                    {student.sessionCount || 0} {student.sessionCount === 1 ? 'session' : 'sessions'} • 
                    Last active: {student.lastActivity ? 
                      new Date(student.lastActivity).toLocaleDateString() : 
                      'Never'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => navigate(`/coach/student/${student.id}`)}
                >
                  <Icon name="arrow-right" size={16} />
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Icon name="user-minus" size={16} />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove student</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove {student.displayName} from your students list? 
                        This will revoke their connection to you.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-red-500 hover:bg-red-600"
                        onClick={() => removeStudent(student.id)}
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="mt-3 flex justify-between">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/coach/student/${student.id}?tab=sessions`)}
                className="text-xs"
              >
                View Sessions
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/coach/student/${student.id}?tab=feedback`)}
                className="text-xs"
              >
                View Feedback
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentList;
