import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import Icon from '@/components/ui/Lucide';
import CoachProfileCard from '@/components/coaching/CoachProfileCard';
import PageContainer from '@/components/ui/PageContainer';
import ProfitLossBadge from '@/components/poker/ProfitLossBadge';
import { SharedSessionModal } from '@/components/coaching/SharedSessionModal';
import PlayerGoalsTasks from '@/components/coaching/PlayerGoalsTasks';
import { HandReviewModal } from '@/components/coaching/HandReviewModal';
import CardDisplay from '@/components/poker/CardDisplay';

interface CoachData {
  id: string;
  full_name: string;
  username: string;
  profile_picture?: string;
  bio?: string;
  default_currency?: string;
  students_coached_count?: number;
  coaching_focus?: string[];
  experience?: string;
}

interface SharedSession {
  id: string;
  game_type: string;
  format: string;
  location?: string;
  buy_in: number;
  cash_out?: number;
  start_time: string;
  is_active: boolean;
  tables_played: number;
  currency?: string;
}

interface CoachReviewedHand {
  id: string;
  hand_number?: number;
  session_id: string;
  table_id?: string;
  game_type: string;
  created_at: string;
  feedback_count: number;
  last_feedback_at: string;
  position?: string;
  hole_cards?: string;
  amount_won?: number;
  pot_size?: number;
  currency_type?: string;
}


