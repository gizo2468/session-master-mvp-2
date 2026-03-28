
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

  // Component renders list of connected students

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
          <div className="text-center py-6 text-gray-500 dark:text-muted-foreground">
            <div className="mb-4">
              <Icon name="Users" size={48} className="mx-auto text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-1">You don't have any connected students yet.</p>
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
            // Render individual student card
            
            // Student names should now be properly resolved from the context
            const displayName = student.displayName;
            const showUnknownWarning = student.displayName === 'Unknown Student' || student.displayName.startsWith('Student ');
            
            return (
              <li key={student.id} className="p-3 border rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{displayName}</div>
                    <div className="text-xs text-gray-500 dark:text-muted-foreground">
                      Connected since {new Date(student.createdAt).toLocaleDateString()}
                    </div>
                    {showUnknownWarning && (
                      <div className="text-xs text-amber-600 mt-1">
                        ⚠️ Student name not available - this might indicate a data sync issue
                      </div>
                    )}
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Student ID: {student.id.slice(0, 8)}
                    </div>
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
                        <AlertDialogTitle>Remove player</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove {displayName} from your players list? 
                          This will revoke their connection to you.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-red-500 hover:bg-red-600"
                          onClick={() => {
                            // Remove student connection
                            removeStudent(student.id);
                          }}
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
