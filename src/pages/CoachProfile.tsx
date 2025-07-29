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

interface CoachData {
  id: string;
  full_name: string;
  username: string;
  profile_picture?: string;
  bio?: string;
  default_currency?: string;
  students_coached_count?: number;
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

const CoachProfile: React.FC = () => {
  const { coachId } = useParams<{ coachId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [coach, setCoach] = useState<CoachData | null>(null);
  const [sharedSessions, setSharedSessions] = useState<SharedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

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

        // Load coach profile data
        const { data: coachProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, username, profile_picture, bio, default_currency, students_coached_count')
          .eq('id', coachId)
          .eq('role', 'coach')
          .single();

        if (profileError || !coachProfile) {
          console.error('Error loading coach profile:', profileError);
          toast({
            title: "Error",
            description: "Failed to load coach profile.",
            variant: "destructive",
          });
          navigate('/dashboard');
          return;
        }

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
          <CardTitle className="flex items-center gap-2">
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

        {/* Placeholder sections for future content */}
      <div className="space-y-6">
        {/* Placeholder: Coach Feedback */}
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              <Icon name="MessageSquare" className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Coach Feedback</h3>
              <p className="text-sm">
                Personal feedback and coaching notes will be displayed here.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder: Learning Progress */}
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              <Icon name="TrendingUp" className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Learning Progress</h3>
              <p className="text-sm">
                Your progress tracking and improvement insights will be shown here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default CoachProfile;