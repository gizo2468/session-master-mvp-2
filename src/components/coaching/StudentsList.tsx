
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCoachStudent } from '@/context/CoachStudentContext';
import Icon from '@/components/ui/Lucide';
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

const StudentsList = () => {
  const { students, removeStudent, loading } = useCoachStudent();

  console.log('StudentsList render - students:', students);

  if (students.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon name="Users" />
            My Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            <div className="mb-4">
              <Icon name="Users" size={48} className="mx-auto text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">You don't have any connected students yet.</p>
            <p className="text-xs">Share your connection code to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon name="Users" />
          My Students ({students.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {students.map((student) => {
            console.log('Rendering student:', student);
            
            // Ensure we have a proper display name
            const displayName = student.displayName && student.displayName !== 'Unknown Student' 
              ? student.displayName 
              : `Student ${student.id.slice(0, 8)}`;
            
            return (
              <li key={student.id} className="p-3 border rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{displayName}</div>
                    <div className="text-xs text-gray-500">
                      Connected since {new Date(student.createdAt).toLocaleDateString()}
                    </div>
                    {student.displayName === 'Unknown Student' && (
                      <div className="text-xs text-amber-600 mt-1">
                        Student name not available
                      </div>
                    )}
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-700"
                        disabled={loading}
                      >
                        {loading ? (
                          <Icon name="Loader" size={18} className="animate-spin" />
                        ) : (
                          <Icon name="UserMinus" size={18} />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove student</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove {displayName} from your students list? 
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
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
};

export default StudentsList;
