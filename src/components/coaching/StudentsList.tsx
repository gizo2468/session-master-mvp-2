
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
  const { students, removeStudent } = useCoachStudent();

  if (students.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon name="users" />
            My Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-6 text-center text-gray-500">
            <p>You don't have any connected students yet.</p>
            <p className="text-sm mt-2">Share your connection code to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon name="users" />
          My Students ({students.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {students.map((student) => (
            <li key={student.id} className="p-3 border rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{student.displayName}</div>
                  <div className="text-xs text-gray-500">Connected since {new Date(student.createdAt).toLocaleDateString()}</div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                      <Icon name="user-minus" size={18} />
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
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default StudentsList;
