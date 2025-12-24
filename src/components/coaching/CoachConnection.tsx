
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCoachStudent } from '@/context/CoachStudentContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/Lucide';

const CoachConnection = () => {
  const { connectedCoaches, disconnectFromCoach, loading } = useCoachStudent();
  
  if (!connectedCoaches || connectedCoaches.length === 0) {
    return null; // Don't show if not connected to any coaches
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon name="Users" />
          Your Coaches ({connectedCoaches.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {connectedCoaches.map((coach) => (
            <div key={coach.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-poker-feltGreen rounded-full flex items-center justify-center text-white text-lg">
                  {coach.displayName.substring(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="text-lg font-medium">{coach.displayName}</div>
                  {coach.bio && (
                    <p className="text-gray-600 text-sm">{coach.bio}</p>
                  )}
                </div>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-red-500 border-red-200"
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
                      Are you sure you want to disconnect from {coach.displayName}? You will need a new code to reconnect.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-red-500 hover:bg-red-600"
                      onClick={() => disconnectFromCoach(coach.id)}
                    >
                      Disconnect
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CoachConnection;