const CoachProfile: React.FC = () => {
  const { coachId } = useParams<{ coachId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [coach, setCoach] = useState<CoachData | null>(null);
  const [sharedSessions, setSharedSessions] = useState<SharedSession[]>([]);
  const [reviewedHands, setReviewedHands] = useState<CoachReviewedHand[]>([]);
  const [reviewedHandsLoading, setReviewedHandsLoading] = useState(false);
  const [reviewedHandsOffset, setReviewedHandsOffset] = useState(0);
  const [hasMoreReviewedHands, setHasMoreReviewedHands] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  // For instant modal open with lazy loading
  const [reviewHandId, setReviewHandId] = useState<string | null>(null);
  const [reviewSessionId, setReviewSessionId] = useState<string | null>(null);
  const [handReviewOpen, setHandReviewOpen] = useState(false);

  useEffect(() => {
    const loadCoachData = async () => {
      if (!coachId || !user?.id) return;

      try {
        // Verify the user is connected to this coach
        const { data: connection, error: connectionError } = await supabase
          .from('coach_student_connections')
          .select('id')
          .eq('coach_id', coachId)
          .eq('student_id', user.id)
          .eq('status', 'approved')
          .single();

        if (connectionError || !connection) {
          toast({
            title: "Access denied",
            description: "You don't have access to view this coach's profile.",
            variant: "destructive",
          });
          navigate('/dashboard');
          return;
        }

        // Load coach profile data with both public and private data
        const [profileResult, privateResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, username, bio, default_currency, students_coached_count, coaching_focus, experience')
            .eq('id', coachId)
            .eq('role', 'coach')
            .single(),
          supabase
            .from('user_private_data')
            .select('full_name, profile_picture')
            .eq('id', coachId)
            .single()
        ]);

        if (profileResult.error || !profileResult.data) {
          console.error('Error loading coach profile:', profileResult.error);
          toast({
            title: "Error",
            description: "Failed to load coach profile.",
            variant: "destructive",
          });
          navigate('/dashboard');
          return;
        }

        // Combine the data
        const coachProfile = {
          ...profileResult.data,
          full_name: privateResult.data?.full_name || profileResult.data.username,
          profile_picture: privateResult.data?.profile_picture
        };

        setCoach(coachProfile);

        // Load shared sessions with this coach
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('shared_sessions')
          .select(`
            session_id,
            sessions!inner(
              id,
              game_type,
              format,
              location,
              buy_in,
              cash_out,
              start_time,
              is_active,
              tables_played,
              currency
            )
          `)
          .eq('player_id', user.id)
          .eq('coach_id', coachId);

        if (sessionsError) {
          console.error('Error loading shared sessions:', sessionsError);
        } else if (sessionsData) {
          const formattedSessions = sessionsData.map((item: any) => ({
            id: item.sessions.id,
            game_type: item.sessions.game_type,
            format: item.sessions.format,
            location: item.sessions.location,
            buy_in: item.sessions.buy_in,
            cash_out: item.sessions.cash_out,
            start_time: item.sessions.start_time,
            is_active: item.sessions.is_active,
            tables_played: item.sessions.tables_played || 0,
            currency: item.sessions.currency
          }));
          
          // Sort sessions: active sessions first, then by start time (newest first)
          formattedSessions.sort((a, b) => {
            if (a.is_active && !b.is_active) return -1;
            if (!a.is_active && b.is_active) return 1;
            return new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
          });
          
          setSharedSessions(formattedSessions);
        }

      } catch (error) {
        console.error('Error in loadCoachData:', error);
        toast({
          title: "Error",
          description: "Something went wrong loading the coach profile.",
          variant: "destructive",
        });
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadCoachData();

    // Set up real-time subscription for coach profile updates
    if (coachId) {
      const channel = supabase
        .channel('coach-profile-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${coachId}`
          },
          (payload) => {
            console.log('Coach profile updated:', payload);
            // Update the coach state with new data
            if (payload.new && payload.new.role === 'coach') {
              setCoach(prev => prev ? {
                ...prev,
                coaching_focus: payload.new.coaching_focus,
                experience: payload.new.experience,
                full_name: payload.new.full_name,
                bio: payload.new.bio,
                profile_picture: payload.new.profile_picture
              } : null);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [coachId, user?.id, navigate]);

  const getCurrencySymbol = (currency?: string) => {
    switch (currency) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'JPY': return '¥';
      case 'USD':
      default: return '$';
    }
  };

  const formatSessionDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const loadReviewedHands = async (offset = 0, reset = false) => {
    if (!coachId || !user?.id) return;

    setReviewedHandsLoading(true);
    try {
      // First get hand IDs that have feedback from this coach for this student
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('hand_feedback')
        .select('hand_id')
        .eq('coach_id', coachId)
        .eq('student_id', user.id);

      if (feedbackError || !feedbackData || feedbackData.length === 0) {
        console.error('Error loading feedback or no feedback found:', feedbackError);
        setReviewedHands([]);
        setHasMoreReviewedHands(false);
        setReviewedHandsLoading(false);
        return;
      }

      const handIds = feedbackData.map(f => f.hand_id);

      // Get hands and session data
      const { data: handsData, error: handsError } = await supabase
        .from('session_hands_new')
        .select(`
          id,
          hand_number,
          session_id,
          table_id,
          created_at,
          position,
          hole_cards,
          amount_won,
          pot_size,
          currency_type,
          sessions!session_hands_new_session_id_fkey(game_type)
        `)
        .eq('user_id', user.id)
        .in('id', handIds)
        .order('created_at', { ascending: false })
        .range(offset, offset + 9);

      if (handsError) {
        console.error('Error loading hands:', handsError);
        setReviewedHandsLoading(false);
        return;
      }

      if (handsData && Array.isArray(handsData)) {
        // Get feedback counts for each hand
        const { data: feedbackCounts } = await supabase
          .from('hand_feedback')
          .select('hand_id')
          .eq('coach_id', coachId)
          .in('hand_id', handsData.map(h => h.id));

        const feedbackCountMap = feedbackCounts?.reduce((acc, f) => {
          acc[f.hand_id] = (acc[f.hand_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        const reviewedHandsData: CoachReviewedHand[] = handsData.map(item => ({
          id: item.id,
          hand_number: item.hand_number,
          session_id: item.session_id,
          table_id: item.table_id,
          game_type: (item.sessions as any)?.game_type || 'NLH',
          created_at: item.created_at,
          feedback_count: feedbackCountMap[item.id] || 0,
          last_feedback_at: item.created_at, // Use hand created_at as fallback
          position: item.position,
          hole_cards: item.hole_cards,
          amount_won: item.amount_won,
          pot_size: item.pot_size,
          currency_type: item.currency_type
        }));

        if (reset) {
          setReviewedHands(reviewedHandsData);
        } else {
          setReviewedHands(prev => [...prev, ...reviewedHandsData]);
        }

        setHasMoreReviewedHands(reviewedHandsData.length === 10);
        setReviewedHandsOffset(offset + 10);
      }
    } catch (error) {
      console.error('Error in loadReviewedHands:', error);
    } finally {
      setReviewedHandsLoading(false);
    }
  };

  // Open modal instantly - data loads inside the modal
  const handleHandClick = (reviewedHand: CoachReviewedHand) => {
    setReviewHandId(reviewedHand.id);
    setReviewSessionId(reviewedHand.session_id);
    setHandReviewOpen(true);
  };

  useEffect(() => {
    if (coachId && user?.id && !loading) {
      loadReviewedHands(0, true);
    }
  }, [coachId, user?.id, loading]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-12">
          <Icon name="Loader" className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading coach profile...</span>
        </div>
      </PageContainer>
    );
  }

  if (!coach) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <Icon name="UserX" className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Coach not found</h2>
          <p className="text-muted-foreground mb-4">
            The coach profile you're looking for could not be found.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            <Icon name="ArrowLeft" className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2"
        >
          <Icon name="ArrowLeft" className="h-4 w-4" />
          <span>Back</span>
        </Button>
      </div>

      {/* Coach Profile Card */}
      <div className="mb-8">
        <CoachProfileCard coach={coach} />
      </div>

      {/* Shared Sessions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-poker-gold">
            <Icon name="Share2" size={18} />
            <span>Shared Sessions</span>
            <Badge variant="secondary">{sharedSessions.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sharedSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="Inbox" className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No sessions have been shared with this coach yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sharedSessions.map((session) => {
                const profit = (session.cash_out || 0) - session.buy_in;
                const currencySymbol = getCurrencySymbol(session.currency || coach?.default_currency);
                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card/30 hover:bg-card/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedSessionId(session.id);
                      setSelectedPlayerId(user.id);
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{session.game_type}</span>
                        <Badge variant="outline" className="text-xs">
                          {session.format}
                        </Badge>
                        {session.is_active && (
                          <Badge variant="default" className="text-xs">
                            Live
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span>{formatSessionDateTime(session.start_time)}</span>
                        {session.location && <span> • {session.location}</span>}
                        {session.tables_played > 0 && <span> • {session.tables_played} tables</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground mb-1">
                        Buy-in: {currencySymbol}{session.buy_in.toFixed(0)}
                      </div>
                      {!session.is_active && session.cash_out !== undefined && (
                        <ProfitLossBadge 
                          profit={profit} 
                          currency={session.currency || coach?.default_currency || 'USD'}
                          size="sm"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </CardContent>
        </Card>

        {/* Session Modal */}
        {selectedSessionId && selectedPlayerId && (
          <SharedSessionModal
            isOpen={!!selectedSessionId}
            onClose={() => {
              setSelectedSessionId(null);
              setSelectedPlayerId(null);
            }}
            sessionId={selectedSessionId}
            playerId={selectedPlayerId}
          />
        )}

        {/* Coach Reviewed Hands */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="MessageSquareMore" size={18} />
              <span>Coach Reviewed Hands</span>
              <Badge variant="secondary">{reviewedHands.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reviewedHandsLoading && reviewedHands.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Icon name="Loader" className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                <span className="text-muted-foreground">Loading reviewed hands...</span>
              </div>
            ) : reviewedHands.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="MessageSquare" className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hands reviewed by this coach yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviewedHands.map((hand) => (
                  <div
                    key={hand.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card/30 hover:bg-card/50 transition-colors cursor-pointer"
                    onClick={() => handleHandClick(hand)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {hand.hole_cards && (
                          <div 
                            className="flex-shrink-0"
                            title={`Cards: ${hand.hole_cards.replace(/([hdsc])/gi, match => 
                              match.toLowerCase() === 'h' ? ' hearts' :
                              match.toLowerCase() === 'd' ? ' diamonds' :
                              match.toLowerCase() === 's' ? ' spades' : ' clubs'
                            )}`}
                          >
                            <CardDisplay cards={hand.hole_cards} size="sm" />
                          </div>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {hand.game_type}
                          </Badge>
                          {hand.position && (
                            <Badge variant="secondary" className="text-xs">
                              {hand.position}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs bg-background">
                            Feedbacks: {hand.feedback_count}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span>{formatSessionDateTime(hand.created_at)}</span>
                        {hand.amount_won !== undefined && hand.amount_won !== 0 && (
                          <span className={hand.amount_won > 0 ? 'text-green-600' : 'text-red-600'}>
                            {' • '}
                            {hand.amount_won > 0 ? '+' : ''}
                            {hand.currency_type === 'currency' ? '$' : ''}
                            {Math.abs(hand.amount_won).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {hasMoreReviewedHands && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadReviewedHands(reviewedHandsOffset, false)}
                      disabled={reviewedHandsLoading}
                    >
                      {reviewedHandsLoading ? (
                        <>
                          <Icon name="Loader" className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'View more'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coach Goals & Tasks */}
        {user?.id && coachId && <PlayerGoalsTasks studentId={user.id} mode="player" coachId={coachId} />}

        {/* Hand Review Modal with Coach Feedback - opens instantly with loading skeleton */}
        <HandReviewModal
          open={handReviewOpen}
          onClose={() => {
            setHandReviewOpen(false);
            setReviewHandId(null);
            setReviewSessionId(null);
          }}
          handId={reviewHandId || undefined}
          sessionId={reviewSessionId || undefined}
          currentUserId={user?.id}
          playerId={user?.id || ''}
          coachId={coachId}
          isCoach={false}
        />
    </PageContainer>
  );
};

export default CoachProfile;