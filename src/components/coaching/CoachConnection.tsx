
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCoachStudent } from '@/context/CoachStudentContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/Lucide';

const CoachConnection = () => {
  const { connectedCoach, disconnectFromCoach, loading } = useCoachStudent();
  
  if (!connectedCoach) {
    return null; // Don't show if not connected to a coach
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon name="User" />
          Your Coach
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 bg-poker-feltGreen rounded-full flex items-center justify-center text-white text-xl mb-3">
            {connectedCoach.displayName.substring(0, 1).toUpperCase()}
          </div>
          <div className="text-lg font-medium">{connectedCoach.displayName}</div>
          {connectedCoach.bio && (
            <p className="text-gray-600 text-center mt-2">{connectedCoach.bio}</p>
          )}
          
          <div className="mt-4 w-full">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full text-red-500 border-red-200"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Icon name="Loader" className="mr-2 h-4 w-4 animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    <>
                      <Icon name="UserMinus" className="mr-2 h-4 w-4" />
                      Disconnect
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disconnect from coach</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to disconnect from your coach? You will need a new code to reconnect.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    className="bg-red-500 hover:bg-red-600"
                    onClick={disconnectFromCoach}
                  >
                    Disconnect
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CoachConnection;
