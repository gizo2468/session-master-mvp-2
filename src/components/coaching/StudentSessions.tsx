
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/Lucide';

// In a real app, this would come from a database query
// For this demo, we'll create mock sessions
const createMockSessions = (studentId: string) => {
  const sessions = [];
  
  for (let i = 0; i < 5; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i * 3);
    
    sessions.push({
      id: `session-${studentId}-${i}`,
      studentId,
      gameType: i % 2 === 0 ? 'NLH' : 'PLO',
      format: i % 3 === 0 ? 'Cash' : 'Tournament',
      location: i % 2 === 0 ? 'Online Poker Site' : 'Local Card Room',
      result: i % 2 === 0 ? 120.50 : -85.75,
      date: date,
      hands: Math.floor(Math.random() * 200) + 20,
      hasUnreadComments: i === 0 || i === 2
    });
  }
  
  return sessions;
};

export const StudentSessions = ({ studentId }: { studentId: string }) => {
  const navigate = useNavigate();
  
  // Create mock sessions for the demo
  const sessions = createMockSessions(studentId);
  
  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-gray-500">
            <p>This student hasn't recorded any sessions yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {sessions.map(session => (
        <Card key={session.id} className={session.hasUnreadComments ? "border-poker-gold" : ""}>
          <CardContent className="p-4">
            <div className="flex flex-col h-full">
              {/* Session info section */}
              <div className="mb-3">
                <div className="font-medium flex items-center gap-2">
                  {session.gameType} {session.format}
                  {session.hasUnreadComments && (
                    <Badge className="bg-poker-gold text-white text-xs px-2 py-0.5 rounded-full">
                      New feedback
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {session.location} • {session.hands} hands • 
                  {new Date(session.date).toLocaleDateString()}
                </div>
              </div>
              
              {/* Result and button section - positioned at the bottom */}
              <div className="flex justify-between items-center mt-auto pt-2">
                <div className={`text-lg font-bold ${session.result >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {session.result >= 0 ? '+' : ''}${Math.abs(session.result).toFixed(2)}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/coach/student/${studentId}/session/${session.id}`)}
                  className="flex items-center gap-1 min-w-[90px] justify-center"
                >
                  <Icon name="MessageSquare" size={14} />
                  <span>Review</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
