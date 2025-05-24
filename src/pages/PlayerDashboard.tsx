
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCoachStudent } from '@/context/CoachStudentContext';
import Icon from '@/components/ui/Lucide';
import { Separator } from '@/components/ui/separator';

const PlayerDashboard = () => {
  const navigate = useNavigate();
  const { connectedCoach } = useCoachStudent();
  const [showDemoFeedback, setShowDemoFeedback] = useState(true);
  
  // Mock demo feedback entry - clickable to demonstrate functionality
  const handleDemoFeedbackClick = () => {
    // Navigate to a demo session or show a mock session view
    alert('This would navigate to a demo hand analysis session showing detailed feedback from your coach. In the full version, you would see the actual poker hand replay with coach comments.');
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <header className="mb-8">
          <button 
            onClick={() => navigate('/')} 
            className="text-poker-feltGreen mb-4 flex items-center gap-1 hover:underline"
          >
            <Icon name="ArrowLeft" size={16} />
            <span>Back</span>
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-poker-black">Player Dashboard</h1>
              <p className="text-gray-500 text-sm mt-1">Track your progress and manage coaching</p>
            </div>
          </div>
        </header>
        
        <div className="grid grid-cols-1 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Users" />
                <span>Your Coaches</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {connectedCoach ? (
                <div className="border rounded-md p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{connectedCoach.displayName}</h3>
                      {connectedCoach.bio && <p className="text-sm text-gray-600">{connectedCoach.bio}</p>}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/connect-coach')}>
                      Manage
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>You are not connected to any coaches yet.</p>
                  <Button 
                    onClick={() => navigate('/connect-coach')} 
                    variant="poker" 
                    className="mt-4"
                  >
                    Connect with a Coach
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="MessageSquare" />
                <span>Recent Feedback</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showDemoFeedback ? (
                <div className="space-y-3">
                  <div className="p-3 border rounded-md bg-gray-50 border-dashed relative cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1" onClick={handleDemoFeedbackClick}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-600">Hand Analysis Feedback</span>
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                            Demo
                          </Badge>
                          <Badge className="text-xs bg-green-100 text-green-700">
                            good decision
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">Your value bet sizing on the river was excellent. You extracted maximum value from villain's bluff-catchers.</p>
                        <div className="text-xs text-gray-400 mt-1">From: Coach Example • Session demo-123 • 2 days ago</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDemoFeedback(false);
                        }}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600 ml-2"
                        aria-label="Remove demo feedback"
                      >
                        <Icon name="x" size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
              <div className={`text-center text-gray-500 ${showDemoFeedback ? 'mt-4' : ''}`}>
                <p className="text-sm">No feedback received yet.</p>
                <p className="text-xs mt-1">
                  Connect with a coach and share your poker sessions to receive feedback.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="CheckSquare" />
                <span>Connection Requests</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-gray-500">
                <p>No pending connection requests.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PlayerDashboard;
