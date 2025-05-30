
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/Lucide';
import { CommentForm } from '@/components/coaching/CommentForm';
import { CommentTag } from '@/types/poker';
import { useAuth } from '@/context/AuthContext';
import { hasFeatureAccess } from '@/utils/coachTiers';
import { AdaptiveTooltip } from '@/components/ui/adaptive-tooltip';
import { supabase } from '@/integrations/supabase/client';

interface SessionData {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  game_type: string | null;
  session_type: string | null;
  notes: string | null;
  created_at: string;
}

const CoachSessionReview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { studentId, sessionId } = useParams<{ studentId: string; sessionId: string }>();
  const { user } = useAuth();
  
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCommentFormOpen, setIsCommentFormOpen] = useState(false);
  const [selectedHandId, setSelectedHandId] = useState<string | undefined>(undefined);
  
  // Check if user has access to comment feature
  const hasCommentAccess = hasFeatureAccess(user?.role, user?.coachTier, 'Comment Tagging');
  
  useEffect(() => {
    if (sessionId && studentId) {
      loadSessionData();
    }
  }, [sessionId, studentId]);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading session data for session:', sessionId, 'student:', studentId);
      
      const { data: session, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', studentId)
        .single();

      if (error) {
        console.error('❌ Error loading session:', error);
        setError('Failed to load session data');
        return;
      }

      if (!session) {
        setError('Session not found');
        return;
      }

      console.log('✅ Session data loaded:', session);
      setSessionData(session);
      
    } catch (error) {
      console.error('❌ Error in loadSessionData:', error);
      setError('Failed to load session data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddComment = (content: string, tag: CommentTag | undefined) => {
    // In a real app, we would save this to the database
    toast({
      title: "Comment added",
      description: selectedHandId 
        ? "Your comment on this hand has been saved" 
        : "Your comment on this session has been saved"
    });
    
    setIsCommentFormOpen(false);
    setSelectedHandId(undefined);
  };
  
  const openCommentForm = (handId?: string) => {
    if (!hasCommentAccess) {
      // Store current location before navigating
      localStorage.setItem('previousLocation', location.pathname);
      // Navigate to coach upgrade page
      navigate('/coach-upgrade');
      return;
    }
    
    setSelectedHandId(handId);
    setIsCommentFormOpen(true);
  };
  
  // Check if we're returning from the upgrade page
  useEffect(() => {
    const previousLocation = localStorage.getItem('previousLocation');
    if (previousLocation === location.pathname) {
      // Clear the stored location to prevent this from running again
      localStorage.removeItem('previousLocation');
    }
  }, [location.pathname]);

  const formatDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString();
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="text-center py-12">
            <Icon name="Loader" className="mx-auto mb-4 h-8 w-8 animate-spin text-poker-feltGreen" />
            <p className="text-gray-600">Loading session data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <header className="mb-8">
            <button 
              onClick={() => navigate(`/coach/student/${studentId}`)} 
              className="text-poker-feltGreen mb-4 flex items-center gap-1 hover:underline"
            >
              <Icon name="arrow-left" size={16} />
              <span>Back to Student</span>
            </button>
          </header>
          
          <div className="text-center py-12">
            <Icon name="AlertCircle" className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error || 'Session not found'}
            </h2>
            <p className="text-gray-600 mb-6">
              The session data could not be loaded or does not exist.
            </p>
            <Button 
              onClick={() => navigate(`/coach/student/${studentId}`)}
              variant="poker"
            >
              Back to Student
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <header className="mb-8">
          <button 
            onClick={() => navigate(`/coach/student/${studentId}`)} 
            className="text-poker-feltGreen mb-4 flex items-center gap-1 hover:underline"
          >
            <Icon name="arrow-left" size={16} />
            <span>Back to Student</span>
          </button>
          
          <h1 className="text-2xl font-bold text-poker-black">Session Review</h1>
          <p className="text-gray-500 text-sm mt-1">
            {sessionData.game_type || 'Poker'} {sessionData.session_type || 'Session'}
          </p>
        </header>
        
        <div className="space-y-6">
          {/* Session details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon name="clock" />
                <span>Session Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Game Type</h4>
                  <p className="text-gray-600">{sessionData.game_type || 'Not specified'}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Session Type</h4>
                  <p className="text-gray-600">{sessionData.session_type || 'Not specified'}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Duration</h4>
                  <p className="text-gray-600">{formatDuration(sessionData.start_time, sessionData.end_time)}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Start Time</h4>
                  <p className="text-gray-600">{formatDateTime(sessionData.start_time)}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">End Time</h4>
                  <p className="text-gray-600">{formatDateTime(sessionData.end_time)}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Created</h4>
                  <p className="text-gray-600">{formatDateTime(sessionData.created_at)}</p>
                </div>
              </div>
              
              {sessionData.notes && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{sessionData.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Session comment button */}
          <div className="flex justify-end">
            {hasCommentAccess ? (
              <Button 
                onClick={() => openCommentForm()}
                variant="poker"
                className="flex items-center gap-2"
              >
                <Icon name="message-square" size={16} />
                <span>Add Session Comment</span>
              </Button>
            ) : (
              <AdaptiveTooltip content={<p>Upgrade to leave session feedback</p>}>
                <Button 
                  onClick={() => openCommentForm()}
                  variant="outline"
                  className="bg-gray-200 hover:bg-gray-300 border border-gray-300 opacity-90 flex items-center gap-2 text-gray-700 relative"
                >
                  <Icon name="message-square" size={16} className="text-gray-500" />
                  <span>Add Session Comment</span>
                  <div className="absolute -top-1.5 -right-1.5 bg-poker-gold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                    <span className="text-white text-xs font-bold">$</span>
                  </div>
                </Button>
              </AdaptiveTooltip>
            )}
          </div>
          
          {/* Additional data sections */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon name="info" />
                <span>Additional Session Data</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Icon name="Database" className="mx-auto mb-3 h-8 w-8" />
                <p className="text-sm">
                  No additional session data (hands, tables, results) has been recorded yet.
                </p>
                <p className="text-xs mt-2 text-gray-400">
                  When the student records detailed session information, it will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <CommentForm 
          open={isCommentFormOpen} 
          onOpenChange={setIsCommentFormOpen} 
          onSubmit={handleAddComment}
          context={selectedHandId ? 'hand' : 'session'}
        />
      </div>
    </div>
  );
};

export default CoachSessionReview;
