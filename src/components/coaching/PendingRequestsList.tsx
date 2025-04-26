
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCoachStudent } from '@/context/CoachStudentContext';
import Icon from '@/components/ui/Lucide';

const PendingRequestsList = () => {
  const { pendingRequests, approveConnectionRequest, declineConnectionRequest } = useCoachStudent();

  if (pendingRequests.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon name="user-plus" />
          Pending Connection Requests
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {pendingRequests.map((request) => {
            // In a real app, you'd fetch student display name from the database
            // Here we use a placeholder since we don't have real data
            const studentName = `Student ${request.studentId.slice(0, 4)}`;
            
            return (
              <li key={request.id} className="p-3 border rounded-md">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{studentName}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={() => approveConnectionRequest(request.id)}
                    variant="poker"
                    size="sm"
                    className="flex-1"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => declineConnectionRequest(request.id)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
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
