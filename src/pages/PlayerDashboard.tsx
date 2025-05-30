
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCoachStudent } from '@/context/CoachStudentContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Icon from '@/components/ui/Lucide';
import PlayerFeedbackForm from '@/components/coaching/PlayerFeedbackForm';

interface PlayerFeedback {
  id: string;
  coach_id: string;
  feedback_type: string;
  message: string;
  created_at: string;
  read: boolean;
}

const PlayerDashboard = () => {
  const navigate = useNavigate();
  const { connectedCoach } = useCoachStudent();
  const { user } = useAuth();
  const [recentFeedback, setRecentFeedback] = useState<PlayerFeedback[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // Load player's recent feedback
  useEffect(() => {
    if (user?.id) {
      loadRecentFeedback();
    }
  }, [user?.id]);

  const loadRecentFeedback = async () => {
    if (!user?.id) return;
    
    setLoadingFeedback(true);
    try {
      const { data: feedback, error } = await supabase
        .from('player_to_coach_feedback')
        .select('*')
        .eq('player_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error loading feedback:', error);
        return;
      }

      setRecentFeedback(feedback || []);
    } catch (error) {
      console.error('Error in loadRecentFeedback:', error);
    } finally {
      setLoadingFeedback(false);
    }
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
                    <div className="flex gap-2">
                      <PlayerFeedbackForm 
                        coachId={connectedCoach.id} 
                        coachName={connectedCoach.displayName} 
                      />
                      <Button variant="outline" size="sm" onClick={() => navigate('/connect-coach')}>
                        Manage
                      </Button>
                    </div>
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
                <span>Your Recent Feedback</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingFeedback ? (
                <div className="text-center py-6 text-gray-500">
                  <p>Loading feedback...</p>
                </div>
              ) : recentFeedback.length > 0 ? (
                <div className="space-y-3">
                  {recentFeedback.map(feedback => (
                    <div key={feedback.id} className="border rounded-md p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-sm font-medium">{feedback.feedback_type}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            {new Date(feedback.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {!feedback.read && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Sent
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{feedback.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-sm">No feedback sent yet.</p>
                  <p className="text-xs mt-1">
                    Connect with a coach and send them feedback about your sessions.
                  </p>
                </div>
              )}
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
