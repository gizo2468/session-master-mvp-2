
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCoachStudent } from '@/context/CoachStudentContext';
import Icon from '@/components/ui/Lucide';

const PendingRequestsList = () => {
  const { pendingRequests, approveConnectionRequest, declineConnectionRequest, loading } = useCoachStudent();

  // Component renders pending connection requests

  if (pendingRequests.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon name="UserPlus" />
          Pending Connection Requests ({pendingRequests.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {pendingRequests.map((request) => {
            // Render each pending request
            
            // Better handling of student name display - should now be resolved properly
            const studentDisplayText = request.studentName && request.studentName !== 'Unknown Student' 
              ? `${request.studentName} requested to connect`
              : 'New connection request from a student';
            
            const showUnknownWarning = !request.studentName || request.studentName === 'Unknown Student' || request.studentName.startsWith('Student ');
            
            return (
              <li key={request.id} className="p-3 border rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">
                      {studentDisplayText}
                    </span>
                    <div className="text-xs text-gray-500 dark:text-muted-foreground">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                    {showUnknownWarning && (
                      <div className="text-xs text-amber-600 mt-1">
                        ⚠️ Student name not available - this might indicate a data sync issue
                      </div>
                    )}
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Request ID: {request.id.slice(0, 8)} • Student ID: {request.studentId.slice(0, 8)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={() => {
                      // Approve connection request
                      approveConnectionRequest(request.id);
                    }}
                    variant="poker"
                    size="sm"
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? (
                      <Icon name="Loader" className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Icon name="Check" className="mr-2 h-4 w-4" />
                    )}
                    Approve
                  </Button>
                  <Button
                    onClick={() => {
                      // Decline connection request
                      declineConnectionRequest(request.id);
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? (
                      <Icon name="Loader" className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Icon name="X" className="mr-2 h-4 w-4" />
                    )}
                    Decline
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
};

export default PendingRequestsList;
