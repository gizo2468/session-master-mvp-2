import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCoachStudent } from '@/context/CoachStudentContext';
import { useAuth } from '@/context/AuthContext';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { supabase } from '@/integrations/supabase/client';
import Icon from '@/components/ui/Lucide';
import PlayerReviewForm from '@/components/coaching/PlayerReviewForm';
import PlayerGoalsTasks from '@/components/coaching/PlayerGoalsTasks';

interface PlayerReview {
  id: string;
  coach_id: string;
  review_type: string;
  message: string;
  created_at: string;
  read: boolean;
}

const PlayerDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { connectedCoaches } = useCoachStudent();
  const { user } = useAuth();
  const [recentReviews, setRecentReviews] = useState<PlayerReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const connectRef = useRef<HTMLDivElement>(null);
  const swipeBackRef = useSwipeBack({ fallbackPath: '/', screenName: 'PlayerDashboard' });

  // Auto-scroll to connect section if openConnect param is present
  useEffect(() => {
    if (searchParams.get('openConnect') === 'true' && connectRef.current) {
      connectRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [searchParams]);

  // Load player's recent reviews
  useEffect(() => {
    if (user?.id) {
      loadRecentReviews();
    }
  }, [user?.id]);

  const loadRecentReviews = async () => {
    if (!user?.id) return;
    
    setLoadingReviews(true);
    try {
      // Player reviews system not implemented yet
      setRecentReviews([]);
    } catch (error) {
      console.error('Error in loadRecentReviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };
  
  return (
    <div ref={swipeBackRef} className="min-h-screen bg-gray-50 dark:bg-background content-safe">
      <div className="container mx-auto max-w-4xl px-4 pb-8">
        <header className="mb-8">
          <button 
            onClick={() => navigate('/', { replace: true })} 
            className="text-poker-feltGreen mb-4 flex items-center gap-1 hover:underline"
          >
            <Icon name="ArrowLeft" size={16} />
            <span>Back</span>
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-poker-black">Player Dashboard</h1>
              <p className="text-gray-500 dark:text-muted-foreground text-sm mt-1">Track your progress and manage coaching</p>
            </div>
          </div>
        </header>
        
        <div className="grid grid-cols-1 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Users" />
                <span>Your Coaches ({connectedCoaches.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {connectedCoaches.length > 0 ? (
                <div className="space-y-4">
                  {connectedCoaches.map(coach => (
                    <div key={coach.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg">{coach.displayName}</h3>
                          {coach.bio && <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">{coach.bio}</p>}
                        </div>
                        <div className="flex gap-2">
                          <PlayerReviewForm 
                            coachId={coach.id} 
                            coachName={coach.displayName} 
                          />
                          <Button variant="outline" size="sm" onClick={() => navigate('/connect-coach')}>
                            Manage
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div ref={connectRef} className="text-center py-6 text-gray-500 dark:text-muted-foreground">
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
                <span>Your Recent Reviews</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingReviews ? (
                <div className="text-center py-6 text-gray-500 dark:text-muted-foreground">
                  <p>Loading reviews...</p>
                </div>
              ) : recentReviews.length > 0 ? (
                <div className="space-y-3">
                  {recentReviews.map(review => (
                    <div key={review.id} className="border rounded-md p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-sm font-medium">{review.review_type}</span>
                          <span className="text-xs text-gray-500 dark:text-muted-foreground ml-2">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {!review.read && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Sent
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{review.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 dark:text-muted-foreground">
                  <p className="text-sm">No reviews sent yet.</p>
                  <p className="text-xs mt-1">
                    Connect with a coach and send them reviews about your sessions.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Clock" />
                <span>Session Sync Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-gray-500 dark:text-muted-foreground">
                <Icon name="Info" className="mx-auto mb-2 h-8 w-8" />
                <p className="text-sm">Your sessions are automatically synced when you complete them.</p>
                <p className="text-xs mt-1">
                  Your coach can view your completed sessions to provide reviews and coaching insights.
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
              <div className="text-center py-6 text-gray-500 dark:text-muted-foreground">
                <p>No pending connection requests.</p>
              </div>
            </CardContent>
          </Card>
          
          {user?.id && <PlayerGoalsTasks studentId={user.id} mode="player" />}
        </div>
      </div>
    </div>
  );
};

export default PlayerDashboard;
