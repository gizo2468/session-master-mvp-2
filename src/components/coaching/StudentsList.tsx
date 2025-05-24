
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const [showDemoStudent, setShowDemoStudent] = useState(true);

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
          {showDemoStudent ? (
            <div className="space-y-3">
              <div className="p-3 border rounded-md bg-gray-50 border-dashed relative">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-600">Alex Student</span>
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                        Demo
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-400">Example student connection</div>
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
            </div>
          ) : null}
          <div className={`text-center text-gray-500 ${showDemoStudent ? 'mt-4' : ''}`}>
            <p className="text-sm">You don't have any connected students yet.</p>
            <p className="text-xs mt-1">Share your connection code to get started.</p>
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
                      <Icon name="UserMinus" size={18} />
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
